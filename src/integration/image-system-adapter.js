/**
 * Adaptateur pour intégrer le système d'images FloDrama existant avec la nouvelle architecture de services
 * Cet adaptateur permet d'utiliser le nouveau ImageService avec le système d'images existant
 */

import { initializeServices } from '../services';

/**
 * Initialise l'adaptateur du système d'images
 * @returns {Object} - L'adaptateur configuré
 */
export function initializeImageSystemAdapter() {
  // Récupérer les services
  const { imageService } = initializeServices();
  
  // Vérifier si le système d'images existant est disponible
  const legacyImageSystem = window.FloDramaImages;
  
  if (!legacyImageSystem) {
    console.warn('[FloDrama] Système d\'images legacy non trouvé. L\'adaptateur ne sera pas initialisé.');
    return null;
  }
  
  console.info('[FloDrama] Initialisation de l\'adaptateur du système d\'images');
  
  // Créer l'adaptateur
  const adapter = {
    /**
     * Charge une image avec le nouveau ImageService
     * @param {HTMLImageElement} imgElement - Élément image à charger
     * @param {string} contentId - ID du contenu
     * @param {string} type - Type d'image
     */
    loadImage(imgElement, contentId, type) {
      if (!imgElement) return;
      
      // Configurer les attributs data-* pour la compatibilité avec le système existant
      imgElement.dataset.contentId = contentId;
      imgElement.dataset.type = type;
      
      // Utiliser le nouveau service pour charger l'image
      imageService.loadImage(contentId, type, {
        element: imgElement,
        onLoad: () => {
          console.debug(`[ImageAdapter] Image chargée: ${contentId} (${type})`);
        },
        onError: (_error) => {
          // En cas d'erreur, utiliser le système legacy comme fallback
          console.debug(`[ImageAdapter] Utilisation du fallback legacy pour: ${contentId} (${type})`);
          legacyImageSystem.handleImageError({ target: imgElement });
        }
      });
    },
    
    /**
     * Précharge les images héroïques
     */
    preloadHeroImages() {
      // Utiliser le nouveau service pour précharger les images héroïques
      for (let i = 1; i <= 3; i++) {
        imageService.preloadImage(`hero${i}`, 'hero', {
          sources: [
            `https://flodrama-assets.s3.amazonaws.com/assets/images/hero/hero${i}.svg`,
            `/assets/images/hero/hero${i}.svg`
          ]
        });
      }
      
      console.info('[FloDrama] Images héroïques préchargées avec le nouveau ImageService');
    },
    
    /**
     * Corrige les chemins des images héroïques dans le DOM
     */
    fixHeroImagePaths() {
      // Trouver toutes les images héroïques dans le DOM
      const heroImages = document.querySelectorAll('img[src*="hero"]');
      
      heroImages.forEach(img => {
        const src = img.getAttribute('src');
        const heroMatch = src.match(/hero(\d+)\.jpg/);
        
        if (heroMatch) {
          const heroNum = heroMatch[1];
          // Remplacer par le chemin SVG
          const newSrc = `https://flodrama-assets.s3.amazonaws.com/assets/images/hero/hero${heroNum}.svg`;
          console.debug(`[ImageAdapter] Correction du chemin d'image: ${src} -> ${newSrc}`);
          img.setAttribute('src', newSrc);
          
          // Configurer pour utiliser le nouveau service
          img.dataset.contentId = `hero${heroNum}`;
          img.dataset.type = 'hero';
        }
      });
      
      console.info('[FloDrama] Chemins des images héroïques corrigés');
    },
    
    /**
     * Initialise l'adaptateur et applique les corrections
     */
    initialize() {
      // Corriger les chemins des images héroïques
      this.fixHeroImagePaths();
      
      // Précharger les images héroïques
      this.preloadHeroImages();
      
      // Écouter les événements d'erreur d'image pour utiliser le nouveau service
      document.addEventListener('error', (event) => {
        if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
          const img = event.target;
          const contentId = img.dataset.contentId;
          const type = img.dataset.type;
          
          if (contentId && type) {
            console.debug(`[ImageAdapter] Gestion d'erreur d'image: ${contentId} (${type})`);
            this.loadImage(img, contentId, type);
            event.preventDefault();
          }
        }
      }, true);
      
      console.info('[FloDrama] Adaptateur du système d\'images initialisé');
      
      return this;
    }
  };
  
  return adapter.initialize();
}

// Exporter une fonction d'initialisation automatique
export function autoInitImageAdapter() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImageSystemAdapter);
  } else {
    initializeImageSystemAdapter();
  }
}

// Initialisation automatique si le script est chargé directement
if (typeof window !== 'undefined') {
  window.FloDramaImageAdapter = {
    init: initializeImageSystemAdapter,
    autoInit: autoInitImageAdapter
  };
}
