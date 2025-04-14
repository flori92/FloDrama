/**
 * Point d'entrée centralisé pour tous les services de FloDrama
 * Ce fichier permet d'exporter tous les services de manière unifiée
 * et facilite la migration vers les nouveaux services unifiés.
 */

// Services unifiés
import unifiedScrapingService from './UnifiedScrapingService';
import unifiedImageService from './UnifiedImageService';
import unifiedPaymentService from './UnifiedPaymentService';

// Services existants à conserver
import AuthService from './AuthService';
import VideoPlaybackService from './VideoPlaybackService';
import WatchPartyService from './WatchPartyService';
import TranslationService from './TranslationService';
import IndexedDBService from './IndexedDBService';
import ContentDataService from './ContentDataService';
import SearchIndexService from './SearchIndexService';

// Nouveaux services avancés
import AdvancedRecommendationEngine from './AdvancedRecommendationEngine';
import EnhancedSubtitleSystem from './EnhancedSubtitleSystem';
import AdaptiveBandwidthManager from './AdaptiveBandwidthManager';
import MetadataEnrichmentService from './MetadataEnrichmentService';

// Alias pour la rétrocompatibilité
// Ces alias permettent d'utiliser les nouveaux services unifiés
// tout en maintenant la compatibilité avec le code existant
const ScrapingService = unifiedScrapingService;
const SmartScrapingService = unifiedScrapingService;
const AdaptiveScraperService = unifiedScrapingService;
const videoScraper = unifiedScrapingService;

// Alias pour les services de paiement
const PayPalService = unifiedPaymentService;
const SubscriptionService = unifiedPaymentService;

// Export de tous les services
export {
  // Services unifiés
  unifiedScrapingService,
  unifiedImageService,
  unifiedPaymentService,
  
  // Alias pour rétrocompatibilité
  ScrapingService,
  SmartScrapingService,
  AdaptiveScraperService,
  videoScraper,
  
  // Alias pour les services de paiement
  PayPalService,
  SubscriptionService,
  
  // Services existants à conserver
  AuthService,
  VideoPlaybackService,
  WatchPartyService,
  TranslationService,
  IndexedDBService,
  ContentDataService,
  SearchIndexService,
  
  // Nouveaux services avancés
  AdvancedRecommendationEngine,
  EnhancedSubtitleSystem,
  AdaptiveBandwidthManager,
  MetadataEnrichmentService,
};

// Export par défaut pour faciliter l'importation
export default {
  scraping: unifiedScrapingService,
  image: unifiedImageService,
  auth: AuthService,
  video: VideoPlaybackService,
  watchParty: WatchPartyService,
  translation: TranslationService,
  db: IndexedDBService,
  content: ContentDataService,
  search: SearchIndexService,
  recommendation: AdvancedRecommendationEngine,
  subtitle: EnhancedSubtitleSystem,
  bandwidth: AdaptiveBandwidthManager,
  metadata: MetadataEnrichmentService,
  payment: {
    paypal: unifiedPaymentService,
    subscription: unifiedPaymentService
  }
};
