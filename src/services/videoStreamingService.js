/**
 * Service de streaming vidéo pour FloDrama
 * Permet la gestion de sources multiples avec système de fallback
 */

import { setCache, getCache } from '../utils/cacheManager';

// Configuration des sources vidéo
const VIDEO_SOURCES_CONFIG = {
  // Priorité des CDNs (du plus prioritaire au moins prioritaire)
  cdnPriority: [
    'bunnycdn', // BunnyCDN pour les performances
    'cloudfront', // CloudFront comme backup
    'youtube', // YouTube comme solution de secours
    'vimeo' // Vimeo comme dernière option
  ],
  
  // Configuration des sources par CDN
  cdnConfig: {
    bunnycdn: {
      baseUrl: 'https://streaming.bunnycdn.com/library/123456/',
      tokenParam: 'token',
      qualityLevels: ['1080p', '720p', '480p', '360p'],
      extension: 'mp4'
    },
    cloudfront: {
      baseUrl: 'https://d2ajqn0zkhdqop.cloudfront.net/videos/',
      qualityLevels: ['1080p', '720p', '480p', '360p'],
      extension: 'mp4'
    },
    youtube: {
      embedUrl: 'https://www.youtube.com/embed/'
    },
    vimeo: {
      embedUrl: 'https://player.vimeo.com/video/'
    }
  },
  
  // Mapping des IDs de contenu vers les IDs vidéo pour les sources externes
  externalSources: {
    'crash-landing-on-you': {
      youtube: 'eXMjTXL2Vks',
      vimeo: '407334684'
    },
    'parasite': {
      youtube: '5xH0HfJHsaY',
      vimeo: '380888696'
    },
    'squid-game': {
      youtube: 'oqxAJKy0ii4',
      vimeo: '584269871'
    },
    // Ajouter d'autres mappings ici
  }
};

/**
 * Classe singleton pour la gestion du streaming vidéo
 */
class VideoStreamingService {
  constructor() {
    if (VideoStreamingService.instance) {
      return VideoStreamingService.instance;
    }
    
    this.activeStreams = new Map();
    this.streamingErrors = new Map();
    this.sourcePreference = localStorage.getItem('flodrama_source_preference') || 'auto';
    
    VideoStreamingService.instance = this;
  }
  
  /**
   * Définit la préférence de source de l'utilisateur
   * @param {string} preference - auto, bunnycdn, cloudfront, youtube ou vimeo
   */
  setSourcePreference(preference) {
    if (preference === 'auto' || VIDEO_SOURCES_CONFIG.cdnPriority.includes(preference)) {
      this.sourcePreference = preference;
      localStorage.setItem('flodrama_source_preference', preference);
      console.log(`Préférence de source définie sur: ${preference}`);
      return true;
    }
    return false;
  }
  
  /**
   * Génère les URLs pour toutes les sources disponibles pour un contenu
   * @param {string} contentId - ID du contenu
   * @param {Object} options - Options supplémentaires (qualité, token, etc.)
   * @returns {Object} - URLs pour toutes les sources disponibles
   */
  generateSourceUrls(contentId, options = {}) {
    const { quality = '720p', token = null } = options;
    const sources = {};
    const external = VIDEO_SOURCES_CONFIG.externalSources[contentId] || {};
    
    // Sources propriétaires (BunnyCDN, CloudFront)
    Object.entries(VIDEO_SOURCES_CONFIG.cdnConfig).forEach(([cdn, config]) => {
      if (cdn === 'youtube' || cdn === 'vimeo') {
        // Traiter les sources externes différemment
        if (external[cdn]) {
          sources[cdn] = `${config.embedUrl}${external[cdn]}`;
        }
      } else {
        // Sources propriétaires
        const qualityLevel = config.qualityLevels.includes(quality) 
          ? quality 
          : config.qualityLevels[0];
          
        let url = `${config.baseUrl}${contentId}_${qualityLevel}.${config.extension}`;
        
        // Ajouter le token si nécessaire
        if (token && config.tokenParam) {
          url += `?${config.tokenParam}=${token}`;
        }
        
        sources[cdn] = url;
      }
    });
    
    return sources;
  }
  
  /**
   * Détermine la meilleure source vidéo pour un contenu
   * @param {string} contentId - ID du contenu
   * @param {Object} options - Options supplémentaires
   * @returns {Object} - Informations sur la meilleure source
   */
  async getBestVideoSource(contentId, options = {}) {
    try {
      // Vérifier le cache d'abord
      const cachedSource = getCache(`video_source_${contentId}`, 'metadata');
      if (cachedSource && !options.forceRefresh) {
        console.log(`Source vidéo récupérée du cache pour: ${contentId}`);
        return cachedSource;
      }
      
      // Générer toutes les sources disponibles
      const allSources = this.generateSourceUrls(contentId, options);
      
      // Si une préférence utilisateur est définie et disponible
      if (this.sourcePreference !== 'auto' && allSources[this.sourcePreference]) {
        const result = {
          contentId,
          primarySource: this.sourcePreference,
          primaryUrl: allSources[this.sourcePreference],
          fallbackSources: VIDEO_SOURCES_CONFIG.cdnPriority
            .filter(cdn => cdn !== this.sourcePreference && allSources[cdn])
            .map(cdn => ({ cdn, url: allSources[cdn] })),
          allSources,
          timestamp: Date.now()
        };
        
        // Mettre en cache pour 30 minutes
        setCache(`video_source_${contentId}`, result, 'metadata');
        return result;
      }
      
      // Suivre l'ordre de priorité configuré
      let primarySource = null;
      let primaryUrl = null;
      
      for (const cdn of VIDEO_SOURCES_CONFIG.cdnPriority) {
        if (allSources[cdn]) {
          primarySource = cdn;
          primaryUrl = allSources[cdn];
          break;
        }
      }
      
      if (!primarySource) {
        throw new Error(`Aucune source disponible pour: ${contentId}`);
      }
      
      // Créer la réponse avec source principale et fallbacks
      const result = {
        contentId,
        primarySource,
        primaryUrl,
        fallbackSources: VIDEO_SOURCES_CONFIG.cdnPriority
          .filter(cdn => cdn !== primarySource && allSources[cdn])
          .map(cdn => ({ cdn, url: allSources[cdn] })),
        allSources,
        timestamp: Date.now()
      };
      
      // Mettre en cache
      setCache(`video_source_${contentId}`, result, 'metadata');
      return result;
      
    } catch (error) {
      console.error(`Erreur lors de la recherche de source vidéo pour ${contentId}:`, error);
      this.streamingErrors.set(contentId, {
        error: error.message,
        timestamp: Date.now()
      });
      
      // Retourner un résultat par défaut si des sources externes sont disponibles
      const external = VIDEO_SOURCES_CONFIG.externalSources[contentId] || {};
      if (external.youtube) {
        return {
          contentId,
          primarySource: 'youtube',
          primaryUrl: `${VIDEO_SOURCES_CONFIG.cdnConfig.youtube.embedUrl}${external.youtube}`,
          fallbackSources: [],
          allSources: { youtube: `${VIDEO_SOURCES_CONFIG.cdnConfig.youtube.embedUrl}${external.youtube}` },
          isEmergencyFallback: true,
          timestamp: Date.now()
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Commence la lecture d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {HTMLElement} container - Conteneur pour le lecteur
   * @param {Object} options - Options de lecture
   * @returns {Object} - Informations sur la lecture
   */
  async playContent(contentId, container, options = {}) {
    try {
      const sourceInfo = await this.getBestVideoSource(contentId, options);
      
      // Nettoyer le conteneur
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Créer l'élément de lecture approprié selon la source
      let playerElement;
      const isEmbed = sourceInfo.primarySource === 'youtube' || sourceInfo.primarySource === 'vimeo';
      
      if (isEmbed) {
        // Créer un iframe pour YouTube ou Vimeo
        playerElement = document.createElement('iframe');
        playerElement.src = sourceInfo.primaryUrl;
        playerElement.width = options.width || '100%';
        playerElement.height = options.height || '100%';
        playerElement.frameBorder = '0';
        playerElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        playerElement.allowFullscreen = true;
      } else {
        // Créer un lecteur HTML5 standard
        playerElement = document.createElement('video');
        playerElement.src = sourceInfo.primaryUrl;
        playerElement.width = options.width || '100%';
        playerElement.height = options.height || '100%';
        playerElement.controls = true;
        playerElement.autoplay = options.autoplay || false;
        
        // Ajouter des sources de fallback
        sourceInfo.fallbackSources.forEach(({ url }) => {
          const source = document.createElement('source');
          source.src = url;
          playerElement.appendChild(source);
        });
        
        // Écouter les erreurs pour basculer vers la source suivante
        playerElement.addEventListener('error', () => {
          console.warn(`Erreur de lecture de ${sourceInfo.primarySource}, basculement vers le fallback...`);
          this.handlePlaybackError(contentId, container, options);
        });
      }
      
      // Ajouter le lecteur au conteneur
      container.appendChild(playerElement);
      
      // Enregistrer la lecture active
      this.activeStreams.set(contentId, {
        contentId,
        element: playerElement,
        container,
        sourceInfo,
        startTime: Date.now(),
        options
      });
      
      return {
        contentId,
        player: playerElement,
        sourceInfo
      };
      
    } catch (error) {
      console.error(`Erreur de lecture pour ${contentId}:`, error);
      
      // Afficher un message d'erreur dans le conteneur
      container.innerHTML = `
        <div class="video-error" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(to right, #3b82f6, #d946ef); color: white; text-align: center; padding: 20px; border-radius: 8px;">
          <h3>Erreur de lecture</h3>
          <p>Nous ne pouvons pas lire cette vidéo pour le moment.</p>
          <button id="retry-btn-${contentId}" style="background: white; color: #3b82f6; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 16px; cursor: pointer;">Réessayer</button>
        </div>
      `;
      
      // Ajouter un gestionnaire d'événements pour le bouton de nouvelle tentative
      setTimeout(() => {
        const retryButton = document.getElementById(`retry-btn-${contentId}`);
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            this.playContent(contentId, container, { ...options, forceRefresh: true });
          });
        }
      }, 0);
      
      throw error;
    }
  }
  
  /**
   * Gère les erreurs de lecture en passant à la source suivante
   * @param {string} contentId - ID du contenu
   * @param {HTMLElement} container - Conteneur du lecteur
   * @param {Object} options - Options de lecture
   */
  async handlePlaybackError(contentId, container, options = {}) {
    try {
      const activeStream = this.activeStreams.get(contentId);
      if (!activeStream) return;
      
      const { sourceInfo } = activeStream;
      
      // Si nous avons des sources de fallback
      if (sourceInfo.fallbackSources && sourceInfo.fallbackSources.length > 0) {
        const nextSource = sourceInfo.fallbackSources.shift();
        console.log(`Basculement vers ${nextSource.cdn} pour ${contentId}`);
        
        // Mettre à jour sourceInfo
        sourceInfo.primarySource = nextSource.cdn;
        sourceInfo.primaryUrl = nextSource.url;
        
        // Rejouer avec la nouvelle source
        await this.playContent(contentId, container, options);
      } else {
        // Si nous n'avons plus de sources, essayer YouTube en dernier recours
        const external = VIDEO_SOURCES_CONFIG.externalSources[contentId] || {};
        if (external.youtube && sourceInfo.primarySource !== 'youtube') {
          console.log(`Fallback d'urgence vers YouTube pour ${contentId}`);
          await this.playContent(contentId, container, { 
            ...options, 
            forceSource: 'youtube',
            forceRefresh: true 
          });
        } else {
          // Afficher un message d'erreur si toutes les sources ont échoué
          container.innerHTML = `
            <div class="video-error" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(to right, #3b82f6, #d946ef); color: white; text-align: center; padding: 20px; border-radius: 8px;">
              <h3>Erreur de lecture</h3>
              <p>Toutes les sources disponibles ont échoué.</p>
              <button id="retry-all-btn-${contentId}" style="background: white; color: #3b82f6; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 16px; cursor: pointer;">Réessayer tout</button>
            </div>
          `;
          
          // Ajouter un gestionnaire d'événements pour le bouton de nouvelle tentative
          setTimeout(() => {
            const retryButton = document.getElementById(`retry-all-btn-${contentId}`);
            if (retryButton) {
              retryButton.addEventListener('click', () => {
                this.playContent(contentId, container, { ...options, forceRefresh: true });
              });
            }
          }, 0);
        }
      }
    } catch (error) {
      console.error(`Erreur lors du fallback pour ${contentId}:`, error);
    }
  }
  
  /**
   * Arrête la lecture d'un contenu
   * @param {string} contentId - ID du contenu
   */
  stopPlayback(contentId) {
    const activeStream = this.activeStreams.get(contentId);
    if (activeStream) {
      try {
        const { element, container } = activeStream;
        
        // Arrêter la lecture
        if (element.tagName === 'VIDEO') {
          element.pause();
        }
        
        // Nettoyer le conteneur
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        // Supprimer de la liste des lectures actives
        this.activeStreams.delete(contentId);
        console.log(`Lecture arrêtée pour ${contentId}`);
      } catch (error) {
        console.error(`Erreur lors de l'arrêt de la lecture pour ${contentId}:`, error);
      }
    }
  }
  
  /**
   * Arrête toutes les lectures actives
   */
  stopAllPlayback() {
    for (const contentId of this.activeStreams.keys()) {
      this.stopPlayback(contentId);
    }
  }
}

// Exporter l'instance singleton
export default new VideoStreamingService();
