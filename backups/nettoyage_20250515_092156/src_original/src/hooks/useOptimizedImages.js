/**
 * Hook personnalisé pour la gestion des images optimisées
 * Ce hook facilite l'utilisation des images optimisées dans les composants React
 */

import { useState, useEffect } from 'react';
import { getPosterUrl, getBackdropUrl, getThumbnailUrl, isImageUrlValid, preloadImage } from '../utils/ImageUtils';

/**
 * Hook pour gérer les images optimisées d'un contenu
 * @param {Object} content - Objet contenant les données du contenu
 * @param {Object} options - Options de configuration
 * @returns {Object} - Objet contenant les URLs d'images et fonctions utilitaires
 */
const useOptimizedImages = (content, options = {}) => {
  const {
    preload = false,
    posterSize = 'medium',
    backdropSize = 'large',
    thumbnailSize = 'small'
  } = options;

  const [imageUrls, setImageUrls] = useState({
    poster: getPosterUrl(content, posterSize),
    backdrop: getBackdropUrl(content, backdropSize),
    thumbnail: getThumbnailUrl(content, thumbnailSize)
  });

  const [isLoading, setIsLoading] = useState(preload);
  const [hasError, setHasError] = useState(false);

  // Vérifier la validité des URLs d'images
  useEffect(() => {
    const validateImages = async () => {
      try {
        // Mettre à jour les URLs d'images
        const posterUrl = getPosterUrl(content, posterSize);
        const backdropUrl = getBackdropUrl(content, backdropSize);
        const thumbnailUrl = getThumbnailUrl(content, thumbnailSize);

        // Vérifier si les URLs sont valides
        const [isPosterValid, isBackdropValid] = await Promise.all([
          isImageUrlValid(posterUrl),
          isImageUrlValid(backdropUrl)
        ]);

        // Mettre à jour les URLs avec des fallbacks si nécessaire
        setImageUrls({
          poster: isPosterValid ? posterUrl : '/images/default-poster.svg',
          backdrop: isBackdropValid ? backdropUrl : '/images/default-backdrop.svg',
          thumbnail: thumbnailUrl
        });

        setHasError(!(isPosterValid && isBackdropValid));
      } catch (error) {
        console.error('Erreur lors de la validation des images:', error);
        setHasError(true);
      }
    };

    validateImages();
  }, [content, posterSize, backdropSize, thumbnailSize]);

  // Précharger les images si l'option est activée
  useEffect(() => {
    if (preload && !hasError) {
      const preloadImages = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            preloadImage(imageUrls.poster),
            preloadImage(imageUrls.backdrop)
          ]);
        } catch (error) {
          console.error('Erreur lors du préchargement des images:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };

      preloadImages();
    }
  }, [imageUrls, preload, hasError]);

  /**
   * Obtenir l'URL d'une image de poster avec une taille spécifique
   * @param {string} size - Taille de l'image (small, medium, large, original)
   * @returns {string} - URL de l'image de poster
   */
  const getPoster = (size = posterSize) => {
    return getPosterUrl(content, size);
  };

  /**
   * Obtenir l'URL d'une image de backdrop avec une taille spécifique
   * @param {string} size - Taille de l'image (small, medium, large, original)
   * @returns {string} - URL de l'image de backdrop
   */
  const getBackdrop = (size = backdropSize) => {
    return getBackdropUrl(content, size);
  };

  /**
   * Obtenir l'URL d'une image de miniature
   * @returns {string} - URL de l'image de miniature
   */
  const getThumbnail = () => {
    return getThumbnailUrl(content);
  };

  return {
    imageUrls,
    isLoading,
    hasError,
    getPoster,
    getBackdrop,
    getThumbnail
  };
};

export default useOptimizedImages;
