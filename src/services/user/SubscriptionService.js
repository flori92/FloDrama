// Service de gestion des abonnements pour FloDrama
// Gère les plans d'abonnement, les paiements et les fonctionnalités associées

/**
 * Service de gestion des abonnements
 * @class SubscriptionService
 */
export class SubscriptionService {
  /**
   * Constructeur du service d'abonnement
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.subscriptionKey - Clé pour les données d'abonnement (défaut: 'subscription_data')
   * @param {boolean} config.useMockData - Utiliser des données fictives (défaut: true)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.subscriptionKey = config.subscriptionKey || 'subscription_data';
    this.useMockData = config.useMockData !== undefined ? config.useMockData : true;
    
    // Plans d'abonnement disponibles
    this.availablePlans = [
      {
        id: 'basic',
        name: 'Basique',
        price: 4.99,
        currency: 'EUR',
        billingPeriod: 'monthly',
        features: [
          'basic_streaming',
          'hd_quality',
          'limited_search',
          'basic_recommendations'
        ],
        description: 'Accès à tous les contenus en qualité HD'
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'EUR',
        billingPeriod: 'monthly',
        features: [
          'basic_streaming',
          '4k_quality',
          'advanced_search',
          'personalized_recommendations',
          'offline_viewing',
          'ad_free'
        ],
        description: 'Accès à tous les contenus en qualité 4K, sans publicité et avec téléchargement'
      },
      {
        id: 'family',
        name: 'Famille',
        price: 14.99,
        currency: 'EUR',
        billingPeriod: 'monthly',
        features: [
          'basic_streaming',
          '4k_quality',
          'advanced_search',
          'personalized_recommendations',
          'offline_viewing',
          'ad_free',
          'multiple_profiles',
          'parental_control'
        ],
        description: 'Tous les avantages Premium pour jusqu\'à 5 profils avec contrôle parental'
      }
    ];
    
    // Données d'abonnement de l'utilisateur
    this.subscriptionData = {
      userId: null,
      planId: null,
      status: 'inactive',
      startDate: null,
      expiryDate: null,
      autoRenew: false,
      paymentMethod: null,
      features: [],
      transactions: []
    };
    
    // Charger les données d'abonnement
    this._loadSubscriptionData();
    
    console.log('SubscriptionService initialisé');
  }
  
  /**
   * Charger les données d'abonnement
   * @private
   */
  async _loadSubscriptionData() {
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer les données depuis l'API
        const response = await this.apiService.get('/subscription');
        if (response && response.subscription) {
          this.subscriptionData = response.subscription;
        }
      } else if (this.storageService) {
        // Utiliser le service de stockage
        const data = await this.storageService.get(this.subscriptionKey);
        if (data) {
          this.subscriptionData = data;
        }
      } else {
        // Fallback sur localStorage
        const storedData = localStorage.getItem(`flodrama_${this.subscriptionKey}`);
        if (storedData) {
          this.subscriptionData = JSON.parse(storedData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'abonnement:', error);
    }
  }
  
  /**
   * Sauvegarder les données d'abonnement
   * @private
   */
  async _saveSubscriptionData() {
    try {
      if (this.apiService && !this.useMockData) {
        // Envoyer les données à l'API
        await this.apiService.put('/subscription', {
          subscription: this.subscriptionData
        });
      }
      
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.subscriptionKey, this.subscriptionData);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.subscriptionKey}`, 
          JSON.stringify(this.subscriptionData)
        );
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('subscription-updated', {
        detail: { subscription: this.subscriptionData }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données d\'abonnement:', error);
    }
  }
  
  /**
   * Obtenir tous les plans disponibles
   * @returns {Array} - Liste des plans
   */
  getAvailablePlans() {
    return [...this.availablePlans];
  }
  
  /**
   * Obtenir un plan par ID
   * @param {string} planId - ID du plan
   * @returns {Object|null} - Plan d'abonnement
   */
  getPlanById(planId) {
    if (!planId) return null;
    return this.availablePlans.find(plan => plan.id === planId) || null;
  }
  
  /**
   * Obtenir les données d'abonnement de l'utilisateur
   * @returns {Object} - Données d'abonnement
   */
  getUserSubscription() {
    return { ...this.subscriptionData };
  }
  
  /**
   * Obtenir le plan actuel de l'utilisateur
   * @returns {Object|null} - Plan d'abonnement
   */
  getCurrentPlan() {
    if (!this.subscriptionData.planId) return null;
    return this.getPlanById(this.subscriptionData.planId);
  }
  
  /**
   * Vérifier si l'utilisateur a un abonnement actif
   * @returns {boolean} - Vrai si l'abonnement est actif
   */
  hasActiveSubscription() {
    if (this.subscriptionData.status !== 'active') {
      return false;
    }
    
    if (this.subscriptionData.expiryDate) {
      const expiryDate = new Date(this.subscriptionData.expiryDate);
      if (expiryDate < new Date()) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Vérifier si l'utilisateur a accès à une fonctionnalité
   * @param {string} feature - Fonctionnalité
   * @returns {boolean} - Vrai si l'utilisateur a accès
   */
  hasFeatureAccess(feature) {
    if (!feature) return false;
    
    // Vérifier si l'utilisateur a un abonnement actif
    if (!this.hasActiveSubscription()) {
      // Certaines fonctionnalités peuvent être disponibles sans abonnement
      const freeFeatures = ['basic_streaming', 'limited_search'];
      return freeFeatures.includes(feature);
    }
    
    // Vérifier si la fonctionnalité est incluse dans l'abonnement
    return this.subscriptionData.features.includes(feature);
  }
  
  /**
   * Obtenir les fonctionnalités disponibles pour l'utilisateur
   * @returns {Array} - Liste des fonctionnalités
   */
  getAvailableFeatures() {
    if (!this.hasActiveSubscription()) {
      return ['basic_streaming', 'limited_search'];
    }
    
    return [...this.subscriptionData.features];
  }
  
  /**
   * Obtenir l'historique des transactions
   * @param {number} limit - Limite
   * @returns {Array} - Liste des transactions
   */
  getTransactionHistory(limit = 10) {
    return this.subscriptionData.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }
  
  /**
   * Souscrire à un plan
   * @param {string} planId - ID du plan
   * @param {Object} paymentDetails - Détails de paiement
   * @param {boolean} autoRenew - Renouvellement automatique
   * @returns {Promise<Object>} - Résultat de la souscription
   */
  async subscribeToPlan(planId, paymentDetails, autoRenew = true) {
    if (!planId) {
      throw new Error('ID de plan non fourni');
    }
    
    // Vérifier si le plan existe
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan '${planId}' non trouvé`);
    }
    
    try {
      let subscriptionResult;
      
      if (this.apiService && !this.useMockData) {
        // Appeler l'API pour souscrire
        subscriptionResult = await this.apiService.post('/subscription', {
          planId,
          paymentDetails,
          autoRenew
        });
      } else {
        // Simuler une souscription
        subscriptionResult = this._mockSubscription(planId, paymentDetails, autoRenew);
      }
      
      // Mettre à jour les données d'abonnement
      this.subscriptionData = {
        ...this.subscriptionData,
        ...subscriptionResult
      };
      
      // Sauvegarder les données
      await this._saveSubscriptionData();
      
      console.log(`Souscription au plan '${planId}' réussie`);
      return subscriptionResult;
    } catch (error) {
      console.error(`Erreur lors de la souscription au plan '${planId}':`, error);
      throw error;
    }
  }
  
  /**
   * Simuler une souscription (pour les tests)
   * @param {string} planId - ID du plan
   * @param {Object} paymentDetails - Détails de paiement
   * @param {boolean} autoRenew - Renouvellement automatique
   * @returns {Object} - Résultat de la souscription
   * @private
   */
  _mockSubscription(planId, paymentDetails, autoRenew) {
    const plan = this.getPlanById(planId);
    
    // Calculer la date d'expiration
    const now = new Date();
    const expiryDate = new Date(now);
    
    if (plan.billingPeriod === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.billingPeriod === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Créer une transaction
    const transaction = {
      id: `tr_${Date.now()}`,
      date: now.toISOString(),
      amount: plan.price,
      currency: plan.currency,
      description: `Abonnement ${plan.name}`,
      status: 'completed'
    };
    
    // Mettre à jour les transactions
    const transactions = [
      transaction,
      ...this.subscriptionData.transactions
    ];
    
    // Retourner les données d'abonnement
    return {
      userId: 'user_123', // Simuler un ID utilisateur
      planId,
      status: 'active',
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew,
      paymentMethod: paymentDetails.type || 'card',
      features: plan.features,
      transactions
    };
  }
  
  /**
   * Annuler un abonnement
   * @returns {Promise<boolean>} - Succès de l'annulation
   */
  async cancelSubscription() {
    if (!this.hasActiveSubscription()) {
      console.warn('Aucun abonnement actif à annuler');
      return false;
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Appeler l'API pour annuler
        await this.apiService.post('/subscription/cancel');
      }
      
      // Mettre à jour les données d'abonnement
      this.subscriptionData.autoRenew = false;
      
      // Sauvegarder les données
      await this._saveSubscriptionData();
      
      console.log('Abonnement annulé');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return false;
    }
  }
  
  /**
   * Renouveler un abonnement
   * @returns {Promise<boolean>} - Succès du renouvellement
   */
  async renewSubscription() {
    if (!this.subscriptionData.planId) {
      console.warn('Aucun plan d\'abonnement à renouveler');
      return false;
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Appeler l'API pour renouveler
        await this.apiService.post('/subscription/renew');
      } else {
        // Simuler un renouvellement
        const plan = this.getPlanById(this.subscriptionData.planId);
        
        // Calculer la nouvelle date d'expiration
        const expiryDate = new Date(this.subscriptionData.expiryDate || new Date());
        
        if (plan.billingPeriod === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (plan.billingPeriod === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        // Créer une transaction
        const transaction = {
          id: `tr_${Date.now()}`,
          date: new Date().toISOString(),
          amount: plan.price,
          currency: plan.currency,
          description: `Renouvellement ${plan.name}`,
          status: 'completed'
        };
        
        // Mettre à jour les données d'abonnement
        this.subscriptionData.status = 'active';
        this.subscriptionData.expiryDate = expiryDate.toISOString();
        this.subscriptionData.autoRenew = true;
        this.subscriptionData.transactions = [
          transaction,
          ...this.subscriptionData.transactions
        ];
      }
      
      // Sauvegarder les données
      await this._saveSubscriptionData();
      
      console.log('Abonnement renouvelé');
      return true;
    } catch (error) {
      console.error('Erreur lors du renouvellement de l\'abonnement:', error);
      return false;
    }
  }
  
  /**
   * Changer de plan d'abonnement
   * @param {string} newPlanId - ID du nouveau plan
   * @returns {Promise<boolean>} - Succès du changement
   */
  async changePlan(newPlanId) {
    if (!newPlanId) {
      console.error('ID de plan non fourni');
      return false;
    }
    
    // Vérifier si le plan existe
    const plan = this.getPlanById(newPlanId);
    if (!plan) {
      console.error(`Plan '${newPlanId}' non trouvé`);
      return false;
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Appeler l'API pour changer de plan
        await this.apiService.post('/subscription/change-plan', {
          planId: newPlanId
        });
      } else {
        // Simuler un changement de plan
        const now = new Date();
        
        // Calculer la nouvelle date d'expiration
        const expiryDate = new Date(now);
        
        if (plan.billingPeriod === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (plan.billingPeriod === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        // Créer une transaction
        const transaction = {
          id: `tr_${Date.now()}`,
          date: now.toISOString(),
          amount: plan.price,
          currency: plan.currency,
          description: `Changement de plan vers ${plan.name}`,
          status: 'completed'
        };
        
        // Mettre à jour les données d'abonnement
        this.subscriptionData.planId = newPlanId;
        this.subscriptionData.status = 'active';
        this.subscriptionData.startDate = now.toISOString();
        this.subscriptionData.expiryDate = expiryDate.toISOString();
        this.subscriptionData.features = plan.features;
        this.subscriptionData.transactions = [
          transaction,
          ...this.subscriptionData.transactions
        ];
      }
      
      // Sauvegarder les données
      await this._saveSubscriptionData();
      
      console.log(`Plan changé pour '${newPlanId}'`);
      return true;
    } catch (error) {
      console.error(`Erreur lors du changement de plan vers '${newPlanId}':`, error);
      return false;
    }
  }
  
  /**
   * Obtenir les jours restants avant expiration
   * @returns {number} - Nombre de jours
   */
  getDaysRemaining() {
    if (!this.hasActiveSubscription() || !this.subscriptionData.expiryDate) {
      return 0;
    }
    
    const expiryDate = new Date(this.subscriptionData.expiryDate);
    const now = new Date();
    
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
  
  /**
   * Obtenir le statut de l'abonnement
   * @returns {Object} - Statut de l'abonnement
   */
  getSubscriptionStatus() {
    const isActive = this.hasActiveSubscription();
    const daysRemaining = this.getDaysRemaining();
    const currentPlan = this.getCurrentPlan();
    
    return {
      isActive,
      daysRemaining,
      willAutoRenew: isActive && this.subscriptionData.autoRenew,
      planName: currentPlan ? currentPlan.name : null,
      expiryDate: this.subscriptionData.expiryDate
    };
  }
  
  /**
   * Réinitialiser les données d'abonnement
   * @returns {Promise<boolean>} - Succès de la réinitialisation
   */
  async resetSubscriptionData() {
    try {
      // Réinitialiser les données
      this.subscriptionData = {
        userId: null,
        planId: null,
        status: 'inactive',
        startDate: null,
        expiryDate: null,
        autoRenew: false,
        paymentMethod: null,
        features: [],
        transactions: []
      };
      
      // Sauvegarder les données
      await this._saveSubscriptionData();
      
      console.log('Données d\'abonnement réinitialisées');
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des données d\'abonnement:', error);
      return false;
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default SubscriptionService;
