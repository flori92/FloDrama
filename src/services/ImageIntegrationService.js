/**
 * Service d'intégration des images avec les services de scraping et de gestion de contenu
 * Ce service fait le pont entre le système d'images et les autres services de FloDrama
 */

import ContentDataService from '../../Frontend/services/ContentService';
import ScrapingService from '../../Frontend/services/ScrapingService';
import CDN_CONFIG, { generateImageUrl, generateFallbackSvg } from '../config/imageSystemConfig';

class ImageIntegrationService {
  constructor() {
    this.contentService = ContentDataService;
    this.scrapingService = ScrapingService;
    this.imageConfig = CDN_CONFIG;
    this.imageCache = new Map();
    this.pendingRequests = new Map();
    
    // État des CDNs
    this.cdnStatus = {
      github: true, // GitHub Pages est toujours considéré comme disponible car c'est local
      cloudfront: false
    };
    
    // Initialiser le service
    this.init();
  }
  
  /**
   * Initialise le service d'intégration des images
   */
  async init() {
    console.log('Initialisation du service d\'intégration des images');
    
    // Vérifier l'état des CDNs
    await this.checkAllCdnStatus();
    
    // Précharger les images pour les contenus populaires
    this.preloadPopularContentImages();
    
    return true;
  }
  
  /**
   * Vérifie l'état d'un CDN
   * @param {string} name - Nom du CDN
   * @param {string} baseUrl - URL de base du CDN
   * @returns {Promise<boolean>} - True si le CDN est disponible
   */
  async checkCdnStatus(name, baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/status.json?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        timeout: 3000
      });
      
      const isAvailable = response.ok;
      this.cdnStatus[name] = isAvailable;
      
      console.log(`CDN ${name} est ${isAvailable ? 'disponible' : 'indisponible'}`);
      return isAvailable;
    } catch (error) {
      console.warn(`CDN ${name} est indisponible:`, error);
      this.cdnStatus[name] = false;
      return false;
    }
  }
  
  /**
   * Vérifie l'état de tous les CDNs
   */
  async checkAllCdnStatus() {
    try {
      // Vérifier CloudFront
      await this.checkCdnStatus('cloudfront', 'https://d11nnqvjfooahr.cloudfront.net');
      
      console.log(`État des CDNs - CloudFront: ${this.cdnStatus.cloudfront ? 'OK' : 'KO'}, GitHub: ${this.cdnStatus.github ? 'OK' : 'KO'}`);
    } catch (error) {
      console.error('Erreur lors de la vérification des CDNs', error);
    }
  }
  
  /**
   * Génère l'URL d'une image pour un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image (poster, backdrop, thumbnail)
   * @returns {string} URL de l'image
   */
  getImageUrl(contentId, type) {
    // Utiliser le système d'images pour générer l'URL
    return generateImageUrl(contentId, type);
  }
  
  /**
   * Génère un SVG de fallback pour une image
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image (poster, backdrop, thumbnail)
   * @returns {string} SVG en base64
   */
  getFallbackSvg(contentId, type) {
    return generateFallbackSvg(contentId, type);
  }
  
  /**
   * Récupère l'image d'un contenu depuis les services de scraping si nécessaire
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image (poster, backdrop, thumbnail)
   * @returns {Promise<string>} URL de l'image
   */
  async fetchContentImage(contentId, type) {
    // Vérifier si l'image est déjà mise en cache
    const cacheKey = `${contentId}_${type}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }
    
    // Vérifier s'il y a déjà une requête en cours pour cette image
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Créer une promesse pour cette requête
    const requestPromise = new Promise((resolve) => {
      const fetchImage = async () => {
        try {
          // Essayer d'abord de récupérer l'image depuis le système d'images
          const imageUrl = this.getImageUrl(contentId, type);
          
          // Vérifier si l'image existe
          const imageExists = await this.checkImageExists(imageUrl);
          
          if (imageExists) {
            // Si l'image existe, la mettre en cache et la retourner
            this.imageCache.set(cacheKey, imageUrl);
            resolve(imageUrl);
            return;
          }
          
          // Si l'image n'existe pas, essayer de la récupérer depuis le service de contenu
          const content = await this.contentService.getContentDetails(contentId);
          
          if (content && content.image) {
            // Si le contenu a une image, la mettre en cache et la retourner
            this.imageCache.set(cacheKey, content.image);
            resolve(content.image);
            return;
          }
          
          // Si le contenu n'a pas d'image, essayer de la récupérer depuis le service de scraping
          const scrapedContent = await this.scrapingService.fetchFromVoirDrama({ query: content?.title });
          
          if (scrapedContent && scrapedContent.length > 0 && scrapedContent[0].image) {
            // Si le scraping a trouvé une image, la mettre en cache et la retourner
            this.imageCache.set(cacheKey, scrapedContent[0].image);
            resolve(scrapedContent[0].image);
            return;
          }
          
          // Si aucune image n'a été trouvée, retourner le SVG de fallback
          const fallbackSvg = this.getFallbackSvg(contentId, type);
          this.imageCache.set(cacheKey, fallbackSvg);
          resolve(fallbackSvg);
        } catch (error) {
          console.error(`Erreur lors de la récupération de l'image ${contentId} (${type}):`, error);
          
          // En cas d'erreur, retourner le SVG de fallback
          const fallbackSvg = this.getFallbackSvg(contentId, type);
          this.imageCache.set(cacheKey, fallbackSvg);
          resolve(fallbackSvg);
        } finally {
          // Supprimer la requête en cours
          this.pendingRequests.delete(cacheKey);
        }
      };
      fetchImage();
    });
    
    // Enregistrer la requête en cours
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }
  
  /**
   * Vérifie si une image existe
   * @param {string} url - URL de l'image
   * @returns {Promise<boolean>} - True si l'image existe
   */
  async checkImageExists(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        timeout: 3000
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Précharge les images pour les contenus populaires
   */
  async preloadPopularContentImages() {
    try {
      // Récupérer les contenus populaires
      const homeData = await this.contentService.preloadHomePageData();
      
      if (homeData && homeData.popular) {
        // Précharger les images pour les contenus populaires
        homeData.popular.forEach(content => {
          this.fetchContentImage(content.id, 'poster');
          this.fetchContentImage(content.id, 'backdrop');
        });
      }
    } catch (error) {
      console.error('Erreur lors du préchargement des images:', error);
    }
  }
  
  /**
   * Enrichit un contenu avec des URLs d'images
   * @param {Object} content - Contenu à enrichir
   * @returns {Object} Contenu enrichi
   */
  enrichContentWithImages(content) {
    if (!content) return content;
    
    // Ajouter les URLs d'images au contenu
    return {
      ...content,
      posterUrl: this.getImageUrl(content.id, 'poster'),
      backdropUrl: this.getImageUrl(content.id, 'backdrop'),
      thumbnailUrl: this.getImageUrl(content.id, 'thumbnail')
    };
  }
  
  /**
   * Enrichit une liste de contenus avec des URLs d'images
   * @param {Array} contents - Liste de contenus à enrichir
   * @returns {Array} Liste de contenus enrichis
   */
  enrichContentsWithImages(contents) {
    if (!contents || !Array.isArray(contents)) return contents;
    
    // Enrichir chaque contenu avec des URLs d'images
    return contents.map(content => this.enrichContentWithImages(content));
  }
  
  /**
   * Récupère une image depuis une URL externe et la stocke dans le système d'images
   * @param {string} externalUrl - URL externe de l'image
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image (poster, backdrop, thumbnail)
   * @returns {Promise<string>} URL de l'image dans le système d'images
   */
  async importExternalImage(externalUrl, contentId, type) {
    try {
      // Télécharger l'image
      const response = await fetch(externalUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement de l'image: ${response.status} ${response.statusText}`);
      }
      
      // Convertir l'image en blob
      const blob = await response.blob();
      
      // Créer un objet FormData pour l'upload
      const formData = new FormData();
      formData.append('file', blob, `${contentId}.jpg`);
      formData.append('contentId', contentId);
      formData.append('type', type);
      
      // Uploader l'image vers le système d'images (à implémenter côté serveur)
      // Cette partie dépend de l'implémentation du serveur
      
      // Retourner l'URL de l'image dans le système d'images
      return this.getImageUrl(contentId, type);
    } catch (error) {
      console.error(`Erreur lors de l'import de l'image externe:`, error);
      
      // En cas d'erreur, retourner le SVG de fallback
      return this.getFallbackSvg(contentId, type);
    }
  }
}

// Exporter une instance unique du service
const imageIntegrationService = new ImageIntegrationService();
export default imageIntegrationService;
