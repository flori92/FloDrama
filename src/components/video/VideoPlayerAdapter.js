/**
 * Adaptateur pour le composant VideoPlayer React
 * Permet d'utiliser le lecteur vidéo React dans un environnement JavaScript vanilla
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

class VideoPlayerAdapter {
  /**
   * Constructeur de l'adaptateur
   * @param {string} containerId - ID du conteneur où monter le lecteur vidéo
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.isReactLoaded = false;
    this.isPlayerMounted = false;
    this.playerInstance = null;
    this.pendingOptions = null;
  }

  /**
   * Initialisation de l'adaptateur
   * @returns {Promise} - Promise résolue lorsque React est chargé
   */
  async init() {
    if (this.isReactLoaded) {
      return Promise.resolve();
    }

    try {
      // Vérifier si React est déjà chargé
      if (window.React && window.ReactDOM) {
        this.isReactLoaded = true;
        return Promise.resolve();
      }

      // Charger React et ReactDOM depuis CDN si nécessaire
      await this.loadScript('https://unpkg.com/react@17/umd/react.production.min.js');
      await this.loadScript('https://unpkg.com/react-dom@17/umd/react-dom.production.min.js');
      
      // Charger les dépendances supplémentaires si nécessaires
      await this.loadScript('/Frontend/dist/lynx-player.js');
      
      this.isReactLoaded = true;
      console.log('React et dépendances chargés avec succès');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors du chargement de React:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Charge un script externe
   * @param {string} src - URL du script à charger
   * @returns {Promise} - Promise résolue lorsque le script est chargé
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error(`Erreur de chargement du script ${src}: ${error}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Charge le composant VideoPlayer
   * @returns {Promise} - Promise résolue lorsque le composant est chargé
   */
  async loadVideoPlayerComponent() {
    if (!window.FloDrama) {
      window.FloDrama = {};
    }

    if (window.FloDrama.VideoPlayer) {
      return Promise.resolve(window.FloDrama.VideoPlayer);
    }

    try {
      // Charger le composant VideoPlayer depuis le bundle
      await this.loadScript('/Frontend/dist/components/VideoPlayer.js');
      
      if (!window.FloDrama.VideoPlayer) {
        // Fallback: utiliser un import dynamique si disponible
        const VideoPlayerModule = await import('/Frontend/src/components/player/VideoPlayer.tsx');
        window.FloDrama.VideoPlayer = VideoPlayerModule.default;
      }
      
      return window.FloDrama.VideoPlayer;
    } catch (error) {
      console.error('Erreur lors du chargement du composant VideoPlayer:', error);
      throw error;
    }
  }

  /**
   * Crée un élément React pour le lecteur vidéo
   * @param {Object} options - Options du lecteur vidéo
   * @returns {React.Element} - Élément React du lecteur vidéo
   */
  createVideoPlayerElement(options) {
    const VideoPlayer = window.FloDrama.VideoPlayer;
    
    // Créer l'élément avec React.createElement
    return window.React.createElement(VideoPlayer, {
      videoId: options.videoId || '',
      episodeId: options.episodeId || '',
      title: options.title || '',
      source: options.source || '',
      subtitles: options.subtitles || [],
      quality: options.quality || [],
      onNext: options.onNext,
      onPrevious: options.onPrevious,
      autoPlay: options.autoPlay !== undefined ? options.autoPlay : true,
      watchPartyEnabled: options.watchPartyEnabled !== undefined ? options.watchPartyEnabled : false
    });
  }

  /**
   * Monte le lecteur vidéo dans le conteneur
   * @param {Object} options - Options du lecteur vidéo
   * @returns {Promise} - Promise résolue lorsque le lecteur est monté
   */
  async mount(options) {
    try {
      // Initialiser React si nécessaire
      await this.init();
      
      // Vérifier que le conteneur existe
      if (!this.container) {
        throw new Error(`Conteneur avec l'ID "${this.containerId}" non trouvé`);
      }
      
      // Charger le composant VideoPlayer
      await this.loadVideoPlayerComponent();
      
      // Créer un élément div pour le montage React
      const mountPoint = document.createElement('div');
      mountPoint.className = 'video-player-mount';
      this.container.appendChild(mountPoint);
      
      // Créer l'élément React
      const videoPlayerElement = this.createVideoPlayerElement(options);
      
      // Monter le composant React
      window.ReactDOM.render(videoPlayerElement, mountPoint);
      
      this.isPlayerMounted = true;
      console.log('Lecteur vidéo monté avec succès');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors du montage du lecteur vidéo:', error);
      
      // Fallback: utiliser un lecteur vidéo HTML5 standard
      this.mountFallbackPlayer(options);
      
      return Promise.reject(error);
    }
  }

  /**
   * Monte un lecteur vidéo HTML5 standard en cas d'échec du montage React
   * @param {Object} options - Options du lecteur vidéo
   */
  mountFallbackPlayer(options) {
    console.warn('Utilisation du lecteur vidéo de secours (HTML5)');
    
    // Vider le conteneur
    this.container.innerHTML = '';
    
    // Créer l'élément vidéo
    const videoElement = document.createElement('video');
    videoElement.className = 'video-player-fallback';
    videoElement.controls = true;
    videoElement.autoplay = options.autoPlay !== undefined ? options.autoPlay : true;
    videoElement.poster = options.poster || '';
    
    // Ajouter la source vidéo
    const sourceElement = document.createElement('source');
    sourceElement.src = options.source || '';
    sourceElement.type = 'video/mp4';
    videoElement.appendChild(sourceElement);
    
    // Ajouter les sous-titres si disponibles
    if (options.subtitles && options.subtitles.length > 0) {
      options.subtitles.forEach(subtitle => {
        const trackElement = document.createElement('track');
        trackElement.kind = 'subtitles';
        trackElement.src = subtitle.url;
        trackElement.srclang = subtitle.language;
        trackElement.label = subtitle.language;
        videoElement.appendChild(trackElement);
      });
    }
    
    // Ajouter l'élément vidéo au conteneur
    this.container.appendChild(videoElement);
    
    // Ajouter le titre si disponible
    if (options.title) {
      const titleElement = document.createElement('h3');
      titleElement.className = 'video-player-title';
      titleElement.textContent = options.title;
      this.container.appendChild(titleElement);
    }
    
    // Ajouter les boutons de navigation si disponibles
    if (options.onPrevious || options.onNext) {
      const navigationElement = document.createElement('div');
      navigationElement.className = 'video-player-navigation';
      
      if (options.onPrevious) {
        const prevButton = document.createElement('button');
        prevButton.className = 'video-player-prev-button';
        prevButton.textContent = 'Épisode précédent';
        prevButton.addEventListener('click', options.onPrevious);
        navigationElement.appendChild(prevButton);
      }
      
      if (options.onNext) {
        const nextButton = document.createElement('button');
        nextButton.className = 'video-player-next-button';
        nextButton.textContent = 'Épisode suivant';
        nextButton.addEventListener('click', options.onNext);
        navigationElement.appendChild(nextButton);
      }
      
      this.container.appendChild(navigationElement);
    }
  }

  /**
   * Démonte le lecteur vidéo
   */
  unmount() {
    if (this.isPlayerMounted && this.container) {
      // Démonter le composant React
      window.ReactDOM.unmountComponentAtNode(this.container);
      this.isPlayerMounted = false;
      
      // Vider le conteneur
      this.container.innerHTML = '';
      
      console.log('Lecteur vidéo démonté avec succès');
    }
  }

  /**
   * Joue la vidéo
   */
  play() {
    const videoElement = this.container.querySelector('video');
    if (videoElement) {
      videoElement.play();
    }
  }

  /**
   * Met en pause la vidéo
   */
  pause() {
    const videoElement = this.container.querySelector('video');
    if (videoElement) {
      videoElement.pause();
    }
  }

  /**
   * Change la source de la vidéo
   * @param {string} source - Nouvelle source vidéo
   */
  changeSource(source) {
    const videoElement = this.container.querySelector('video');
    if (videoElement) {
      videoElement.src = source;
      videoElement.load();
    }
  }
}

// Exporter l'adaptateur
window.VideoPlayerAdapter = VideoPlayerAdapter;
