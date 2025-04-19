// Index des services utilisateur pour FloDrama
// Centralise l'accès aux services liés aux utilisateurs

import FavoritesService from './FavoritesService';
import RecommendationService from './RecommendationService';
import WatchHistoryService from './WatchHistoryService';
import UserDataService from './UserDataService';
import SubscriptionService from './SubscriptionService';
import WatchPartyService from './WatchPartyService';

/**
 * Initialise tous les services utilisateur
 * @param {Object} dependencies - Services dont dépendent les services utilisateur
 * @param {ApiService} dependencies.apiService - Service API
 * @param {StorageService} dependencies.storageService - Service de stockage
 * @param {Object} config - Configuration des services
 * @returns {Object} - Services utilisateur initialisés
 */
export const initializeUserServices = (dependencies = {}, config = {}) => {
  const { apiService, storageService } = dependencies;
  
  // Configuration par défaut
  const defaultConfig = {
    useMockData: true,
    syncInterval: 5000
  };
  
  // Fusionner la configuration
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Initialiser les services
  const userDataService = new UserDataService(
    apiService, 
    storageService, 
    mergedConfig.userData || {}
  );
  
  const favoritesService = new FavoritesService(
    apiService, 
    storageService, 
    mergedConfig.favorites || {}
  );
  
  const recommendationService = new RecommendationService(
    apiService, 
    storageService, 
    mergedConfig.recommendations || {}
  );
  
  const watchHistoryService = new WatchHistoryService(
    apiService, 
    storageService, 
    mergedConfig.watchHistory || {}
  );
  
  const subscriptionService = new SubscriptionService(
    apiService, 
    storageService, 
    mergedConfig.subscription || {}
  );
  
  const watchPartyService = new WatchPartyService(
    apiService, 
    storageService, 
    mergedConfig.watchParty || {}
  );
  
  // Retourner les services initialisés
  return {
    userDataService,
    favoritesService,
    recommendationService,
    watchHistoryService,
    subscriptionService,
    watchPartyService
  };
};

// Exporter les services individuellement
export {
  FavoritesService,
  RecommendationService,
  WatchHistoryService,
  UserDataService,
  SubscriptionService,
  WatchPartyService
};

// Exporter un objet par défaut avec tous les services
export default {
  FavoritesService,
  RecommendationService,
  WatchHistoryService,
  UserDataService,
  SubscriptionService,
  WatchPartyService,
  initializeUserServices
};
