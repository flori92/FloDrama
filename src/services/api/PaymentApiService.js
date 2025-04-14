/**
 * PaymentApiService
 * 
 * Service d'API pour la gestion des paiements et abonnements
 * Permet l'intégration avec le backend AWS pour stocker et gérer les données d'abonnement
 */

import axios from 'axios';
import { getApiEndpoint } from '../../utils/ApiUtils';
import { createLogger } from '../../utils/LoggingUtils';
import AuthService from '../AuthService';

class PaymentApiService {
  constructor() {
    this.logger = createLogger('PaymentApiService');
    this.baseUrl = getApiEndpoint();
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Intercepteur pour ajouter le token d'authentification à chaque requête
    this.axios.interceptors.request.use(
      async (config) => {
        try {
          const token = await AuthService.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        } catch (error) {
          this.logger.error('Erreur lors de la récupération du token', error);
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // La requête a été faite et le serveur a répondu avec un code d'erreur
          this.logger.error(`Erreur API ${error.response.status}:`, error.response.data);
          
          // Si le token est expiré, tenter de le rafraîchir
          if (error.response.status === 401) {
            AuthService.refreshToken()
              .then(() => {
                this.logger.info('Token rafraîchi avec succès');
              })
              .catch((refreshError) => {
                this.logger.error('Impossible de rafraîchir le token', refreshError);
                // Rediriger vers la page de connexion si nécessaire
                if (typeof window !== 'undefined') {
                  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }
              });
          }
        } else if (error.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          this.logger.error('Aucune réponse reçue du serveur:', error.request);
        } else {
          // Une erreur s'est produite lors de la configuration de la requête
          this.logger.error('Erreur de configuration de la requête:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupère les données d'abonnement de l'utilisateur depuis le backend
   * @returns {Promise<Object>} Données d'abonnement
   */
  async getSubscriptionData() {
    try {
      const response = await this.axios.get('/subscription');
      this.logger.info('Données d\'abonnement récupérées avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des données d\'abonnement', error);
      throw error;
    }
  }

  /**
   * Met à jour les données d'abonnement sur le backend
   * @param {Object} data - Nouvelles données d'abonnement
   * @returns {Promise<Object>} Données d'abonnement mises à jour
   */
  async updateSubscriptionData(data) {
    try {
      const response = await this.axios.put('/subscription', data);
      this.logger.info('Données d\'abonnement mises à jour avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour des données d\'abonnement', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel abonnement sur le backend
   * @param {Object} subscriptionData - Données de l'abonnement à créer
   * @returns {Promise<Object>} Données de l'abonnement créé
   */
  async createSubscription(subscriptionData) {
    try {
      const response = await this.axios.post('/subscription', subscriptionData);
      this.logger.info('Abonnement créé avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la création de l\'abonnement', error);
      throw error;
    }
  }

  /**
   * Annule un abonnement sur le backend
   * @param {String} subscriptionId - ID de l'abonnement à annuler
   * @returns {Promise<Object>} Résultat de l'annulation
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.axios.post(`/subscription/${subscriptionId}/cancel`);
      this.logger.info('Abonnement annulé avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de l\'annulation de l\'abonnement', error);
      throw error;
    }
  }

  /**
   * Vérifie la validité d'un paiement PayPal
   * @param {Object} paymentDetails - Détails du paiement PayPal
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyPayPalPayment(paymentDetails) {
    try {
      const response = await this.axios.post('/verify-paypal', paymentDetails);
      this.logger.info('Paiement PayPal vérifié avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du paiement PayPal', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des paiements de l'utilisateur
   * @returns {Promise<Array>} Historique des paiements
   */
  async getPaymentHistory() {
    try {
      const response = await this.axios.get('/payment-history');
      this.logger.info('Historique des paiements récupéré avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'historique des paiements', error);
      throw error;
    }
  }

  /**
   * Enregistre un événement de conversion pour l'analyse
   * @param {Object} conversionData - Données de l'événement de conversion
   * @returns {Promise<Object>} Résultat de l'enregistrement
   */
  async trackConversion(conversionData) {
    try {
      const response = await this.axios.post('/analytics/conversion', conversionData);
      this.logger.info('Événement de conversion enregistré avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'événement de conversion', error);
      // Ne pas propager l'erreur pour ne pas bloquer le flux utilisateur
      return { success: false, error: error.message };
    }
  }

  /**
   * Enregistre un événement de comportement utilisateur pour l'analyse
   * @param {Object} behaviorData - Données de l'événement de comportement
   * @returns {Promise<Object>} Résultat de l'enregistrement
   */
  async trackUserBehavior(behaviorData) {
    try {
      const response = await this.axios.post('/analytics/behavior', behaviorData);
      this.logger.info('Événement de comportement enregistré avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'événement de comportement', error);
      // Ne pas propager l'erreur pour ne pas bloquer le flux utilisateur
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les métriques de conversion pour le tableau de bord
   * @param {Object} filters - Filtres pour les métriques (période, etc.)
   * @returns {Promise<Object>} Métriques de conversion
   */
  async getConversionMetrics(filters = {}) {
    try {
      const response = await this.axios.get('/analytics/conversion-metrics', { params: filters });
      this.logger.info('Métriques de conversion récupérées avec succès');
      return response.data;
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
      const response = await this.axios.get('/analytics/behavior-metrics', { params: filters });
      this.logger.info('Métriques de comportement récupérées avec succès');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des métriques de comportement', error);
      throw error;
    }
  }
  
  /**
   * Vérifie la santé du service de paiement
   * @returns {Promise<Object>} État de santé du service
   */
  async checkHealth() {
    try {
      const response = await this.axios.get('/health');
      this.logger.info('Vérification de santé du service réussie');
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de la vérification de santé du service', error);
      throw error;
    }
  }
}

// Créer et exporter l'instance unique
const paymentApiService = new PaymentApiService();
export default paymentApiService;
