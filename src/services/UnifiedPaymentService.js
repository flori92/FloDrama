/**
 * UnifiedPaymentService
 * 
 * Service unifié pour la gestion des paiements et abonnements sur FloDrama.
 * Intègre PayPal avec une interface cohérente et respecte l'identité visuelle FloDrama.
 * Version améliorée avec intégration backend et analyse des conversions.
 */

import { createLogger } from '../utils/LoggingUtils';
import { getApiEndpoint } from '../utils/ApiUtils';
import paymentApiService from './api/PaymentApiService';

// Configuration visuelle conforme à l'identité FloDrama
const FLODRAMA_VISUAL_IDENTITY = {
  colors: {
    primary: '#3b82f6',     // Bleu signature
    secondary: '#d946ef',   // Fuchsia accent
    background: '#121118',  // Fond principal
    backgroundSecondary: '#1A1926' // Fond secondaire
  },
  gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
  cornerRadius: '8px',
  transition: '0.3s ease'
};

// Configuration de l'environnement PayPal
const PAYPAL_CONFIG = {
  // En production, ces valeurs sont stockées dans des variables d'environnement
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
  SANDBOX_MODE: process.env.NODE_ENV !== 'production',
  CURRENCY: 'EUR'
};

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

// Types d'événements de conversion pour l'analyse
export const CONVERSION_EVENTS = {
  VIEW_SUBSCRIPTION_PAGE: 'view_subscription_page',
  SELECT_PLAN: 'select_plan',
  TOGGLE_BILLING_PERIOD: 'toggle_billing_period',
  START_TRIAL: 'start_trial',
  INITIATE_PAYMENT: 'initiate_payment',
  COMPLETE_PAYMENT: 'complete_payment',
  CANCEL_PAYMENT: 'cancel_payment',
  PAYMENT_ERROR: 'payment_error',
  CANCEL_SUBSCRIPTION: 'cancel_subscription',
  REACTIVATE_SUBSCRIPTION: 'reactivate_subscription',
  CHANGE_PLAN: 'change_plan'
};

// Types d'événements de comportement utilisateur pour l'analyse
export const BEHAVIOR_EVENTS = {
  HOVER_PLAN: 'hover_plan',
  READ_FEATURES: 'read_features',
  VIEW_FAQ: 'view_faq',
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
  EXIT_INTENT: 'exit_intent',
  RETURN_VISIT: 'return_visit'
};

class UnifiedPaymentService {
  constructor() {
    this.logger = typeof createLogger === 'function' 
      ? createLogger('UnifiedPaymentService') 
      : { info: console.log, error: console.error, warn: console.warn };
    
    this.apiEndpoint = typeof getApiEndpoint === 'function' 
      ? getApiEndpoint() 
      : 'https://api.flodrama.com';
    
    this.isInitialized = false;
    this.paypalInstance = null;
    this.currentUser = null;
    this.subscriptionCache = new Map();
    this.sessionStartTime = new Date();
    this.lastUserActivity = new Date();
    this.userBehaviorData = {
      pageViews: {},
      interactions: [],
      timeOnPage: {}
    };
    
    // Initialiser le stockage local si nécessaire
    this.initLocalStorage();
    
    // Configurer les écouteurs d'événements pour le suivi du comportement
    if (typeof window !== 'undefined') {
      this.setupBehaviorTracking();
    }
  }

  /**
   * Initialise le stockage local pour les données d'abonnement
   */
  initLocalStorage() {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('flodrama_subscription')) {
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
   * Configure le suivi du comportement utilisateur
   */
  setupBehaviorTracking() {
    // Suivi du temps passé sur la page
    window.addEventListener('beforeunload', () => {
      const currentPage = window.location.pathname;
      const timeSpent = (new Date() - this.lastUserActivity) / 1000; // en secondes
      
      if (timeSpent > 1 && currentPage.includes('/subscription')) {
        this.trackUserBehavior({
          event: BEHAVIOR_EVENTS.TIME_ON_PAGE,
          page: currentPage,
          timeSpent: timeSpent,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Suivi de la profondeur de défilement
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      this.lastUserActivity = new Date();
      
      if (window.location.pathname.includes('/subscription')) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        if (scrollPercent > maxScrollDepth) {
          maxScrollDepth = scrollPercent;
          
          // Enregistrer la profondeur de défilement par paliers de 25%
          if (maxScrollDepth >= 25 && maxScrollDepth < 50) {
            this.trackUserBehavior({
              event: BEHAVIOR_EVENTS.SCROLL_DEPTH,
              page: window.location.pathname,
              depth: 25,
              timestamp: new Date().toISOString()
            });
          } else if (maxScrollDepth >= 50 && maxScrollDepth < 75) {
            this.trackUserBehavior({
              event: BEHAVIOR_EVENTS.SCROLL_DEPTH,
              page: window.location.pathname,
              depth: 50,
              timestamp: new Date().toISOString()
            });
          } else if (maxScrollDepth >= 75 && maxScrollDepth < 100) {
            this.trackUserBehavior({
              event: BEHAVIOR_EVENTS.SCROLL_DEPTH,
              page: window.location.pathname,
              depth: 75,
              timestamp: new Date().toISOString()
            });
          } else if (maxScrollDepth >= 100) {
            this.trackUserBehavior({
              event: BEHAVIOR_EVENTS.SCROLL_DEPTH,
              page: window.location.pathname,
              depth: 100,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
    
    // Détection de l'intention de quitter
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 0 && window.location.pathname.includes('/subscription')) {
        this.trackUserBehavior({
          event: BEHAVIOR_EVENTS.EXIT_INTENT,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Initialise le service de paiement unifié
   * @param {Object} options - Options d'initialisation
   * @returns {Promise} Promesse résolue lorsque le service est initialisé
   */
  async initialize(options = {}) {
    if (this.isInitialized) return Promise.resolve();
    
    try {
      this.logger.info('Initialisation du service de paiement unifié');
      
      // Initialiser PayPal
      await this.initializePayPalSDK();
      
      // Synchroniser les données d'abonnement avec le serveur si possible
      try {
        await this.syncSubscriptionData();
      } catch (syncError) {
        this.logger.warn('Impossible de synchroniser les données d\'abonnement avec le serveur', syncError);
        // Continuer quand même, on utilisera les données locales
      }
      
      this.isInitialized = true;
      this.logger.info('Service de paiement unifié initialisé avec succès');
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du service de paiement', error);
      throw error;
    }
  }

  /**
   * Initialise le SDK PayPal
   * @returns {Promise} Promesse résolue lorsque le SDK est chargé
   */
  async initializePayPalSDK() {
    if (typeof window === 'undefined') return Promise.resolve(); // SSR check
    if (this.paypalInstance) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Charger le script PayPal
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&currency=${PAYPAL_CONFIG.CURRENCY}`;
      script.async = true;
      
      script.onload = () => {
        this.paypalInstance = window.paypal;
        this.logger.info('SDK PayPal chargé avec succès');
        resolve();
      };
      
      script.onerror = (error) => {
        this.logger.error('Impossible de charger le SDK PayPal', error);
        reject(new Error('Impossible de charger le SDK PayPal'));
      };
      
      document.body.appendChild(script);
    });
  }

  /**
   * Synchronise les données d'abonnement avec le serveur
   * @returns {Promise} Promesse résolue lorsque les données sont synchronisées
   */
  async syncSubscriptionData() {
    try {
      // Récupérer les données d'abonnement depuis le backend
      const serverData = await paymentApiService.getSubscriptionData();
      
      if (serverData) {
        // Mettre à jour le stockage local avec les données du serveur
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('flodrama_subscription', JSON.stringify(serverData));
        }
        
        // Mettre à jour le cache
        if (this.currentUser) {
          this.subscriptionCache.set(this.currentUser.id, serverData);
        }
        
        this.logger.info('Données d\'abonnement synchronisées avec succès depuis le serveur');
        return serverData;
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des données d\'abonnement avec le serveur', error);
      
      // En cas d'erreur, utiliser les données locales
      const localData = this.getLocalSubscriptionData();
      
      // Tenter de mettre à jour le serveur avec les données locales
      if (localData) {
        try {
          await paymentApiService.updateSubscriptionData(localData);
          this.logger.info('Serveur mis à jour avec les données locales');
        } catch (updateError) {
          this.logger.warn('Impossible de mettre à jour le serveur avec les données locales', updateError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Récupère les données d'abonnement locales
   * @returns {Object} Données d'abonnement locales
   */
  getLocalSubscriptionData() {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('flodrama_subscription');
      return data ? JSON.parse(data) : null;
    }
    
    return null;
  }

  /**
   * Récupère les données d'abonnement de l'utilisateur
   * @returns {Object} Données d'abonnement
   */
  getSubscriptionData() {
    // Vérifier d'abord le cache si l'utilisateur est connecté
    if (this.currentUser && this.subscriptionCache.has(this.currentUser.id)) {
      return this.subscriptionCache.get(this.currentUser.id);
    }
    
    // Sinon, utiliser le stockage local
    return this.getLocalSubscriptionData();
  }

  /**
   * Met à jour les données d'abonnement
   * @param {Object} data - Nouvelles données d'abonnement
   */
  async updateSubscriptionData(data) {
    const currentData = this.getSubscriptionData();
    const updatedData = {
      ...currentData,
      ...data
    };
    
    // Mettre à jour le stockage local
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flodrama_subscription', JSON.stringify(updatedData));
    }
    
    // Mettre à jour le cache
    if (this.currentUser) {
      this.subscriptionCache.set(this.currentUser.id, updatedData);
    }
    
    // Synchroniser avec le serveur
    try {
      await paymentApiService.updateSubscriptionData(updatedData);
      this.logger.info('Données d\'abonnement mises à jour avec succès sur le serveur');
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour des données d\'abonnement sur le serveur', error);
      // Continuer quand même, les données locales sont à jour
    }
    
    return updatedData;
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
  async startInitialTrial() {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 jours d'essai
    
    const data = {
      status: SUBSCRIPTION_STATUS.TRIAL,
      startDate: now.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      endDate: trialEndDate.toISOString()
    };
    
    // Enregistrer l'événement de conversion
    this.trackConversion({
      event: CONVERSION_EVENTS.START_TRIAL,
      timestamp: now.toISOString(),
      data: {
        trialEndDate: trialEndDate.toISOString()
      }
    });
    
    return await this.updateSubscriptionData(data);
  }

  /**
   * Souscrit à un abonnement et démarre la période d'essai d'un mois
   * @param {String} planId - ID du plan d'abonnement
   * @param {Object} paymentMethod - Méthode de paiement
   * @returns {Object} Données d'abonnement mises à jour
   */
  async subscribe(planId, paymentMethod) {
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan d'abonnement invalide: ${planId}`);
    }
    
    const now = new Date();
    const subscriptionTrialEndDate = new Date(now);
    subscriptionTrialEndDate.setMonth(subscriptionTrialEndDate.getMonth() + 1); // 1 mois d'essai après abonnement
    
    const endDate = new Date(subscriptionTrialEndDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Abonnement d'un an par défaut
    
    const subscriptionData = {
      status: SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL,
      plan: plan,
      startDate: now.toISOString(),
      subscriptionTrialEndDate: subscriptionTrialEndDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentMethod: paymentMethod,
      autoRenew: true
    };
    
    // Créer l'abonnement sur le serveur
    try {
      await paymentApiService.createSubscription({
        planId: planId,
        billingPeriod: paymentMethod.details.billingPeriod,
        paymentMethod: paymentMethod,
        startDate: now.toISOString(),
        trialEndDate: subscriptionTrialEndDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } catch (error) {
      this.logger.error('Erreur lors de la création de l\'abonnement sur le serveur', error);
      // Continuer quand même, les données locales seront mises à jour
    }
    
    // Enregistrer l'événement de conversion
    this.trackConversion({
      event: CONVERSION_EVENTS.COMPLETE_PAYMENT,
      timestamp: now.toISOString(),
      data: {
        planId: planId,
        billingPeriod: paymentMethod.details.billingPeriod,
        amount: paymentMethod.details.billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
        currency: PAYPAL_CONFIG.CURRENCY,
        paymentMethodType: paymentMethod.type
      }
    });
    
    return await this.updateSubscriptionData(subscriptionData);
  }

  /**
   * Annule l'abonnement (désactive le renouvellement automatique)
   * @returns {Object} Données d'abonnement mises à jour
   */
  async cancelSubscription() {
    const data = this.getSubscriptionData();
    
    // Annuler l'abonnement sur le serveur
    if (data && data.paymentMethod && data.paymentMethod.id) {
      try {
        await paymentApiService.cancelSubscription(data.paymentMethod.id);
      } catch (error) {
        this.logger.error('Erreur lors de l\'annulation de l\'abonnement sur le serveur', error);
        // Continuer quand même, les données locales seront mises à jour
      }
    }
    
    // Enregistrer l'événement de conversion
    this.trackConversion({
      event: CONVERSION_EVENTS.CANCEL_SUBSCRIPTION,
      timestamp: new Date().toISOString(),
      data: {
        planId: data?.plan?.id,
        reason: 'user_initiated'
      }
    });
    
    return await this.updateSubscriptionData({
      autoRenew: false
    });
  }

  /**
   * Réactive l'abonnement (active le renouvellement automatique)
   * @returns {Object} Données d'abonnement mises à jour
   */
  async reactivateSubscription() {
    const data = this.getSubscriptionData();
    
    // Enregistrer l'événement de conversion
    this.trackConversion({
      event: CONVERSION_EVENTS.REACTIVATE_SUBSCRIPTION,
      timestamp: new Date().toISOString(),
      data: {
        planId: data?.plan?.id
      }
    });
    
    return await this.updateSubscriptionData({
      autoRenew: true
    });
  }

  /**
   * Change le plan d'abonnement
   * @param {String} newPlanId - ID du nouveau plan
   * @returns {Object} Données d'abonnement mises à jour
   */
  async changePlan(newPlanId) {
    const newPlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === newPlanId);
    if (!newPlan) {
      throw new Error(`Plan d'abonnement invalide: ${newPlanId}`);
    }
    
    const oldData = this.getSubscriptionData();
    
    // Enregistrer l'événement de conversion
    this.trackConversion({
      event: CONVERSION_EVENTS.CHANGE_PLAN,
      timestamp: new Date().toISOString(),
      data: {
        oldPlanId: oldData?.plan?.id,
        newPlanId: newPlanId
      }
    });
    
    return await this.updateSubscriptionData({
      plan: newPlan
    });
  }

  /**
   * Simule le passage de la période d'essai à l'abonnement actif
   * @returns {Object} Données d'abonnement mises à jour
   */
  async activateSubscription() {
    return await this.updateSubscriptionData({
      status: SUBSCRIPTION_STATUS.ACTIVE
    });
  }

  /**
   * Vérifie si l'abonnement a expiré et met à jour le statut
   * @returns {Boolean} Vrai si l'abonnement est expiré
   */
  async checkSubscriptionExpiration() {
    const data = this.getSubscriptionData();
    if (!data) return true;
    
    const now = new Date();
    
    // Vérifier si la période d'essai initiale est terminée
    if (data.status === SUBSCRIPTION_STATUS.TRIAL && 
        data.trialEndDate && 
        new Date(data.trialEndDate) < now) {
      await this.updateSubscriptionData({
        status: SUBSCRIPTION_STATUS.INACTIVE
      });
      return true;
    }
    
    // Vérifier si la période d'essai après abonnement est terminée
    if (data.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL && 
        data.subscriptionTrialEndDate && 
        new Date(data.subscriptionTrialEndDate) < now) {
      await this.updateSubscriptionData({
        status: SUBSCRIPTION_STATUS.ACTIVE
      });
    }
    
    // Vérifier si l'abonnement est expiré
    if (data.endDate && new Date(data.endDate) < now) {
      if (data.autoRenew) {
        // Renouveler l'abonnement sur le serveur
        try {
          const newEndDate = new Date(data.endDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          
          await paymentApiService.updateSubscriptionData({
            ...data,
            endDate: newEndDate.toISOString()
          });
          
          await this.updateSubscriptionData({
            endDate: newEndDate.toISOString()
          });
          
          return false;
        } catch (error) {
          this.logger.error('Erreur lors du renouvellement de l\'abonnement sur le serveur', error);
          // Continuer avec le renouvellement local en cas d'échec
          const newEndDate = new Date(data.endDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          
          await this.updateSubscriptionData({
            endDate: newEndDate.toISOString()
          });
          
          return false;
        }
      } else {
        await this.updateSubscriptionData({
          status: SUBSCRIPTION_STATUS.INACTIVE
        });
        return true;
      }
    }
    
    return false;
  }

  /**
   * Crée un bouton PayPal pour l'abonnement avec le style FloDrama
   * @param {String} containerId - ID du conteneur pour le bouton
   * @param {String} planId - ID du plan d'abonnement
   * @param {String} billingPeriod - Période de facturation ('monthly' ou 'yearly')
   * @param {Function} onSuccess - Fonction appelée après un paiement réussi
   * @param {Function} onError - Fonction appelée en cas d'erreur
   * @param {Function} onCancel - Fonction appelée si l'utilisateur annule
   */
  async createSubscriptionButton(containerId, planId, billingPeriod, onSuccess, onError, onCancel) {
    try {
      await this.initializePayPalSDK();
      
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Plan d'abonnement invalide: ${planId}`);
      }
      
      const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      
      // Enregistrer l'événement de conversion pour l'initiation du paiement
      this.trackConversion({
        event: CONVERSION_EVENTS.INITIATE_PAYMENT,
        timestamp: new Date().toISOString(),
        data: {
          planId: planId,
          billingPeriod: billingPeriod,
          amount: price,
          currency: PAYPAL_CONFIG.CURRENCY
        }
      });
      
      // Créer un bouton PayPal avec le style FloDrama
      this.paypalInstance.Buttons({
        style: {
          shape: 'rect',
          color: 'blue',
          layout: 'vertical',
          label: 'subscribe',
          // Personnalisation avancée pour s'approcher de l'identité visuelle FloDrama
          // Note: PayPal a des limitations sur la personnalisation des boutons
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: price.toFixed(2),
                currency_code: PAYPAL_CONFIG.CURRENCY
              },
              description: `Abonnement FloDrama - ${plan.name} (${billingPeriod === 'yearly' ? 'Annuel' : 'Mensuel'})`
            }]
          });
        },
        onApprove: async (data, actions) => {
          try {
            const details = await actions.order.capture();
            
            // Vérifier le paiement sur le serveur
            try {
              await paymentApiService.verifyPayPalPayment({
                orderId: details.id,
                payerId: details.payer.payer_id,
                amount: price,
                currency: PAYPAL_CONFIG.CURRENCY,
                planId: planId,
                billingPeriod: billingPeriod
              });
            } catch (verifyError) {
              this.logger.error('Erreur lors de la vérification du paiement PayPal', verifyError);
              // Continuer quand même, le paiement a été capturé par PayPal
            }
            
            // Créer l'objet de méthode de paiement
            const paymentMethod = {
              id: details.id,
              type: 'paypal',
              email: details.payer.email_address,
              isDefault: true,
              details: {
                payerId: details.payer.payer_id,
                paymentId: details.id,
                billingPeriod: billingPeriod,
                timestamp: new Date().toISOString()
              }
            };
            
            // Enregistrer l'abonnement
            await this.subscribe(planId, paymentMethod);
            
            this.logger.info('Paiement PayPal réussi', details);
            
            if (onSuccess) {
              onSuccess(details);
            }
          } catch (error) {
            this.logger.error('Erreur lors de la capture du paiement', error);
            
            // Enregistrer l'événement de conversion pour l'erreur de paiement
            this.trackConversion({
              event: CONVERSION_EVENTS.PAYMENT_ERROR,
              timestamp: new Date().toISOString(),
              data: {
                planId: planId,
                billingPeriod: billingPeriod,
                error: error.message
              }
            });
            
            if (onError) {
              onError(error);
            }
          }
        },
        onError: (err) => {
          this.logger.error('Erreur PayPal:', err);
          
          // Enregistrer l'événement de conversion pour l'erreur de paiement
          this.trackConversion({
            event: CONVERSION_EVENTS.PAYMENT_ERROR,
            timestamp: new Date().toISOString(),
            data: {
              planId: planId,
              billingPeriod: billingPeriod,
              error: err.message || 'Erreur PayPal inconnue'
            }
          });
          
          if (onError) {
            onError(err);
          }
        },
        onCancel: (data) => {
          this.logger.info('Paiement PayPal annulé', data);
          
          // Enregistrer l'événement de conversion pour l'annulation du paiement
          this.trackConversion({
            event: CONVERSION_EVENTS.CANCEL_PAYMENT,
            timestamp: new Date().toISOString(),
            data: {
              planId: planId,
              billingPeriod: billingPeriod
            }
          });
          
          if (onCancel) {
            onCancel(data);
          }
        }
      }).render(`#${containerId}`);
      
      this.logger.info(`Bouton d'abonnement créé dans le conteneur #${containerId}`);
    } catch (error) {
      this.logger.error('Erreur lors de la création du bouton PayPal:', error);
      
      // Enregistrer l'événement de conversion pour l'erreur de paiement
      this.trackConversion({
        event: CONVERSION_EVENTS.PAYMENT_ERROR,
        timestamp: new Date().toISOString(),
        data: {
          planId: planId,
          billingPeriod: billingPeriod,
          error: error.message || 'Erreur lors de la création du bouton PayPal'
        }
      });
      
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Enregistre un événement de conversion
   * @param {Object} event - Événement à enregistrer
   */
  async trackConversion(event) {
    try {
      // En production, envoyer les données à l'API d'analyse
      await paymentApiService.trackConversion({
        ...event,
        userId: this.currentUser?.id || 'anonymous',
        sessionId: this.sessionId || 'unknown',
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        page: window.location.pathname
      });
      
      this.logger.info('Événement de conversion enregistré', event);
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'événement de conversion', error);
      // Ne pas propager l'erreur pour ne pas bloquer le flux utilisateur
    }
  }

  /**
   * Enregistre un événement de comportement utilisateur
   * @param {Object} event - Événement à enregistrer
   */
  async trackUserBehavior(event) {
    this.userBehaviorData.interactions.push(event);
    
    try {
      // En production, envoyer les données à l'API d'analyse
      await paymentApiService.trackUserBehavior({
        ...event,
        userId: this.currentUser?.id || 'anonymous',
        sessionId: this.sessionId || 'unknown',
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
      
      this.logger.info('Événement de comportement utilisateur enregistré', event);
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'événement de comportement', error);
      // Ne pas propager l'erreur pour ne pas bloquer le flux utilisateur
    }
  }
  
  /**
   * Récupère les métriques de conversion pour le tableau de bord
   * @param {Object} filters - Filtres pour les métriques (période, etc.)
   * @returns {Promise<Object>} Métriques de conversion
   */
  async getConversionMetrics(filters = {}) {
    try {
      return await paymentApiService.getConversionMetrics(filters);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des métriques de conversion', error);
      throw error;
    }
  }
  
  /**
   * Récupère les métriques de comportement utilisateur pour le tableau de bord
   * @param {Object} filters - Filtres pour les métriques (période, etc.)
   * @returns {Promise<Object>} Métriques de comportement
   */
  async getUserBehaviorMetrics(filters = {}) {
    try {
      return await paymentApiService.getUserBehaviorMetrics(filters);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des métriques de comportement', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique des paiements de l'utilisateur
   * @returns {Promise<Array>} Historique des paiements
   */
  async getPaymentHistory() {
    try {
      return await paymentApiService.getPaymentHistory();
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'historique des paiements', error);
      throw error;
    }
  }
}

// Créer et exporter l'instance unique
const unifiedPaymentService = new UnifiedPaymentService();
export default unifiedPaymentService;
