import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useLazyLoading } from '../hooks/useLazyLoading.jsx';
import cacheManager from '../utils/cacheManager';

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
  fallbackSrc,
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
  const [_hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Vérifier si l'image est en cache
  const getCachedImage = () => {
    if (!cacheKey) return null;
    return cacheManager.getCache(cacheKey, cacheType);
  };
  
  // Mettre l'image en cache
  const cacheImage = () => {
    if (!cacheKey || !isLoaded) return;
    cacheManager.setCache(cacheKey, src, cacheType);
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
    setHasError(true);
    console.warn(`Erreur de chargement de l'image: ${src}`);
    
    // Essayer d'utiliser l'image en cache si disponible
    const cachedSrc = getCachedImage();
    if (cachedSrc && cachedSrc !== src) {
      console.log(`Utilisation de l'image en cache: ${cachedSrc}`);
      setImageSrc(cachedSrc);
    } else if (fallbackSrc) {
      // Sinon utiliser l'image de secours
      setImageSrc(fallbackSrc);
    }
    
    if (onError) onError(e);
  };
  
  // Styles pour le conteneur et l'image
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1A1926', // Couleur de fond conforme à l'identité visuelle
    ...style
  };
  
  // Styles pour le placeholder
  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, #3b82f6, #d946ef)', // Dégradé signature
    opacity: isLoaded ? 0 : 0.3,
    transition: 'opacity 0.3s ease', // Animation fluide
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  // Classes CSS pour l'image
  const imageClasses = `lazy-image ${isLoaded ? 'loaded' : ''} ${className || ''}`;
  
  return (
    <div
      ref={elementRef}
      className="lazy-image-container"
      style={containerStyle}
      data-testid="lazy-image-container"
    >
      {/* Placeholder avec dégradé signature */}
      <div className="lazy-image-placeholder" style={placeholderStyle}>
        {placeholderSrc && !isLoaded && (
          <img 
            src={placeholderSrc} 
            alt="" 
            className="placeholder-image" 
            style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.7 }}
          />
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
            zIndex: 1
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
