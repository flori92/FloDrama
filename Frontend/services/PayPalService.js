/**
 * PayPalService
 * 
 * Service d'intégration avec l'API PayPal pour la gestion des paiements
 * et des abonnements sur FloDrama.
 */

import subscriptionService, { SUBSCRIPTION_PLANS } from './SubscriptionService';

// Configuration de l'environnement PayPal
const PAYPAL_CONFIG = {
  // En production, ces valeurs seraient stockées dans des variables d'environnement
  CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
  SANDBOX_MODE: true, // true pour le développement, false pour la production
  CURRENCY: 'EUR'
};

class PayPalService {
  constructor() {
    this.isInitialized = false;
    this.paypalInstance = null;
  }

  /**
   * Initialise le SDK PayPal
   * @returns {Promise} Promesse résolue lorsque le SDK est chargé
   */
  async initializePayPalSDK() {
    if (this.isInitialized) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Charger le script PayPal
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&currency=${PAYPAL_CONFIG.CURRENCY}`;
      script.async = true;
      
      script.onload = () => {
        this.isInitialized = true;
        this.paypalInstance = window.paypal;
        resolve();
      };
      
      script.onerror = (error) => {
        reject(new Error('Impossible de charger le SDK PayPal'));
      };
      
      document.body.appendChild(script);
    });
  }

  /**
   * Crée un bouton PayPal pour l'abonnement
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
      
      this.paypalInstance.Buttons({
        style: {
          shape: 'rect',
          color: 'blue',
          layout: 'vertical',
          label: 'subscribe'
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
        onApprove: (data, actions) => {
          return actions.order.capture().then((details) => {
            // Simuler la création d'un abonnement
            const paymentMethod = {
              id: details.id,
              type: 'paypal',
              email: details.payer.email_address,
              isDefault: true
            };
            
            // Enregistrer l'abonnement
            subscriptionService.subscribe(planId, paymentMethod);
            
            if (onSuccess) {
              onSuccess(details);
            }
          });
        },
        onError: (err) => {
          console.error('Erreur PayPal:', err);
          if (onError) {
            onError(err);
          }
        },
        onCancel: (data) => {
          if (onCancel) {
            onCancel(data);
          }
        }
      }).render(`#${containerId}`);
    } catch (error) {
      console.error('Erreur lors de la création du bouton PayPal:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Simule l'annulation d'un abonnement PayPal
   * @param {String} subscriptionId - ID de l'abonnement à annuler
   * @returns {Promise} Promesse résolue lorsque l'abonnement est annulé
   */
  async cancelSubscription(subscriptionId) {
    // Dans une implémentation réelle, cela appellerait l'API PayPal
    // pour annuler l'abonnement
    return new Promise((resolve) => {
      setTimeout(() => {
        subscriptionService.cancelSubscription();
        resolve({ success: true });
      }, 1000);
    });
  }

  /**
   * Simule la mise à jour d'un abonnement PayPal
   * @param {String} subscriptionId - ID de l'abonnement à mettre à jour
   * @param {String} newPlanId - ID du nouveau plan
   * @returns {Promise} Promesse résolue lorsque l'abonnement est mis à jour
   */
  async updateSubscription(subscriptionId, newPlanId) {
    // Dans une implémentation réelle, cela appellerait l'API PayPal
    // pour mettre à jour l'abonnement
    return new Promise((resolve) => {
      setTimeout(() => {
        subscriptionService.changePlan(newPlanId);
        resolve({ success: true });
      }, 1000);
    });
  }
}

// Créer une instance unique du service
const paypalService = new PayPalService();

export default paypalService;
