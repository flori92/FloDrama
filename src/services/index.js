// Point d'entrée centralisé pour tous les services FloDrama
// Permet d'importer facilement tous les services depuis un seul fichier

// Importation des services core
import ApiService from './core/ApiService.js';
import StorageService from './core/StorageService.js';
import AuthService from './core/AuthService.js';
import ScrapingService from './core/ScrapingService.js';

// Importation des services content
import ContentDataService from './content/ContentDataService.js';
import ContentCategorizer from './content/ContentCategorizer.js';
import VideoService from './content/VideoService.js';
import ImageService from './content/ImageService.js';

// Importation des services user
import { 
  FavoritesService, 
  RecommendationService, 
  WatchHistoryService,
  UserDataService,
  SubscriptionService,
  WatchPartyService,
  initializeUserServices
} from './user/index.js';

// Importation des services UI
import {
  SearchService,
  NotificationService,
  TranslationService,
  InteractionService,
  initializeUIServices
} from './ui/index.js';

// Importation des services existants (à migrer progressivement)
import { ImageIntegrationService } from './ImageIntegrationService.js';

// Fonction d'initialisation de tous les services
export function initializeServices(config = {}) {
  // Configuration par défaut
  const defaultConfig = {
    useMockData: true,
    storage: {
      prefix: 'flodrama_',
      defaultExpiry: 86400 // 24 heures
    },
    api: {
      baseUrl: 'https://api.flodrama.com',
      timeout: 10000,
      retryAttempts: 3
    }
  };
  
  // Fusionner la configuration
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Initialiser les services core
  const storageService = new StorageService(mergedConfig.storage);
  const apiService = new ApiService(mergedConfig.api);
  const authService = new AuthService(apiService, storageService, mergedConfig.auth);
  const scrapingService = new ScrapingService(apiService, mergedConfig.scraping);
  
  // Initialiser les services content
  const contentDataService = new ContentDataService(apiService, storageService, mergedConfig.content);
  const contentCategorizer = new ContentCategorizer(mergedConfig.categorizer);
  const videoService = new VideoService(apiService, storageService, mergedConfig.video);
  const imageService = new ImageService(apiService, storageService, mergedConfig.image);
  
  // Initialiser les services user
  const userServices = initializeUserServices(
    { apiService, storageService },
    mergedConfig.user
  );
  
  // Initialiser les services UI
  const uiServices = initializeUIServices(
    { apiService, storageService, contentDataService },
    mergedConfig.ui
  );
  
  // Initialiser les services existants (à migrer progressivement)
  const imageIntegrationService = new ImageIntegrationService();
  
  // Retourner tous les services initialisés
  return {
    // Services core
    apiService,
    storageService,
    authService,
    scrapingService,
    
    // Services content
    contentDataService,
    contentCategorizer,
    videoService,
    imageService,
    
    // Services user
    ...userServices,
    
    // Services UI
    ...uiServices,
    
    // Services existants (à migrer progressivement)
    imageIntegrationService
  };
}

// Exporter tous les services individuellement
export {
  // Services core
  ApiService,
  StorageService,
  AuthService,
  ScrapingService,
  
  // Services content
  ContentDataService,
  ContentCategorizer,
  VideoService,
  ImageService,
  
  // Services user
  FavoritesService,
  RecommendationService,
  WatchHistoryService,
  UserDataService,
  SubscriptionService,
  WatchPartyService,
  
  // Services UI
  SearchService,
  NotificationService,
  TranslationService,
  InteractionService,
  
  // Services existants (à migrer progressivement)
  ImageIntegrationService
};

/**
 * Structure implémentée des services
 * 
 * /services/
 *   /core/                 # Services fondamentaux
 *     ApiService.js        # Communication avec les API
 *     StorageService.js    # Gestion du stockage (local, session, IndexedDB)
 *     AuthService.js       # Authentification et gestion des sessions
 *     ScrapingService.js   # Scraping intelligent avec stratégies adaptatives
 *     
 *   /content/              # Services liés au contenu
 *     ContentDataService.js # Gestion des données de contenu
 *     ContentCategorizer.js # Catégorisation avancée du contenu
 *     VideoService.js      # Gestion des vidéos
 *     ImageService.js      # Gestion des images
 *     
 *   /user/                 # Services liés à l'utilisateur
 *     FavoritesService.js  # Gestion des favoris
 *     RecommendationService.js # Recommandations personnalisées
 *     WatchHistoryService.js # Historique de visionnage
 *     UserDataService.js   # Données utilisateur
 *     SubscriptionService.js # Gestion des abonnements
 *     WatchPartyService.js # Visionnage en groupe
 *     
 *   /ui/                   # Services liés à l'interface
 *     SearchService.js     # Recherche avancée
 *     NotificationService.js # Notifications
 *     TranslationService.js # Traduction et internationalisation
 *     InteractionService.js # Interactions utilisateur et comportement humain
 *     
 *   /index.js              # Ce fichier (point d'entrée centralisé)
 */
