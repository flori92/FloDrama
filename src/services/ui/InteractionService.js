// Service d'interaction pour FloDrama
// Gère les interactions utilisateur avancées et la simulation de comportement humain

/**
 * Service d'interaction
 * @class InteractionService
 */
export class InteractionService {
  /**
   * Constructeur du service d'interaction
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {boolean} config.enableHumanization - Activer la simulation de comportement humain (défaut: true)
   * @param {number} config.delayVariation - Variation de délai en ms (défaut: 500)
   * @param {number} config.baseDelay - Délai de base en ms (défaut: 300)
   * @param {boolean} config.trackInteractions - Suivre les interactions (défaut: true)
   */
  constructor(storageService = null, config = {}) {
    this.storageService = storageService;
    this.enableHumanization = config.enableHumanization !== undefined ? config.enableHumanization : true;
    this.delayVariation = config.delayVariation || 500;
    this.baseDelay = config.baseDelay || 300;
    this.trackInteractions = config.trackInteractions !== undefined ? config.trackInteractions : true;
    
    // Historique d'interactions
    this.interactionHistory = [];
    this.interactionPatterns = {};
    
    // Écouteurs
    this.listeners = [];
    
    console.log('InteractionService initialisé');
  }
  
  /**
   * Ajouter un écouteur d'interactions
   * @param {Function} listener - Fonction appelée lors d'une interaction
   * @returns {Function} - Fonction pour supprimer l'écouteur
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      console.error('L\'écouteur doit être une fonction');
      return () => { /* Fonction vide intentionnellement */ };
    }
    
    this.listeners.push(listener);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notifier les écouteurs
   * @param {Object} interaction - Interaction
   * @private
   */
  _notifyListeners(interaction) {
    this.listeners.forEach(listener => {
      try {
        listener(interaction);
      } catch (error) {
        console.error('Erreur dans un écouteur d\'interaction:', error);
      }
    });
  }
  
  /**
   * Enregistrer une interaction
   * @param {string} type - Type d'interaction
   * @param {Object} data - Données de l'interaction
   * @returns {Object} - Interaction enregistrée
   */
  trackInteraction(type, data = {}) {
    if (!this.trackInteractions) {
      return null;
    }
    
    const interaction = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Ajouter à l'historique
    this.interactionHistory.push(interaction);
    
    // Limiter la taille de l'historique
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift();
    }
    
    // Mettre à jour les modèles d'interaction
    this._updateInteractionPatterns(type);
    
    // Notifier les écouteurs
    this._notifyListeners(interaction);
    
    return interaction;
  }
  
  /**
   * Mettre à jour les modèles d'interaction
   * @param {string} type - Type d'interaction
   * @private
   */
  _updateInteractionPatterns(type) {
    if (!this.interactionPatterns[type]) {
      this.interactionPatterns[type] = {
        count: 0,
        lastTime: null,
        avgTimeBetween: 0
      };
    }
    
    const pattern = this.interactionPatterns[type];
    const now = new Date();
    
    // Mettre à jour le compteur
    pattern.count++;
    
    // Calculer le temps moyen entre les interactions
    if (pattern.lastTime) {
      const timeDiff = now - new Date(pattern.lastTime);
      pattern.avgTimeBetween = (pattern.avgTimeBetween * (pattern.count - 1) + timeDiff) / pattern.count;
    }
    
    // Mettre à jour le dernier temps
    pattern.lastTime = now.toISOString();
  }
  
  /**
   * Obtenir l'historique des interactions
   * @param {string} type - Type d'interaction (optionnel)
   * @param {number} limit - Limite de résultats
   * @returns {Array} - Historique des interactions
   */
  getInteractionHistory(type = null, limit = 0) {
    let history = [...this.interactionHistory];
    
    // Filtrer par type
    if (type) {
      history = history.filter(interaction => interaction.type === type);
    }
    
    // Trier par date (plus récent en premier)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limiter les résultats
    if (limit > 0 && history.length > limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  }
  
  /**
   * Obtenir les modèles d'interaction
   * @param {string} type - Type d'interaction (optionnel)
   * @returns {Object} - Modèles d'interaction
   */
  getInteractionPatterns(type = null) {
    if (type) {
      return this.interactionPatterns[type] || null;
    }
    
    return { ...this.interactionPatterns };
  }
  
  /**
   * Effacer l'historique des interactions
   * @param {string} type - Type d'interaction (optionnel)
   * @returns {boolean} - Succès de l'opération
   */
  clearInteractionHistory(type = null) {
    if (type) {
      this.interactionHistory = this.interactionHistory.filter(
        interaction => interaction.type !== type
      );
      delete this.interactionPatterns[type];
    } else {
      this.interactionHistory = [];
      this.interactionPatterns = {};
    }
    
    return true;
  }
  
  /**
   * Simuler un délai humain
   * @param {number} minDelay - Délai minimum en ms
   * @param {number} maxDelay - Délai maximum en ms
   * @returns {Promise<void>} - Promesse résolue après le délai
   */
  async simulateHumanDelay(minDelay = null, maxDelay = null) {
    if (!this.enableHumanization) {
      return Promise.resolve();
    }
    
    // Utiliser les valeurs par défaut si non spécifiées
    const min = minDelay !== null ? minDelay : this.baseDelay;
    const max = maxDelay !== null ? maxDelay : min + this.delayVariation;
    
    // Générer un délai aléatoire
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Attendre le délai
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Simuler un mouvement de souris humain
   * @param {HTMLElement} element - Élément cible
   * @param {Object} options - Options de mouvement
   * @returns {Promise<void>} - Promesse résolue après le mouvement
   */
  async simulateHumanMouseMovement(element, options = {}) {
    if (!this.enableHumanization || !element) {
      return Promise.resolve();
    }
    
    // Options par défaut
    const defaults = {
      steps: 10,
      duration: 500,
      jitter: 5
    };
    
    // Fusionner les options
    const config = { ...defaults, ...options };
    
    // Obtenir la position de l'élément
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    // Position actuelle de la souris
    const startX = window.mouseX || window.innerWidth / 2;
    const startY = window.mouseY || window.innerHeight / 2;
    
    // Simuler le mouvement
    const stepDuration = config.duration / config.steps;
    
    for (let i = 0; i < config.steps; i++) {
      // Calculer la position intermédiaire avec une courbe de Bézier
      const t = i / (config.steps - 1);
      const easedT = this._easeInOutQuad(t);
      
      let x = startX + (targetX - startX) * easedT;
      let y = startY + (targetY - startY) * easedT;
      
      // Ajouter un peu de jitter pour un mouvement plus naturel
      if (i > 0 && i < config.steps - 1) {
        x += (Math.random() - 0.5) * config.jitter;
        y += (Math.random() - 0.5) * config.jitter;
      }
      
      // Mettre à jour la position de la souris
      this._updateMousePosition(x, y);
      
      // Attendre avant la prochaine étape
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    // Mettre à jour la position finale
    this._updateMousePosition(targetX, targetY);
    
    return Promise.resolve();
  }
  
  /**
   * Mettre à jour la position de la souris
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @private
   */
  _updateMousePosition(x, y) {
    window.mouseX = x;
    window.mouseY = y;
    
    // Créer un événement de mouvement de souris
    const event = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    // Dispatcher l'événement
    document.dispatchEvent(event);
  }
  
  /**
   * Fonction d'easing quadratique
   * @param {number} t - Temps (0-1)
   * @returns {number} - Valeur d'easing
   * @private
   */
  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  /**
   * Simuler un clic humain
   * @param {HTMLElement} element - Élément cible
   * @param {Object} options - Options de clic
   * @returns {Promise<void>} - Promesse résolue après le clic
   */
  async simulateHumanClick(element, options = {}) {
    if (!this.enableHumanization || !element) {
      return Promise.resolve();
    }
    
    // Options par défaut
    const defaults = {
      moveFirst: true,
      clickDelay: 100
    };
    
    // Fusionner les options
    const config = { ...defaults, ...options };
    
    // D'abord déplacer la souris vers l'élément
    if (config.moveFirst) {
      await this.simulateHumanMouseMovement(element);
    }
    
    // Attendre un court délai
    await this.simulateHumanDelay(config.clickDelay / 2, config.clickDelay);
    
    // Simuler le clic
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Créer les événements de souris
    const mousedownEvent = new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    const mouseupEvent = new MouseEvent('mouseup', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    // Dispatcher les événements
    element.dispatchEvent(mousedownEvent);
    
    // Attendre un court délai entre mousedown et mouseup
    await this.simulateHumanDelay(30, 70);
    
    element.dispatchEvent(mouseupEvent);
    element.dispatchEvent(clickEvent);
    
    // Enregistrer l'interaction
    this.trackInteraction('click', {
      element: element.tagName,
      id: element.id,
      class: element.className,
      position: { x, y }
    });
    
    return Promise.resolve();
  }
  
  /**
   * Simuler une saisie humaine
   * @param {HTMLElement} element - Élément cible (input, textarea)
   * @param {string} text - Texte à saisir
   * @param {Object} options - Options de saisie
   * @returns {Promise<void>} - Promesse résolue après la saisie
   */
  async simulateHumanTyping(element, text, options = {}) {
    if (!this.enableHumanization || !element || !text) {
      return Promise.resolve();
    }
    
    // Vérifier que l'élément est un champ de saisie
    if (!['INPUT', 'TEXTAREA'].includes(element.tagName)) {
      console.error('L\'élément doit être un champ de saisie (input, textarea)');
      return Promise.resolve();
    }
    
    // Options par défaut
    const defaults = {
      focusFirst: true,
      minDelay: 50,
      maxDelay: 150,
      initialDelay: 300,
      finalDelay: 500,
      mistakeProbability: 0.05,
      correctionDelay: 400
    };
    
    // Fusionner les options
    const config = { ...defaults, ...options };
    
    // D'abord mettre le focus sur l'élément
    if (config.focusFirst) {
      await this.simulateHumanClick(element, { moveFirst: true });
      await this.simulateHumanDelay(config.initialDelay, config.initialDelay * 1.5);
    }
    
    // Saisir le texte caractère par caractère
    for (let i = 0; i < text.length; i++) {
      // Simuler une erreur de frappe occasionnelle
      if (Math.random() < config.mistakeProbability && i < text.length - 1) {
        // Choisir un caractère erroné proche sur le clavier
        const errorChar = this._getNeighborKey(text[i]);
        
        // Saisir le caractère erroné
        element.value += errorChar;
        
        // Créer un événement input
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Attendre un délai avant correction
        await this.simulateHumanDelay(config.correctionDelay, config.correctionDelay * 1.5);
        
        // Supprimer le caractère erroné
        element.value = element.value.slice(0, -1);
        
        // Créer un événement input
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Attendre un court délai
        await this.simulateHumanDelay(config.minDelay, config.maxDelay);
      }
      
      // Saisir le caractère correct
      element.value += text[i];
      
      // Créer un événement input
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Varier la vitesse de frappe en fonction du caractère
      let delay = config.minDelay;
      
      // Ralentir pour les caractères spéciaux et les majuscules
      if (text[i].match(/[^a-zA-Z0-9]/)) {
        delay = config.maxDelay;
      } else if (text[i].match(/[A-Z]/)) {
        delay = (config.minDelay + config.maxDelay) / 2;
      }
      
      // Ralentir à la fin des mots
      if (text[i] === ' ' || text[i] === '.' || text[i] === ',') {
        delay = config.maxDelay * 1.5;
      }
      
      // Attendre le délai
      await this.simulateHumanDelay(delay, delay * 1.5);
    }
    
    // Attendre un délai final
    await this.simulateHumanDelay(config.finalDelay, config.finalDelay * 1.5);
    
    // Créer un événement change
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Enregistrer l'interaction
    this.trackInteraction('typing', {
      element: element.tagName,
      id: element.id,
      class: element.className,
      textLength: text.length
    });
    
    return Promise.resolve();
  }
  
  /**
   * Obtenir une touche voisine sur le clavier
   * @param {string} key - Touche d'origine
   * @returns {string} - Touche voisine
   * @private
   */
  _getNeighborKey(key) {
    // Disposition de clavier AZERTY simplifiée
    const keyboardLayout = {
      'a': ['q', 'z', 's'],
      'z': ['a', 'e', 's', 'q'],
      'e': ['z', 'r', 'd', 's'],
      'r': ['e', 't', 'f', 'd'],
      't': ['r', 'y', 'g', 'f'],
      'y': ['t', 'u', 'h', 'g'],
      'u': ['y', 'i', 'j', 'h'],
      'i': ['u', 'o', 'k', 'j'],
      'o': ['i', 'p', 'l', 'k'],
      'p': ['o', 'm', 'l'],
      'q': ['a', 'z', 's', 'w'],
      's': ['q', 'z', 'e', 'd', 'x', 'w'],
      'd': ['s', 'e', 'r', 'f', 'c', 'x'],
      'f': ['d', 'r', 't', 'g', 'v', 'c'],
      'g': ['f', 't', 'y', 'h', 'b', 'v'],
      'h': ['g', 'y', 'u', 'j', 'n', 'b'],
      'j': ['h', 'u', 'i', 'k', ',', 'n'],
      'k': ['j', 'i', 'o', 'l', ';', ','],
      'l': ['k', 'o', 'p', 'm', ':', ';'],
      'm': ['l', 'p', ':', '!'],
      'w': ['q', 's', 'x'],
      'x': ['w', 's', 'd', 'c'],
      'c': ['x', 'd', 'f', 'v'],
      'v': ['c', 'f', 'g', 'b'],
      'b': ['v', 'g', 'h', 'n'],
      'n': ['b', 'h', 'j', ','],
      ',': ['n', 'j', 'k', ';'],
      ';': [',', 'k', 'l', ':'],
      ':': [';', 'l', 'm', '!'],
      '!': [':', 'm']
    };
    
    // Convertir en minuscule pour la recherche
    const lowerKey = key.toLowerCase();
    
    // Si la touche existe dans la disposition
    if (keyboardLayout[lowerKey]) {
      const neighbors = keyboardLayout[lowerKey];
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Conserver la casse
      return key === key.toUpperCase() ? randomNeighbor.toUpperCase() : randomNeighbor;
    }
    
    // Fallback: retourner une lettre aléatoire
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  
  /**
   * Simuler un défilement humain
   * @param {number} targetY - Position Y cible
   * @param {Object} options - Options de défilement
   * @returns {Promise<void>} - Promesse résolue après le défilement
   */
  async simulateHumanScroll(targetY, options = {}) {
    if (!this.enableHumanization) {
      return Promise.resolve();
    }
    
    // Options par défaut
    const defaults = {
      steps: 15,
      duration: 800,
      easing: 'easeInOutQuad',
      jitter: 10
    };
    
    // Fusionner les options
    const config = { ...defaults, ...options };
    
    // Position actuelle
    const startY = window.scrollY;
    const distance = targetY - startY;
    
    // Pas de défilement si la distance est nulle
    if (distance === 0) {
      return Promise.resolve();
    }
    
    // Simuler le défilement
    const stepDuration = config.duration / config.steps;
    
    for (let i = 0; i < config.steps; i++) {
      // Calculer la position intermédiaire avec easing
      const t = i / (config.steps - 1);
      const easedT = this._easeInOutQuad(t);
      
      let scrollY = startY + distance * easedT;
      
      // Ajouter un peu de jitter pour un défilement plus naturel
      if (i > 0 && i < config.steps - 1) {
        scrollY += (Math.random() - 0.5) * config.jitter;
      }
      
      // Effectuer le défilement
      window.scrollTo({
        top: scrollY,
        behavior: 'auto' // Utiliser 'auto' car nous gérons l'animation nous-mêmes
      });
      
      // Attendre avant la prochaine étape
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    // Défilement final à la position exacte
    window.scrollTo({
      top: targetY,
      behavior: 'auto'
    });
    
    // Enregistrer l'interaction
    this.trackInteraction('scroll', {
      from: startY,
      to: targetY,
      distance
    });
    
    return Promise.resolve();
  }
  
  /**
   * Simuler une navigation humaine
   * @param {string} url - URL de destination
   * @param {Object} options - Options de navigation
   * @returns {Promise<void>} - Promesse résolue après la navigation
   */
  async simulateHumanNavigation(url, options = {}) {
    if (!this.enableHumanization || !url) {
      return Promise.resolve();
    }
    
    // Options par défaut
    const defaults = {
      delay: 500
    };
    
    // Fusionner les options
    const config = { ...defaults, ...options };
    
    // Attendre un délai
    await this.simulateHumanDelay(config.delay, config.delay * 1.5);
    
    // Enregistrer l'interaction
    this.trackInteraction('navigation', {
      from: window.location.href,
      to: url
    });
    
    // Effectuer la navigation
    window.location.href = url;
    
    return Promise.resolve();
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default InteractionService;
