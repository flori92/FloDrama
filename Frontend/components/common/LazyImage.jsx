import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { LazyImage as LazyImageComponent } from '../../hooks/useLazyLoading';
import { handleImageError } from '../../utils/localImageFallback';

/**
 * Composant d'image avec chargement paresseux et gestion d'erreur
 * Optimisé pour les performances de FloDrama
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  style = {},
  placeholderSrc,
  aspectRatio = '2/3',
  objectFit = 'cover',
  onClick,
  onLoad,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Déterminer le type d'image pour le placeholder
  const getImageType = () => {
    if (src.includes('posters')) return 'poster';
    if (src.includes('backdrops')) return 'backdrop';
    if (src.includes('thumbnails')) return 'thumbnail';
    return 'generic';
  };

  // Gérer le chargement de l'image
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Gérer les erreurs de chargement
  const handleError = (e) => {
    setHasError(true);
    handleImageError(e);
  };

  // Styles pour le conteneur
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    aspectRatio,
    width: width || '100%',
    height: height || 'auto',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    ...style
  };

  // Styles pour l'image
  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out'
  };

  // Styles pour le placeholder
  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    color: '#888',
    fontSize: '0.8rem',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out'
  };

  // Si l'image est prioritaire, la charger immédiatement
  if (priority) {
    return (
      <div 
        className={`lazy-image-container ${className}`} 
        style={containerStyle}
        onClick={onClick}
      >
        <img
          src={hasError && placeholderSrc ? placeholderSrc : src}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
        />
        {!isLoaded && (
          <div style={placeholderStyle}>
            <span>Chargement...</span>
          </div>
        )}
      </div>
    );
  }

  // Sinon, utiliser le composant de lazy loading
  return (
    <LazyImageComponent
      src={src}
      alt={alt}
      placeholderSrc={placeholderSrc || `/assets/static/placeholders/${getImageType()}-placeholder.jpg`}
      className={className}
      style={containerStyle}
      onLoad={handleLoad}
      onClick={onClick}
    />
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  placeholderSrc: PropTypes.string,
  aspectRatio: PropTypes.string,
  objectFit: PropTypes.string,
  onClick: PropTypes.func,
  onLoad: PropTypes.func,
  priority: PropTypes.bool
};

export default LazyImage;
