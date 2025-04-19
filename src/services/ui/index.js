// Index des services UI pour FloDrama
// Centralise l'accès aux services liés à l'interface utilisateur

import SearchService from './SearchService.js';
import NotificationService from './NotificationService.js';
import TranslationService from './TranslationService.js';
import InteractionService from './InteractionService.js';

/**
 * Initialise tous les services UI
 * @param {Object} dependencies - Services dont dépendent les services UI
 * @param {ApiService} dependencies.apiService - Service API
 * @param {StorageService} dependencies.storageService - Service de stockage
 * @param {ContentDataService} dependencies.contentDataService - Service de données de contenu
 * @param {Object} config - Configuration des services
 * @returns {Object} - Services UI initialisés
 */
export const initializeUIServices = (dependencies = {}, config = {}) => {
  const { apiService, storageService, contentDataService } = dependencies;
  
  // Configuration par défaut
  const defaultConfig = {
    useMockData: true
  };
  
  // Fusionner la configuration
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Initialiser les services
  const searchService = new SearchService(
    contentDataService,
    storageService,
    mergedConfig.search || {}
  );
  
  const notificationService = new NotificationService(
    storageService,
    mergedConfig.notification || {}
  );
  
  const translationService = new TranslationService(
    apiService,
    storageService,
    mergedConfig.translation || {}
  );
  
  const interactionService = new InteractionService(
    storageService,
    mergedConfig.interaction || {}
  );
  
  // Retourner les services initialisés
  return {
    searchService,
    notificationService,
    translationService,
    interactionService
  };
};

// Exporter les services individuellement
export {
  SearchService,
  NotificationService,
  TranslationService,
  InteractionService
};

// Exporter un objet par défaut avec tous les services
export default {
  SearchService,
  NotificationService,
  TranslationService,
  InteractionService,
  initializeUIServices
};
