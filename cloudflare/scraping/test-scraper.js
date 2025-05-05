#!/usr/bin/env node

/**
 * Script de test pour déboguer le scraper FloDrama
 * 
 * Ce script simule le comportement du Worker Cloudflare mais s'exécute localement,
 * ce qui permet un débogage plus facile.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;

// URL à tester
const TEST_URL = 'https://mydramalist.com/shows/top';

// En-têtes pour contourner les protections anti-scraping
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// Sélecteurs pour MyDramaList
const SELECTORS = {
  listing: '.box-body .col-xs-9 h6 a, .m-a-box .content a',
  title: 'h1.film-title',
  poster: '.poster a img, .film-cover img'
};

/**
 * Extrait des attributs avec une regex
 */
function extractAllAttributes(html, selector, attribute) {
  console.log(`Extraction de tous les attributs ${attribute} pour le sélecteur: ${selector}`);
  
  const attrRegex = new RegExp(`<${selector.split(',')[0].trim()}[^>]*${attribute}=["']([^"']*)["'][^>]*>`, 'gi');
  const matches = [];
  let match;
  
  while ((match = attrRegex.exec(html))) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * Effectue le test de scraping
 */
async function testScraping() {
  console.log(`🔍 Test de scraping pour: ${TEST_URL}`);
  
  try {
    // 1. Essayer d'accéder à la page de listing
    console.log('📥 Récupération de la page...');
    const response = await fetch(TEST_URL, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ Page récupérée: ${html.length} caractères`);
    
    // Sauvegarde du HTML pour inspection
    await fs.writeFile('debug-page.html', html);
    console.log('💾 HTML sauvegardé dans debug-page.html');
    
    // 2. Extraction des liens vers les dramas
    const dramaUrls = extractAllAttributes(html, SELECTORS.listing, 'href');
    console.log(`🔗 Liens trouvés: ${dramaUrls.length}`);
    
    if (dramaUrls.length === 0) {
      console.log('⚠️ Aucun lien trouvé. Le sélecteur est peut-être incorrect ou la page a changé.');
      
      // Recherche de patterns alternatifs
      const hrefPattern = /href=["']([^"']*\/\d+[^"']*)["']/gi;
      const altMatches = [];
      let altMatch;
      
      while ((altMatch = hrefPattern.exec(html))) {
        if (altMatch[1].includes('/drama/')) {
          altMatches.push(altMatch[1]);
        }
      }
      
      console.log(`🔍 Recherche alternative: ${altMatches.length} liens potentiels trouvés`);
      console.log(altMatches.slice(0, 5));
      
      return;
    }
    
    // Afficher les 5 premiers liens
    console.log('Premiers liens trouvés:');
    dramaUrls.slice(0, 5).forEach(url => console.log(`- ${url}`));
    
    // 3. Tester le scraping d'un drama
    if (dramaUrls.length > 0) {
      const testDramaUrl = dramaUrls[0].startsWith('/') 
        ? `https://mydramalist.com${dramaUrls[0]}` 
        : dramaUrls[0];
      
      console.log(`\n🔍 Test de scraping pour le drama: ${testDramaUrl}`);
      
      const dramaResponse = await fetch(testDramaUrl, { headers: HEADERS });
      
      if (!dramaResponse.ok) {
        throw new Error(`Erreur HTTP lors de l'accès au drama: ${dramaResponse.status}`);
      }
      
      const dramaHtml = await dramaResponse.text();
      console.log(`✅ Page du drama récupérée: ${dramaHtml.length} caractères`);
      
      // Sauvegarde du HTML pour inspection
      await fs.writeFile('debug-drama.html', dramaHtml);
      console.log('💾 HTML du drama sauvegardé dans debug-drama.html');
      
      // Extraction du titre
      const titleMatch = dramaHtml.match(new RegExp(`<${SELECTORS.title}[^>]*>(.*?)<\/${SELECTORS.title.split(' ')[0]}>`, 'is'));
      console.log(`📝 Titre: ${titleMatch ? titleMatch[1].trim() : 'Non trouvé'}`);
      
      // Extraction de l'image poster
      const posterMatch = dramaHtml.match(new RegExp(`<${SELECTORS.poster.split(',')[0].trim()}[^>]*src=["']([^"']*)["'][^>]*>`, 'i'));
      console.log(`🖼️ Poster: ${posterMatch ? posterMatch[1] : 'Non trouvé'}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors du test: ${error.message}`);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Exécution du test
testScraping().catch(error => {
  console.error('Erreur fatale:', error);
});
