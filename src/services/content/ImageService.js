// Service de gestion d'images pour FloDrama
// Gère le chargement, l'optimisation et le traitement des images

/**
 * Service de gestion d'images
 * @class ImageService
 */
export class ImageService {
  /**
   * Constructeur du service d'images
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.baseUrl - URL de base pour les images (défaut: '/public/assets/images/')
   * @param {boolean} config.lazyLoading - Activer le chargement paresseux (défaut: true)
   * @param {Object} config.placeholders - Configuration des placeholders
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.baseUrl = config.baseUrl || '/public/assets/images/';
    this.lazyLoading = config.lazyLoading !== undefined ? config.lazyLoading : true;
    
    // Configuration des placeholders
    this.placeholders = {
      poster: config.placeholders?.poster || '/public/assets/images/placeholders/poster.svg',
      backdrop: config.placeholders?.backdrop || '/public/assets/images/placeholders/backdrop.svg',
      profile: config.placeholders?.profile || '/public/assets/images/placeholders/profile.svg',
      logo: config.placeholders?.logo || '/public/assets/images/placeholders/logo.svg'
    };
    
    // Cache d'images
    this.imageCache = new Map();
    
    // Observer pour le lazy loading
    this.lazyLoadObserver = null;
    
    // Initialiser le lazy loading si activé
    if (this.lazyLoading) {
      this._initLazyLoading();
    }
    
    console.log('ImageService initialisé');
  }
  
  /**
   * Initialiser le lazy loading
   * @private
   */
  _initLazyLoading() {
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver non supporté, lazy loading désactivé');
      this.lazyLoading = false;
      return;
    }
    
    this.lazyLoadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
            
            // Ajouter une classe pour l'animation de fade-in
            img.classList.add('loaded');
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }
  
  /**
   * Construit l'URL d'une image
   * @param {string} path - Chemin de l'image
   * @param {Object} options - Options
   * @param {string} options.size - Taille de l'image
   * @param {string} options.format - Format de l'image
   * @param {boolean} options.lazy - Chargement paresseux
   * @returns {string} - URL de l'image
   * @private
   */
  _buildImageUrl(path, options = {}) {
    if (!path) return null;
    
    // Si l'URL est absolue, la retourner telle quelle
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Si le chemin commence par '/', c'est déjà un chemin absolu
    if (path.startsWith('/')) {
      return path;
    }
    
    // Construire l'URL
    let url = this.baseUrl;
    
    // Ajouter le chemin
    url += path;
    
    return url;
  }
  
  /**
   * Obtenir un placeholder
   * @param {string} type - Type de placeholder
   * @returns {string} - URL du placeholder
   */
  getPlaceholder(type = 'poster') {
    return this.placeholders[type] || this.placeholders.poster;
  }
  
  /**
   * Charger une image
   * @param {string} url - URL de l'image
   * @param {Object} [options={}] - Options de chargement
   * @param {boolean} [options.lazy=true] - Chargement paresseux
   * @param {string} [options.size='medium'] - Taille de l'image (small, medium, large)
   * @param {string} [options.format='webp'] - Format préféré
   * @param {Function} [callback] - Callback appelé après le chargement
   * @returns {Promise<HTMLImageElement>} - Élément image chargé
   */
  async loadImage(url, options = {}, callback) {
    if (!url) {
      console.error('URL d\'image non fournie');
      return null;
    }
    
    // Utiliser les options ou les valeurs par défaut
    const lazy = options.lazy !== undefined ? options.lazy : true;
    const size = options.size || 'medium';
    const format = options.format || 'webp';
    
    try {
      // Construire l'URL avec les options extraites
      const imageUrl = this._buildImageUrl(url, { lazy, size, format });
      
      // Vérifier le cache
      if (this.imageCache.has(imageUrl)) {
        return this.imageCache.get(imageUrl);
      }
      
      // Créer une promesse pour le chargement
      const imagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          this.imageCache.set(imageUrl, img);
          resolve(img);
          if (callback) callback(img);
        };
        
        img.onerror = () => {
          reject(new Error(`Erreur de chargement de l'image: ${imageUrl}`));
        };
        
        img.src = imageUrl;
      });
      
      return imagePromise;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
      return null;
    }
  }
  
  /**
   * Précharger des images
   * @param {Array} paths - Chemins des images
   * @param {Object} options - Options
   * @returns {Promise<Array>} - Éléments image
   */
  preloadImages(paths, options = {}) {
    if (!paths || !Array.isArray(paths)) {
      return Promise.resolve([]);
    }
    
    const promises = paths.map(path => this.loadImage(path, options));
    return Promise.all(promises);
  }
  
  /**
   * Appliquer le lazy loading à un élément image
   * @param {HTMLImageElement} img - Élément image
   * @param {string} src - Source de l'image
   * @param {Object} options - Options
   * @returns {HTMLImageElement} - Élément image
   */
  applyLazyLoading(img, src, options = {}) {
    if (!img || !src || !this.lazyLoading || !this.lazyLoadObserver) {
      if (img && src) {
        img.src = src;
      }
      return img;
    }
    
    // Définir le placeholder
    const placeholderType = options.placeholder || 'poster';
    img.src = this.getPlaceholder(placeholderType);
    
    // Définir la source réelle comme attribut data
    img.setAttribute('data-src', src);
    
    // Ajouter une classe pour le style
    img.classList.add('lazy-image');
    
    // Observer l'image
    this.lazyLoadObserver.observe(img);
    
    return img;
  }
  
  /**
   * Créer un élément image
   * @param {string} path - Chemin de l'image
   * @param {Object} options - Options
   * @param {string} options.alt - Texte alternatif
   * @param {string} options.className - Classe CSS
   * @param {boolean} options.lazy - Activer le lazy loading
   * @param {string} options.placeholder - Type de placeholder
   * @returns {HTMLImageElement} - Élément image
   */
  createImageElement(path, options = {}) {
    const img = document.createElement('img');
    
    // Définir les attributs
    if (options.alt) {
      img.alt = options.alt;
    }
    
    if (options.className) {
      img.className = options.className;
    }
    
    // Construire l'URL
    const imageUrl = this._buildImageUrl(path, options);
    
    // Appliquer le lazy loading si demandé
    if (options.lazy !== false && this.lazyLoading) {
      this.applyLazyLoading(img, imageUrl, options);
    } else {
      img.src = imageUrl;
    }
    
    return img;
  }
  
  /**
   * Mettre à jour les sources d'images dans un conteneur
   * @param {HTMLElement} container - Conteneur
   * @param {Object} options - Options
   * @returns {number} - Nombre d'images traitées
   */
  updateImagesInContainer(container, options = {}) {
    if (!container) return 0;
    
    const images = container.querySelectorAll('img[data-src-path]');
    let count = 0;
    
    images.forEach(img => {
      const path = img.getAttribute('data-src-path');
      if (path) {
        const imageUrl = this._buildImageUrl(path, options);
        
        if (options.lazy !== false && this.lazyLoading) {
          this.applyLazyLoading(img, imageUrl, options);
        } else {
          img.src = imageUrl;
        }
        
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Télécharger une image
   * @param {string} url - URL de l'image
   * @param {string} filename - Nom du fichier
   * @returns {Promise<boolean>} - Succès du téléchargement
   */
  async downloadImage(url, filename) {
    if (!url) {
      return Promise.reject(new Error('URL non fournie'));
    }
    
    try {
      // Créer un lien de téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'image.jpg';
      a.style.display = 'none';
      
      // Ajouter au DOM et cliquer
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      return false;
    }
  }
  
  /**
   * Obtenir les dimensions d'une image
   * @param {string} path - Chemin de l'image
   * @returns {Promise<Object>} - Dimensions de l'image
   */
  async getImageDimensions(path) {
    try {
      const img = await this.loadImage(path);
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des dimensions de l\'image:', error);
      return { width: 0, height: 0, aspectRatio: 0 };
    }
  }
  
  /**
   * Vérifier si une image existe
   * @param {string} path - Chemin de l'image
   * @returns {Promise<boolean>} - Existence de l'image
   */
  async imageExists(path) {
    try {
      await this.loadImage(path);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Vider le cache d'images
   */
  clearCache() {
    this.imageCache.clear();
    console.log('Cache d\'images vidé');
  }
  
  /**
   * Nettoyer les ressources
   */
  dispose() {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }
    
    this.clearCache();
    console.log('ImageService nettoyé');
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default ImageService;
