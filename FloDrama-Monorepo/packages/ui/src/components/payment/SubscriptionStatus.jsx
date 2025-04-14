/**
 * SubscriptionStatus
 * 
 * Composant pour afficher le statut de l'abonnement et la période d'essai.
 */

import React from 'react';
import { useSubscription } from '../../services/SubscriptionService';
import { SUBSCRIPTION_STATUS } from '../../services/SubscriptionService';

const SubscriptionStatus = ({ className }) => {
  const { 
    subscriptionData, 
    isInInitialTrial, 
    isInSubscriptionTrial,
    hasActiveSubscription,
    getRemainingTrialDays
  } = useSubscription();

  if (!subscriptionData) {
    return null;
  }

  const remainingDays = getRemainingTrialDays();
  
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      {isInInitialTrial() && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
          <p className="font-bold">Période d'essai en cours</p>
          <p>
            Vous profitez actuellement de votre période d'essai gratuite de 7 jours.
            {remainingDays > 0 && ` Il vous reste ${remainingDays} jour${remainingDays > 1 ? 's' : ''}.`}
          </p>
        </div>
      )}

      {isInSubscriptionTrial() && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Période d'essai après abonnement</p>
          <p>
            Merci pour votre abonnement ! Vous profitez actuellement de votre mois gratuit.
            {remainingDays > 0 && ` Il vous reste ${remainingDays} jour${remainingDays > 1 ? 's' : ''}.`}
          </p>
          <p className="mt-2">
            Votre premier prélèvement sera effectué à la fin de cette période.
          </p>
        </div>
      )}

      {hasActiveSubscription() && subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE && (
        <div className="bg-pink-100 border-l-4 border-pink-500 text-pink-700 p-4 mb-4" role="alert">
          <p className="font-bold">Abonnement actif</p>
          <p>
            Vous êtes abonné à la formule {subscriptionData.plan?.name || 'inconnue'}.
            {subscriptionData.endDate && ` Votre abonnement est valable jusqu'au ${new Date(subscriptionData.endDate).toLocaleDateString()}.`}
          </p>
          <p className="mt-2">
            {subscriptionData.autoRenew 
              ? 'Votre abonnement sera automatiquement renouvelé.' 
              : 'Votre abonnement ne sera pas renouvelé automatiquement.'}
          </p>
        </div>
      )}

      {subscriptionData.status === SUBSCRIPTION_STATUS.INACTIVE && (
        <div className="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 mb-4" role="alert">
          <p className="font-bold">Aucun abonnement actif</p>
          <p>
            Vous n'avez pas d'abonnement actif. Abonnez-vous pour profiter de tout le contenu de FloDrama.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
