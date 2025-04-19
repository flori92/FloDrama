/**
 * Composant FloDramaImage
 * 
 * Composant React réutilisable pour afficher des images avec gestion des fallbacks
 * et intégration des services de scraping et de gestion de contenu
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import imageIntegrationService from '../services/ImageIntegrationService';

/**
 * Composant d'image avec gestion avancée des fallbacks et intégration des services
 */
const FloDramaImage = ({
  contentId,
  type = 'poster',
  alt = '',
  className = '',
  width,
  height,
  lazy = true,
  showPlaceholder = true,
  onLoad,
  onError,
  ...props
}) => {
  // État local
  const [src, setSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackApplied, setFallbackApplied] = useState(false);

  // Effet pour charger l'image
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setFallbackApplied(false);

    const loadImage = async () => {
      try {
        // Récupérer l'URL de l'image via le service d'intégration
        const imageUrl = await imageIntegrationService.fetchContentImage(contentId, type);
        
        if (isMounted) {
          setSrc(imageUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de l'image ${contentId} (${type}):`, error);
        
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          
          // Appliquer le fallback SVG
          const fallbackSvg = imageIntegrationService.getFallbackSvg(contentId, type);
          setSrc(fallbackSvg);
          setFallbackApplied(true);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [contentId, type]);

  // Gestionnaire d'erreur de chargement d'image
  const handleError = (e) => {
    if (fallbackApplied) return; // Éviter les boucles infinies
    
    setHasError(true);
    
    // Appliquer le fallback SVG
    const fallbackSvg = imageIntegrationService.getFallbackSvg(contentId, type);
    setSrc(fallbackSvg);
    setFallbackApplied(true);
    
    // Appeler le callback onError si fourni
    if (onError) onError(e);
  };

  // Gestionnaire de chargement d'image réussi
  const handleLoad = (e) => {
    setIsLoading(false);
    
    // Appeler le callback onLoad si fourni
    if (onLoad) onLoad(e);
  };

  // Classes CSS
  const imageClasses = [
    className,
    isLoading ? 'flodrama-image-loading' : '',
    hasError ? 'flodrama-image-error' : '',
    fallbackApplied ? 'flodrama-image-fallback' : '',
    `flodrama-image-${type}`
  ].filter(Boolean).join(' ');

  // Rendu du composant
  return (
    <div className={`flodrama-image-container ${isLoading ? 'loading' : ''}`}>
      {isLoading && showPlaceholder && (
        <div 
          className="flodrama-image-placeholder"
          style={{ 
            width: width || 'auto', 
            height: height || 'auto',
            backgroundImage: 'linear-gradient(to right, #3b82f6, #d946ef)'
          }}
        />
      )}
      
      {src && (
        <img
          src={src}
          alt={alt || `${type} de ${contentId}`}
          className={imageClasses}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          data-content-id={contentId}
          data-type={type}
          data-fallback={fallbackApplied ? 'true' : 'false'}
          {...props}
        />
      )}
    </div>
  );
};

FloDramaImage.propTypes = {
  contentId: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['poster', 'backdrop', 'thumbnail', 'logo']),
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lazy: PropTypes.bool,
  showPlaceholder: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default FloDramaImage;
