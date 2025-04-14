import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';

// Contexte d'abonnement
const SubscriptionContext = createContext({
  subscription: null,
  isLoading: true,
  error: null,
  checkSubscription: () => {},
  hasAccess: () => false
});

// Provider d'abonnement
export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérification de l'état d'abonnement au chargement et quand l'utilisateur change
  useEffect(() => {
    if (isAuthenticated) {
      checkSubscription();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fonction pour vérifier l'abonnement
  const checkSubscription = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler une vérification d'abonnement
      // Dans un cas réel, cela ferait une requête API
      setTimeout(() => {
        const mockSubscription = {
          id: 'sub-123',
          plan: 'premium',
          status: 'active',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ['watchParty', 'downloadContent', 'noAds', 'highDefinition']
        };
        
        setSubscription(mockSubscription);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'abonnement:', err);
      setError('Impossible de vérifier l\'abonnement');
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier si l'utilisateur a accès à une fonctionnalité
  const hasAccess = (feature) => {
    if (!isAuthenticated || !subscription) {
      return false;
    }
    
    // Vérifier si l'abonnement est actif
    if (subscription.status !== 'active') {
      return false;
    }
    
    // Vérifier si l'abonnement inclut la fonctionnalité demandée
    return subscription.features.includes(feature);
  };

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscription, 
        isLoading, 
        error, 
        checkSubscription,
        hasAccess
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'abonnement
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription doit être utilisé à l\'intérieur d\'un SubscriptionProvider');
  }
  
  return context;
};

export default useSubscription;
