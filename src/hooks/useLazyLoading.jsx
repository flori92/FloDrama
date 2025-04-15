import { useEffect, useRef, useState, useMemo } from 'react';

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

export default useLazyLoading;
