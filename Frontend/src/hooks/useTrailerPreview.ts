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

// Hook pour gérer la prévisualisation du trailer sur hover prolongé
export function useTrailerPreview(delayMs = 1000): UseTrailerPreviewReturn {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showPreview = useCallback((url: string) => {
    setTrailerUrl(url);
    setIsPreviewing(true);
  }, []);

  const hidePreview = useCallback(() => {
    setIsPreviewing(false);
    setTrailerUrl(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const onMouseEnter = (e: React.MouseEvent) => {
    const url = (e.currentTarget as HTMLElement).getAttribute('data-trailer-url');
    if (!url) return;
    timerRef.current = setTimeout(() => {
      showPreview(url);
    }, delayMs);
  };

  const onMouseLeave = () => {
    hidePreview();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Accessibilité : support du focus clavier
  const onFocus = (e: React.FocusEvent) => {
    const url = (e.currentTarget as HTMLElement).getAttribute('data-trailer-url');
    if (!url) return;
    timerRef.current = setTimeout(() => {
      showPreview(url);
    }, delayMs);
  };
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
