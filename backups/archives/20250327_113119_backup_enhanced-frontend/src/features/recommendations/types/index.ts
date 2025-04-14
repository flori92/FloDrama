/**
 * Types pour le système de recommandations intelligentes de FloDrama
 */

export interface RecommendationConfig {
  /** Configuration du modèle ML */
  mlModel?: {
    /** Chemin vers le modèle pré-entraîné */
    path: string;
    /** Version du modèle */
    version: string;
    /** Configuration d'entraînement */
    training: {
      /** Taille du batch */
      batchSize: number;
      /** Taux d'apprentissage */
      learningRate: number;
      /** Époques */
      epochs: number;
    };
  };
  /** Intervalle de mise à jour en ms */
  updateInterval: number;
  /** Configuration du cache */
  cache: {
    /** Durée de vie du cache en ms */
    ttl: number;
    /** Taille maximale du cache */
    maxSize: number;
  };
  /** Seuils de qualité */
  thresholds: {
    /** Score minimum pour recommander */
    minScore: number;
    /** Confiance minimum */
    minConfidence: number;
  };
}

export type ContentCategory =
  | 'drama'
  | 'movie'
  | 'variety'
  | 'documentary'
  | 'animation';

export type ContentGenre =
  | 'romance'
  | 'action'
  | 'comedy'
  | 'thriller'
  | 'historical'
  | 'fantasy'
  | 'slice-of-life';

export interface UserPreferences {
  /** ID de l'utilisateur */
  id: string;
  /** Catégories préférées */
  categories: ContentCategory[];
  /** Langues préférées */
  languages: string[];
  /** Genres préférés */
  genres: ContentGenre[];
  /** Acteurs favoris */
  actors: string[];
  /** Réalisateurs favoris */
  directors: string[];
  /** Temps de visionnage */
  watchTime: {
    /** Temps total en secondes */
    total: number;
    /** Temps par catégorie */
    byCategory: Map<ContentCategory, number>;
    /** Temps par genre */
    byGenre: Map<ContentGenre, number>;
  };
  /** Préférences techniques */
  preferences: {
    /** Sous-titres activés */
    subtitles: boolean;
    /** Qualité vidéo préférée */
    quality: 'auto' | '480p' | '720p' | '1080p' | '4k';
    /** Lecture automatique */
    autoplay: boolean;
  };
  /** Date de création */
  created: Date;
  /** Dernière mise à jour */
  lastUpdated: Date;
}

export interface ContentProfile {
  /** ID du contenu */
  id: string;
  /** Catégories */
  categories: ContentCategory[];
  /** Genres */
  genres: ContentGenre[];
  /** Métadonnées */
  metadata: {
    /** Durée en minutes */
    duration: number;
    /** Année de sortie */
    year: number;
    /** Pays d'origine */
    country: string;
    /** Langue originale */
    language: string;
    /** Sous-titres disponibles */
    subtitles: string[];
  };
  /** Distribution */
  cast: {
    /** Acteurs */
    actors: string[];
    /** Réalisateurs */
    directors: string[];
  };
  /** Statistiques */
  stats: {
    /** Note moyenne */
    rating: number;
    /** Nombre de vues */
    views: number;
    /** Taux de complétion */
    completionRate: number;
  };
  /** Vecteurs de caractéristiques */
  features: {
    /** Vecteur de contenu */
    content: number[];
    /** Vecteur de style */
    style: number[];
    /** Vecteur d'audience */
    audience: number[];
  };
}

export interface WatchHistory {
  /** ID du contenu */
  contentId: string;
  /** Type d'événement */
  type: 'start' | 'complete' | 'abandon';
  /** Horodatage */
  timestamp: Date;
  /** Durée de visionnage */
  duration: number;
  /** Progression (0-1) */
  progress: number;
  /** Réactions pendant le visionnage */
  reactions: {
    /** Type de réaction */
    type: string;
    /** Horodatage */
    timestamp: Date;
    /** Position dans la vidéo */
    position: number;
  }[];
  /** Note donnée */
  rating: number | null;
}

export interface RecommendationResult {
  /** ID du contenu */
  contentId: string;
  /** Score de recommandation */
  score: number;
  /** Niveau de confiance */
  confidence: number;
  /** Raisons de la recommandation */
  reasons: string[];
  /** Métadonnées */
  metadata?: {
    /** Similarité avec d'autres contenus */
    similarity?: {
      /** ID du contenu similaire */
      contentId: string;
      /** Score de similarité */
      score: number;
    }[];
    /** Facteurs de recommandation */
    factors?: {
      /** Nom du facteur */
      name: string;
      /** Poids du facteur */
      weight: number;
    }[];
  };
}

export interface RecommendationEvent {
  /** Type d'événement */
  type: 
    | 'recommendationGenerated'
    | 'userPreferencesUpdated'
    | 'modelRetrained'
    | 'error';
  /** Données de l'événement */
  data: any;
  /** Horodatage */
  timestamp: Date;
  /** Métadonnées */
  metadata?: {
    /** ID de l'utilisateur */
    userId?: string;
    /** Informations de performance */
    performance?: {
      /** Temps de génération */
      generationTime: number;
      /** Score de précision */
      accuracy: number;
    };
  };
}

export interface RecommendationMetrics {
  /** Métriques globales */
  global: {
    /** Précision moyenne */
    accuracy: number;
    /** Taux de clic */
    clickThroughRate: number;
    /** Taux de conversion */
    conversionRate: number;
  };
  /** Métriques par catégorie */
  byCategory: Map<ContentCategory, {
    /** Précision */
    accuracy: number;
    /** Engagement */
    engagement: number;
  }>;
  /** Métriques d'engagement */
  engagement: {
    /** Temps moyen de visionnage */
    averageWatchTime: number;
    /** Taux de complétion */
    completionRate: number;
    /** Taux de rebond */
    bounceRate: number;
  };
}
