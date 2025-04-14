/**
 * PayPalButton
 * 
 * Composant pour afficher un bouton de paiement PayPal pour les abonnements FloDrama.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSubscription } from '../../services/SubscriptionService';
import paypalService from '../../services/PayPalService';

const PayPalButton = ({ planId, billingPeriod, onSuccess, onError, onCancel, className }) => {
  const paypalButtonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe } = useSubscription();
  const containerId = `paypal-button-${planId}-${billingPeriod}`;

  useEffect(() => {
    const initializePayPalButton = async () => {
      try {
        setIsLoading(true);
        
        await paypalService.createSubscriptionButton(
          containerId,
          planId,
          billingPeriod,
          (details) => {
            // Créer un objet de méthode de paiement à partir des détails PayPal
            const paymentMethod = {
              id: details.id,
              type: 'paypal',
              email: details.payer.email_address,
              isDefault: true
            };
            
            // Mettre à jour l'abonnement dans le service
            subscribe(planId, paymentMethod);
            
            if (onSuccess) {
              onSuccess(details);
            }
          },
          (error) => {
            setError(error.message || 'Une erreur est survenue lors du paiement');
            if (onError) {
              onError(error);
            }
          },
          (data) => {
            if (onCancel) {
              onCancel(data);
            }
          }
        );
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du bouton PayPal:', err);
        setError(err.message || 'Impossible de charger le bouton PayPal');
        setIsLoading(false);
        
        if (onError) {
          onError(err);
        }
      }
    };

    initializePayPalButton();
    
    // Nettoyage
    return () => {
      // Si nécessaire, ajouter du code de nettoyage
    };
  }, [planId, billingPeriod, onSuccess, onError, onCancel, subscribe, containerId]);

  return (
    <div className={className}>
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <span className="ml-2 text-gray-400">Chargement du paiement...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div id={containerId} ref={paypalButtonRef} className={isLoading ? 'hidden' : ''}></div>
    </div>
  );
};

export default PayPalButton;
