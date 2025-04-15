import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getStaticUrl } from '../../utils/assetUtils';

/**
 * Composant LazyImage optimisé pour le chargement paresseux des images
 * Avec support pour les placeholders et gestion des erreurs
 */
const LazyImage = ({
  src,
  alt,
  className,
  placeholderSrc,
  onLoad,
  onError,
  width,
  height,
  style,
  loading = 'lazy',
  decoding = 'async',
  imageType = 'poster',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Fonction pour déterminer le type d'image pour le placeholder
  const getImageType = () => {
    const types = ['poster', 'backdrop', 'profile', 'still', 'logo'];
    return types.includes(imageType) ? imageType : 'poster';
  };

  // Fonction pour obtenir le placeholder par défaut
  const getDefaultPlaceholder = () => {
    return getStaticUrl(`placeholders/${getImageType()}-placeholder.jpg`);
  };

  useEffect(() => {
    // Réinitialiser l'état si la source change
    setIsLoaded(false);
    setHasError(false);
    
    // Fonction pour charger l'image
    const loadImage = () => {
      if (!imgRef.current) return;
      
      // Nettoyer l'observateur existant si présent
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Créer un nouvel observateur d'intersection
      observerRef.current = new IntersectionObserver((entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          // L'image est visible, charger l'image
          const img = imgRef.current;
          if (img) {
            // Définir les gestionnaires d'événements
            img.onload = () => {
              setIsLoaded(true);
              if (onLoad) onLoad();
            };
            
            img.onerror = () => {
              setHasError(true);
              if (onError) onError();
            };
            
            // Déclencher le chargement en définissant la source
            if (img.src !== src) {
              img.src = src;
            }
          }
          
          // Arrêter d'observer une fois chargé
          observerRef.current.disconnect();
        }
      });
      
      // Commencer à observer l'élément image
      observerRef.current.observe(imgRef.current);
    };
    
    loadImage();
    
    // Nettoyage lors du démontage
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, onLoad, onError]);

  return (
    <div className={`lazy-image-container ${className || ''}`} style={style}>
      {!isLoaded && (
        <div className="lazy-image-placeholder">
          <img
            ref={imgRef}
            src={hasError && placeholderSrc ? placeholderSrc : (placeholderSrc || getDefaultPlaceholder())}
            alt={alt || "Image en cours de chargement"}
            className="placeholder-img"
            width={width}
            height={height}
          />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={hasError && placeholderSrc ? placeholderSrc : src}
        alt={alt || ""}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  placeholderSrc: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  loading: PropTypes.string,
  decoding: PropTypes.string,
  imageType: PropTypes.oneOf(['poster', 'backdrop', 'profile', 'still', 'logo'])
};

export default LazyImage;
