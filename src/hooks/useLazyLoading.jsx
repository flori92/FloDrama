import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Hook personnalisé pour implémenter le lazy loading des images
 * Utilise l'API Intersection Observer pour charger les images uniquement lorsqu'elles sont visibles
 */

/**
 * Hook pour le lazy loading des images
 * @param {Object} options - Options pour l'Intersection Observer
 * @param {string} options.rootMargin - Marge autour de l'élément racine (par défaut: "200px")
 * @param {number} options.threshold - Seuil de visibilité pour déclencher le chargement (par défaut: 0.1)
 * @returns {Object} - Référence à attacher à l'élément et état de visibilité
 */
export const useLazyLoading = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  // Utiliser useMemo pour éviter de recréer l'objet à chaque rendu
  const defaultOptions = useMemo(() => ({
    rootMargin: '200px',
    threshold: 0.1,
    ...options
  }), [options]); // Inclure options comme dépendance

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Une fois que l'élément est visible, on n'a plus besoin de l'observer
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      }
    }, defaultOptions);

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [defaultOptions]); // Inclure defaultOptions comme dépendance

  return { elementRef, isVisible };
};

/**
 * Composant pour le lazy loading des images
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - URL de l'image
 * @param {string} props.alt - Texte alternatif de l'image
 * @param {string} props.placeholderSrc - URL de l'image de placeholder (optionnel)
 * @param {Object} props.style - Styles CSS pour l'image
 * @param {string} props.className - Classes CSS pour l'image
 * @returns {JSX.Element} - Élément image avec lazy loading
 */
export const LazyImage = ({ src, alt, placeholderSrc, style, className, ...props }) => {
  const { elementRef, isVisible } = useLazyLoading();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <div
      ref={elementRef}
      className={`lazy-image-container ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {isVisible ? (
        <img
          src={error && placeholderSrc ? placeholderSrc : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          loading="lazy"
          {...props}
        />
      ) : (
        <div className="lazy-image-placeholder" />
      )}
    </div>
  );
};

export default useLazyLoading;
