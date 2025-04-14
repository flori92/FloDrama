// Configuration de l'API
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Configuration du système de recommandation
export const RECOMMANDATION_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes en millisecondes
  MAX_RECOMMANDATIONS: 50,
  MIN_SCORE_THRESHOLD: 0.5,
  GENRES_WEIGHT: 2,
  POPULARITE_WEIGHT: 0.5,
  FRAICHEUR_WEIGHT: 1,
  LANGUE_WEIGHT: 1
};

// Configuration des médias
export const MEDIA_CONFIG = {
  FORMATS_SUPPORTES: ['mp4', 'webm', 'hls'],
  QUALITES_VIDEO: ['1080p', '720p', '480p', '360p'],
  LANGUES_DISPONIBLES: ['fr', 'en', 'es', 'de', 'it'],
  BUFFER_SIZE: 30 // secondes
};

// Configuration de l'interface utilisateur
export const UI_CONFIG = {
  THEME: {
    PRIMAIRE: '#ff4081',
    SECONDAIRE: '#3f51b5',
    FOND: '#1a1a1a',
    TEXTE: '#ffffff'
  },
  ANIMATIONS: {
    DUREE_TRANSITION: 300, // millisecondes
    DUREE_FADE: 200
  }
};
