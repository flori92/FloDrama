/**
 * Hook de prévisualisation des trailers pour FloDrama
 * 
 * Ce hook gère l'affichage des prévisualisations de trailers au survol des cartes
 * avec un délai configurable pour éviter les déclenchements accidentels.
 */

import { useRef, useState, useCallback } from 'react';

interface UseTrailerPreviewReturn {
  isPreviewing: boolean;
  showPreview: (trailerUrl: string) => void;
  hidePreview: () => void;
  trailerUrl: string | null;
  bind: {
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  };
}

/**
 * Hook pour gérer la prévisualisation du trailer sur hover prolongé
 * @param delayMs Délai en millisecondes avant l'affichage du trailer (défaut: 1000ms)
 */
export function useTrailerPreview(delayMs = 1000): UseTrailerPreviewReturn {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Affiche la prévisualisation avec l'URL fournie
  const showPreview = useCallback((url: string) => {
    setTrailerUrl(url);
    setIsPreviewing(true);
  }, []);

  // Masque la prévisualisation et nettoie le timer
  const hidePreview = useCallback(() => {
    setIsPreviewing(false);
    setTrailerUrl(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Gestionnaire d'entrée de souris
  const onMouseEnter = (e: React.MouseEvent) => {
    const url = (e.currentTarget as HTMLElement).getAttribute('data-trailer-url');
    if (!url) return;
    
    // Nettoyer tout timer existant
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Configurer un nouveau timer pour le délai
    timerRef.current = setTimeout(() => {
      showPreview(url);
    }, delayMs);
  };

  // Gestionnaire de sortie de souris
  const onMouseLeave = () => {
    hidePreview();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Accessibilité : support du focus clavier
  const onFocus = (e: React.FocusEvent) => {
    const url = (e.currentTarget as HTMLElement).getAttribute('data-trailer-url');
    if (!url) return;
    
    // Nettoyer tout timer existant
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Configurer un nouveau timer pour le délai
    timerRef.current = setTimeout(() => {
      showPreview(url);
    }, delayMs);
  };
  
  // Accessibilité : support de la perte de focus
  const onBlur = () => {
    hidePreview();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return {
    isPreviewing,
    showPreview,
    hidePreview,
    trailerUrl,
    bind: {
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
    },
  };
}

export default useTrailerPreview;
