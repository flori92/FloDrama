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
  src = '',
  style = null,
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
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackApplied, setFallbackApplied] = useState(false);
  const [isGradient, setIsGradient] = useState(style === 'gradient');

  // Effet pour charger l'image si pas un gradient
  useEffect(() => {
    // Si c'est un gradient, rien à faire
    if (isGradient) {
      setIsLoading(false);
      return;
    }
    
    // Si une source directe est fournie, l'utiliser
    if (src) {
      setImageSrc(src);
      return;
    }
    
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setFallbackApplied(false);

    const loadImage = async () => {
      try {
        // Récupérer l'URL de l'image via le service d'intégration
        const imageUrl = await imageIntegrationService.fetchContentImage(contentId, type);
        
        if (isMounted) {
          setImageSrc(imageUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de l'image ${contentId} (${type}):`, error);
        
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          
          // Appliquer le fallback SVG
          const fallbackSvg = imageIntegrationService.getFallbackSvg(contentId, type);
          setImageSrc(fallbackSvg);
          setFallbackApplied(true);
        }
      }
    };

    if (contentId) {
      loadImage();
    }

    return () => {
      isMounted = false;
    };
  }, [contentId, type, src, isGradient]);

  // Gestionnaire d'erreur de chargement d'image
  const handleError = (e) => {
    if (fallbackApplied || isGradient) return; // Éviter les boucles infinies
    
    setHasError(true);
    
    // Appliquer le fallback SVG
    const fallbackSvg = imageIntegrationService.getFallbackSvg(contentId, type);
    setImageSrc(fallbackSvg);
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
    isGradient ? 'flodrama-image-gradient' : '',
    `flodrama-image-${type}`
  ].filter(Boolean).join(' ');

  // Rendu du composant
  if (isGradient) {
    // Rendu pour gradient CSS
    return (
      <div 
        className={`flodrama-image-container ${imageClasses}`}
        style={{ 
          backgroundImage: imageSrc,
          width: width || '100%', 
          height: height || '250px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        data-content-id={contentId}
        data-type={type}
        data-style="gradient"
        {...props}
      >
        {props.children}
      </div>
    );
  }

  // Rendu standard pour image
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
      
      {imageSrc && (
        <img
          src={imageSrc}
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
  contentId: PropTypes.string,
  src: PropTypes.string,
  style: PropTypes.string,
  type: PropTypes.oneOf(['poster', 'backdrop', 'thumbnail', 'logo']),
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lazy: PropTypes.bool,
  showPlaceholder: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.node
};

export default FloDramaImage;
