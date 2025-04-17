/**
 * BrowserFingerprintService
 * 
 * Service de génération d'empreintes digitales de navigateur réalistes
 * pour contourner les protections anti-bot
 */

// Liste des User-Agents pour rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
];

// Liste des langues pour rotation
const LANGUAGES = [
  'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'en-US,en;q=0.9',
  'fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3',
  'en-GB,en;q=0.9,fr;q=0.8',
  'fr-CA,fr;q=0.9,en-CA;q=0.7,en;q=0.5'
];

// Liste des plateformes pour rotation
const PLATFORMS = ['Windows', 'MacOS', 'Linux', 'Android', 'iOS'];

// Liste des résolutions d'écran pour rotation
const SCREEN_RESOLUTIONS = [
  '1920x1080',
  '1366x768',
  '1440x900',
  '1536x864',
  '2560x1440',
  '3840x2160',
  '1280x720',
  '1680x1050'
];

// Liste des fuseaux horaires pour rotation
const TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/Madrid'
];

// Liste des polices pour rotation
const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat'
];

class BrowserFingerprintService {
  constructor() {
    this.lastUserAgentIndex = 0;
    this.lastLanguageIndex = 0;
    this.lastPlatformIndex = 0;
    this.lastScreenResolutionIndex = 0;
    this.lastTimezoneIndex = 0;
    
    // Générer une empreinte par défaut
    this.defaultFingerprint = this.generateFingerprint();
  }
  
  /**
   * Génère une empreinte digitale de navigateur réaliste
   * @param {Object} options - Options de personnalisation
   * @returns {Object} Empreinte digitale
   */
  generateFingerprint(options = {}) {
    // Incrémenter les index pour la rotation
    this.lastUserAgentIndex = (this.lastUserAgentIndex + 1) % USER_AGENTS.length;
    this.lastLanguageIndex = (this.lastLanguageIndex + 1) % LANGUAGES.length;
    this.lastPlatformIndex = (this.lastPlatformIndex + 1) % PLATFORMS.length;
    this.lastScreenResolutionIndex = (this.lastScreenResolutionIndex + 1) % SCREEN_RESOLUTIONS.length;
    this.lastTimezoneIndex = (this.lastTimezoneIndex + 1) % TIMEZONES.length;
    
    // Sélectionner les valeurs
    const userAgent = options.userAgent || USER_AGENTS[this.lastUserAgentIndex];
    const language = options.language || LANGUAGES[this.lastLanguageIndex];
    const platform = options.platform || PLATFORMS[this.lastPlatformIndex];
    const screenResolution = options.screenResolution || SCREEN_RESOLUTIONS[this.lastScreenResolutionIndex];
    const timezone = options.timezone || TIMEZONES[this.lastTimezoneIndex];
    
    // Sélectionner des polices aléatoires
    const availableFonts = [...FONTS];
    const fonts = [];
    const fontCount = Math.floor(Math.random() * 10) + 5; // Entre 5 et 15 polices
    
    for (let i = 0; i < fontCount && availableFonts.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableFonts.length);
      fonts.push(availableFonts.splice(randomIndex, 1)[0]);
    }
    
    // Générer un hash WebGL aléatoire
    const webglHash = this.generateWebGLHash();
    
    // Générer un hash canvas aléatoire
    const canvasHash = this.generateCanvasHash();
    
    // Générer des plugins aléatoires
    const plugins = this.generatePlugins();
    
    // Générer des en-têtes HTTP
    const headers = this.generateHeaders(userAgent, language, platform);
    
    return {
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      fonts,
      webglHash,
      canvasHash,
      plugins,
      headers,
      colorDepth: 24,
      deviceMemory: 8,
      hardwareConcurrency: 4,
      touchSupport: false,
      sessionStorage: true,
      localStorage: true,
      indexedDB: true,
      addBehavior: false,
      openDatabase: true,
      cpuClass: 'unknown',
      doNotTrack: 'unspecified',
      canvas: canvasHash,
      webgl: webglHash,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      adBlock: false,
      hasLiedLanguages: false,
      hasLiedResolution: false,
      hasLiedOs: false,
      hasLiedBrowser: false,
      touchPoints: 0,
      audio: 'audio_fp',
      enumerateDevices: 'enumerate_devices_fp'
    };
  }
  
  /**
   * Génère une empreinte digitale de navigateur aléatoire
   * @returns {Object} Empreinte digitale aléatoire
   */
  generateRandomFingerprint() {
    // Sélectionner des valeurs aléatoires
    const userAgent = this.getRandomUserAgent();
    const language = this.getRandomLanguage();
    const platform = this.getRandomPlatform();
    const screenResolution = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)];
    const timezone = TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];
    
    // Générer un hash WebGL aléatoire
    const webglHash = this.generateWebGLHash();
    
    // Générer un hash canvas aléatoire
    const canvasHash = this.generateCanvasHash();
    
    // Générer des plugins aléatoires
    const plugins = this.generatePlugins();
    
    // Générer des en-têtes HTTP
    const headers = this.generateHeaders(userAgent, language, platform);
    
    // Sélectionner des polices aléatoires
    const availableFonts = [...FONTS];
    const fonts = [];
    const fontCount = Math.floor(Math.random() * 10) + 5; // Entre 5 et 15 polices
    
    for (let i = 0; i < fontCount && availableFonts.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableFonts.length);
      fonts.push(availableFonts.splice(randomIndex, 1)[0]);
    }
    
    return {
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      fonts,
      webglHash,
      canvasHash,
      plugins,
      headers,
      colorDepth: 24,
      deviceMemory: 8,
      hardwareConcurrency: 4,
      touchSupport: false,
      sessionStorage: true,
      localStorage: true,
      indexedDB: true,
      addBehavior: false,
      openDatabase: true,
    };
  }
  
  /**
   * Génère un hash WebGL aléatoire
   * @returns {String} Hash WebGL
   */
  generateWebGLHash() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
  
  /**
   * Génère un hash canvas aléatoire
   * @returns {String} Hash canvas
   */
  generateCanvasHash() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
  
  /**
   * Génère une liste de plugins aléatoires
   * @returns {Array} Liste de plugins
   */
  generatePlugins() {
    const allPlugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll', description: 'Enables Widevine licenses for playback of HTML audio/video content.' },
      { name: 'Microsoft Edge PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' }
    ];
    
    // Sélectionner un nombre aléatoire de plugins
    const pluginCount = Math.floor(Math.random() * 4) + 1; // Entre 1 et 4 plugins
    const selectedPlugins = [];
    const availablePlugins = [...allPlugins];
    
    for (let i = 0; i < pluginCount && availablePlugins.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availablePlugins.length);
      selectedPlugins.push(availablePlugins.splice(randomIndex, 1)[0]);
    }
    
    return selectedPlugins;
  }
  
  /**
   * Génère des en-têtes HTTP réalistes
   * @param {String} userAgent - User-Agent
   * @param {String} language - Langue
   * @param {String} platform - Plateforme
   * @returns {Object} En-têtes HTTP
   */
  generateHeaders(userAgent, language, platform) {
    return {
      'User-Agent': userAgent,
      'Accept-Language': language,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': `"${platform}"`,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
  }
  
  /**
   * Génère des cookies réalistes pour simuler un navigateur
   * @param {String} domain - Domaine pour lequel générer les cookies
   * @param {Number} count - Nombre de cookies à générer (par défaut: entre 5 et 15)
   * @returns {Object} Objet contenant les cookies générés
   */
  generateCookies(domain, count = null) {
    // Nombre aléatoire de cookies si non spécifié
    const cookieCount = count || Math.floor(Math.random() * 10) + 5;
    
    // Liste des noms de cookies courants
    const commonCookieNames = [
      'session_id', 'user_id', 'auth_token', 'csrf_token', 'theme',
      'language', 'preferences', 'last_visit', 'device_id', 'tracking_id',
      'visitor_id', 'ab_test', 'gdpr_consent', 'analytics_id', 'referrer',
      'utm_source', 'utm_medium', 'utm_campaign', 'ads_id', 'notification'
    ];
    
    // Valeurs possibles pour les cookies
    const possibleValues = [
      // IDs alphanumériques
      () => this.generateRandomId(16),
      // Timestamps
      () => Date.now().toString(),
      // Valeurs booléennes
      () => Math.random() > 0.5 ? 'true' : 'false',
      // Valeurs numériques
      () => Math.floor(Math.random() * 1000).toString(),
      // JSON encodé
      () => encodeURIComponent(JSON.stringify({id: this.generateRandomId(8), ts: Date.now()}))
    ];
    
    // Résultat final
    const cookies = {};
    
    // Générer les cookies
    const usedNames = new Set();
    
    for (let i = 0; i < cookieCount; i++) {
      // Sélectionner un nom de cookie non utilisé
      let cookieName;
      do {
        if (Math.random() > 0.7 && commonCookieNames.length > 0) {
          // 70% de chance d'utiliser un nom commun
          const index = Math.floor(Math.random() * commonCookieNames.length);
          cookieName = commonCookieNames[index];
        } else {
          // 30% de chance de générer un nom aléatoire
          cookieName = this.generateRandomId(Math.floor(Math.random() * 10) + 3);
        }
      } while (usedNames.has(cookieName));
      
      usedNames.add(cookieName);
      
      // Générer une valeur pour le cookie
      const valueGenerator = possibleValues[Math.floor(Math.random() * possibleValues.length)];
      
      // Stocker le cookie avec sa valeur
      const cookieValue = valueGenerator();
      
      // Créer une fonction pour définir les propriétés du cookie
      const setCookieProperties = (name) => {
        return {
          value: cookieValue,
          domain: domain,
          path: Math.random() > 0.3 ? '/' : '/path' + Math.floor(Math.random() * 3),
          secure: Math.random() > 0.5,
          httpOnly: Math.random() > 0.7,
          sameSite: ['Strict', 'Lax', 'None'][Math.floor(Math.random() * 3)],
          expires: new Date(Date.now() + Math.floor(Math.random() * 86400000 * 30)).toUTCString()
        };
      };
      
      // Ajouter le cookie au résultat
      cookies[cookieName] = setCookieProperties(cookieName);
    }
    
    return cookies;
  }

  /**
   * Obtient l'empreinte digitale par défaut
   * @returns {Object} Empreinte digitale
   */
  getDefaultFingerprint() {
    return this.defaultFingerprint;
  }
  
  /**
   * Obtient un User-Agent aléatoire
   * @returns {String} User-Agent
   */
  getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
  
  /**
   * Obtient une langue aléatoire
   * @returns {String} Langue
   */
  getRandomLanguage() {
    return LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
  }
  
  /**
   * Obtient une plateforme aléatoire
   * @returns {String} Plateforme
   */
  getRandomPlatform() {
    return PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  }
  
  /**
   * Génère un ID aléatoire
   * @param {Number} length - Longueur de l'ID
   * @returns {String} ID aléatoire
   */
  generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
}

// Créer une instance unique du service
const browserFingerprintService = new BrowserFingerprintService();

// Exporter le service
export default browserFingerprintService;
