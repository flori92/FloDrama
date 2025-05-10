/**
 * Client Proxy Webshare pour Cloudflare Workers
 * 
 * Ce module permet d'utiliser les proxies résidentiels de Webshare
 * pour contourner les protections anti-scraping.
 */

// Configuration Webshare
const WEBSHARE_API_KEY = "0g0wphwljsuawxuh8tcq6xzb566chruxbsxe1lw1";

// Liste de proxies Webshare (récupérés depuis le dashboard)
const WEBSHARE_PROXIES = [
  { proxy_address: "45.61.121.187", port: "6786", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "64.137.103.30", port: "6618", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "AT" },
  { proxy_address: "82.21.224.32", port: "6388", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "UA" },
  { proxy_address: "82.24.210.157", port: "5510", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "UA" },
  { proxy_address: "89.42.8.149", port: "5710", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "SG" },
  { proxy_address: "154.203.49.72", port: "5368", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "PT" },
  { proxy_address: "161.123.5.253", port: "5302", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "23.26.95.11", port: "5493", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "82.25.216.79", port: "6921", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "GB" },
  { proxy_address: "92.113.246.213", port: "5798", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "136.0.126.62", port: "5823", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "184.174.58.87", port: "5649", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "199.180.10.7", port: "6378", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "38.154.200.180", port: "5881", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "104.222.187.158", port: "6282", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "NL" },
  { proxy_address: "198.37.118.51", port: "5510", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "92.112.175.7", port: "6280", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "BR" },
  { proxy_address: "104.233.15.227", port: "5950", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "104.253.55.43", port: "5473", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "CH" },
  { proxy_address: "104.249.61.195", port: "6850", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "ES" },
  { proxy_address: "142.111.245.185", port: "6052", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "191.96.174.28", port: "7114", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "191.96.104.178", port: "5915", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "37.44.218.137", port: "5820", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "GB" },
  { proxy_address: "38.170.162.248", port: "7303", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "82.22.220.81", port: "5436", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "UA" },
  { proxy_address: "45.39.17.124", port: "5547", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "US" },
  { proxy_address: "82.23.243.167", port: "7525", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "DE" },
  { proxy_address: "92.112.217.238", port: "6010", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "SE" },
  { proxy_address: "92.112.239.52", port: "6840", username: "dmqyjfr", password: "ucxojwb5p9w3", country_code: "SE" }
];

/**
 * Classe pour la gestion des proxies Webshare
 */
class WebshareProxyClient {
  constructor(apiKey = WEBSHARE_API_KEY, debug = false) {
    this.apiKey = apiKey;
    this.debug = debug;
    this.proxyList = WEBSHARE_PROXIES;
    this.currentProxyIndex = 0;
    this.lastProxyRotation = Date.now();
    this.rotationInterval = 60 * 1000; // 1 minute par défaut
    this.proxyAuth = `${this.proxyList[0].username}:${this.proxyList[0].password}`;
    this.failedProxies = new Set();
    this.successfulProxies = new Map();
  }

  /**
   * Active le mode debug
   */
  enableDebug() {
    this.debug = true;
  }

  /**
   * Log de debug
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[PROXY_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Obtient un proxy de manière intelligente
   * - Évite les proxies qui ont échoué
   * - Préfère les proxies qui ont réussi
   * - Maintient une rotation pour éviter la détection
   */
  getNextProxy() {
    // Si la liste est vide
    if (!this.proxyList || this.proxyList.length === 0) {
      throw new Error("Aucun proxy disponible");
    }
    
    // Liste des proxies disponibles (qui n'ont pas échoué récemment)
    const availableProxies = this.proxyList.filter((_, index) => !this.failedProxies.has(index));
    
    if (availableProxies.length === 0) {
      // Si tous les proxies ont échoué, réinitialiser la liste des échecs
      this.debugLog("Tous les proxies ont échoué, réinitialisation");
      this.failedProxies.clear();
      return this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
    }
    
    // Choisir un proxy parmi les disponibles
    // Préférer un proxy qui a déjà réussi
    const successfulIndices = [...this.successfulProxies.entries()]
      .filter(([index]) => !this.failedProxies.has(index))
      .sort((a, b) => b[1] - a[1]) // Trier par nombre de succès décroissant
      .map(([index]) => index);
    
    // Si nous avons des proxies qui ont réussi, prendre le meilleur (80% du temps)
    if (successfulIndices.length > 0 && Math.random() < 0.8) {
      const bestProxyIndex = successfulIndices[0];
      this.currentProxyIndex = bestProxyIndex;
      this.debugLog(`Utilisation du proxy à succès #${bestProxyIndex}`);
    } else {
      // Sinon, choisir un proxy aléatoire parmi les disponibles
      const availableIndices = this.proxyList
        .map((_, index) => index)
        .filter(index => !this.failedProxies.has(index));
      
      this.currentProxyIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      this.debugLog(`Utilisation d'un proxy aléatoire #${this.currentProxyIndex}`);
    }
    
    return this.proxyList[this.currentProxyIndex];
  }

  /**
   * Marque un proxy comme ayant échoué
   */
  markProxyAsFailed() {
    this.failedProxies.add(this.currentProxyIndex);
    this.debugLog(`Proxy #${this.currentProxyIndex} marqué comme échoué`);
    
    // Supprimer ce proxy des succès s'il y était
    this.successfulProxies.delete(this.currentProxyIndex);
  }

  /**
   * Marque un proxy comme ayant réussi
   */
  markProxyAsSuccessful() {
    const currentCount = this.successfulProxies.get(this.currentProxyIndex) || 0;
    this.successfulProxies.set(this.currentProxyIndex, currentCount + 1);
    this.debugLog(`Proxy #${this.currentProxyIndex} marqué comme réussi (${currentCount + 1} succès)`);
    
    // Retirer ce proxy de la liste des échecs s'il y était
    this.failedProxies.delete(this.currentProxyIndex);
  }

  /**
   * Construit l'URL complète du proxy actuel
   */
  getProxyUrl() {
    const proxy = this.getNextProxy();
    this.proxyAuth = `${proxy.username}:${proxy.password}`;
    return `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
  }

  /**
   * Construit la chaîne d'authentification au format base64
   */
  getProxyAuthBase64() {
    return btoa(this.proxyAuth);
  }

  /**
   * Effectue une requête via un proxy Webshare avec optimisations
   */
  async fetch(url, options = {}) {
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        const proxyUrl = this.getProxyUrl();
        const proxyParts = new URL(proxyUrl);
        
        this.debugLog(`Tentative ${attempt + 1}/${maxAttempts} avec proxy: ${proxyParts.hostname}:${proxyParts.port}`);
        
        // Construction des en-têtes optimisés
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate', 
          'Sec-Fetch-Site': 'none',
          'Connection': 'keep-alive',
          ...options.headers,
          
          // En-têtes spécifiques au proxy
          'Proxy-Authorization': `Basic ${this.getProxyAuthBase64()}`
        };
        
        // Options optimisées pour Cloudflare Workers
        const finalOptions = {
          ...options,
          headers,
          cf: {
            // Contourner le DNS de Cloudflare pour utiliser le serveur proxy
            resolveOverride: proxyParts.hostname,
            // Paramètres de performance
            minify: false,
            mirage: false,
            scrapeShield: false,
            apps: false,
            cacheTtl: 1,
            cacheEverything: false
          },
          redirect: 'follow'
        };
        
        // Exécution de la requête
        const response = await fetch(url, finalOptions);
        
        // Traitement de la réponse
        if (response.status === 407) {
          // Erreur d'authentification proxy
          this.debugLog(`Erreur d'authentification proxy (407)`);
          this.markProxyAsFailed();
          attempt++;
          continue;
        } else if (response.status === 403 || response.status === 429) {
          // Blocage détecté, marquer ce proxy comme ayant échoué
          this.debugLog(`Proxy bloqué: ${response.status}`);
          this.markProxyAsFailed();
          attempt++;
          continue;
        } else if (!response.ok) {
          // Autre erreur HTTP
          this.debugLog(`Erreur HTTP: ${response.status} ${response.statusText}`);
          this.markProxyAsFailed();
          attempt++;
          continue;
        }
        
        // Succès! Marquer ce proxy comme réussi
        this.markProxyAsSuccessful();
        
        // Vérifier rapidement si la réponse contient du contenu réel
        const contentType = response.headers.get('content-type') || '';
        const isHtml = contentType.includes('text/html');
        
        if (isHtml) {
          // Cloner la réponse pour pouvoir l'examiner
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          
          // Vérifier si la page est une page de blocage (contient des termes spécifiques)
          const isBlockPage = 
            text.includes('captcha') || 
            text.includes('blocked') || 
            text.includes('access denied') ||
            text.includes('security check') ||
            text.length < 500; // Page trop courte = probablement un blocage
          
          if (isBlockPage) {
            this.debugLog(`Proxy retourne une page de blocage (${text.length} caractères)`);
            this.markProxyAsFailed();
            attempt++;
            continue;
          }
        }
        
        this.debugLog(`Requête réussie: ${response.status}`);
        return response;
      } catch (error) {
        this.debugLog(`Erreur lors de la requête: ${error.message}`);
        this.markProxyAsFailed();
        attempt++;
        
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    
    throw new Error(`Échec après ${maxAttempts} tentatives`);
  }
}

export default WebshareProxyClient;
