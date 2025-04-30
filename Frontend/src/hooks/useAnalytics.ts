// src/hooks/useAnalytics.ts
import { useEffect } from 'react';
import analytics from '@services/analytics';

/**
 * Hook pour utiliser le service d'analytics dans les composants React
 * @returns Méthodes pour tracker des événements
 */
export const useAnalytics = () => {
  // Initialisation du service d'analytics au montage du composant
  useEffect(() => {
    analytics.init();
  }, []);

  /**
   * Tracker un événement personnalisé
   * @param eventName Nom de l'événement
   * @param eventData Données associées à l'événement
   */
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    analytics.trackEvent(eventName, eventData);
  };

  /**
   * Tracker un clic sur un élément
   * @param elementName Nom de l'élément cliqué
   * @param elementData Données associées à l'élément
   */
  const trackClick = (elementName: string, elementData?: Record<string, any>) => {
    analytics.trackEvent('click', {
      element_name: elementName,
      ...elementData
    });
  };

  /**
   * Tracker une interaction avec un contenu
   * @param contentType Type de contenu (film, série, etc.)
   * @param contentId Identifiant du contenu
   * @param interactionType Type d'interaction (view, like, share, etc.)
   */
  const trackContentInteraction = (
    contentType: string,
    contentId: string,
    interactionType: 'view' | 'like' | 'share' | 'save' | 'comment' | string
  ) => {
    analytics.trackEvent('content_interaction', {
      content_type: contentType,
      content_id: contentId,
      interaction_type: interactionType
    });
  };

  return {
    trackEvent,
    trackClick,
    trackContentInteraction
  };
};

export default useAnalytics;
