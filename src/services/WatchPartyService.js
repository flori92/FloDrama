/**
 * Service de gestion des Watch Parties pour FloDrama
 * Gère les connexions WebSocket et les interactions en temps réel
 */

// Importation conditionnelle pour éviter les problèmes de build
let io;
try {
  // Essayer d'importer socket.io-client de manière dynamique
  if (typeof window !== 'undefined') {
    io = require('socket.io-client');
  }
} catch (error) {
  console.warn('Socket.io-client non disponible, fonctionnalités Watch Party désactivées');
  // Créer un mock pour éviter les erreurs
  io = () => ({
    on: () => {},
    emit: () => {},
    disconnect: () => {},
    connected: false
  });
}

import { API_BASE_URL } from '../config/api';
import AuthService from './AuthService';

class WatchPartyService {
  constructor() {
    this.socket = null;
    this.currentParty = null;
    this.messageListeners = [];
    this.statusListeners = [];
    this.videoSyncListeners = [];
  }

  /**
   * Initialise une connexion WebSocket pour une Watch Party
   * @param {string} partyId - Identifiant unique de la Watch Party
   * @returns {Promise<boolean>} - Succès de la connexion
   */
  async joinParty(partyId) {
    try {
      // Récupérer le token d'authentification
      const token = await AuthService.getToken();
      
      if (!token) {
        console.error('Impossible de rejoindre la Watch Party: utilisateur non authentifié');
        return false;
      }

      // Fermer toute connexion existante
      if (this.socket) {
        this.leaveParty();
      }

      // Créer une nouvelle connexion
      this.socket = io(`${API_BASE_URL}/watch-party`, {
        query: { partyId },
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Configurer les écouteurs d'événements
      this._setupEventListeners();
      
      this.currentParty = partyId;
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion à la Watch Party:', error);
      return false;
    }
  }

  /**
   * Quitte la Watch Party actuelle
   */
  leaveParty() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentParty = null;
      
      // Notifier les écouteurs du changement de statut
      this._notifyStatusListeners({ connected: false, partyId: null });
    }
  }

  /**
   * Envoie un message dans la Watch Party
   * @param {Object} message - Message à envoyer (format GiftedChat)
   * @returns {boolean} - Succès de l'envoi
   */
  sendMessage(message) {
    if (!this.socket || !this.socket.connected) {
      console.error('Impossible d\'envoyer un message: non connecté à une Watch Party');
      return false;
    }

    this.socket.emit('message', message);
    return true;
  }

  /**
   * Synchronise la position de lecture vidéo avec les autres participants
   * @param {number} timestamp - Position de lecture en secondes
   * @param {boolean} isPlaying - État de lecture (lecture/pause)
   */
  syncVideoPosition(timestamp, isPlaying) {
    if (!this.socket || !this.socket.connected) {
      return false;
    }

    this.socket.emit('videoSync', { timestamp, isPlaying });
    return true;
  }

  /**
   * Ajoute un écouteur pour les nouveaux messages
   * @param {Function} listener - Fonction appelée lors de la réception d'un message
   */
  addMessageListener(listener) {
    this.messageListeners.push(listener);
  }

  /**
   * Supprime un écouteur de messages
   * @param {Function} listener - Écouteur à supprimer
   */
  removeMessageListener(listener) {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  /**
   * Ajoute un écouteur pour les changements de statut de connexion
   * @param {Function} listener - Fonction appelée lors d'un changement de statut
   */
  addStatusListener(listener) {
    this.statusListeners.push(listener);
    
    // Envoyer immédiatement l'état actuel
    if (this.socket) {
      listener({ 
        connected: this.socket.connected, 
        partyId: this.currentParty 
      });
    } else {
      listener({ connected: false, partyId: null });
    }
  }

  /**
   * Supprime un écouteur de statut
   * @param {Function} listener - Écouteur à supprimer
   */
  removeStatusListener(listener) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  /**
   * Ajoute un écouteur pour la synchronisation vidéo
   * @param {Function} listener - Fonction appelée lors d'une synchronisation
   */
  addVideoSyncListener(listener) {
    this.videoSyncListeners.push(listener);
  }

  /**
   * Supprime un écouteur de synchronisation vidéo
   * @param {Function} listener - Écouteur à supprimer
   */
  removeVideoSyncListener(listener) {
    this.videoSyncListeners = this.videoSyncListeners.filter(l => l !== listener);
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   * @private
   */
  _setupEventListeners() {
    if (!this.socket) return;

    // Connexion établie
    this.socket.on('connect', () => {
      this._notifyStatusListeners({ 
        connected: true, 
        partyId: this.currentParty 
      });
    });

    // Déconnexion
    this.socket.on('disconnect', () => {
      this._notifyStatusListeners({ 
        connected: false, 
        partyId: this.currentParty 
      });
    });

    // Réception d'un message
    this.socket.on('message', (message) => {
      this._notifyMessageListeners(message);
    });

    // Synchronisation vidéo
    this.socket.on('videoSync', (syncData) => {
      this._notifyVideoSyncListeners(syncData);
    });

    // Erreurs
    this.socket.on('error', (error) => {
      console.error('Erreur WebSocket:', error);
      this._notifyStatusListeners({ 
        connected: this.socket?.connected || false,
        partyId: this.currentParty,
        error
      });
    });
  }

  /**
   * Notifie tous les écouteurs de messages
   * @param {Object} message - Message reçu
   * @private
   */
  _notifyMessageListeners(message) {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Erreur dans un écouteur de messages:', error);
      }
    });
  }

  /**
   * Notifie tous les écouteurs de statut
   * @param {Object} status - Statut de connexion
   * @private
   */
  _notifyStatusListeners(status) {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erreur dans un écouteur de statut:', error);
      }
    });
  }

  /**
   * Notifie tous les écouteurs de synchronisation vidéo
   * @param {Object} syncData - Données de synchronisation
   * @private
   */
  _notifyVideoSyncListeners(syncData) {
    this.videoSyncListeners.forEach(listener => {
      try {
        listener(syncData);
      } catch (error) {
        console.error('Erreur dans un écouteur de synchronisation vidéo:', error);
      }
    });
  }
}

// Créer une instance unique du service
const watchPartyService = new WatchPartyService();

// Exporter l'instance
export default watchPartyService;
