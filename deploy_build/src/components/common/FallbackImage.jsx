import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { handleImageError } from '../../utils/localImageFallback';

/**
 * Composant d'image avec gestion de fallback
 * Affiche une image de remplacement en cas d'erreur de chargement
 */
const FallbackImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  style = {},
  type = 'generic',
  onClick
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Déterminer le type d'image pour le placeholder
  const getImageType = () => {
    if (type !== 'generic') return type;
    if (src.includes('posters')) return 'poster';
    if (src.includes('backdrops')) return 'backdrop';
    if (src.includes('thumbnails')) return 'thumbnail';
    return 'generic';
  };

  // Obtenir l'URL du placeholder
  const getPlaceholderUrl = () => {
    const imgType = getImageType();
    return `/assets/static/placeholders/${imgType}-placeholder.svg`;
  };

  // Gérer les erreurs de chargement
  const onError = (e) => {
    setHasError(true);
    handleImageError(e);
  };

  // Gérer le chargement réussi
  const onLoad = () => {
    setIsLoaded(true);
  };

  // Styles pour le conteneur
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div 
      className={`fallback-image-container ${className}`} 
      style={containerStyle}
      onClick={onClick}
    >
      <img
        src={hasError ? getPlaceholderUrl() : src}
        alt={alt}
        width={width}
        height={height}
        onError={onError}
        onLoad={onLoad}
        className={`fallback-image ${isLoaded ? 'loaded' : ''} ${hasError ? `${getImageType()}-fallback` : ''}`}
        loading="lazy"
      />
      {!isLoaded && (
        <div className="image-loading-indicator">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

FallbackImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  type: PropTypes.oneOf(['poster', 'backdrop', 'thumbnail', 'generic']),
  onClick: PropTypes.func
};

export default FallbackImage;
