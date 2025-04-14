/**
 * SocialViewingService
 * 
 * Service pour les fonctionnalités de visionnage social (Watch Parties)
 * Permet aux utilisateurs de regarder des contenus ensemble en synchronisant la lecture
 */

import axios from 'axios';
import HybridBridgeService from './HybridBridgeService';

class SocialViewingService {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'https://api.flodrama.com/v1';
    this.hybridBridgeService = HybridBridgeService;
    this.activeWatchParty = null;
    this.participants = [];
    this.chatMessages = [];
    this.isConnected = false;
    
    // Écouter les événements de synchronisation
    if (this.hybridBridgeService.isFlutterAvailable) {
      this.hybridBridgeService.addEventListener('watchPartyUpdate', this._handleWatchPartyUpdate.bind(this));
      this.hybridBridgeService.addEventListener('watchPartyChatMessage', this._handleChatMessage.bind(this));
      this.hybridBridgeService.addEventListener('watchPartyParticipantJoined', this._handleParticipantJoined.bind(this));
      this.hybridBridgeService.addEventListener('watchPartyParticipantLeft', this._handleParticipantLeft.bind(this));
      this.hybridBridgeService.addEventListener('watchPartyPlaybackSync', this._handlePlaybackSync.bind(this));
    }
  }
  
  /**
   * Crée une nouvelle soirée de visionnage
   * @param {Object} params - Paramètres de la soirée
   * @param {string} params.contentId - ID du contenu à regarder
   * @param {string} params.title - Titre de la soirée
   * @param {string} params.description - Description de la soirée
   * @param {Date} params.scheduledTime - Date et heure programmées (optionnel)
   * @param {boolean} params.isPrivate - Si la soirée est privée
   * @returns {Promise<Object>} Détails de la soirée créée
   */
  async createWatchParty({ contentId, title, description, scheduledTime, isPrivate = false }) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('createWatchParty', {
          contentId,
          title,
          description,
          scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
          isPrivate
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/watch-parties`, {
        contentId,
        title,
        description,
        scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
        isPrivate
      });
      
      this.activeWatchParty = response.data;
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la soirée de visionnage:', error);
      throw new Error('Échec de la création de la soirée de visionnage');
    }
  }
  
  /**
   * Rejoint une soirée de visionnage existante
   * @param {string} watchPartyId - ID de la soirée à rejoindre
   * @param {string} inviteCode - Code d'invitation (optionnel)
   * @returns {Promise<Object>} Détails de la soirée rejointe
   */
  async joinWatchParty(watchPartyId, inviteCode = null) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('joinWatchParty', {
          watchPartyId,
          inviteCode
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/watch-parties/${watchPartyId}/join`, {
        inviteCode
      });
      
      this.activeWatchParty = response.data.watchParty;
      this.participants = response.data.participants;
      this.isConnected = true;
      
      // Initialiser la connexion WebSocket pour le chat et la synchronisation
      this._initializeWebSocketConnection(watchPartyId);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la soirée de visionnage:', error);
      throw new Error('Échec de la tentative de rejoindre la soirée de visionnage');
    }
  }
  
  /**
   * Quitte la soirée de visionnage actuelle
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async leaveWatchParty() {
    if (!this.activeWatchParty) {
      console.warn('Aucune soirée de visionnage active à quitter');
      return false;
    }
    
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('leaveWatchParty', {
          watchPartyId: this.activeWatchParty.id
        });
      }
      
      // Sinon, utiliser l'API directement
      await axios.post(`${this.apiBaseUrl}/watch-parties/${this.activeWatchParty.id}/leave`);
      
      // Fermer la connexion WebSocket
      if (this.socket) {
        this.socket.close();
      }
      
      this.activeWatchParty = null;
      this.participants = [];
      this.chatMessages = [];
      this.isConnected = false;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la tentative de quitter la soirée de visionnage:', error);
      throw new Error('Échec de la tentative de quitter la soirée de visionnage');
    }
  }
  
  /**
   * Envoie un message dans le chat de la soirée
   * @param {string} message - Contenu du message
   * @returns {Promise<Object>} Message envoyé
   */
  async sendChatMessage(message) {
    if (!this.activeWatchParty) {
      throw new Error('Aucune soirée de visionnage active');
    }
    
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('sendWatchPartyChatMessage', {
          watchPartyId: this.activeWatchParty.id,
          message
        });
      }
      
      // Sinon, utiliser l'API directement
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'chat',
          message
        }));
        
        // Ajouter le message localement pour l'affichage immédiat
        const newMessage = {
          id: `local-${Date.now()}`,
          content: message,
          sender: 'Moi', // À remplacer par le nom d'utilisateur réel
          timestamp: new Date().toISOString()
        };
        
        this.chatMessages.push(newMessage);
        return newMessage;
      } else {
        throw new Error('Connexion WebSocket non disponible');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw new Error('Échec de l\'envoi du message');
    }
  }
  
  /**
   * Synchronise la lecture vidéo avec les autres participants
   * @param {number} currentTime - Position actuelle de lecture en secondes
   * @param {boolean} isPlaying - État de lecture (lecture/pause)
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async syncPlayback(currentTime, isPlaying) {
    if (!this.activeWatchParty) {
      throw new Error('Aucune soirée de visionnage active');
    }
    
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('syncWatchPartyPlayback', {
          watchPartyId: this.activeWatchParty.id,
          currentTime,
          isPlaying
        });
      }
      
      // Sinon, utiliser l'API directement
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'playback',
          currentTime,
          isPlaying
        }));
        return true;
      } else {
        throw new Error('Connexion WebSocket non disponible');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation de la lecture:', error);
      throw new Error('Échec de la synchronisation de la lecture');
    }
  }
  
  /**
   * Récupère les soirées de visionnage actives
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des soirées actives
   */
  async getActiveWatchParties(filters = {}) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('getActiveWatchParties', filters);
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.get(`${this.apiBaseUrl}/watch-parties`, {
        params: filters
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des soirées de visionnage:', error);
      throw new Error('Échec de la récupération des soirées de visionnage');
    }
  }
  
  /**
   * Initialise la connexion WebSocket pour le chat et la synchronisation
   * @private
   * @param {string} watchPartyId - ID de la soirée
   */
  _initializeWebSocketConnection(watchPartyId) {
    // Fermer toute connexion existante
    if (this.socket) {
      this.socket.close();
    }
    
    // Créer une nouvelle connexion
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/watch-parties/${watchPartyId}`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('Connexion WebSocket établie pour la soirée de visionnage');
      this.isConnected = true;
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'chat':
            this._handleChatMessage(data);
            break;
          case 'participant_joined':
            this._handleParticipantJoined(data);
            break;
          case 'participant_left':
            this._handleParticipantLeft(data);
            break;
          case 'playback':
            this._handlePlaybackSync(data);
            break;
          default:
            console.log('Message WebSocket non géré:', data);
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message WebSocket:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log('Connexion WebSocket fermée');
      this.isConnected = false;
    };
    
    this.socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      this.isConnected = false;
    };
  }
  
  /**
   * Gère les mises à jour de la soirée de visionnage
   * @private
   * @param {Object} data - Données de mise à jour
   */
  _handleWatchPartyUpdate(data) {
    this.activeWatchParty = data.watchParty;
    
    // Déclencher un événement pour notifier les composants
    const event = new CustomEvent('watchPartyUpdated', { detail: data });
    window.dispatchEvent(event);
  }
  
  /**
   * Gère les nouveaux messages de chat
   * @private
   * @param {Object} data - Données du message
   */
  _handleChatMessage(data) {
    this.chatMessages.push(data.message);
    
    // Déclencher un événement pour notifier les composants
    const event = new CustomEvent('watchPartyChatMessageReceived', { detail: data.message });
    window.dispatchEvent(event);
  }
  
  /**
   * Gère l'arrivée d'un nouveau participant
   * @private
   * @param {Object} data - Données du participant
   */
  _handleParticipantJoined(data) {
    this.participants.push(data.participant);
    
    // Déclencher un événement pour notifier les composants
    const event = new CustomEvent('watchPartyParticipantJoined', { detail: data.participant });
    window.dispatchEvent(event);
  }
  
  /**
   * Gère le départ d'un participant
   * @private
   * @param {Object} data - Données du participant
   */
  _handleParticipantLeft(data) {
    this.participants = this.participants.filter(p => p.id !== data.participantId);
    
    // Déclencher un événement pour notifier les composants
    const event = new CustomEvent('watchPartyParticipantLeft', { detail: data });
    window.dispatchEvent(event);
  }
  
  /**
   * Gère la synchronisation de la lecture
   * @private
   * @param {Object} data - Données de synchronisation
   */
  _handlePlaybackSync(data) {
    // Déclencher un événement pour notifier les composants
    const event = new CustomEvent('watchPartyPlaybackSync', { detail: data });
    window.dispatchEvent(event);
  }
  
  /**
   * Génère un code d'invitation pour une soirée de visionnage
   * @param {string} watchPartyId - ID de la soirée
   * @returns {Promise<string>} Code d'invitation généré
   */
  async generateWatchPartyInviteCode(watchPartyId) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('generateWatchPartyInviteCode', {
          watchPartyId
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/watch-parties/${watchPartyId}/invite-code`);
      return response.data.inviteCode;
    } catch (error) {
      console.error('Erreur lors de la génération du code d\'invitation:', error);
      throw new Error('Échec de la génération du code d\'invitation');
    }
  }
  
  /**
   * Récupère le code d'invitation existant pour une soirée de visionnage
   * @param {string} watchPartyId - ID de la soirée
   * @returns {Promise<string|null>} Code d'invitation ou null si aucun code n'existe
   */
  async getWatchPartyInviteCode(watchPartyId) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('getWatchPartyInviteCode', {
          watchPartyId
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.get(`${this.apiBaseUrl}/watch-parties/${watchPartyId}/invite-code`);
      return response.data.inviteCode;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Aucun code d'invitation n'existe
        return null;
      }
      console.error('Erreur lors de la récupération du code d\'invitation:', error);
      throw new Error('Échec de la récupération du code d\'invitation');
    }
  }
  
  /**
   * Envoie une invitation à rejoindre une soirée de visionnage par email
   * @param {string} watchPartyId - ID de la soirée
   * @param {string} email - Adresse email du destinataire
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async sendWatchPartyInvitation(watchPartyId, email) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('sendWatchPartyInvitation', {
          watchPartyId,
          email
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/watch-parties/${watchPartyId}/invite`, {
        email
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      throw new Error('Échec de l\'envoi de l\'invitation');
    }
  }
  
  /**
   * Récupère les invitations reçues par l'utilisateur
   * @returns {Promise<Array>} Liste des invitations reçues
   */
  async getReceivedInvitations() {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('getReceivedWatchPartyInvitations');
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.get(`${this.apiBaseUrl}/notifications/watch-party-invitations`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error);
      throw new Error('Échec de la récupération des invitations');
    }
  }
  
  /**
   * Accepte une invitation à rejoindre une soirée de visionnage
   * @param {string} invitationId - ID de l'invitation
   * @returns {Promise<Object>} Détails de la soirée rejointe
   */
  async acceptWatchPartyInvitation(invitationId) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('acceptWatchPartyInvitation', {
          invitationId
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/notifications/watch-party-invitations/${invitationId}/accept`);
      
      // Rejoindre automatiquement la soirée
      if (response.data.watchPartyId) {
        return await this.joinWatchParty(response.data.watchPartyId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
      throw new Error('Échec de l\'acceptation de l\'invitation');
    }
  }
  
  /**
   * Refuse une invitation à rejoindre une soirée de visionnage
   * @param {string} invitationId - ID de l'invitation
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async declineWatchPartyInvitation(invitationId) {
    try {
      // Si Flutter est disponible, utiliser le service natif
      if (this.hybridBridgeService.isFlutterAvailable) {
        return await this.hybridBridgeService.sendToFlutter('declineWatchPartyInvitation', {
          invitationId
        });
      }
      
      // Sinon, utiliser l'API directement
      const response = await axios.post(`${this.apiBaseUrl}/notifications/watch-party-invitations/${invitationId}/decline`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du refus de l\'invitation:', error);
      throw new Error('Échec du refus de l\'invitation');
    }
  }
}

// Exporter une instance unique du service
const socialViewingService = new SocialViewingService();
export default socialViewingService;
// Exporter également la classe pour permettre l'instanciation dans certains composants
export { SocialViewingService };
