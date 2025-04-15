import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLazyLoading } from '../hooks/useLazyLoading.jsx';
import cacheManager from '../utils/cacheManager';
import { getAssetUrl } from '../utils/assetUtils';

/**
 * Composant LazyImage optimisé pour FloDrama
 * Charge les images uniquement lorsqu'elles sont visibles dans le viewport
 * Utilise le système de cache pour améliorer les performances
 * Gère les erreurs de chargement avec une image de remplacement
 */
const LazyImage = ({
  src,
  alt,
  placeholderSrc,
  fallbackSrc = '/assets/images/placeholders/image-placeholder.jpg',
  className,
  style,
  cacheKey,
  cacheType = 'images',
  onLoad,
  onError,
  ...props
}) => {
  // Utiliser le hook de lazy loading
  const { elementRef, isVisible } = useLazyLoading();
  
  // États pour suivre le chargement et les erreurs
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
  // Résoudre les URLs des images
  useEffect(() => {
    // Résoudre l'URL de l'image principale
    const resolvedSrc = src.startsWith('http') ? src : getAssetUrl(src);
    setImageSrc(resolvedSrc);
    
    // Vérifier si l'image est en cache
    if (cacheKey) {
      const cachedImage = cacheManager.getCache(cacheKey, cacheType);
      if (cachedImage) {
        setImageSrc(cachedImage);
      }
    }
  }, [src, cacheKey, cacheType]);
  
  // Mettre l'image en cache
  const cacheImage = () => {
    if (!cacheKey || !isLoaded) return;
    cacheManager.setCache(cacheKey, imageSrc, cacheType);
  };
  
  // Gérer le chargement réussi
  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    cacheImage();
    if (onLoad) onLoad(e);
  };
  
  // Gérer les erreurs de chargement
  const handleError = (e) => {
    console.warn(`Erreur de chargement de l'image: ${imageSrc}`);
    setHasError(true);
    
    // Utiliser l'image de secours
    if (fallbackSrc) {
      const resolvedFallback = fallbackSrc.startsWith('http') ? fallbackSrc : getAssetUrl(fallbackSrc);
      setImageSrc(resolvedFallback);
    }
    
    if (onError) onError(e);
  };
  
  // Styles pour le conteneur et l'image
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1A1926', // Couleur de fond conforme à l'identité visuelle
    width: '100%',
    height: '100%',
    ...style
  };
  
  // Styles pour le placeholder
  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, #d946ef, #8b5cf6, #3b82f6)', // Dégradé signature FloDrama
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease', // Animation fluide
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  // Classes CSS pour l'image
  const imageClasses = `lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''} ${className || ''}`;
  
  return (
    <div
      ref={elementRef}
      className="lazy-image-container"
      style={containerStyle}
      data-testid="lazy-image-container"
      data-error={hasError ? 'true' : 'false'}
    >
      {/* Placeholder avec dégradé signature */}
      <div className="lazy-image-placeholder" style={placeholderStyle}>
        {placeholderSrc && !isLoaded && (
          <img 
            src={placeholderSrc.startsWith('http') ? placeholderSrc : getAssetUrl(placeholderSrc)} 
            alt="" 
            className="placeholder-image" 
            style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.7 }}
          />
        )}
        
        {/* Icône d'erreur si le chargement a échoué */}
        {hasError && (
          <div className="error-icon" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            !
          </div>
        )}
      </div>
      
      {/* Image principale (chargée uniquement si visible) */}
      {isVisible && (
        <img
          src={imageSrc}
          alt={alt}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease', // Animation fluide
            position: 'relative',
            zIndex: 1,
            filter: hasError ? 'grayscale(50%) brightness(0.8)' : 'none'
          }}
          {...props}
        />
      )}
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholderSrc: PropTypes.string,
  fallbackSrc: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  cacheKey: PropTypes.string,
  cacheType: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default LazyImage;
