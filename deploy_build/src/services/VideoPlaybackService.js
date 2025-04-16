/**
 * VideoPlaybackService
 * 
 * Service de lecture vidéo pour l'application React de FloDrama
 * Gère la lecture des vidéos avec support pour le streaming adaptatif
 * Utilise le HybridBridgeService pour communiquer avec Flutter lorsque nécessaire
 */

import hybridBridgeService from './HybridBridgeService';

// Configuration CDN
const CDN_CONFIG = {
  // Bunny CDN
  BUNNY_CDN: {
    BASE_URL: 'https://videos.flodrama.com',
    PULL_ZONE_ID: '3467614',
    HOSTNAME: 'videos.flodrama.com',
  },
  
  // CloudFront (fallback)
  CLOUDFRONT: {
    BASE_URL: 'https://d2ra390ol17u3n.cloudfront.net',
    DISTRIBUTION_ID: 'E24183RM9CHE65',
  },
  
  // Stratégie de fallback
  FALLBACK_STRATEGY: 'sequential', // 'sequential' ou 'parallel'
  TIMEOUT_MS: 5000, // Délai avant de passer au fallback
};

// Qualités vidéo disponibles
const VIDEO_QUALITIES = [
  {
    name: 'Basse',
    resolution: '480p',
    bitrate: 800000,
    suffix: '_480p',
  },
  {
    name: 'Moyenne',
    resolution: '720p',
    bitrate: 2500000,
    suffix: '_720p',
  },
  {
    name: 'Haute',
    resolution: '1080p',
    bitrate: 5000000,
    suffix: '_1080p',
  },
  {
    name: 'Ultra HD',
    resolution: '4K',
    bitrate: 15000000,
    suffix: '_4k',
  },
];

class VideoPlaybackService {
  constructor() {
    this.isFlutterMode = hybridBridgeService.isFlutterAvailable;
    this.currentPlaybackInfo = null;
    this.bandwidthEstimate = 5000000; // Estimation initiale de la bande passante (5 Mbps)
    this.playerInstances = new Map(); // Map des instances de lecteur vidéo
  }

  /**
   * Initialise un lecteur vidéo
   * @param {string} playerId - Identifiant du lecteur
   * @param {HTMLVideoElement} videoElement - Élément vidéo HTML
   * @returns {Object} Instance du lecteur
   */
  initializePlayer(playerId, videoElement) {
    if (!videoElement) {
      console.error('Élément vidéo non fourni');
      return null;
    }

    // Créer une instance de lecteur
    const playerInstance = {
      id: playerId,
      videoElement,
      currentSource: null,
      currentQuality: null,
      qualities: [],
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: 1,
      isMuted: false,
      playbackRate: 1,
      isFullscreen: false,
      isLoading: false,
      error: null,
    };

    // Stocker l'instance
    this.playerInstances.set(playerId, playerInstance);

    // Configurer les événements du lecteur
    this._setupPlayerEvents(playerInstance);

    return playerInstance;
  }

  /**
   * Configure les événements du lecteur vidéo
   * @param {Object} playerInstance - Instance du lecteur
   */
  _setupPlayerEvents(playerInstance) {
    const { videoElement } = playerInstance;

    // Événement de chargement des métadonnées
    videoElement.addEventListener('loadedmetadata', () => {
      playerInstance.duration = videoElement.duration;
      playerInstance.isLoading = false;
    });

    // Événement de progression de la lecture
    videoElement.addEventListener('timeupdate', () => {
      playerInstance.currentTime = videoElement.currentTime;
      
      // Enregistrer la progression si nécessaire
      if (playerInstance.currentSource && playerInstance.currentTime > 0) {
        this._savePlaybackProgress(playerInstance);
      }
    });

    // Événement de changement d'état de lecture
    videoElement.addEventListener('play', () => {
      playerInstance.isPlaying = true;
    });

    videoElement.addEventListener('pause', () => {
      playerInstance.isPlaying = false;
    });

    // Événement de chargement
    videoElement.addEventListener('waiting', () => {
      playerInstance.isLoading = true;
    });

    videoElement.addEventListener('canplay', () => {
      playerInstance.isLoading = false;
    });

    // Événement d'erreur
    videoElement.addEventListener('error', (event) => {
      playerInstance.error = event.error || new Error('Erreur de lecture vidéo');
      playerInstance.isLoading = false;
      
      // Essayer la source de fallback si disponible
      this._tryFallbackSource(playerInstance);
    });
  }

  /**
   * Essaie une source de fallback en cas d'erreur
   * @param {Object} playerInstance - Instance du lecteur
   */
  _tryFallbackSource(playerInstance) {
    if (!playerInstance.currentSource || !playerInstance.currentSource.fallbackUrl) {
      console.warn('Aucune source de fallback disponible');
      return;
    }

    console.log('Utilisation de la source de fallback');
    const { videoElement } = playerInstance;
    
    // Sauvegarder la position actuelle
    const currentTime = videoElement.currentTime;
    const wasPlaying = !videoElement.paused;
    
    // Changer la source
    videoElement.src = playerInstance.currentSource.fallbackUrl;
    videoElement.load();
    
    // Restaurer la position
    videoElement.addEventListener('canplay', () => {
      videoElement.currentTime = currentTime;
      if (wasPlaying) {
        videoElement.play().catch(err => console.error('Erreur lors de la reprise de la lecture', err));
      }
    }, { once: true });
  }

  /**
   * Enregistre la progression de la lecture
   * @param {Object} playerInstance - Instance du lecteur
   */
  _savePlaybackProgress(playerInstance) {
    // Limiter la fréquence des enregistrements (toutes les 5 secondes)
    if (!playerInstance._lastProgressSave || 
        Date.now() - playerInstance._lastProgressSave > 5000) {
      
      playerInstance._lastProgressSave = Date.now();
      
      // Si en mode Flutter, utiliser le bridge
      if (this.isFlutterMode) {
        hybridBridgeService.updateWatchHistory({
          contentId: playerInstance.currentSource.contentId,
          position: playerInstance.currentTime,
          duration: playerInstance.duration,
          timestamp: Date.now(),
        });
      } else {
        // Sinon, sauvegarder localement
        try {
          const history = JSON.parse(localStorage.getItem('watchHistory') || '{}');
          history[playerInstance.currentSource.contentId] = {
            position: playerInstance.currentTime,
            duration: playerInstance.duration,
            timestamp: Date.now(),
          };
          localStorage.setItem('watchHistory', JSON.stringify(history));
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la progression', error);
        }
      }
    }
  }

  /**
   * Charge une vidéo dans le lecteur
   * @param {string} playerId - Identifiant du lecteur
   * @param {string} contentId - Identifiant du contenu
   * @param {Object} options - Options de lecture
   * @returns {Promise<boolean>} Succès du chargement
   */
  async loadVideo(playerId, contentId, options = {}) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) {
      console.error(`Lecteur non trouvé: ${playerId}`);
      return false;
    }

    playerInstance.isLoading = true;
    
    try {
      let videoSources;
      
      // Si en mode Flutter, récupérer les sources via Flutter
      if (this.isFlutterMode) {
        videoSources = await hybridBridgeService.getVideoSources(contentId);
      } else {
        // Sinon, générer les URLs directement
        videoSources = await this._generateVideoUrls(contentId);
      }
      
      if (!videoSources || videoSources.length === 0) {
        throw new Error('Aucune source vidéo disponible');
      }
      
      // Sélectionner la qualité appropriée
      const selectedQuality = this._selectAppropriateQuality(videoSources);
      
      // Configurer la source
      playerInstance.currentSource = {
        contentId,
        url: selectedQuality.url,
        fallbackUrl: selectedQuality.fallbackUrl,
        quality: selectedQuality.quality,
      };
      
      playerInstance.qualities = videoSources.map(source => ({
        name: source.quality.name,
        resolution: source.quality.resolution,
        bitrate: source.quality.bitrate,
      }));
      
      playerInstance.currentQuality = selectedQuality.quality;
      
      // Charger la vidéo
      const { videoElement } = playerInstance;
      videoElement.src = selectedQuality.url;
      videoElement.load();
      
      // Restaurer la progression si disponible
      this._restorePlaybackProgress(playerInstance, contentId);
      
      // Appliquer les options
      if (options.autoplay) {
        videoElement.play().catch(err => console.warn('Autoplay empêché', err));
      }
      
      if (options.volume !== undefined) {
        videoElement.volume = options.volume;
        playerInstance.volume = options.volume;
      }
      
      if (options.muted !== undefined) {
        videoElement.muted = options.muted;
        playerInstance.isMuted = options.muted;
      }
      
      if (options.playbackRate !== undefined) {
        videoElement.playbackRate = options.playbackRate;
        playerInstance.playbackRate = options.playbackRate;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo', error);
      playerInstance.error = error;
      playerInstance.isLoading = false;
      return false;
    }
  }

  /**
   * Restaure la progression de lecture précédente
   * @param {Object} playerInstance - Instance du lecteur
   * @param {string} contentId - Identifiant du contenu
   */
  async _restorePlaybackProgress(playerInstance, contentId) {
    try {
      let progress;
      
      // Si en mode Flutter, récupérer la progression via Flutter
      if (this.isFlutterMode) {
        const historyData = await hybridBridgeService.sendToFlutter('getWatchHistory', { contentId });
        progress = historyData && historyData[contentId];
      } else {
        // Sinon, récupérer depuis le stockage local
        const history = JSON.parse(localStorage.getItem('watchHistory') || '{}');
        progress = history[contentId];
      }
      
      if (progress && progress.position > 0) {
        // Ne pas restaurer si on a déjà vu plus de 95% de la vidéo
        const percentWatched = progress.position / progress.duration;
        if (percentWatched < 0.95) {
          playerInstance.videoElement.addEventListener('canplay', () => {
            playerInstance.videoElement.currentTime = progress.position;
          }, { once: true });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de la progression', error);
    }
  }

  /**
   * Génère les URLs des différentes qualités vidéo
   * @param {string} contentId - Identifiant du contenu
   * @returns {Promise<Array>} Liste des sources vidéo
   */
  async _generateVideoUrls(contentId) {
    try {
      const sources = [];
      
      // Générer les URLs pour chaque qualité
      for (const quality of VIDEO_QUALITIES) {
        // URL Bunny CDN
        const bunnyUrl = `${CDN_CONFIG.BUNNY_CDN.BASE_URL}/${contentId}${quality.suffix}.mp4`;
        
        // URL CloudFront (fallback)
        const cloudfrontUrl = `${CDN_CONFIG.CLOUDFRONT.BASE_URL}/${contentId}${quality.suffix}.mp4`;
        
        sources.push({
          url: bunnyUrl,
          fallbackUrl: cloudfrontUrl,
          quality,
        });
      }
      
      return sources;
    } catch (error) {
      console.error('Erreur lors de la génération des URLs vidéo', error);
      return [];
    }
  }

  /**
   * Sélectionne la qualité vidéo appropriée en fonction de la bande passante
   * @param {Array} sources - Liste des sources vidéo
   * @returns {Object} Source sélectionnée
   */
  _selectAppropriateQuality(sources) {
    // Trier les sources par bitrate (de la plus basse à la plus haute)
    const sortedSources = [...sources].sort((a, b) => 
      a.quality.bitrate - b.quality.bitrate
    );
    
    // Sélectionner la qualité en fonction de la bande passante estimée
    // Utiliser une qualité légèrement inférieure à la bande passante pour éviter les bufferings
    const targetBitrate = this.bandwidthEstimate * 0.8;
    
    let selectedSource = sortedSources[0]; // Par défaut, la qualité la plus basse
    
    for (const source of sortedSources) {
      if (source.quality.bitrate <= targetBitrate) {
        selectedSource = source;
      } else {
        break;
      }
    }
    
    return selectedSource;
  }

  /**
   * Change la qualité vidéo
   * @param {string} playerId - Identifiant du lecteur
   * @param {string} resolution - Résolution souhaitée (ex: '720p')
   * @returns {boolean} Succès du changement
   */
  changeQuality(playerId, resolution) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance || !playerInstance.currentSource) {
      return false;
    }
    
    // Trouver la source correspondant à la résolution
    const sources = VIDEO_QUALITIES.map(quality => {
      // URL Bunny CDN
      const bunnyUrl = `${CDN_CONFIG.BUNNY_CDN.BASE_URL}/${playerInstance.currentSource.contentId}${quality.suffix}.mp4`;
      
      // URL CloudFront (fallback)
      const cloudfrontUrl = `${CDN_CONFIG.CLOUDFRONT.BASE_URL}/${playerInstance.currentSource.contentId}${quality.suffix}.mp4`;
      
      return {
        url: bunnyUrl,
        fallbackUrl: cloudfrontUrl,
        quality,
      };
    });
    
    const selectedSource = sources.find(source => 
      source.quality.resolution === resolution
    );
    
    if (!selectedSource) {
      return false;
    }
    
    // Sauvegarder la position actuelle
    const { videoElement } = playerInstance;
    const currentTime = videoElement.currentTime;
    const wasPlaying = !videoElement.paused;
    
    // Mettre à jour la source
    playerInstance.currentSource.url = selectedSource.url;
    playerInstance.currentSource.fallbackUrl = selectedSource.fallbackUrl;
    playerInstance.currentQuality = selectedSource.quality;
    
    // Changer la source
    videoElement.src = selectedSource.url;
    videoElement.load();
    
    // Restaurer la position
    videoElement.addEventListener('canplay', () => {
      videoElement.currentTime = currentTime;
      if (wasPlaying) {
        videoElement.play().catch(err => console.error('Erreur lors de la reprise de la lecture', err));
      }
    }, { once: true });
    
    return true;
  }

  /**
   * Contrôle la lecture (play/pause)
   * @param {string} playerId - Identifiant du lecteur
   * @param {boolean} play - True pour lire, false pour mettre en pause
   */
  playPause(playerId, play) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    const { videoElement } = playerInstance;
    
    if (play) {
      videoElement.play().catch(err => console.error('Erreur lors de la lecture', err));
    } else {
      videoElement.pause();
    }
  }

  /**
   * Cherche à une position spécifique
   * @param {string} playerId - Identifiant du lecteur
   * @param {number} time - Position en secondes
   */
  seek(playerId, time) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    playerInstance.videoElement.currentTime = time;
  }

  /**
   * Ajuste le volume
   * @param {string} playerId - Identifiant du lecteur
   * @param {number} volume - Volume (0-1)
   */
  setVolume(playerId, volume) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    playerInstance.videoElement.volume = volume;
    playerInstance.volume = volume;
  }

  /**
   * Active/désactive le mode muet
   * @param {string} playerId - Identifiant du lecteur
   * @param {boolean} muted - True pour activer le mode muet
   */
  setMuted(playerId, muted) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    playerInstance.videoElement.muted = muted;
    playerInstance.isMuted = muted;
  }

  /**
   * Ajuste la vitesse de lecture
   * @param {string} playerId - Identifiant du lecteur
   * @param {number} rate - Vitesse de lecture
   */
  setPlaybackRate(playerId, rate) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    playerInstance.videoElement.playbackRate = rate;
    playerInstance.playbackRate = rate;
  }

  /**
   * Active/désactive le mode plein écran
   * @param {string} playerId - Identifiant du lecteur
   * @param {boolean} fullscreen - True pour activer le mode plein écran
   */
  setFullscreen(playerId, fullscreen) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    const { videoElement } = playerInstance;
    
    if (fullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  /**
   * Met à jour l'estimation de la bande passante
   * @param {number} bandwidthBps - Bande passante en bits par seconde
   */
  updateBandwidthEstimate(bandwidthBps) {
    this.bandwidthEstimate = bandwidthBps;
  }

  /**
   * Détruit une instance de lecteur
   * @param {string} playerId - Identifiant du lecteur
   */
  destroyPlayer(playerId) {
    const playerInstance = this.playerInstances.get(playerId);
    if (!playerInstance) return;
    
    // Sauvegarder la progression
    if (playerInstance.currentSource) {
      this._savePlaybackProgress(playerInstance);
    }
    
    // Nettoyer les événements
    const { videoElement } = playerInstance;
    videoElement.pause();
    videoElement.src = '';
    videoElement.load();
    
    // Supprimer l'instance
    this.playerInstances.delete(playerId);
  }
}

// Exporter une instance unique du service
const videoPlaybackService = new VideoPlaybackService();
export default videoPlaybackService;
