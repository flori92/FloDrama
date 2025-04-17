/**
 * HybridBridgeService
 * 
 * Service de communication entre les applications React et Flutter de FloDrama
 * Permet de partager des données et des événements entre les deux plateformes
 */

class HybridBridgeService {
  constructor() {
    this.isFlutterAvailable = this._checkFlutterAvailability();
    this.eventListeners = {};
    this.pendingRequests = new Map();
    this.requestId = 0;
    
    // Initialisation de l'écoute des messages depuis Flutter
    this._initMessageListener();
  }
  
  /**
   * Vérifie si l'application est exécutée dans un contexte Flutter
   * @returns {boolean} True si Flutter est disponible
   */
  _checkFlutterAvailability() {
    return (
      typeof window !== 'undefined' && 
      window.flutter_inappwebview !== undefined
    );
  }
  
  /**
   * Initialise l'écoute des messages provenant de Flutter
   */
  _initMessageListener() {
    if (typeof window !== 'undefined') {
      // Définir la fonction de réception des messages
      window.receiveFromFlutter = (message) => {
        try {
          const data = JSON.parse(message);
          
          // Si c'est une réponse à une requête
          if (data.requestId && this.pendingRequests.has(data.requestId)) {
            const { resolve, reject } = this.pendingRequests.get(data.requestId);
            
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.data);
            }
            
            this.pendingRequests.delete(data.requestId);
          } 
          // Si c'est un événement
          else if (data.event && this.eventListeners[data.event]) {
            this.eventListeners[data.event].forEach(callback => {
              callback(data.data);
            });
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message Flutter:', error);
        }
      };
    }
  }
  
  /**
   * Envoie un message à Flutter
   * @param {string} action - Action à exécuter
   * @param {object} data - Données à envoyer
   * @returns {Promise} Promesse résolue avec la réponse de Flutter
   */
  sendToFlutter(action, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isFlutterAvailable) {
        // Mode de développement ou exécution standalone
        console.warn(`Flutter non disponible. Action: ${action}`, data);
        
        // Simuler une réponse pour le développement
        if (action === 'getMetadata') {
          setTimeout(() => resolve({ success: true, simulatedData: true }), 500);
        } else {
          resolve({ success: false, message: 'Flutter non disponible' });
        }
        return;
      }
      
      try {
        const requestId = ++this.requestId;
        
        // Stocker la promesse pour la résoudre plus tard
        this.pendingRequests.set(requestId, { resolve, reject });
        
        // Envoyer le message à Flutter
        const message = JSON.stringify({
          action,
          data,
          requestId
        });
        
        window.flutter_inappwebview.callHandler('flutterBridge', message);
        
        // Timeout pour éviter les promesses en attente indéfiniment
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Délai d'attente dépassé pour l'action: ${action}`));
          }
        }, 10000); // 10 secondes de timeout
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * S'abonne à un événement Flutter
   * @param {string} eventName - Nom de l'événement
   * @param {function} callback - Fonction à appeler lors de l'événement
   * @returns {function} Fonction pour se désabonner
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    this.eventListeners[eventName].push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        cb => cb !== callback
      );
    };
  }
  
  /**
   * Récupère les métadonnées d'un drama depuis Flutter
   * @param {string} dramaId - Identifiant du drama
   * @returns {Promise} Promesse résolue avec les métadonnées
   */
  getDramaMetadata(dramaId) {
    return this.sendToFlutter('getDramaMetadata', { dramaId });
  }
  
  /**
   * Récupère les épisodes d'un drama depuis Flutter
   * @param {string} dramaId - Identifiant du drama
   * @returns {Promise} Promesse résolue avec la liste des épisodes
   */
  getDramaEpisodes(dramaId) {
    return this.sendToFlutter('getDramaEpisodes', { dramaId });
  }
  
  /**
   * Récupère les sources vidéo d'un épisode depuis Flutter
   * @param {string} episodeId - Identifiant de l'épisode
   * @returns {Promise} Promesse résolue avec les sources vidéo
   */
  getVideoSources(episodeId) {
    return this.sendToFlutter('getVideoSources', { episodeId });
  }
  
  /**
   * Met à jour l'historique de visionnage
   * @param {object} watchData - Données de visionnage
   * @returns {Promise} Promesse résolue avec le statut de la mise à jour
   */
  updateWatchHistory(watchData) {
    return this.sendToFlutter('updateWatchHistory', watchData);
  }
  
  /**
   * Gère les favoris
   * @param {string} dramaId - Identifiant du drama
   * @param {boolean} isFavorite - État du favori
   * @returns {Promise} Promesse résolue avec le statut de la mise à jour
   */
  toggleFavorite(dramaId, isFavorite) {
    return this.sendToFlutter('toggleFavorite', { dramaId, isFavorite });
  }
  
  /**
   * Récupère les recommandations depuis Flutter
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise} Promesse résolue avec les recommandations
   */
  getRecommendations(userId) {
    return this.sendToFlutter('getRecommendations', { userId });
  }
}

// Exporter une instance unique du service
const hybridBridgeService = new HybridBridgeService();
export default hybridBridgeService;
export { HybridBridgeService };
