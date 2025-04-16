import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

/**
 * Composant LazyImage amélioré avec gestion des erreurs
 * et fallback automatique vers des sources fiables
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  style = {}, 
  onLoad, 
  onError 
}) => {
  const [imgSrc, setImgSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    const optimizedSrc = getOptimizedImageUrl(src);
    const img = new Image();
    
    img.onload = () => {
      setImgSrc(img.src);
      setIsLoading(false);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      // Si l'image d'origine échoue, utiliser directement l'URL optimisée
      setImgSrc(optimizedSrc);
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
    };
    
    // D'abord essayer la source originale
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);
  
  if (isLoading) {
    return (
      <div 
        className={`lazy-image-placeholder ${className}`}
        style={{
          width: width || '100%',
          height: height || '100%',
          background: 'linear-gradient(to right, #3b82f6, #d946ef)',
          borderRadius: '8px',
          ...style
        }}
      />
    );
  }
  
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`lazy-image ${className} ${hasError ? 'lazy-image-fallback' : ''}`}
      width={width}
      height={height}
      style={style}
      loading="lazy"
    />
  );
};

export default LazyImage;
