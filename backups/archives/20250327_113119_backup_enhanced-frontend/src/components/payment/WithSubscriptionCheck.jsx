/**
 * WithSubscriptionCheck
 * 
 * HOC (High Order Component) qui vérifie si l'utilisateur a accès au contenu premium.
 * Si non, affiche le composant PremiumContentOverlay.
 */

import React from 'react';
import { useSubscription } from '../../services/SubscriptionService';
import PremiumContentOverlay from './PremiumContentOverlay';

const WithSubscriptionCheck = (WrappedComponent, requirePremium = true) => {
  // Création d'un composant fonctionnel pour utiliser le hook
  const SubscriptionProtectedComponent = (props) => {
    const { canAccessPremiumContent } = useSubscription();
    
    // Si le contenu ne nécessite pas d'abonnement premium ou si l'utilisateur a accès au contenu premium
    if (!requirePremium || canAccessPremiumContent()) {
      return <WrappedComponent {...props} />;
    }
    
    // Sinon, afficher l'overlay de contenu premium
    return (
      <>
        <WrappedComponent {...props} blurred />
        <PremiumContentOverlay />
      </>
    );
  };
  
  return SubscriptionProtectedComponent;
};

export default WithSubscriptionCheck;
