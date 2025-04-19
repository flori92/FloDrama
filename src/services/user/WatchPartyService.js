// Service de gestion des Watch Parties pour FloDrama
// Permet aux utilisateurs de regarder du contenu ensemble en synchronisant la lecture

/**
 * Service de gestion des Watch Parties
 * @class WatchPartyService
 */
export class WatchPartyService {
  /**
   * Constructeur du service Watch Party
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.socketUrl - URL du serveur WebSocket (défaut: 'wss://api.flodrama.com/watch-party')
   * @param {number} config.syncInterval - Intervalle de synchronisation en ms (défaut: 5000)
   * @param {boolean} config.useMockData - Utiliser des données fictives (défaut: true)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.socketUrl = config.socketUrl || 'wss://api.flodrama.com/watch-party';
    this.syncInterval = config.syncInterval || 5000;
    this.useMockData = config.useMockData !== undefined ? config.useMockData : true;
    
    // État de la Watch Party
    this.currentParty = null;
    this.socket = null;
    this.syncTimer = null;
    this.localUser = {
      id: null,
      name: null,
      avatar: null,
      isHost: false
    };
    
    // Historique des messages
    this.chatHistory = [];
    
    // Callbacks
    this.callbacks = {
      onPartyJoined: null,
      onPartyLeft: null,
      onUserJoined: null,
      onUserLeft: null,
      onMessageReceived: null,
      onPlaybackSync: null,
      onPlaybackControl: null,
      onError: null
    };
    
    console.log('WatchPartyService initialisé');
  }
  
  /**
   * Définir l'utilisateur local
   * @param {Object} user - Données utilisateur
   */
  setLocalUser(user) {
    if (!user || !user.id) {
      console.error('Données utilisateur invalides');
      return;
    }
    
    this.localUser = {
      id: user.id,
      name: user.name || `Utilisateur ${user.id}`,
      avatar: user.avatar || null,
      isHost: false
    };
    
    console.log(`Utilisateur local défini: ${this.localUser.name}`);
  }
  
  /**
   * Définir un callback
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  setCallback(event, callback) {
    if (!event || typeof callback !== 'function') {
      console.error('Paramètres de callback invalides');
      return;
    }
    
    if (event in this.callbacks) {
      this.callbacks[event] = callback;
    } else {
      console.warn(`Événement inconnu: ${event}`);
    }
  }
  
  /**
   * Créer une nouvelle Watch Party
   * @param {Object} contentItem - Élément de contenu
   * @returns {Promise<Object>} - Données de la Watch Party
   */
  async createParty(contentItem) {
    if (!contentItem || !contentItem.id) {
      throw new Error('Élément de contenu invalide');
    }
    
    if (!this.localUser.id) {
      throw new Error('Utilisateur local non défini');
    }
    
    try {
      let partyData;
      
      if (this.apiService && !this.useMockData) {
        // Créer la Watch Party via l'API
        partyData = await this.apiService.post('/watch-party', {
          contentId: contentItem.id,
          hostId: this.localUser.id
        });
      } else {
        // Simuler la création d'une Watch Party
        partyData = this._mockCreateParty(contentItem);
      }
      
      // Mettre à jour l'état
      this.currentParty = partyData;
      this.localUser.isHost = true;
      
      // Connecter au WebSocket
      await this._connectToParty(partyData.id);
      
      console.log(`Watch Party créée: ${partyData.id}`);
      return partyData;
    } catch (error) {
      console.error('Erreur lors de la création de la Watch Party:', error);
      throw error;
    }
  }
  
  /**
   * Rejoindre une Watch Party existante
   * @param {string} partyId - ID de la Watch Party
   * @returns {Promise<Object>} - Données de la Watch Party
   */
  async joinParty(partyId) {
    if (!partyId) {
      throw new Error('ID de Watch Party non fourni');
    }
    
    if (!this.localUser.id) {
      throw new Error('Utilisateur local non défini');
    }
    
    try {
      let partyData;
      
      if (this.apiService && !this.useMockData) {
        // Rejoindre la Watch Party via l'API
        partyData = await this.apiService.post(`/watch-party/${partyId}/join`, {
          userId: this.localUser.id
        });
      } else {
        // Simuler l'accès à une Watch Party
        partyData = this._mockJoinParty(partyId);
      }
      
      // Mettre à jour l'état
      this.currentParty = partyData;
      this.localUser.isHost = partyData.hostId === this.localUser.id;
      
      // Connecter au WebSocket
      await this._connectToParty(partyId);
      
      console.log(`Watch Party rejointe: ${partyId}`);
      return partyData;
    } catch (error) {
      console.error(`Erreur lors de l'accès à la Watch Party ${partyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Quitter la Watch Party actuelle
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async leaveParty() {
    if (!this.currentParty) {
      console.warn('Aucune Watch Party active');
      return false;
    }
    
    try {
      const partyId = this.currentParty.id;
      
      // Déconnecter du WebSocket
      this._disconnectFromParty();
      
      if (this.apiService && !this.useMockData) {
        // Quitter la Watch Party via l'API
        await this.apiService.post(`/watch-party/${partyId}/leave`, {
          userId: this.localUser.id
        });
      }
      
      // Réinitialiser l'état
      this.currentParty = null;
      this.chatHistory = [];
      
      console.log(`Watch Party quittée: ${partyId}`);
      
      // Appeler le callback
      if (this.callbacks.onPartyLeft) {
        this.callbacks.onPartyLeft(partyId);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sortie de la Watch Party:', error);
      return false;
    }
  }
  
  /**
   * Envoyer un message dans le chat
   * @param {string} message - Contenu du message
   * @returns {Promise<boolean>} - Succès de l'envoi
   */
  async sendMessage(message) {
    if (!this.currentParty) {
      console.warn('Aucune Watch Party active');
      return false;
    }
    
    if (!message || message.trim() === '') {
      console.warn('Message vide');
      return false;
    }
    
    try {
      const chatMessage = {
        id: `msg_${Date.now()}`,
        partyId: this.currentParty.id,
        userId: this.localUser.id,
        userName: this.localUser.name,
        userAvatar: this.localUser.avatar,
        content: message,
        timestamp: new Date().toISOString()
      };
      
      // Envoyer le message via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'chat_message',
          data: chatMessage
        }));
      } else if (this.useMockData) {
        // Simuler l'envoi d'un message
        this._mockSendMessage(chatMessage);
      } else {
        throw new Error('WebSocket non connecté');
      }
      
      // Ajouter au chat local
      this.chatHistory.push(chatMessage);
      
      console.log(`Message envoyé: ${message}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      return false;
    }
  }
  
  /**
   * Synchroniser la lecture
   * @param {Object} playbackState - État de lecture
   * @returns {Promise<boolean>} - Succès de la synchronisation
   */
  async syncPlayback(playbackState) {
    if (!this.currentParty) {
      console.warn('Aucune Watch Party active');
      return false;
    }
    
    try {
      const syncData = {
        partyId: this.currentParty.id,
        userId: this.localUser.id,
        contentId: this.currentParty.contentId,
        currentTime: playbackState.currentTime || 0,
        isPlaying: playbackState.isPlaying || false,
        timestamp: new Date().toISOString()
      };
      
      // Envoyer la synchronisation via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'playback_sync',
          data: syncData
        }));
      } else if (this.useMockData) {
        // Simuler la synchronisation
        this._mockSyncPlayback(syncData);
      } else {
        throw new Error('WebSocket non connecté');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la synchronisation de la lecture:', error);
      return false;
    }
  }
  
  /**
   * Contrôler la lecture
   * @param {string} action - Action de contrôle ('play', 'pause', 'seek')
   * @param {Object} params - Paramètres de l'action
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async controlPlayback(action, params = {}) {
    if (!this.currentParty) {
      console.warn('Aucune Watch Party active');
      return false;
    }
    
    if (!action) {
      console.warn('Action non fournie');
      return false;
    }
    
    try {
      const controlData = {
        partyId: this.currentParty.id,
        userId: this.localUser.id,
        action,
        params,
        timestamp: new Date().toISOString()
      };
      
      // Envoyer le contrôle via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'playback_control',
          data: controlData
        }));
      } else if (this.useMockData) {
        // Simuler le contrôle
        this._mockControlPlayback(controlData);
      } else {
        throw new Error('WebSocket non connecté');
      }
      
      console.log(`Contrôle de lecture: ${action}`);
      return true;
    } catch (error) {
      console.error('Erreur lors du contrôle de la lecture:', error);
      return false;
    }
  }
  
  /**
   * Obtenir l'historique du chat
   * @param {number} limit - Limite
   * @returns {Array} - Historique du chat
   */
  getChatHistory(limit = 0) {
    return limit > 0 ? this.chatHistory.slice(-limit) : [...this.chatHistory];
  }
  
  /**
   * Obtenir les participants
   * @returns {Array} - Liste des participants
   */
  getParticipants() {
    if (!this.currentParty) {
      return [];
    }
    
    return [...this.currentParty.participants];
  }
  
  /**
   * Obtenir les informations de la Watch Party
   * @returns {Object|null} - Informations de la Watch Party
   */
  getPartyInfo() {
    return this.currentParty ? { ...this.currentParty } : null;
  }
  
  /**
   * Vérifier si l'utilisateur est l'hôte
   * @returns {boolean} - Vrai si l'utilisateur est l'hôte
   */
  isHost() {
    return this.localUser.isHost;
  }
  
  /**
   * Connecter à une Watch Party via WebSocket
   * @param {string} partyId - ID de la Watch Party
   * @returns {Promise<boolean>} - Succès de la connexion
   * @private
   */
  _connectToParty(partyId) {
    return new Promise((resolve, reject) => {
      if (this.useMockData) {
        // Simuler la connexion
        console.log(`Connexion simulée à la Watch Party: ${partyId}`);
        this._setupMockSync();
        
        // Appeler le callback
        if (this.callbacks.onPartyJoined) {
          this.callbacks.onPartyJoined(this.currentParty);
        }
        
        resolve(true);
        return;
      }
      
      try {
        // Connecter au WebSocket
        this.socket = new WebSocket(`${this.socketUrl}/${partyId}`);
        
        this.socket.onopen = () => {
          console.log(`Connecté à la Watch Party: ${partyId}`);
          
          // Envoyer un message d'identification
          this.socket.send(JSON.stringify({
            type: 'identify',
            data: {
              userId: this.localUser.id,
              userName: this.localUser.name,
              userAvatar: this.localUser.avatar
            }
          }));
          
          // Appeler le callback
          if (this.callbacks.onPartyJoined) {
            this.callbacks.onPartyJoined(this.currentParty);
          }
          
          resolve(true);
        };
        
        this.socket.onmessage = (event) => {
          this._handleSocketMessage(event);
        };
        
        this.socket.onerror = (error) => {
          console.error('Erreur WebSocket:', error);
          
          // Appeler le callback
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          
          reject(error);
        };
        
        this.socket.onclose = () => {
          console.log('Connexion WebSocket fermée');
          this.socket = null;
        };
      } catch (error) {
        console.error('Erreur lors de la connexion WebSocket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Déconnecter de la Watch Party
   * @private
   */
  _disconnectFromParty() {
    // Arrêter la synchronisation
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    // Fermer le WebSocket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  /**
   * Gérer les messages WebSocket
   * @param {MessageEvent} event - Événement de message
   * @private
   */
  _handleSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'user_joined':
          this._handleUserJoined(message.data);
          break;
        case 'user_left':
          this._handleUserLeft(message.data);
          break;
        case 'chat_message':
          this._handleChatMessage(message.data);
          break;
        case 'playback_sync':
          this._handlePlaybackSync(message.data);
          break;
        case 'playback_control':
          this._handlePlaybackControl(message.data);
          break;
        case 'party_update':
          this._handlePartyUpdate(message.data);
          break;
        case 'error':
          this._handleError(message.data);
          break;
        default:
          console.warn(`Type de message inconnu: ${message.type}`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message WebSocket:', error);
    }
  }
  
  /**
   * Gérer l'arrivée d'un utilisateur
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handleUserJoined(data) {
    if (!this.currentParty) return;
    
    // Ajouter l'utilisateur aux participants
    const existingIndex = this.currentParty.participants.findIndex(p => p.id === data.userId);
    
    if (existingIndex === -1) {
      this.currentParty.participants.push({
        id: data.userId,
        name: data.userName,
        avatar: data.userAvatar,
        isHost: data.userId === this.currentParty.hostId
      });
    }
    
    // Appeler le callback
    if (this.callbacks.onUserJoined) {
      this.callbacks.onUserJoined(data);
    }
    
    console.log(`Utilisateur rejoint: ${data.userName}`);
  }
  
  /**
   * Gérer le départ d'un utilisateur
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handleUserLeft(data) {
    if (!this.currentParty) return;
    
    // Supprimer l'utilisateur des participants
    this.currentParty.participants = this.currentParty.participants.filter(
      p => p.id !== data.userId
    );
    
    // Appeler le callback
    if (this.callbacks.onUserLeft) {
      this.callbacks.onUserLeft(data);
    }
    
    console.log(`Utilisateur parti: ${data.userName}`);
  }
  
  /**
   * Gérer un message de chat
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handleChatMessage(data) {
    // Ignorer les messages de l'utilisateur local
    if (data.userId === this.localUser.id) return;
    
    // Ajouter au chat
    this.chatHistory.push(data);
    
    // Appeler le callback
    if (this.callbacks.onMessageReceived) {
      this.callbacks.onMessageReceived(data);
    }
    
    console.log(`Message reçu de ${data.userName}: ${data.content}`);
  }
  
  /**
   * Gérer la synchronisation de lecture
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handlePlaybackSync(data) {
    // Ignorer les synchronisations de l'utilisateur local
    if (data.userId === this.localUser.id) return;
    
    // Appeler le callback
    if (this.callbacks.onPlaybackSync) {
      this.callbacks.onPlaybackSync(data);
    }
  }
  
  /**
   * Gérer le contrôle de lecture
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handlePlaybackControl(data) {
    // Ignorer les contrôles de l'utilisateur local
    if (data.userId === this.localUser.id) return;
    
    // Appeler le callback
    if (this.callbacks.onPlaybackControl) {
      this.callbacks.onPlaybackControl(data);
    }
    
    console.log(`Contrôle de lecture reçu: ${data.action}`);
  }
  
  /**
   * Gérer la mise à jour de la Watch Party
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handlePartyUpdate(data) {
    if (!this.currentParty) return;
    
    // Mettre à jour les données de la Watch Party
    this.currentParty = {
      ...this.currentParty,
      ...data
    };
    
    // Vérifier si l'hôte a changé
    if (data.hostId) {
      this.localUser.isHost = data.hostId === this.localUser.id;
    }
    
    console.log('Watch Party mise à jour');
  }
  
  /**
   * Gérer une erreur
   * @param {Object} data - Données de l'événement
   * @private
   */
  _handleError(data) {
    console.error('Erreur de Watch Party:', data.message);
    
    // Appeler le callback
    if (this.callbacks.onError) {
      this.callbacks.onError(data);
    }
  }
  
  /**
   * Configurer la synchronisation simulée
   * @private
   */
  _setupMockSync() {
    // Arrêter la synchronisation existante
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    // Démarrer une nouvelle synchronisation
    this.syncTimer = setInterval(() => {
      if (!this.currentParty) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
        return;
      }
      
      // Simuler des événements aléatoires
      const random = Math.random();
      
      if (random < 0.1) {
        // Simuler un message de chat
        const mockUser = this._getRandomMockUser();
        const messages = [
          'Super film !',
          'Vous avez vu cette scène ?',
          'J\'adore cet acteur',
          'La musique est incroyable',
          'Attendez, je reviens dans 5 minutes'
        ];
        
        const mockMessage = {
          id: `msg_${Date.now()}`,
          partyId: this.currentParty.id,
          userId: mockUser.id,
          userName: mockUser.name,
          userAvatar: mockUser.avatar,
          content: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toISOString()
        };
        
        this._handleChatMessage(mockMessage);
      }
    }, this.syncInterval);
  }
  
  /**
   * Simuler la création d'une Watch Party
   * @param {Object} contentItem - Élément de contenu
   * @returns {Object} - Données de la Watch Party
   * @private
   */
  _mockCreateParty(contentItem) {
    const partyId = `party_${Date.now()}`;
    
    return {
      id: partyId,
      contentId: contentItem.id,
      contentTitle: contentItem.title,
      contentImage: contentItem.image,
      hostId: this.localUser.id,
      createdAt: new Date().toISOString(),
      participants: [
        {
          id: this.localUser.id,
          name: this.localUser.name,
          avatar: this.localUser.avatar,
          isHost: true
        }
      ],
      status: 'active'
    };
  }
  
  /**
   * Simuler l'accès à une Watch Party
   * @param {string} partyId - ID de la Watch Party
   * @returns {Object} - Données de la Watch Party
   * @private
   */
  _mockJoinParty(partyId) {
    // Générer des participants fictifs
    const mockParticipants = [
      {
        id: 'user_1',
        name: 'Sophie',
        avatar: '/assets/avatars/avatar1.png',
        isHost: true
      },
      {
        id: 'user_2',
        name: 'Thomas',
        avatar: '/assets/avatars/avatar2.png',
        isHost: false
      }
    ];
    
    // Ajouter l'utilisateur local
    mockParticipants.push({
      id: this.localUser.id,
      name: this.localUser.name,
      avatar: this.localUser.avatar,
      isHost: false
    });
    
    return {
      id: partyId,
      contentId: 'content_123',
      contentTitle: 'Film Populaire',
      contentImage: '/assets/posters/movie123.jpg',
      hostId: 'user_1',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      participants: mockParticipants,
      status: 'active'
    };
  }
  
  /**
   * Simuler l'envoi d'un message
   * @param {Object} message - Message
   * @private
   */
  _mockSendMessage(message) {
    // Ajouter au chat
    this.chatHistory.push(message);
    
    // Simuler une réponse
    setTimeout(() => {
      if (!this.currentParty) return;
      
      const mockUser = this._getRandomMockUser();
      const responses = [
        'Bien dit !',
        'Je suis d\'accord',
        'Pas sûr de comprendre...',
        'Trop drôle 😂',
        'Intéressant !'
      ];
      
      const mockResponse = {
        id: `msg_${Date.now()}`,
        partyId: this.currentParty.id,
        userId: mockUser.id,
        userName: mockUser.name,
        userAvatar: mockUser.avatar,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString()
      };
      
      this._handleChatMessage(mockResponse);
    }, 2000 + Math.random() * 3000);
  }
  
  /**
   * Simuler la synchronisation de lecture
   * @param {Object} syncData - Données de synchronisation
   * @private
   */
  _mockSyncPlayback(syncData) {
    // Rien à faire, la synchronisation est gérée par le timer
  }
  
  /**
   * Simuler le contrôle de lecture
   * @param {Object} controlData - Données de contrôle
   * @private
   */
  _mockControlPlayback(controlData) {
    // Simuler une réponse de contrôle
    setTimeout(() => {
      if (!this.currentParty) return;
      
      const mockUser = this._getRandomMockUser();
      
      // Simuler une action correspondante
      let mockAction = controlData.action;
      if (controlData.action === 'play') {
        mockAction = Math.random() < 0.2 ? 'pause' : 'play';
      } else if (controlData.action === 'pause') {
        mockAction = Math.random() < 0.2 ? 'play' : 'pause';
      }
      
      const mockControl = {
        partyId: this.currentParty.id,
        userId: mockUser.id,
        action: mockAction,
        params: controlData.params,
        timestamp: new Date().toISOString()
      };
      
      this._handlePlaybackControl(mockControl);
    }, 1000 + Math.random() * 2000);
  }
  
  /**
   * Obtenir un utilisateur fictif aléatoire
   * @returns {Object} - Utilisateur fictif
   * @private
   */
  _getRandomMockUser() {
    const mockUsers = [
      {
        id: 'user_1',
        name: 'Sophie',
        avatar: '/assets/avatars/avatar1.png'
      },
      {
        id: 'user_2',
        name: 'Thomas',
        avatar: '/assets/avatars/avatar2.png'
      },
      {
        id: 'user_3',
        name: 'Emma',
        avatar: '/assets/avatars/avatar3.png'
      }
    ];
    
    return mockUsers[Math.floor(Math.random() * mockUsers.length)];
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default WatchPartyService;
