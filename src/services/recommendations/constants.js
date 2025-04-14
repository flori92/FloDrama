/**
 * Constantes pour le système de recommandations FloDrama
 */

// Types de contenu
export const CONTENT_TYPES = {
  ALL: 'all',
  DRAMA: 'drama',
  MOVIE: 'movie',
  ANIME: 'anime',
  DOCUMENTARY: 'documentary',
  VARIETY: 'variety'
};

// Types de recommandations
export const RECOMMENDATION_TYPES = {
  PERSONALIZED: 'personalized',
  SIMILAR: 'similar',
  TRENDING: 'trending',
  CONTEXTUAL: 'contextual',
  CONTINUE_WATCHING: 'continue_watching',
  NEW_RELEASES: 'new_releases',
  DISCOVER: 'discover'
};

// Genres de contenu
export const CONTENT_GENRES = {
  ACTION: 'action',
  ROMANCE: 'romance',
  COMEDY: 'comedy',
  THRILLER: 'thriller',
  HISTORICAL: 'historical',
  FANTASY: 'fantasy',
  SCI_FI: 'sci_fi',
  SLICE_OF_LIFE: 'slice_of_life',
  MYSTERY: 'mystery',
  HORROR: 'horror',
  MEDICAL: 'medical',
  CRIME: 'crime',
  SCHOOL: 'school',
  SPORTS: 'sports',
  SUPERNATURAL: 'supernatural',
  PSYCHOLOGICAL: 'psychological'
};

// Pays d'origine
export const CONTENT_ORIGINS = {
  SOUTH_KOREA: 'kr',
  JAPAN: 'jp',
  CHINA: 'cn',
  TAIWAN: 'tw',
  THAILAND: 'th',
  PHILIPPINES: 'ph',
  VIETNAM: 'vn',
  INDONESIA: 'id',
  MALAYSIA: 'my',
  SINGAPORE: 'sg'
};

// Facteurs contextuels
export const CONTEXTUAL_FACTORS = {
  TIME_OF_DAY: 'time_of_day',
  DAY_OF_WEEK: 'day_of_week',
  SEASON: 'season',
  DEVICE_TYPE: 'device_type',
  SCREEN_SIZE: 'screen_size',
  CONNECTION_TYPE: 'connection_type',
  LOCATION: 'location',
  PREVIOUS_SESSION: 'previous_session'
};

// Poids par défaut pour les différents facteurs de recommandation
export const WEIGHTS = {
  // Poids des préférences utilisateur
  USER_PREFERENCES: 0.35,
  
  // Poids de l'historique de visionnage
  WATCH_HISTORY: 0.25,
  
  // Poids des facteurs contextuels
  CONTEXTUAL: 0.15,
  
  // Poids de la popularité
  POPULARITY: 0.10,
  
  // Poids de la nouveauté
  RECENCY: 0.10,
  
  // Poids de la diversité
  DIVERSITY: 0.05,
  
  // Poids pour les recommandations personnalisées
  PERSONALIZED: {
    SIMILAR: 0.40,
    TRENDING: 0.20,
    CONTEXTUAL: 0.25,
    GENRE: 0.15
  },
  
  // Poids pour les recommandations tendance
  TRENDING_PERSONALIZATION: 0.3,
  
  // Facteurs de score pour le calcul du score final
  SCORE_FACTORS: {
    SIMILARITY: 0.4,
    CONTEXT: 0.3,
    GENRE: 0.2,
    RECENCY: 0.1
  }
};

// Seuils pour les différentes métriques
export const THRESHOLDS = {
  // Seuil de similarité minimum pour considérer deux contenus comme similaires
  SIMILARITY: 0.65,
  
  // Nombre minimum de visionnages pour considérer un genre comme préféré
  GENRE_PREFERENCE: 3,
  
  // Pourcentage minimum d'un épisode regardé pour le considérer comme vu
  WATCHED_PERCENTAGE: 0.7,
  
  // Durée minimum (en secondes) pour considérer qu'un contenu a été regardé
  MINIMUM_WATCH_TIME: 300,
  
  // Nombre minimum d'interactions pour l'analyse comportementale
  MINIMUM_INTERACTIONS: 10,
  
  // Seuil de confiance pour les prédictions comportementales
  BEHAVIOR_CONFIDENCE: 0.6
};

// Paramètres de l'algorithme
export const ALGORITHM_PARAMS = {
  // Nombre maximum de recommandations par catégorie
  MAX_RECOMMENDATIONS_PER_CATEGORY: 20,
  
  // Facteur de décroissance temporelle pour les contenus plus anciens
  TIME_DECAY_FACTOR: 0.85,
  
  // Facteur de boost pour les contenus nouveaux
  NEW_CONTENT_BOOST: 1.2,
  
  // Période (en jours) pendant laquelle un contenu est considéré comme nouveau
  NEW_CONTENT_PERIOD_DAYS: 30,
  
  // Facteur de diversité pour éviter les recommandations trop similaires
  DIVERSITY_FACTOR: 0.8,
  
  // Niveaux de diversité
  DIVERSITY_LEVELS: {
    NONE: 0,
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.9
  },
  
  // Taille du cache pour les recommandations
  CACHE_SIZE: 100,
  
  // Durée de validité du cache (en minutes)
  CACHE_TTL: 30
};

// Périodes de temps pour l'analyse des tendances
export const TIME_PERIODS = {
  LAST_DAY: 'last_day',
  LAST_WEEK: 'last_week',
  LAST_MONTH: 'last_month',
  LAST_QUARTER: 'last_quarter'
};

// Événements utilisateur à suivre pour l'analyse comportementale
export const USER_EVENTS = {
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  COMPLETE: 'complete',
  ADD_TO_LIST: 'add_to_list',
  REMOVE_FROM_LIST: 'remove_from_list',
  RATE: 'rate',
  SHARE: 'share',
  DOWNLOAD: 'download',
  QUALITY_CHANGE: 'quality_change',
  SUBTITLE_CHANGE: 'subtitle_change',
  LANGUAGE_CHANGE: 'language_change'
};

// Paramètres pour les recommandations contextuelles
export const CONTEXTUAL_PARAMS = {
  // Moments de la journée
  TIME_OF_DAY: {
    MORNING: 'morning',
    FORENOON: 'forenoon',
    NOON: 'noon',
    AFTERNOON: 'afternoon',
    EVENING: 'evening',
    NIGHT: 'night'
  },
  
  // Jours de la semaine
  DAY_OF_WEEK: {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday'
  },
  
  // Saisons
  SEASON: {
    SPRING: 'spring',
    SUMMER: 'summer',
    AUTUMN: 'autumn',
    WINTER: 'winter'
  },
  
  // Types d'appareil
  DEVICE_TYPE: {
    DESKTOP: 'desktop',
    MOBILE: 'mobile',
    TABLET: 'tablet',
    TV: 'tv'
  },
  
  // Tailles d'écran
  SCREEN_SIZE: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large'
  },
  
  // Types de connexion
  CONNECTION_TYPE: {
    WIFI: 'wifi',
    CELLULAR: 'cellular',
    ETHERNET: 'ethernet',
    SLOW: 'slow',
    FAST: 'fast'
  }
};
