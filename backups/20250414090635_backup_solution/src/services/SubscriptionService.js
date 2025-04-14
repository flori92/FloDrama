/**
 * SubscriptionService
 * 
 * Service de gestion des abonnements et du modèle freemium de FloDrama.
 * Gère les périodes d'essai, les abonnements et les paiements.
 */

import { createContext, useContext } from 'react';

// Types d'abonnement
export const SUBSCRIPTION_PLANS = {
  ESSENTIAL: {
    id: 'essential',
    name: 'Essentiel',
    description: 'L\'essentiel pour découvrir FloDrama',
    monthlyPrice: 1.99,
    yearlyPrice: 23,
    features: [
      'Accès à tous les dramas',
      'Qualité HD',
      'Visionnage sur 1 écran à la fois'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'Notre offre la plus populaire',
    monthlyPrice: 2.99,
    yearlyPrice: 35,
    features: [
      'Accès à tous les dramas',
      'Qualité Full HD',
      'Visionnage sur 2 écrans à la fois',
      'Sans publicité'
    ]
  },
  ULTIMATE: {
    id: 'ultimate',
    name: 'Ultimate',
    description: 'L\'expérience FloDrama ultime',
    monthlyPrice: 4.99,
    yearlyPrice: 55,
    features: [
      'Accès à tous les dramas',
      'Qualité 4K Ultra HD',
      'Visionnage sur 4 écrans à la fois',
      'Sans publicité',
      'Accès anticipé aux nouveautés'
    ]
  }
};

// Statuts d'abonnement
export const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',           // Pas d'abonnement
  TRIAL: 'trial',                 // Période d'essai initiale (7 jours)
  SUBSCRIBED_TRIAL: 'subscribed_trial', // Période d'essai après abonnement (1 mois)
  ACTIVE: 'active'                // Abonnement actif et payant
};

class SubscriptionService {
  constructor() {
    // Initialiser le stockage local si nécessaire
    this.initLocalStorage();
  }

  /**
   * Initialise le stockage local pour les données d'abonnement
   */
  initLocalStorage() {
    if (!localStorage.getItem('flodrama_subscription')) {
      localStorage.setItem('flodrama_subscription', JSON.stringify({
        status: SUBSCRIPTION_STATUS.INACTIVE,
        plan: null,
        startDate: null,
        endDate: null,
        trialEndDate: null,
        subscriptionTrialEndDate: null,
        paymentMethod: null,
        autoRenew: true
      }));
    }
  }

  /**
   * Récupère les données d'abonnement de l'utilisateur
   * @returns {Object} Données d'abonnement
   */
  getSubscriptionData() {
    const data = localStorage.getItem('flodrama_subscription');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Met à jour les données d'abonnement
   * @param {Object} data - Nouvelles données d'abonnement
   */
  updateSubscriptionData(data) {
    const currentData = this.getSubscriptionData();
    localStorage.setItem('flodrama_subscription', JSON.stringify({
      ...currentData,
      ...data
    }));
  }

  /**
   * Vérifie si l'utilisateur est en période d'essai initiale
   * @returns {Boolean} Vrai si l'utilisateur est en période d'essai
   */
  isInInitialTrial() {
    const data = this.getSubscriptionData();
    if (!data) return false;
    
    return data.status === SUBSCRIPTION_STATUS.TRIAL && 
           data.trialEndDate && 
           new Date(data.trialEndDate) > new Date();
  }

  /**
   * Vérifie si l'utilisateur est en période d'essai après abonnement
   * @returns {Boolean} Vrai si l'utilisateur est en période d'essai après abonnement
   */
  isInSubscriptionTrial() {
    const data = this.getSubscriptionData();
    if (!data) return false;
    
    return data.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL && 
           data.subscriptionTrialEndDate && 
           new Date(data.subscriptionTrialEndDate) > new Date();
  }

  /**
   * Vérifie si l'utilisateur a un abonnement actif
   * @returns {Boolean} Vrai si l'utilisateur a un abonnement actif
   */
  hasActiveSubscription() {
    const data = this.getSubscriptionData();
    if (!data) return false;
    
    return (data.status === SUBSCRIPTION_STATUS.ACTIVE || 
            this.isInInitialTrial() || 
            this.isInSubscriptionTrial()) && 
           data.endDate && 
           new Date(data.endDate) > new Date();
  }

  /**
   * Vérifie si l'utilisateur peut accéder au contenu premium
   * @returns {Boolean} Vrai si l'utilisateur peut accéder au contenu premium
   */
  canAccessPremiumContent() {
    return this.hasActiveSubscription() || this.isInInitialTrial() || this.isInSubscriptionTrial();
  }

  /**
   * Démarre la période d'essai initiale (7 jours)
   * @returns {Object} Données d'abonnement mises à jour
   */
  startInitialTrial() {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 jours d'essai
    
    const data = {
      status: SUBSCRIPTION_STATUS.TRIAL,
      startDate: now.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      endDate: trialEndDate.toISOString()
    };
    
    this.updateSubscriptionData(data);
    return this.getSubscriptionData();
  }

  /**
   * Souscrit à un abonnement et démarre la période d'essai d'un mois
   * @param {String} planId - ID du plan d'abonnement
   * @param {Object} paymentMethod - Méthode de paiement
   * @returns {Object} Données d'abonnement mises à jour
   */
  subscribe(planId, paymentMethod) {
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan d'abonnement invalide: ${planId}`);
    }
    
    const now = new Date();
    const subscriptionTrialEndDate = new Date(now);
    subscriptionTrialEndDate.setMonth(subscriptionTrialEndDate.getMonth() + 1); // 1 mois d'essai après abonnement
    
    const endDate = new Date(subscriptionTrialEndDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Abonnement d'un an par défaut
    
    const data = {
      status: SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL,
      plan: plan,
      startDate: now.toISOString(),
      subscriptionTrialEndDate: subscriptionTrialEndDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentMethod: paymentMethod,
      autoRenew: true
    };
    
    this.updateSubscriptionData(data);
    return this.getSubscriptionData();
  }

  /**
   * Annule l'abonnement (désactive le renouvellement automatique)
   * @returns {Object} Données d'abonnement mises à jour
   */
  cancelSubscription() {
    this.updateSubscriptionData({
      autoRenew: false
    });
    return this.getSubscriptionData();
  }

  /**
   * Réactive l'abonnement (active le renouvellement automatique)
   * @returns {Object} Données d'abonnement mises à jour
   */
  reactivateSubscription() {
    this.updateSubscriptionData({
      autoRenew: true
    });
    return this.getSubscriptionData();
  }

  /**
   * Change le plan d'abonnement
   * @param {String} newPlanId - ID du nouveau plan
   * @returns {Object} Données d'abonnement mises à jour
   */
  changePlan(newPlanId) {
    const newPlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === newPlanId);
    if (!newPlan) {
      throw new Error(`Plan d'abonnement invalide: ${newPlanId}`);
    }
    
    this.updateSubscriptionData({
      plan: newPlan
    });
    return this.getSubscriptionData();
  }

  /**
   * Simule le passage de la période d'essai à l'abonnement actif
   * @returns {Object} Données d'abonnement mises à jour
   */
  activateSubscription() {
    this.updateSubscriptionData({
      status: SUBSCRIPTION_STATUS.ACTIVE
    });
    return this.getSubscriptionData();
  }

  /**
   * Vérifie si l'abonnement a expiré et met à jour le statut
   * @returns {Boolean} Vrai si l'abonnement est expiré
   */
  checkSubscriptionExpiration() {
    const data = this.getSubscriptionData();
    if (!data) return true;
    
    const now = new Date();
    
    // Vérifier si la période d'essai initiale est terminée
    if (data.status === SUBSCRIPTION_STATUS.TRIAL && 
        data.trialEndDate && 
        new Date(data.trialEndDate) < now) {
      this.updateSubscriptionData({
        status: SUBSCRIPTION_STATUS.INACTIVE
      });
      return true;
    }
    
    // Vérifier si la période d'essai après abonnement est terminée
    if (data.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL && 
        data.subscriptionTrialEndDate && 
        new Date(data.subscriptionTrialEndDate) < now) {
      this.updateSubscriptionData({
        status: SUBSCRIPTION_STATUS.ACTIVE
      });
    }
    
    // Vérifier si l'abonnement est expiré
    if (data.endDate && new Date(data.endDate) < now) {
      if (data.autoRenew) {
        // Simuler le renouvellement
        const newEndDate = new Date(data.endDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        
        this.updateSubscriptionData({
          endDate: newEndDate.toISOString()
        });
        return false;
      } else {
        this.updateSubscriptionData({
          status: SUBSCRIPTION_STATUS.INACTIVE
        });
        return true;
      }
    }
    
    return false;
  }

  /**
   * Réinitialise les données d'abonnement (pour les tests)
   */
  resetSubscriptionData() {
    localStorage.removeItem('flodrama_subscription');
    this.initLocalStorage();
  }

  /**
   * Calcule le nombre de jours restants dans la période d'essai
   * @returns {Number} Nombre de jours restants
   */
  getRemainingTrialDays() {
    const data = this.getSubscriptionData();
    if (!data) return 0;
    
    const now = new Date();
    let endDate = null;
    
    if (this.isInInitialTrial()) {
      endDate = new Date(data.trialEndDate);
    } else if (this.isInSubscriptionTrial()) {
      endDate = new Date(data.subscriptionTrialEndDate);
    } else {
      return 0;
    }
    
    const diffTime = Math.abs(endDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

// Créer une instance unique du service
const subscriptionService = new SubscriptionService();

// Créer un contexte React pour le service d'abonnement
export const SubscriptionContext = createContext(null);

// Hook personnalisé pour utiliser le service d'abonnement
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription doit être utilisé à l\'intérieur d\'un SubscriptionProvider');
  }
  return context;
};

export default subscriptionService;
