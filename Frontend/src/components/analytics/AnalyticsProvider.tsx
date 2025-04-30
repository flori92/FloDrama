import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import analytics from '@services/analytics';

// Création du contexte pour l'analytics
type AnalyticsContextType = {
  trackEvent: (eventName: string, eventData?: Record<string, any>) => void;
  trackContentView: (contentId: string, contentType: string) => void;
  trackUserAction: (action: string, details?: Record<string, any>) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Props pour le provider
interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le service d'analytics
 * Initialise le service et fournit des méthodes pour tracker les événements
 */
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  // Initialisation du service d'analytics au montage du composant
  useEffect(() => {
    analytics.init();
  }, []);

  // Méthode pour tracker un événement personnalisé
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    analytics.trackEvent(eventName, eventData);
  };

  // Méthode pour tracker la vue d'un contenu
  const trackContentView = (contentId: string, contentType: string) => {
    analytics.trackEvent('content_view', {
      content_id: contentId,
      content_type: contentType,
      timestamp: new Date().toISOString()
    });
  };

  // Méthode pour tracker une action utilisateur
  const trackUserAction = (action: string, details?: Record<string, any>) => {
    analytics.trackEvent('user_action', {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  };

  // Valeur du contexte
  const contextValue: AnalyticsContextType = {
    trackEvent,
    trackContentView,
    trackUserAction
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

/**
 * Hook pour utiliser le service d'analytics dans les composants
 */
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics doit être utilisé à l\'intérieur d\'un AnalyticsProvider');
  }
  
  return context;
};

export default AnalyticsProvider;
