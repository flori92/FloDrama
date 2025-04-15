/**
 * UnifiedImageService
 * 
 * Service unifié de gestion d'images pour FloDrama qui centralise toutes les fonctionnalités
 * de traitement, optimisation et affichage des images selon l'identité visuelle de la plateforme.
 */

import { FloDramaImageProcessor } from '../utils/FloDramaImageProcessor';
import lazyLoaderDefault from '../utils/lazyLoader';
import localImageFallbackDefault from '../utils/localImageFallback';
import loggerDefault from '../utils/logger';

// Création des alias pour compatibilité
const lazyLoader = lazyLoaderDefault.lazyLoad || lazyLoaderDefault;
const localImageFallback = localImageFallbackDefault.localImageFallback || localImageFallbackDefault;
const { logError, logInfo } = loggerDefault;

// Configuration de l'identité visuelle FloDrama
const FLODRAMA_STYLE = {
  primaryBlue: '#3b82f6',
  primaryFuchsia: '#d946ef',
  backgroundDark: '#121118',
  backgroundSecondary: '#1A1926',
  gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
  cornerRadius: '8px',
  transitionDuration: '0.3s'
};

// Types d'images supportés
const IMAGE_TYPES = {
  POSTER: 'poster',
  BACKDROP: 'backdrop',
  THUMBNAIL: 'thumbnail',
  LOGO: 'logo',
  AVATAR: 'avatar',
  HERO: 'hero'
};

// Configuration des tailles d'images
const IMAGE_SIZES = {
  poster: {
    small: { width: 185, height: 278 },
    medium: { width: 342, height: 513 },
    large: { width: 500, height: 750 }
  },
  backdrop: {
    small: { width: 300, height: 169 },
    medium: { width: 780, height: 439 },
    large: { width: 1280, height: 720 }
  },
  thumbnail: {
    small: { width: 100, height: 56 },
    medium: { width: 220, height: 124 },
    large: { width: 356, height: 200 }
  },
  logo: {
    small: { width: 92, height: 45 },
    medium: { width: 185, height: 90 },
    large: { width: 300, height: 145 }
  },
  avatar: {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 128, height: 128 }
  },
  hero: {
    small: { width: 768, height: 432 },
    medium: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 }
  }
};

class UnifiedImageService {
  constructor() {
    this.imageProcessor = new FloDramaImageProcessor();
    this.lazyLoader = lazyLoader;
    this.localFallback = localImageFallback;
    this.style = FLODRAMA_STYLE;
    this.imageTypes = IMAGE_TYPES;
    this.imageSizes = IMAGE_SIZES;
    this.isInitialized = false;
    this.isServerSide = typeof window === 'undefined';
    this.isClientSide = typeof window !== 'undefined';
    
    // Cache d'images optimisées
    this.imageCache = new Map();
    
    // Configuration des CDN
    this.cdnConfig = {
      primary: 'https://cdn.flodrama.com',
      fallback: 'https://flodrama-cdn.b-cdn.net',
      local: '/images'
    };
    
    // Statistiques
    this.stats = {
      processed: 0,
      cached: 0,
      fallbacks: 0,
      errors: 0
    };
  }
  
  /**
   * Initialise le service d'images
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialiser le processeur d'images
      await this.imageProcessor.initialize();
      
      // Initialiser le chargeur paresseux
      if (this.isClientSide) {
        this.lazyLoader.initialize();
      }
      
      this.isInitialized = true;
      logInfo('UnifiedImageService initialized successfully');
    } catch (error) {
      logError('Failed to initialize UnifiedImageService', error);
      throw new Error('Failed to initialize image service');
    }
  }
  
  /**
   * S'assure que le service est initialisé
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  /**
   * Obtient l'URL optimisée d'une image
   * @param {string} imageUrl - URL de l'image originale
   * @param {string} type - Type d'image (poster, backdrop, etc.)
   * @param {string} size - Taille de l'image (small, medium, large)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Informations sur l'image optimisée
   */
  async getOptimizedImageUrl(imageUrl, type = 'poster', size = 'medium', options = {}) {
    await this.ensureInitialized();
    
    if (!imageUrl) {
      return this.getFallbackImage(type, size);
    }
    
    // Vérifier le cache
    const cacheKey = `${imageUrl}_${type}_${size}_${JSON.stringify(options)}`;
    if (this.imageCache.has(cacheKey)) {
      this.stats.cached++;
      return this.imageCache.get(cacheKey);
    }
    
    try {
      // Déterminer les dimensions cibles
      const targetSize = this.imageSizes[type][size] || this.imageSizes.poster.medium;
      
      // Construire l'URL optimisée
      let optimizedUrl;
      
      // Si l'URL est déjà sur notre CDN, utiliser les paramètres de redimensionnement
      if (imageUrl.includes(this.cdnConfig.primary) || imageUrl.includes(this.cdnConfig.fallback)) {
        optimizedUrl = this.buildCdnUrl(imageUrl, targetSize, type, options);
      } 
      // Sinon, pour les URL externes, utiliser notre proxy d'images
      else {
        optimizedUrl = this.buildProxyUrl(imageUrl, targetSize, type, options);
      }
      
      // Créer le résultat
      const result = {
        url: optimizedUrl,
        placeholderUrl: this.generatePlaceholderUrl(type, size),
        width: targetSize.width,
        height: targetSize.height,
        original: imageUrl,
        type,
        size
      };
      
      // Mettre en cache
      this.imageCache.set(cacheKey, result);
      this.stats.processed++;
      
      return result;
    } catch (error) {
      logError(`Error optimizing image: ${imageUrl}`, error);
      this.stats.errors++;
      this.stats.fallbacks++;
      return this.getFallbackImage(type, size);
    }
  }
  
  /**
   * Construit une URL CDN optimisée
   * @param {string} imageUrl - URL de l'image
   * @param {Object} targetSize - Dimensions cibles
   * @param {string} type - Type d'image
   * @param {Object} options - Options supplémentaires
   * @returns {string} - URL CDN optimisée
   */
  buildCdnUrl(imageUrl, targetSize, type, options) {
    // Exemple pour BunnyCDN
    const width = targetSize.width;
    const height = targetSize.height;
    
    // Extraire le chemin de l'image depuis l'URL complète
    const urlObj = new URL(imageUrl);
    const imagePath = urlObj.pathname;
    
    // Construire l'URL avec les paramètres de transformation
    return `${this.cdnConfig.primary}/images${imagePath}?width=${width}&height=${height}&quality=85&format=webp`;
  }
  
  /**
   * Construit une URL de proxy d'images
   * @param {string} imageUrl - URL de l'image
   * @param {Object} targetSize - Dimensions cibles
   * @param {string} type - Type d'image
   * @param {Object} options - Options supplémentaires
   * @returns {string} - URL du proxy d'images
   */
  buildProxyUrl(imageUrl, targetSize, type, options) {
    // Encoder l'URL de l'image
    const encodedUrl = encodeURIComponent(imageUrl);
    const width = targetSize.width;
    const height = targetSize.height;
    
    // Construire l'URL du proxy
    return `/api/image-proxy?url=${encodedUrl}&width=${width}&height=${height}&type=${type}`;
  }
  
  /**
   * Génère une URL d'image de remplacement
   * @param {string} type - Type d'image
   * @param {string} size - Taille de l'image
   * @returns {Object} - Informations sur l'image de remplacement
   */
  getFallbackImage(type, size) {
    const targetSize = this.imageSizes[type][size] || this.imageSizes.poster.medium;
    
    // Utiliser le service de fallback local
    const fallbackUrl = this.localFallback.getFallbackImagePath(type);
    
    return {
      url: fallbackUrl,
      placeholderUrl: this.generatePlaceholderUrl(type, size),
      width: targetSize.width,
      height: targetSize.height,
      isFallback: true,
      type,
      size
    };
  }
  
  /**
   * Génère une URL d'image de préchargement
   * @param {string} type - Type d'image
   * @param {string} size - Taille de l'image
   * @returns {string} - URL de l'image de préchargement
   */
  generatePlaceholderUrl(type, size) {
    // Générer un dégradé SVG avec les couleurs FloDrama
    const { primaryBlue, primaryFuchsia } = this.style;
    const targetSize = this.imageSizes[type][size] || this.imageSizes.poster.medium;
    const width = targetSize.width;
    const height = targetSize.height;
    
    // Créer un SVG avec un dégradé
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stop-color="${primaryBlue}" offset="0%"/>
            <stop stop-color="${primaryFuchsia}" offset="100%"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#g)" opacity="0.3"/>
      </svg>
    `;
    
    // Encoder le SVG pour l'utiliser comme data URL
    const encodedSvg = encodeURIComponent(svg.trim());
    return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  }
  
  /**
   * Traite une image selon l'identité visuelle FloDrama
   * @param {File|Blob|string} imageData - Données de l'image ou URL
   * @param {string} type - Type d'image
   * @param {Object} options - Options de traitement
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processImage(imageData, type = 'poster', options = {}) {
    await this.ensureInitialized();
    
    try {
      // Déterminer le type d'appareil
      const deviceType = this.detectDeviceType();
      
      // Traiter l'image selon son type
      let result;
      
      switch (type) {
        case 'poster':
          result = await this.imageProcessor.processPoster(imageData, deviceType);
          break;
        case 'backdrop':
          result = await this.imageProcessor.processBackdrop(imageData, deviceType);
          break;
        case 'thumbnail':
          result = await this.imageProcessor.processThumbnail(imageData, deviceType);
          break;
        default:
          result = await this.imageProcessor.processPoster(imageData, deviceType);
      }
      
      this.stats.processed++;
      return result;
    } catch (error) {
      logError(`Error processing image: ${error.message}`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Détecte le type d'appareil
   * @returns {Object} - Informations sur l'appareil
   */
  detectDeviceType() {
    if (this.isServerSide) {
      return { type: 'desktop', width: 1920, height: 1080, pixelRatio: 1 };
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    let type = 'desktop';
    
    if (width < 768) {
      type = 'mobile';
    } else if (width < 1024) {
      type = 'tablet';
    }
    
    return { type, width, height, pixelRatio };
  }
  
  /**
   * Initialise le chargement paresseux des images
   * @param {string} selector - Sélecteur CSS pour les images
   * @param {Object} options - Options de chargement
   */
  initLazyLoading(selector = '.lazy-image', options = {}) {
    if (this.isServerSide) return;
    
    this.lazyLoader.observe(selector, {
      rootMargin: '200px 0px',
      threshold: 0.1,
      ...options
    });
  }
  
  /**
   * Précharge les images importantes
   * @param {Array} urls - URLs des images à précharger
   * @returns {Promise<void>}
   */
  async preloadImportantImages(urls) {
    if (this.isServerSide || !urls || urls.length === 0) return;
    
    const preloadPromises = urls.map(url => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Résoudre même en cas d'erreur
        img.src = url;
      });
    });
    
    await Promise.all(preloadPromises);
  }
  
  /**
   * Génère les balises HTML pour une image optimisée
   * @param {string} imageUrl - URL de l'image
   * @param {string} type - Type d'image
   * @param {string} size - Taille de l'image
   * @param {Object} attributes - Attributs HTML supplémentaires
   * @returns {Promise<string>} - Balise HTML
   */
  async generateImageTag(imageUrl, type = 'poster', size = 'medium', attributes = {}) {
    const imageData = await this.getOptimizedImageUrl(imageUrl, type, size);
    
    const {
      alt = '',
      className = '',
      loading = 'lazy',
      ...otherAttributes
    } = attributes;
    
    // Construire les attributs HTML
    const htmlAttributes = Object.entries(otherAttributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    // Générer la balise HTML
    return `
      <img
        src="${imageData.url}"
        alt="${alt}"
        width="${imageData.width}"
        height="${imageData.height}"
        class="flodrama-image ${className} ${type}-image"
        loading="${loading}"
        data-type="${type}"
        data-original="${imageData.original || ''}"
        style="border-radius: ${type === 'poster' || type === 'thumbnail' ? this.style.cornerRadius : '0'};"
        ${htmlAttributes}
      />
    `;
  }
  
  /**
   * Récupère les statistiques du service
   * @returns {Object} - Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.imageCache.size
    };
  }
}

// Exporter une instance singleton
const unifiedImageService = new UnifiedImageService();
export default unifiedImageService;
