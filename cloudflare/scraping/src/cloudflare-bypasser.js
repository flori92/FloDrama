/**
 * Module de contournement des protections Cloudflare
 * Utilisé par l'extracteur de streaming pour accéder aux contenus protégés
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

/**
 * Classe permettant de contourner les protections Cloudflare
 */
class CloudflareBypasser {
  constructor() {
    this.cookieJar = new CookieJar();
    this.client = wrapper(axios.create({ 
      jar: this.cookieJar,
      withCredentials: true 
    }));
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
  }

  /**
   * Contourne la protection Cloudflare en utilisant Puppeteer
   * @param {string} url - URL à visiter
   * @returns {Promise<object>} - Cookies et contenu de la page
   */
  async bypassWithPuppeteer(url) {
    console.log(`🔐 Contournement de la protection Cloudflare pour: ${url}`);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.userAgent);
      
      // Intercepter les requêtes pour détecter le challenge Cloudflare
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().includes('cdn-cgi/challenge-platform')) {
          console.log('🛡️ Challenge Cloudflare détecté');
        }
        request.continue();
      });
      
      // Définir un timeout raisonnable pour le chargement initial
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Attendre la résolution du challenge si nécessaire
      await this.waitForCloudflareToBeGone(page);
      
      // Récupérer les cookies
      const cookies = await page.cookies();
      
      // Récupérer le contenu de la page
      const content = await page.content();
      
      return { cookies, content };
    } finally {
      await browser.close();
    }
  }

  /**
   * Attend que la page de challenge Cloudflare disparaisse
   * @param {Page} page - Instance de page Puppeteer
   */
  async waitForCloudflareToBeGone(page) {
    try {
      // Vérifier la présence d'éléments du challenge
      const cloudflareElements = [
        '#cf-please-wait',
        '#cf-spinner',
        '.cf-spinner',
        '#cf-challenge-running',
        '#cf_challenge'
      ];
      
      // Attendre jusqu'à 15 secondes pour la résolution du challenge
      const maxWaitTime = 15000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        let challengeDetected = false;
        
        for (const selector of cloudflareElements) {
          const element = await page.$(selector);
          if (element) {
            challengeDetected = true;
            break;
          }
        }
        
        if (!challengeDetected) {
          console.log('✅ Challenge Cloudflare résolu');
          return;
        }
        
        // Attendre un peu avant de revérifier
        await page.waitForTimeout(1000);
      }
      
      console.log('⚠️ Timeout lors de la résolution du challenge Cloudflare');
    } catch (error) {
      console.error('Erreur lors de l\'attente de résolution Cloudflare:', error);
    }
  }

  /**
   * Utilise les cookies obtenus pour créer un client HTTP avec authentification
   * @param {Array} cookies - Cookies obtenus via Puppeteer
   * @returns {Object} - Client HTTP avec cookies configurés
   */
  setupClientWithCookies(cookies) {
    cookies.forEach(cookie => {
      this.cookieJar.setCookieSync(
        `${cookie.name}=${cookie.value}`,
        `https://${cookie.domain}${cookie.path}`
      );
    });
    
    return this.client;
  }

  /**
   * Effectue une requête HTTP avec contournement Cloudflare
   * @param {string} url - URL à requêter
   * @returns {Promise<string>} - Contenu de la page
   */
  async request(url) {
    const { cookies, content } = await this.bypassWithPuppeteer(url);
    
    // Si nous n'avons besoin que du contenu initial
    if (content.includes('</html>') && !content.includes('cf-spinner')) {
      return content;
    }
    
    // Sinon, configurer le client avec les cookies et faire une nouvelle requête
    const client = this.setupClientWithCookies(cookies);
    const response = await client.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Referer': url
      }
    });
    
    return response.data;
  }
}

module.exports = CloudflareBypasser;
