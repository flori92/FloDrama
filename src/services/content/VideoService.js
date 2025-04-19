// Service de gestion vidéo pour FloDrama
// Gère la lecture, le streaming et les métadonnées des vidéos

/**
 * Service de gestion vidéo
 * @class VideoService
 */
export class VideoService {
  /**
   * Constructeur du service vidéo
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {boolean} config.enableAnalytics - Activer les analyses (défaut: true)
   * @param {number} config.bufferSize - Taille du buffer en secondes (défaut: 30)
   * @param {string} config.defaultQuality - Qualité par défaut (défaut: 'auto')
   * @param {boolean} config.enableSubtitles - Activer les sous-titres (défaut: true)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.enableAnalytics = config.enableAnalytics !== undefined ? config.enableAnalytics : true;
    this.bufferSize = config.bufferSize || 30;
    this.defaultQuality = config.defaultQuality || 'auto';
    this.enableSubtitles = config.enableSubtitles !== undefined ? config.enableSubtitles : true;
    
    // État de lecture
    this.currentVideo = null;
    this.player = null;
    this.watchHistory = [];
    
    // Charger l'historique de visionnage
    this._loadWatchHistory();
    
    console.log('VideoService initialisé');
  }
  
  /**
   * Charger l'historique de visionnage
   * @private
   */
  async _loadWatchHistory() {
    try {
      if (this.storageService) {
        const history = await this.storageService.get('watch_history', { defaultValue: [] });
        this.watchHistory = history;
      } else {
        const storedHistory = localStorage.getItem('flodrama_watch_history');
        this.watchHistory = storedHistory ? JSON.parse(storedHistory) : [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique de visionnage:', error);
      this.watchHistory = [];
    }
  }
  
  /**
   * Sauvegarder l'historique de visionnage
   * @private
   */
  async _saveWatchHistory() {
    try {
      if (this.storageService) {
        await this.storageService.set('watch_history', this.watchHistory);
      } else {
        localStorage.setItem('flodrama_watch_history', JSON.stringify(this.watchHistory));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique de visionnage:', error);
    }
  }
  
  /**
   * Initialiser le lecteur vidéo
   * @param {HTMLElement} container - Conteneur du lecteur
   * @param {Object} options - Options du lecteur
   * @returns {Object} - Instance du lecteur
   */
  initPlayer(container, options = {}) {
    if (!container) {
      console.error('Conteneur non fourni pour initPlayer');
      return null;
    }
    
    try {
      // Vérifier si le lecteur existe déjà
      if (this.player) {
        this.player.dispose();
      }
      
      // Créer l'élément vidéo
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-big-play-centered';
      videoElement.controls = true;
      videoElement.preload = 'auto';
      
      // Ajouter au conteneur
      container.innerHTML = '';
      container.appendChild(videoElement);
      
      // Options par défaut
      const defaultOptions = {
        fluid: true,
        aspectRatio: '16:9',
        autoplay: false,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'liveDisplay',
            'remainingTimeDisplay',
            'customControlSpacer',
            'playbackRateMenuButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'qualitySelector',
            'fullscreenToggle'
          ]
        }
      };
      
      // Fusionner les options
      const playerOptions = { ...defaultOptions, ...options };
      
      // Initialiser le lecteur (videojs ou lecteur natif)
      if (window.videojs) {
        this.player = window.videojs(videoElement, playerOptions);
        
        // Ajouter les événements
        this._addPlayerEvents(this.player);
      } else {
        // Utiliser le lecteur HTML5 natif
        this.player = {
          element: videoElement,
          play: () => videoElement.play(),
          pause: () => videoElement.pause(),
          currentTime: (time) => {
            if (time !== undefined) {
              videoElement.currentTime = time;
            }
            return videoElement.currentTime;
          },
          duration: () => videoElement.duration,
          volume: (vol) => {
            if (vol !== undefined) {
              videoElement.volume = vol;
            }
            return videoElement.volume;
          },
          muted: (muted) => {
            if (muted !== undefined) {
              videoElement.muted = muted;
            }
            return videoElement.muted;
          },
          dispose: () => {
            videoElement.pause();
            videoElement.src = '';
            videoElement.remove();
          }
        };
        
        // Ajouter les événements
        videoElement.addEventListener('play', () => this._onPlay());
        videoElement.addEventListener('pause', () => this._onPause());
        videoElement.addEventListener('ended', () => this._onEnded());
        videoElement.addEventListener('timeupdate', () => this._onTimeUpdate());
        videoElement.addEventListener('error', (e) => this._onError(e));
      }
      
      console.log('Lecteur vidéo initialisé');
      return this.player;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du lecteur:', error);
      return null;
    }
  }
  
  /**
   * Ajouter les événements au lecteur
   * @param {Object} player - Instance du lecteur
   * @private
   */
  _addPlayerEvents(player) {
    player.on('play', () => this._onPlay());
    player.on('pause', () => this._onPause());
    player.on('ended', () => this._onEnded());
    player.on('timeupdate', () => this._onTimeUpdate());
    player.on('error', (e) => this._onError(e));
  }
  
  /**
   * Événement de lecture
   * @private
   */
  _onPlay() {
    if (this.currentVideo && this.enableAnalytics) {
      // Enregistrer l'événement de lecture
      this._logAnalyticsEvent('play', {
        videoId: this.currentVideo.id,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Événement de pause
   * @private
   */
  _onPause() {
    if (this.currentVideo && this.enableAnalytics) {
      // Enregistrer l'événement de pause
      this._logAnalyticsEvent('pause', {
        videoId: this.currentVideo.id,
        timestamp: Date.now(),
        currentTime: this.player.currentTime()
      });
    }
  }
  
  /**
   * Événement de fin
   * @private
   */
  _onEnded() {
    if (this.currentVideo) {
      // Mettre à jour l'historique
      this._updateWatchHistory(this.currentVideo, 100);
      
      if (this.enableAnalytics) {
        // Enregistrer l'événement de fin
        this._logAnalyticsEvent('ended', {
          videoId: this.currentVideo.id,
          timestamp: Date.now()
        });
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('video-ended', {
        detail: { video: this.currentVideo }
      });
      document.dispatchEvent(event);
    }
  }
  
  /**
   * Événement de mise à jour du temps
   * @private
   */
  _onTimeUpdate() {
    if (this.currentVideo && this.player) {
      const currentTime = this.player.currentTime();
      const duration = this.player.duration();
      
      if (duration > 0) {
        // Calculer le pourcentage de progression
        const progress = Math.floor((currentTime / duration) * 100);
        
        // Mettre à jour l'historique tous les 5%
        if (progress % 5 === 0) {
          this._updateWatchHistory(this.currentVideo, progress);
        }
        
        // Émettre un événement personnalisé
        const event = new CustomEvent('video-progress', {
          detail: {
            video: this.currentVideo,
            currentTime,
            duration,
            progress
          }
        });
        document.dispatchEvent(event);
      }
    }
  }
  
  /**
   * Événement d'erreur
   * @param {Event} error - Erreur
   * @private
   */
  _onError(error) {
    console.error('Erreur de lecture vidéo:', error);
    
    if (this.currentVideo && this.enableAnalytics) {
      // Enregistrer l'événement d'erreur
      this._logAnalyticsEvent('error', {
        videoId: this.currentVideo.id,
        timestamp: Date.now(),
        error: error.message || 'Unknown error'
      });
    }
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('video-error', {
      detail: {
        video: this.currentVideo,
        error
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Enregistrer un événement d'analyse
   * @param {string} eventType - Type d'événement
   * @param {Object} data - Données de l'événement
   * @private
   */
  async _logAnalyticsEvent(eventType, data) {
    if (!this.enableAnalytics) return;
    
    try {
      // Enregistrer localement
      const analyticsEvents = await this._getAnalyticsEvents();
      analyticsEvents.push({
        type: eventType,
        ...data,
        clientTimestamp: Date.now()
      });
      
      // Limiter le nombre d'événements stockés
      if (analyticsEvents.length > 1000) {
        analyticsEvents.splice(0, analyticsEvents.length - 1000);
      }
      
      // Sauvegarder
      if (this.storageService) {
        await this.storageService.set('analytics_events', analyticsEvents);
      } else {
        localStorage.setItem('flodrama_analytics_events', JSON.stringify(analyticsEvents));
      }
      
      // Envoyer à l'API si disponible
      if (this.apiService) {
        this.apiService.post('/analytics/video', {
          eventType,
          ...data
        }).catch(error => {
          console.warn('Erreur lors de l\'envoi des données d\'analyse:', error);
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des données d\'analyse:', error);
    }
  }
  
  /**
   * Récupérer les événements d'analyse
   * @returns {Promise<Array>} - Événements d'analyse
   * @private
   */
  async _getAnalyticsEvents() {
    try {
      if (this.storageService) {
        return await this.storageService.get('analytics_events', { defaultValue: [] });
      } else {
        const storedEvents = localStorage.getItem('flodrama_analytics_events');
        return storedEvents ? JSON.parse(storedEvents) : [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des événements d\'analyse:', error);
      return [];
    }
  }
  
  /**
   * Mettre à jour l'historique de visionnage
   * @param {Object} video - Vidéo
   * @param {number} progress - Progression en pourcentage
   * @private
   */
  async _updateWatchHistory(video, progress) {
    if (!video) return;
    
    // Trouver l'entrée existante
    const existingIndex = this.watchHistory.findIndex(item => item.id === video.id);
    
    // Créer ou mettre à jour l'entrée
    const historyEntry = {
      id: video.id,
      title: video.title,
      type: video.type,
      image: video.image,
      progress,
      duration: video.duration,
      lastWatched: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
      // Mettre à jour uniquement si la progression est supérieure
      if (progress > this.watchHistory[existingIndex].progress) {
        this.watchHistory[existingIndex] = {
          ...this.watchHistory[existingIndex],
          ...historyEntry
        };
      }
    } else {
      // Ajouter une nouvelle entrée
      this.watchHistory.unshift(historyEntry);
    }
    
    // Limiter la taille de l'historique
    if (this.watchHistory.length > 100) {
      this.watchHistory = this.watchHistory.slice(0, 100);
    }
    
    // Sauvegarder
    await this._saveWatchHistory();
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('watch-history-updated', {
      detail: {
        video,
        progress,
        history: this.watchHistory
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Charger une vidéo
   * @param {Object} video - Vidéo à charger
   * @param {Object} options - Options de lecture
   * @returns {Promise<boolean>} - Succès du chargement
   */
  async loadVideo(video, options = {}) {
    if (!video || !this.player) {
      console.error('Vidéo ou lecteur non disponible');
      return false;
    }
    
    try {
      // Sauvegarder la vidéo courante
      this.currentVideo = video;
      
      // Options par défaut
      const defaultOptions = {
        autoplay: false,
        startTime: 0,
        quality: this.defaultQuality,
        subtitles: this.enableSubtitles
      };
      
      // Fusionner les options
      const playOptions = { ...defaultOptions, ...options };
      
      // Obtenir les sources vidéo
      let sources = [];
      
      if (video.sources) {
        // Utiliser les sources fournies
        sources = video.sources;
      } else if (video.url) {
        // Créer une source à partir de l'URL
        sources = [{
          src: video.url,
          type: this._guessVideoType(video.url)
        }];
      } else if (this.apiService) {
        // Récupérer les sources depuis l'API
        const response = await this.apiService.get(`/videos/${video.id}/sources`);
        sources = response.sources || [];
      }
      
      if (sources.length === 0) {
        console.error('Aucune source vidéo disponible');
        return false;
      }
      
      // Charger la vidéo
      if (window.videojs && this.player.src) {
        // VideoJS
        this.player.src(sources);
        
        // Charger les sous-titres si disponibles et activés
        if (playOptions.subtitles && video.subtitles) {
          this._loadSubtitles(video.subtitles);
        }
        
        // Définir la qualité
        if (this.player.qualityLevels && playOptions.quality !== 'auto') {
          this._setQuality(playOptions.quality);
        }
      } else {
        // Lecteur natif
        const source = sources[0];
        this.player.element.src = source.src;
        this.player.element.type = source.type;
        
        // Charger les sous-titres si disponibles et activés
        if (playOptions.subtitles && video.subtitles) {
          this._loadSubtitlesNative(video.subtitles);
        }
      }
      
      // Restaurer la progression si disponible
      const historyItem = this.watchHistory.find(item => item.id === video.id);
      if (historyItem && historyItem.progress < 98) { // Ne pas restaurer si presque terminé
        const duration = this.player.duration();
        if (duration > 0) {
          const startTime = (historyItem.progress / 100) * duration;
          this.player.currentTime(startTime);
        }
      } else if (playOptions.startTime > 0) {
        this.player.currentTime(playOptions.startTime);
      }
      
      // Lancer la lecture si autoplay
      if (playOptions.autoplay) {
        this.player.play();
      }
      
      console.log(`Vidéo chargée: ${video.title}`);
      return true;
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
      return false;
    }
  }
  
  /**
   * Deviner le type MIME d'une vidéo
   * @param {string} url - URL de la vidéo
   * @returns {string} - Type MIME
   * @private
   */
  _guessVideoType(url) {
    if (!url) return 'video/mp4';
    
    const extension = url.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
      case 'ogv':
        return 'video/ogg';
      case 'm3u8':
        return 'application/x-mpegURL';
      case 'mpd':
        return 'application/dash+xml';
      default:
        return 'video/mp4';
    }
  }
  
  /**
   * Charger les sous-titres (VideoJS)
   * @param {Array} subtitles - Sous-titres
   * @private
   */
  _loadSubtitles(subtitles) {
    if (!subtitles || !Array.isArray(subtitles) || !this.player || !this.player.addRemoteTextTrack) {
      return;
    }
    
    // Supprimer les sous-titres existants
    const tracks = this.player.textTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
      this.player.removeRemoteTextTrack(tracks[i]);
    }
    
    // Ajouter les nouveaux sous-titres
    subtitles.forEach(subtitle => {
      this.player.addRemoteTextTrack({
        kind: 'subtitles',
        srclang: subtitle.language,
        label: subtitle.label,
        src: subtitle.url,
        default: subtitle.default
      }, false);
    });
  }
  
  /**
   * Charger les sous-titres (lecteur natif)
   * @param {Array} subtitles - Sous-titres
   * @private
   */
  _loadSubtitlesNative(subtitles) {
    if (!subtitles || !Array.isArray(subtitles) || !this.player || !this.player.element) {
      return;
    }
    
    // Supprimer les sous-titres existants
    const tracks = this.player.element.querySelectorAll('track');
    tracks.forEach(track => track.remove());
    
    // Ajouter les nouveaux sous-titres
    subtitles.forEach(subtitle => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.srclang = subtitle.language;
      track.label = subtitle.label;
      track.src = subtitle.url;
      track.default = subtitle.default;
      
      this.player.element.appendChild(track);
    });
  }
  
  /**
   * Définir la qualité (VideoJS)
   * @param {string} quality - Qualité
   * @private
   */
  _setQuality(quality) {
    if (!this.player || !this.player.qualityLevels) {
      return;
    }
    
    const qualityLevels = this.player.qualityLevels();
    
    for (let i = 0; i < qualityLevels.length; i++) {
      const level = qualityLevels[i];
      
      if (quality === 'auto') {
        level.enabled = true;
      } else {
        // Activer uniquement le niveau correspondant
        level.enabled = (level.height === parseInt(quality) || 
                         `${level.height}p` === quality);
      }
    }
  }
  
  /**
   * Obtenir l'historique de visionnage
   * @param {number} limit - Limite
   * @returns {Array} - Historique de visionnage
   */
  getWatchHistory(limit = 20) {
    return this.watchHistory.slice(0, limit);
  }
  
  /**
   * Effacer l'historique de visionnage
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearWatchHistory() {
    this.watchHistory = [];
    await this._saveWatchHistory();
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('watch-history-cleared');
    document.dispatchEvent(event);
    
    console.log('Historique de visionnage effacé');
    return true;
  }
  
  /**
   * Supprimer un élément de l'historique de visionnage
   * @param {string|number} videoId - ID de la vidéo
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async removeFromWatchHistory(videoId) {
    if (!videoId) return false;
    
    const initialLength = this.watchHistory.length;
    this.watchHistory = this.watchHistory.filter(item => item.id !== videoId);
    
    if (this.watchHistory.length !== initialLength) {
      await this._saveWatchHistory();
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('watch-history-updated', {
        detail: {
          videoId,
          history: this.watchHistory
        }
      });
      document.dispatchEvent(event);
      
      console.log(`Vidéo ${videoId} supprimée de l'historique`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtenir la progression d'une vidéo
   * @param {string|number} videoId - ID de la vidéo
   * @returns {number} - Progression en pourcentage
   */
  getVideoProgress(videoId) {
    if (!videoId) return 0;
    
    const historyItem = this.watchHistory.find(item => item.id === videoId);
    return historyItem ? historyItem.progress : 0;
  }
  
  /**
   * Vérifier si une vidéo a été vue
   * @param {string|number} videoId - ID de la vidéo
   * @param {number} threshold - Seuil de progression (défaut: 90%)
   * @returns {boolean} - Vrai si la vidéo a été vue
   */
  isVideoWatched(videoId, threshold = 90) {
    if (!videoId) return false;
    
    const progress = this.getVideoProgress(videoId);
    return progress >= threshold;
  }
  
  /**
   * Obtenir les vidéos en cours
   * @param {number} limit - Limite
   * @returns {Array} - Vidéos en cours
   */
  getContinueWatching(limit = 10) {
    return this.watchHistory
      .filter(item => item.progress > 0 && item.progress < 98) // Exclure les vidéos terminées
      .slice(0, limit);
  }
  
  /**
   * Nettoyer les ressources
   */
  dispose() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    
    this.currentVideo = null;
    console.log('VideoService nettoyé');
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default VideoService;
