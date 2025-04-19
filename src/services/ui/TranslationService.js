// Service de traduction pour FloDrama
// Gère les traductions et l'internationalisation de l'application

/**
 * Service de traduction
 * @class TranslationService
 */
export class TranslationService {
  /**
   * Constructeur du service de traduction
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.defaultLanguage - Langue par défaut (défaut: 'fr')
   * @param {string} config.fallbackLanguage - Langue de secours (défaut: 'en')
   * @param {string} config.translationsKey - Clé pour les traductions (défaut: 'translations')
   * @param {boolean} config.useMockData - Utiliser des données fictives (défaut: true)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.defaultLanguage = config.defaultLanguage || 'fr';
    this.fallbackLanguage = config.fallbackLanguage || 'en';
    this.translationsKey = config.translationsKey || 'translations';
    this.useMockData = config.useMockData !== undefined ? config.useMockData : true;
    
    // Langue actuelle
    this.currentLanguage = this.defaultLanguage;
    
    // Traductions
    this.translations = {};
    
    // Écouteurs
    this.listeners = [];
    
    // Charger les traductions
    this._loadTranslations();
    
    console.log('TranslationService initialisé');
  }
  
  /**
   * Charger les traductions
   * @private
   */
  async _loadTranslations() {
    try {
      // Essayer de charger depuis le stockage
      let translations = null;
      
      if (this.storageService) {
        translations = await this.storageService.get(this.translationsKey);
      } else {
        // Fallback sur localStorage
        const storedTranslations = localStorage.getItem(`flodrama_${this.translationsKey}`);
        if (storedTranslations) {
          translations = JSON.parse(storedTranslations);
        }
      }
      
      // Si aucune traduction n'est trouvée, charger depuis l'API ou les données fictives
      if (!translations) {
        if (this.apiService && !this.useMockData) {
          translations = await this._fetchTranslationsFromApi();
        } else {
          translations = this._getMockTranslations();
        }
        
        // Sauvegarder les traductions
        if (translations) {
          if (this.storageService) {
            await this.storageService.set(this.translationsKey, translations);
          } else {
            localStorage.setItem(
              `flodrama_${this.translationsKey}`, 
              JSON.stringify(translations)
            );
          }
        }
      }
      
      if (translations) {
        this.translations = translations;
        console.log(`Traductions chargées pour ${Object.keys(translations).length} langues`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traductions:', error);
      this.translations = this._getMockTranslations();
    }
  }
  
  /**
   * Récupérer les traductions depuis l'API
   * @returns {Promise<Object>} - Traductions
   * @private
   */
  async _fetchTranslationsFromApi() {
    try {
      if (!this.apiService) {
        throw new Error('ApiService non disponible');
      }
      
      const response = await this.apiService.get('/translations');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des traductions:', error);
      return null;
    }
  }
  
  /**
   * Obtenir des traductions fictives
   * @returns {Object} - Traductions
   * @private
   */
  _getMockTranslations() {
    return {
      fr: {
        app: {
          name: 'FloDrama',
          tagline: 'Votre plateforme de streaming préférée'
        },
        common: {
          search: 'Rechercher',
          filter: 'Filtrer',
          sort: 'Trier',
          loading: 'Chargement...',
          error: 'Erreur',
          success: 'Succès',
          warning: 'Avertissement',
          info: 'Information',
          close: 'Fermer',
          save: 'Enregistrer',
          cancel: 'Annuler',
          confirm: 'Confirmer',
          delete: 'Supprimer',
          edit: 'Modifier',
          view: 'Voir',
          back: 'Retour',
          next: 'Suivant',
          previous: 'Précédent',
          more: 'Plus',
          less: 'Moins',
          all: 'Tous',
          none: 'Aucun',
          yes: 'Oui',
          no: 'Non'
        },
        auth: {
          login: 'Connexion',
          logout: 'Déconnexion',
          register: 'Inscription',
          forgotPassword: 'Mot de passe oublié',
          resetPassword: 'Réinitialiser le mot de passe',
          username: 'Nom d\'utilisateur',
          email: 'Email',
          password: 'Mot de passe',
          confirmPassword: 'Confirmer le mot de passe',
          rememberMe: 'Se souvenir de moi',
          loginSuccess: 'Connexion réussie',
          loginError: 'Erreur de connexion',
          logoutSuccess: 'Déconnexion réussie',
          registerSuccess: 'Inscription réussie',
          registerError: 'Erreur d\'inscription'
        },
        content: {
          recentlyAdded: 'Ajoutés récemment',
          trending: 'Tendances',
          popular: 'Populaires',
          recommended: 'Recommandés pour vous',
          favorites: 'Favoris',
          watchLater: 'À regarder plus tard',
          continueWatching: 'Continuer à regarder',
          movie: 'Film',
          series: 'Série',
          episode: 'Épisode',
          season: 'Saison',
          category: 'Catégorie',
          genre: 'Genre',
          director: 'Réalisateur',
          actor: 'Acteur',
          duration: 'Durée',
          releaseDate: 'Date de sortie',
          rating: 'Note',
          synopsis: 'Synopsis',
          trailer: 'Bande-annonce',
          cast: 'Distribution',
          crew: 'Équipe technique',
          similar: 'Similaires',
          related: 'Liés',
          watchNow: 'Regarder maintenant',
          addToFavorites: 'Ajouter aux favoris',
          removeFromFavorites: 'Retirer des favoris',
          addToWatchLater: 'Regarder plus tard',
          removeFromWatchLater: 'Retirer de regarder plus tard'
        },
        player: {
          play: 'Lecture',
          pause: 'Pause',
          stop: 'Arrêt',
          mute: 'Muet',
          unmute: 'Son activé',
          fullscreen: 'Plein écran',
          exitFullscreen: 'Quitter le plein écran',
          settings: 'Paramètres',
          quality: 'Qualité',
          speed: 'Vitesse',
          subtitles: 'Sous-titres',
          audio: 'Audio',
          volume: 'Volume',
          seekForward: 'Avancer',
          seekBackward: 'Reculer',
          nextEpisode: 'Épisode suivant',
          previousEpisode: 'Épisode précédent',
          watchParty: 'Watch Party',
          startWatchParty: 'Démarrer une Watch Party',
          joinWatchParty: 'Rejoindre une Watch Party',
          leaveWatchParty: 'Quitter la Watch Party',
          inviteFriends: 'Inviter des amis'
        },
        user: {
          profile: 'Profil',
          settings: 'Paramètres',
          account: 'Compte',
          subscription: 'Abonnement',
          billing: 'Facturation',
          notifications: 'Notifications',
          preferences: 'Préférences',
          language: 'Langue',
          theme: 'Thème',
          dark: 'Sombre',
          light: 'Clair',
          system: 'Système',
          privacy: 'Confidentialité',
          security: 'Sécurité',
          help: 'Aide',
          feedback: 'Commentaires',
          about: 'À propos',
          terms: 'Conditions d\'utilisation',
          contact: 'Contact'
        },
        errors: {
          notFound: 'Page non trouvée',
          serverError: 'Erreur serveur',
          connectionError: 'Erreur de connexion',
          authRequired: 'Authentification requise',
          permissionDenied: 'Permission refusée',
          invalidInput: 'Entrée invalide',
          contentUnavailable: 'Contenu non disponible',
          tryAgain: 'Veuillez réessayer'
        }
      },
      en: {
        app: {
          name: 'FloDrama',
          tagline: 'Your favorite streaming platform'
        },
        common: {
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          warning: 'Warning',
          info: 'Information',
          close: 'Close',
          save: 'Save',
          cancel: 'Cancel',
          confirm: 'Confirm',
          delete: 'Delete',
          edit: 'Edit',
          view: 'View',
          back: 'Back',
          next: 'Next',
          previous: 'Previous',
          more: 'More',
          less: 'Less',
          all: 'All',
          none: 'None',
          yes: 'Yes',
          no: 'No'
        },
        auth: {
          login: 'Login',
          logout: 'Logout',
          register: 'Register',
          forgotPassword: 'Forgot Password',
          resetPassword: 'Reset Password',
          username: 'Username',
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          rememberMe: 'Remember Me',
          loginSuccess: 'Login Successful',
          loginError: 'Login Error',
          logoutSuccess: 'Logout Successful',
          registerSuccess: 'Registration Successful',
          registerError: 'Registration Error'
        },
        content: {
          recentlyAdded: 'Recently Added',
          trending: 'Trending',
          popular: 'Popular',
          recommended: 'Recommended for You',
          favorites: 'Favorites',
          watchLater: 'Watch Later',
          continueWatching: 'Continue Watching',
          movie: 'Movie',
          series: 'Series',
          episode: 'Episode',
          season: 'Season',
          category: 'Category',
          genre: 'Genre',
          director: 'Director',
          actor: 'Actor',
          duration: 'Duration',
          releaseDate: 'Release Date',
          rating: 'Rating',
          synopsis: 'Synopsis',
          trailer: 'Trailer',
          cast: 'Cast',
          crew: 'Crew',
          similar: 'Similar',
          related: 'Related',
          watchNow: 'Watch Now',
          addToFavorites: 'Add to Favorites',
          removeFromFavorites: 'Remove from Favorites',
          addToWatchLater: 'Watch Later',
          removeFromWatchLater: 'Remove from Watch Later'
        },
        player: {
          play: 'Play',
          pause: 'Pause',
          stop: 'Stop',
          mute: 'Mute',
          unmute: 'Unmute',
          fullscreen: 'Fullscreen',
          exitFullscreen: 'Exit Fullscreen',
          settings: 'Settings',
          quality: 'Quality',
          speed: 'Speed',
          subtitles: 'Subtitles',
          audio: 'Audio',
          volume: 'Volume',
          seekForward: 'Forward',
          seekBackward: 'Backward',
          nextEpisode: 'Next Episode',
          previousEpisode: 'Previous Episode',
          watchParty: 'Watch Party',
          startWatchParty: 'Start a Watch Party',
          joinWatchParty: 'Join a Watch Party',
          leaveWatchParty: 'Leave Watch Party',
          inviteFriends: 'Invite Friends'
        },
        user: {
          profile: 'Profile',
          settings: 'Settings',
          account: 'Account',
          subscription: 'Subscription',
          billing: 'Billing',
          notifications: 'Notifications',
          preferences: 'Preferences',
          language: 'Language',
          theme: 'Theme',
          dark: 'Dark',
          light: 'Light',
          system: 'System',
          privacy: 'Privacy',
          security: 'Security',
          help: 'Help',
          feedback: 'Feedback',
          about: 'About',
          terms: 'Terms of Use',
          contact: 'Contact'
        },
        errors: {
          notFound: 'Page Not Found',
          serverError: 'Server Error',
          connectionError: 'Connection Error',
          authRequired: 'Authentication Required',
          permissionDenied: 'Permission Denied',
          invalidInput: 'Invalid Input',
          contentUnavailable: 'Content Unavailable',
          tryAgain: 'Please Try Again'
        }
      }
    };
  }
  
  /**
   * Ajouter un écouteur de changement de langue
   * @param {Function} listener - Fonction appelée lors d'un changement de langue
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
   * @param {string} language - Langue
   * @private
   */
  _notifyListeners(language) {
    this.listeners.forEach(listener => {
      try {
        listener(language);
      } catch (error) {
        console.error('Erreur dans un écouteur de changement de langue:', error);
      }
    });
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('language-changed', {
      detail: { language }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Définir la langue actuelle
   * @param {string} language - Code de langue
   * @returns {boolean} - Succès de l'opération
   */
  setLanguage(language) {
    if (!language) {
      console.error('Code de langue non fourni');
      return false;
    }
    
    // Vérifier si la langue est disponible
    if (!this.translations[language]) {
      console.warn(`Langue '${language}' non disponible, utilisation de la langue par défaut`);
      language = this.defaultLanguage;
    }
    
    // Définir la langue
    this.currentLanguage = language;
    
    // Sauvegarder la préférence
    try {
      if (this.storageService) {
        this.storageService.set('language_preference', language);
      } else {
        localStorage.setItem('flodrama_language_preference', language);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence de langue:', error);
    }
    
    // Notifier les écouteurs
    this._notifyListeners(language);
    
    console.log(`Langue définie: ${language}`);
    return true;
  }
  
  /**
   * Obtenir la langue actuelle
   * @returns {string} - Code de langue
   */
  getLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Obtenir les langues disponibles
   * @returns {Array} - Codes de langue
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
  
  /**
   * Traduire une clé
   * @param {string} key - Clé de traduction (format: 'section.subsection.key')
   * @param {Object} params - Paramètres de remplacement
   * @param {string} language - Code de langue (défaut: langue actuelle)
   * @returns {string} - Texte traduit
   */
  translate(key, params = {}, language = null) {
    if (!key) {
      console.error('Clé de traduction non fournie');
      return key;
    }
    
    // Utiliser la langue spécifiée ou la langue actuelle
    const lang = language || this.currentLanguage;
    
    // Vérifier si la langue est disponible
    if (!this.translations[lang]) {
      console.warn(`Langue '${lang}' non disponible, utilisation de la langue de secours`);
      return this.translateFallback(key, params);
    }
    
    // Diviser la clé en sections
    const sections = key.split('.');
    
    // Naviguer dans l'objet de traduction
    let translation = this.translations[lang];
    for (const section of sections) {
      if (!translation[section]) {
        console.warn(`Clé de traduction '${key}' non trouvée pour la langue '${lang}', utilisation de la langue de secours`);
        return this.translateFallback(key, params);
      }
      translation = translation[section];
    }
    
    // Si la traduction n'est pas une chaîne, utiliser la clé
    if (typeof translation !== 'string') {
      console.warn(`Clé de traduction '${key}' n'est pas une chaîne pour la langue '${lang}'`);
      return key;
    }
    
    // Remplacer les paramètres
    let result = translation;
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    });
    
    return result;
  }
  
  /**
   * Traduire une clé avec la langue de secours
   * @param {string} key - Clé de traduction
   * @param {Object} params - Paramètres de remplacement
   * @returns {string} - Texte traduit
   * @private
   */
  translateFallback(key, params = {}) {
    // Vérifier si la langue de secours est disponible
    if (!this.translations[this.fallbackLanguage]) {
      console.error(`Langue de secours '${this.fallbackLanguage}' non disponible`);
      return key;
    }
    
    // Diviser la clé en sections
    const sections = key.split('.');
    
    // Naviguer dans l'objet de traduction
    let translation = this.translations[this.fallbackLanguage];
    for (const section of sections) {
      if (!translation[section]) {
        console.error(`Clé de traduction '${key}' non trouvée pour la langue de secours '${this.fallbackLanguage}'`);
        return key;
      }
      translation = translation[section];
    }
    
    // Si la traduction n'est pas une chaîne, utiliser la clé
    if (typeof translation !== 'string') {
      console.error(`Clé de traduction '${key}' n'est pas une chaîne pour la langue de secours '${this.fallbackLanguage}'`);
      return key;
    }
    
    // Remplacer les paramètres
    let result = translation;
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    });
    
    return result;
  }
  
  /**
   * Ajouter des traductions
   * @param {string} language - Code de langue
   * @param {Object} translations - Traductions
   * @returns {boolean} - Succès de l'opération
   */
  addTranslations(language, translations) {
    if (!language || !translations) {
      console.error('Langue ou traductions non fournies');
      return false;
    }
    
    // Vérifier si la langue existe déjà
    if (this.translations[language]) {
      // Fusionner les traductions
      this.translations[language] = this._deepMerge(this.translations[language], translations);
    } else {
      // Ajouter les nouvelles traductions
      this.translations[language] = translations;
    }
    
    // Sauvegarder les traductions
    try {
      if (this.storageService) {
        this.storageService.set(this.translationsKey, this.translations);
      } else {
        localStorage.setItem(
          `flodrama_${this.translationsKey}`, 
          JSON.stringify(this.translations)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des traductions:', error);
      return false;
    }
    
    console.log(`Traductions ajoutées pour la langue '${language}'`);
    return true;
  }
  
  /**
   * Fusionner profondément deux objets
   * @param {Object} target - Objet cible
   * @param {Object} source - Objet source
   * @returns {Object} - Objet fusionné
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };
    
    if (typeof target === 'object' && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }
  
  /**
   * Fonction de traduction raccourcie
   * @param {string} key - Clé de traduction
   * @param {Object} params - Paramètres de remplacement
   * @returns {string} - Texte traduit
   */
  t(key, params = {}) {
    return this.translate(key, params);
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default TranslationService;
