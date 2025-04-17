/**
 * Hook personnalisé pour gérer les images avec fallback et préchargement
 * Réduit les erreurs dans la console et améliore l'expérience utilisateur
 */

import { useState, useEffect, useCallback } from 'react';
import imageManager, { ImageTypes } from '../utils/imageManager';
import logger from '../utils/logger';

/**
 * Hook pour charger des images avec gestion optimisée des erreurs et fallbacks
 * @param {string} contentId - Identifiant du contenu
 * @param {string} type - Type d'image (poster, backdrop, etc.)
 * @param {Object} options - Options supplémentaires
 * @returns {Object} - État et fonctions pour gérer l'image
 */
const useOptimizedImage = (contentId, type = ImageTypes.POSTER, options = {}) => {
  const [imageState, setImageState] = useState({
    src: '',
    isLoading: true,
    error: null,
    retryCount: 0,
    useFallback: false
  });
  
  // Options par défaut
  const {
    preload = true,
    placeholderColor = null,
    maxRetries = 2,
    lazyLoad = true,
    size = 'medium',
    quality = 'high'
  } = options;
  
  /**
   * Génère un SVG de remplacement
   */
  const generatePlaceholder = useCallback(() => {
    try {
      // Utiliser la fonction de génération de SVG du gestionnaire d'images
      // ou créer un SVG simple si la fonction n'est pas disponible
      if (typeof imageManager.generateSvgDataUrl === 'function') {
        return imageManager.generateSvgDataUrl(contentId, type);
      }
      
      // Couleurs de dégradé basées sur le type de contenu
      const colors = {
        [ImageTypes.POSTER]: ['#3b82f6', '#d946ef'],
        [ImageTypes.BACKDROP]: ['#1e40af', '#7e22ce'],
        [ImageTypes.THUMBNAIL]: ['#2563eb', '#c026d3'],
        [ImageTypes.PROFILE]: ['#4f46e5', '#db2777'],
        [ImageTypes.LOGO]: ['#6366f1', '#e11d48']
      };
      
      const [color1, color2] = placeholderColor 
        ? [placeholderColor, placeholderColor] 
        : (colors[type] || ['#3b82f6', '#d946ef']);
      
      // Dimensions basées sur le type d'image
      const dimensions = {
        [ImageTypes.POSTER]: { width: 300, height: 450 },
        [ImageTypes.BACKDROP]: { width: 780, height: 439 },
        [ImageTypes.THUMBNAIL]: { width: 200, height: 200 },
        [ImageTypes.PROFILE]: { width: 200, height: 200 },
        [ImageTypes.LOGO]: { width: 300, height: 150 }
      };
      
      const { width, height } = dimensions[type] || { width: 300, height: 450 };
      
      // Créer un SVG avec le dégradé
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          <defs>
            <linearGradient id="grad${contentId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${color1}" />
              <stop offset="100%" stop-color="${color2}" />
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#grad${contentId})" />
          <text x="${width/2}" y="${height/2}" fill="white" text-anchor="middle" dominant-baseline="middle" 
                font-family="SF Pro Display, sans-serif" font-weight="bold" font-size="${Math.min(width, height) * 0.08}px">${contentId}</text>
        </svg>
      `;
      
      // Convertir le SVG en Data URL
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    } catch (error) {
      logger.error('Erreur lors de la génération du placeholder:', error);
      return '/assets/static/placeholders/default.svg';
    }
  }, [contentId, type, placeholderColor]);
  
  /**
   * Charge l'image avec gestion des erreurs
   */
  const loadImage = useCallback(async () => {
    if (!contentId) {
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        error: new Error('Identifiant de contenu non fourni'),
        useFallback: true,
        src: generatePlaceholder()
      }));
      return;
    }
    
    setImageState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let imageSrc;
      
      // Si préchargement activé, utiliser la fonction de préchargement
      if (preload && typeof imageManager.preloadImage === 'function') {
        imageSrc = await imageManager.preloadImage(contentId, type);
      } else if (typeof imageManager.getOptimalImageUrl === 'function') {
        // Sinon, obtenir l'URL optimale
        imageSrc = await imageManager.getOptimalImageUrl(contentId, type, { size, quality });
      } else {
        // Fallback si le gestionnaire d'images n'est pas disponible
        const cdnUrl = `https://images.flodrama.com/${type}s/${contentId}.jpg`;
        const fallbackUrl = `https://d2ra390ol17u3n.cloudfront.net/${type}s/${contentId}.jpg`;
        const localUrl = `/assets/media/${type}s/${contentId}.jpg`;
        
        // Tester si les images existent
        try {
          const response = await fetch(cdnUrl, { method: 'HEAD' });
          if (response.ok) {
            imageSrc = cdnUrl;
          } else {
            const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
            imageSrc = fallbackResponse.ok ? fallbackUrl : localUrl;
          }
        } catch (error) {
          imageSrc = localUrl;
        }
      }
      
      setImageState(prev => ({
        ...prev,
        src: imageSrc,
        isLoading: false,
        useFallback: false
      }));
    } catch (error) {
      logger.warn(`Erreur de chargement d'image pour ${contentId}:`, error);
      
      // Si nombre max de tentatives atteint, utiliser le fallback
      if (imageState.retryCount >= maxRetries) {
        setImageState(prev => ({
          ...prev,
          isLoading: false,
          error,
          useFallback: true,
          src: generatePlaceholder()
        }));
      } else {
        // Sinon, incrémenter le compteur de tentatives
        setImageState(prev => ({
          ...prev,
          retryCount: prev.retryCount + 1,
          error
        }));
        
        // Réessayer après un délai
        setTimeout(loadImage, 1000);
      }
    }
  }, [contentId, type, preload, generatePlaceholder, maxRetries, size, quality]);
  
  /**
   * Gère les erreurs de chargement d'image
   */
  const handleImageError = useCallback(() => {
    if (imageState.useFallback) return; // Déjà en mode fallback
    
    if (imageState.retryCount >= maxRetries) {
      // Utiliser le placeholder si nombre max de tentatives atteint
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        useFallback: true,
        src: generatePlaceholder()
      }));
    } else {
      // Sinon, incrémenter le compteur et réessayer avec une autre source
      setImageState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1
      }));
      
      // Réessayer après un délai
      setTimeout(loadImage, 1000);
    }
  }, [imageState.retryCount, imageState.useFallback, maxRetries, generatePlaceholder, loadImage]);
  
  // Effet pour charger l'image au montage du composant
  useEffect(() => {
    if (lazyLoad) {
      // Si lazyLoad est activé, utiliser IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        },
        { rootMargin: '200px' } // Précharger lorsque l'élément est à 200px de la zone visible
      );
      
      // Créer un élément div temporaire pour l'observer
      const tempDiv = document.createElement('div');
      tempDiv.id = `image-observer-${contentId}`;
      tempDiv.style.height = '1px';
      tempDiv.style.width = '1px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.opacity = '0';
      document.body.appendChild(tempDiv);
      
      observer.observe(tempDiv);
      
      return () => {
        observer.disconnect();
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      };
    } else {
      // Sinon, charger immédiatement
      loadImage();
    }
  }, [contentId, type, lazyLoad, loadImage]);
  
  return {
    ...imageState,
    reload: loadImage,
    onError: handleImageError,
    getPlaceholder: generatePlaceholder
  };
};

export default useOptimizedImage;
