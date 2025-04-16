/**
 * SubscriptionProvider
 * 
 * Fournisseur de contexte pour la gestion des abonnements dans FloDrama.
 * Permet d'accéder aux fonctionnalités d'abonnement depuis n'importe quel composant.
 */

import React, { useState, useEffect, useCallback } from 'react';
import subscriptionService, { SubscriptionContext, SUBSCRIPTION_STATUS } from '../services/SubscriptionService';

const SubscriptionProvider = ({ children }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données d'abonnement au montage du composant
  useEffect(() => {
    try {
      const data = subscriptionService.getSubscriptionData();
      setSubscriptionData(data);
      
      // Vérifier si l'abonnement a expiré
      subscriptionService.checkSubscriptionExpiration();
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données d\'abonnement:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Mettre à jour les données d'abonnement
  const refreshSubscriptionData = useCallback(() => {
    try {
      const data = subscriptionService.getSubscriptionData();
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour des données d\'abonnement:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Démarrer la période d'essai initiale (7 jours)
  const startInitialTrial = useCallback(() => {
    try {
      const data = subscriptionService.startInitialTrial();
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du démarrage de la période d\'essai:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Souscrire à un abonnement
  const subscribe = useCallback((planId, paymentMethod) => {
    try {
      const data = subscriptionService.subscribe(planId, paymentMethod);
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la souscription à l\'abonnement:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Annuler l'abonnement
  const cancelSubscription = useCallback(() => {
    try {
      const data = subscriptionService.cancelSubscription();
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Réactiver l'abonnement
  const reactivateSubscription = useCallback(() => {
    try {
      const data = subscriptionService.reactivateSubscription();
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la réactivation de l\'abonnement:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Changer de plan d'abonnement
  const changePlan = useCallback((newPlanId) => {
    try {
      const data = subscriptionService.changePlan(newPlanId);
      setSubscriptionData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du changement de plan:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Vérifier si l'utilisateur peut accéder au contenu premium
  const canAccessPremiumContent = useCallback(() => {
    return subscriptionService.canAccessPremiumContent();
  }, []);

  // Vérifier si l'utilisateur est en période d'essai initiale
  const isInInitialTrial = useCallback(() => {
    return subscriptionService.isInInitialTrial();
  }, []);

  // Vérifier si l'utilisateur est en période d'essai après abonnement
  const isInSubscriptionTrial = useCallback(() => {
    return subscriptionService.isInSubscriptionTrial();
  }, []);

  // Vérifier si l'utilisateur a un abonnement actif
  const hasActiveSubscription = useCallback(() => {
    return subscriptionService.hasActiveSubscription();
  }, []);

  // Pour les tests uniquement
  const resetSubscriptionData = useCallback(() => {
    try {
      subscriptionService.resetSubscriptionData();
      refreshSubscriptionData();
    } catch (err) {
      console.error('Erreur lors de la réinitialisation des données d\'abonnement:', err);
      setError(err.message);
    }
  }, [refreshSubscriptionData]);

  // Calculer le temps restant dans la période d'essai
  const getRemainingTrialDays = useCallback(() => {
    if (!subscriptionData) return 0;
    
    let endDate = null;
    
    if (subscriptionData.status === SUBSCRIPTION_STATUS.TRIAL && subscriptionData.trialEndDate) {
      endDate = new Date(subscriptionData.trialEndDate);
    } else if (subscriptionData.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL && subscriptionData.subscriptionTrialEndDate) {
      endDate = new Date(subscriptionData.subscriptionTrialEndDate);
    }
    
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscriptionData]);

  // Valeur du contexte
  const value = {
    subscriptionData,
    loading,
    error,
    refreshSubscriptionData,
    startInitialTrial,
    subscribe,
    cancelSubscription,
    reactivateSubscription,
    changePlan,
    canAccessPremiumContent,
    isInInitialTrial,
    isInSubscriptionTrial,
    hasActiveSubscription,
    resetSubscriptionData,
    getRemainingTrialDays
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
