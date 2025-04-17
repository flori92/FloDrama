/**
 * Composant d'image optimisé pour FloDrama
 * Gère automatiquement les fallbacks, le chargement progressif et les erreurs
 */

import React, { useState, useRef, useEffect } from 'react';
import useOptimizedImage from '../../hooks/useOptimizedImage';
import { ImageTypes } from '../../utils/imageManager';
import './OptimizedImage.css';

/**
 * Composant d'image optimisé avec gestion des erreurs et fallbacks
 * @param {Object} props - Propriétés du composant
 * @param {string} props.contentId - Identifiant du contenu
 * @param {string} props.type - Type d'image (poster, backdrop, etc.)
 * @param {string} props.alt - Texte alternatif
 * @param {Object} props.options - Options de chargement d'image
 * @param {Object} props.style - Styles CSS supplémentaires
 * @param {string} props.className - Classes CSS supplémentaires
 * @param {Function} props.onLoad - Fonction appelée quand l'image est chargée
 * @param {Function} props.onError - Fonction appelée en cas d'erreur
 * @param {boolean} props.showPlaceholder - Afficher un placeholder pendant le chargement
 * @param {boolean} props.blur - Appliquer un effet de flou pendant le chargement
 */
const OptimizedImage = ({
  contentId,
  type = ImageTypes.POSTER,
  alt = '',
  options = {},
  style = {},
  className = '',
  onLoad,
  onError,
  showPlaceholder = true,
  blur = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  
  // Utiliser notre hook personnalisé
  const {
    src,
    isLoading,
    error,
    useFallback,
    reload,
    onError: handleImageError,
    getPlaceholder
  } = useOptimizedImage(contentId, type, options);
  
  // Effet pour observer la visibilité de l'image
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Gestionnaire d'événement de chargement
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  // Gestionnaire d'événement d'erreur
  const handleError = (e) => {
    handleImageError();
    if (onError) onError(e);
  };
  
  // Classes CSS conditionnelles
  const imageClasses = [
    'optimized-image',
    className,
    isLoading ? 'is-loading' : '',
    useFallback ? 'is-fallback' : '',
    blur && !isLoaded ? 'blur-effect' : '',
    isLoaded ? 'loaded' : ''
  ].filter(Boolean).join(' ');
  
  // Styles combinés
  const combinedStyle = {
    ...style,
    backgroundImage: showPlaceholder && !isLoaded ? `url(${getPlaceholder()})` : 'none'
  };
  
  return (
    <div className="optimized-image-container" style={combinedStyle}>
      {isVisible && (
        <img
          ref={imgRef}
          src={src}
          alt={alt || `Image ${contentId}`}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
      
      {isLoading && showPlaceholder && (
        <div className="optimized-image-loading">
          <div className="optimized-image-spinner"></div>
        </div>
      )}
      
      {error && useFallback && (
        <div className="optimized-image-error">
          <button 
            className="optimized-image-retry" 
            onClick={reload}
            aria-label="Réessayer de charger l'image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
