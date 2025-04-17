/**
 * HumanBehaviorService
 * 
 * Service de simulation de comportement humain pour contourner
 * les détections anti-bot
 */

// Délais aléatoires pour simuler un comportement humain
const TYPING_SPEED_MS = { min: 50, max: 200 }; // Vitesse de frappe (ms par caractère)
const READING_SPEED_MS = { min: 200, max: 500 }; // Vitesse de lecture (ms par mot)
const NAVIGATION_DELAY_MS = { min: 1000, max: 3000 }; // Délai entre les navigations
const SCROLL_INTERVAL_MS = { min: 500, max: 1500 }; // Intervalle entre les défilements
const MOUSE_MOVE_INTERVAL_MS = { min: 100, max: 300 }; // Intervalle entre les mouvements de souris

// Paramètres de défilement
const SCROLL_AMOUNT = { min: 100, max: 300 }; // Quantité de défilement (px)
const SCROLL_DIRECTION_CHANGE_PROBABILITY = 0.2; // Probabilité de changer de direction

// Paramètres de mouvement de souris
// eslint-disable-next-line no-unused-vars
const MOUSE_MOVE_DISTANCE = { min: 5, max: 20 }; // Distance de mouvement (px)
const MOUSE_ACCELERATION = { min: 0.1, max: 0.3 }; // Accélération du mouvement

class HumanBehaviorService {
  constructor() {
    this.currentPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.scrollPosition = 0;
    this.scrollDirection = 1; // 1 = bas, -1 = haut
    this.isScrolling = false;
    this.isMovingMouse = false;
    
    // Liste des moteurs de recherche pour les referers
    this.searchEngines = [
      'https://www.google.com/search?q=',
      'https://www.bing.com/search?q=',
      'https://search.yahoo.com/search?p=',
      'https://duckduckgo.com/?q=',
      'https://www.baidu.com/s?wd='
    ];
    
    // Liste des sites de réseaux sociaux pour les referers
    this.socialSites = [
      'https://www.facebook.com/',
      'https://twitter.com/',
      'https://www.instagram.com/',
      'https://www.reddit.com/r/kdrama/',
      'https://www.pinterest.com/'
    ];
  }
  
  /**
   * Génère un délai aléatoire entre deux valeurs
   * @param {Object} range - Plage de valeurs { min, max }
   * @returns {Number} Délai en millisecondes
   */
  getRandomDelay(range) {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }
  
  /**
   * Simule un délai de frappe humain
   * @param {Number} length - Longueur du texte
   * @returns {Promise} Promesse résolue après le délai
   */
  async simulateTyping(length) {
    const delay = this.getRandomDelay(TYPING_SPEED_MS) * length;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Simule un délai de lecture humain
   * @param {String} text - Texte à lire
   * @returns {Promise} Promesse résolue après le délai
   */
  async simulateReading(text) {
    const wordCount = text.split(/\s+/).length;
    const delay = this.getRandomDelay(READING_SPEED_MS) * wordCount;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Simule un délai de navigation humain
   * @returns {Promise} Promesse résolue après le délai
   */
  async simulateNavigation() {
    const delay = this.getRandomDelay(NAVIGATION_DELAY_MS);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Simule un défilement humain
   * @param {Number} duration - Durée du défilement en millisecondes
   * @returns {Promise} Promesse résolue après le défilement
   */
  async simulateScrolling(duration = 5000) {
    if (this.isScrolling) {
      return;
    }
    
    this.isScrolling = true;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      // Changer de direction aléatoirement
      if (Math.random() < SCROLL_DIRECTION_CHANGE_PROBABILITY) {
        this.scrollDirection *= -1;
      }
      
      // Calculer la quantité de défilement
      const scrollAmount = this.getRandomDelay(SCROLL_AMOUNT) * this.scrollDirection;
      this.scrollPosition += scrollAmount;
      
      // Simuler le défilement
      if (typeof window !== 'undefined') {
        window.scrollBy(0, scrollAmount);
      }
      
      // Attendre avant le prochain défilement
      await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(SCROLL_INTERVAL_MS)));
    }
    
    this.isScrolling = false;
  }
  
  /**
   * Simule un mouvement de souris humain
   * @param {Object} target - Position cible { x, y }
   * @param {Number} duration - Durée du mouvement en millisecondes
   * @returns {Promise} Promesse résolue après le mouvement
   */
  async simulateMouseMovement(target, duration = 2000) {
    if (this.isMovingMouse) {
      return;
    }
    
    this.isMovingMouse = true;
    this.targetPosition = target;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      // Calculer la direction vers la cible
      const dx = this.targetPosition.x - this.currentPosition.x;
      const dy = this.targetPosition.y - this.currentPosition.y;
      
      // Calculer l'accélération
      const acceleration = this.getRandomDelay(MOUSE_ACCELERATION);
      
      // Mettre à jour la vélocité
      this.velocity.x += dx * acceleration;
      this.velocity.y += dy * acceleration;
      
      // Amortir la vélocité
      this.velocity.x *= 0.9;
      this.velocity.y *= 0.9;
      
      // Mettre à jour la position
      this.currentPosition.x += this.velocity.x;
      this.currentPosition.y += this.velocity.y;
      
      // Simuler le mouvement de souris
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new MouseEvent('mousemove', {
          clientX: this.currentPosition.x,
          clientY: this.currentPosition.y,
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(event);
      }
      
      // Attendre avant le prochain mouvement
      await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(MOUSE_MOVE_INTERVAL_MS)));
      
      // Vérifier si on est arrivé à destination
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 5) {
        break;
      }
    }
    
    this.isMovingMouse = false;
  }
  
  /**
   * Simule un clic humain
   * @param {Object} position - Position du clic { x, y }
   * @returns {Promise} Promesse résolue après le clic
   */
  async simulateClick(position) {
    // Déplacer la souris vers la position du clic
    await this.simulateMouseMovement(position);
    
    // Simuler le clic
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new MouseEvent('click', {
        clientX: position.x,
        clientY: position.y,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
    }
    
    // Attendre un court délai après le clic
    await new Promise(resolve => setTimeout(resolve, this.getRandomDelay({ min: 100, max: 300 })));
  }
  
  /**
   * Génère un referer réaliste pour une URL
   * @param {String} url - URL de destination
   * @returns {String} Referer généré
   */
  generateReferer(url) {
    // Extraire le domaine de l'URL
    let domain = '';
    try {
      domain = new URL(url).hostname.replace('www.', '');
    } catch (error) {
      domain = url.split('/')[2]?.replace('www.', '') || '';
    }
    
    // Différents types de referers possibles
    const refererTypes = [
      'search', // Moteur de recherche
      'social', // Réseau social
      'direct', // Accès direct (pas de referer)
      'internal' // Page du même site
    ];
    
    // Sélectionner aléatoirement un type de referer
    const refererType = refererTypes[Math.floor(Math.random() * refererTypes.length)];
    
    switch (refererType) {
      case 'search':
        // Générer un referer de moteur de recherche
        const searchEngine = this.searchEngines[Math.floor(Math.random() * this.searchEngines.length)];
        const searchTerms = [
          `${domain} drama online`,
          `watch ${domain} korean drama`,
          `best dramas on ${domain}`,
          `${domain} new episodes`,
          `korean drama streaming ${domain}`
        ];
        const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        return `${searchEngine}${encodeURIComponent(searchTerm)}`;
        
      case 'social':
        // Générer un referer de réseau social
        return this.socialSites[Math.floor(Math.random() * this.socialSites.length)];
        
      case 'internal':
        // Générer un referer interne au site
        try {
          const urlObj = new URL(url);
          const paths = [
            '/index.html',
            '/popular',
            '/recent',
            '/top',
            '/drama-list',
            '/movies'
          ];
          const randomPath = paths[Math.floor(Math.random() * paths.length)];
          return `${urlObj.protocol}//${urlObj.hostname}${randomPath}`;
        } catch (error) {
          // En cas d'erreur, retourner une URL de base
          return `https://${domain}`;
        }
        
      case 'direct':
      default:
        // Pas de referer (accès direct)
        return '';
    }
  }
  
  /**
   * Simule une session de navigation humaine complète
   * @param {Array} actions - Liste d'actions à effectuer
   * @returns {Promise} Promesse résolue après la session
   */
  async simulateSession(actions) {
    for (const action of actions) {
      switch (action.type) {
        case 'navigate':
          await this.simulateNavigation();
          break;
        case 'read':
          await this.simulateReading(action.text);
          break;
        case 'type':
          await this.simulateTyping(action.text.length);
          break;
        case 'scroll':
          await this.simulateScrolling(action.duration);
          break;
        case 'move':
          await this.simulateMouseMovement(action.position, action.duration);
          break;
        case 'click':
          await this.simulateClick(action.position);
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, action.duration));
          break;
        default:
          console.warn(`[HumanBehaviorService] Action non reconnue: ${action.type}`);
      }
    }
  }
}

// Créer une instance unique du service
const humanBehaviorService = new HumanBehaviorService();

// Exporter le service
export default humanBehaviorService;
