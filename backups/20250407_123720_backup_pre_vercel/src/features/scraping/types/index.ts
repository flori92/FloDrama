/**
 * Types pour le système de scraping intelligent de FloDrama
 */

export type ContentSource =
  | 'dramacool'
  | 'myasiantv'
  | 'dramanice'
  | 'kissasian'
  | 'viki'
  | 'wetv'
  | 'iqiyi'
  | 'kocowa'
  | 'viu';

export interface ScrapingConfig {
  /** Configuration du proxy et de la rotation des IPs */
  proxy: ProxyConfig;
  /** Configuration de la catégorisation du contenu */
  categorization: CategorizationConfig;
  /** Intervalle de mise à jour de la base de données (en minutes) */
  updateInterval: number;
  /** Timeout pour les requêtes (en ms) */
  timeout: number;
  /** Nombre maximum de tentatives par requête */
  maxRetries: number;
}

export interface ProxyConfig {
  /** Liste des proxies disponibles */
  proxies: string[];
  /** Temps de rotation des proxies (en secondes) */
  rotationInterval: number;
  /** Pays autorisés pour les proxies */
  allowedCountries: string[];
  /** Configuration du User-Agent */
  userAgent: UserAgentConfig;
}

export interface UserAgentConfig {
  /** Rotation automatique des User-Agents */
  autoRotate: boolean;
  /** Liste des User-Agents personnalisés */
  customUserAgents?: string[];
  /** Intervalle de rotation (en secondes) */
  rotationInterval?: number;
}

export interface CategorizationConfig {
  /** Seuil minimum de confiance pour la catégorisation */
  confidenceThreshold: number;
  /** Activer l'apprentissage automatique */
  enableLearning: boolean;
  /** Langues supportées */
  languages: string[];
}

export interface ScrapedContent {
  /** Identifiant unique du contenu */
  id: string;
  /** Titre du contenu */
  title: string;
  /** Titre original (non traduit) */
  originalTitle?: string;
  /** Année de sortie */
  year?: number;
  /** Source du contenu */
  source: ContentSource;
  /** Synopsis */
  synopsis?: string;
  /** URL de l'image */
  posterUrl?: string;
  /** Nombre d'épisodes disponibles */
  episodesAvailable?: number;
  /** Note moyenne */
  rating?: number;
  /** Genres */
  genres?: string[];
  /** Pays d'origine */
  country?: string;
  /** Status (en cours, terminé, etc.) */
  status?: 'ongoing' | 'completed' | 'upcoming';
  /** Date de dernière mise à jour */
  lastUpdate?: Date;
}

export interface ContentDetails extends ScrapedContent {
  /** Liste des épisodes */
  episodes: Episode[];
  /** Casting */
  cast: CastMember[];
  /** Équipe de production */
  crew: CrewMember[];
  /** Informations supplémentaires */
  additionalInfo: {
    duration?: number;
    broadcastDay?: string;
    network?: string;
    totalEpisodes?: number;
    relatedContent?: ScrapedContent[];
  };
}

export interface Episode {
  /** Identifiant unique de l'épisode */
  id: string;
  /** Numéro de l'épisode */
  number: number;
  /** Titre de l'épisode */
  title?: string;
  /** Durée en minutes */
  duration?: number;
  /** Date de diffusion */
  airDate?: Date;
  /** Synopsis de l'épisode */
  synopsis?: string;
  /** Miniature de l'épisode */
  thumbnail?: string;
  /** Liens de streaming disponibles */
  streamingLinks?: StreamingLink[];
}

export interface StreamingLink {
  /** Identifiant unique du lien */
  id: string;
  /** URL du stream */
  url: string;
  /** Qualité vidéo */
  quality: '360p' | '480p' | '720p' | '1080p' | '4k';
  /** Type de stream */
  type: 'hls' | 'dash' | 'mp4';
  /** Sous-titres disponibles */
  subtitles?: Subtitle[];
  /** Serveur hébergeant le stream */
  server: string;
  /** Nécessite un proxy */
  requiresProxy: boolean;
}

export interface Subtitle {
  /** Code de la langue */
  language: string;
  /** URL du fichier de sous-titres */
  url: string;
  /** Format des sous-titres */
  format: 'srt' | 'vtt' | 'ass';
}

export interface CastMember {
  /** Nom de l'acteur */
  name: string;
  /** Rôle joué */
  role: string;
  /** URL de la photo */
  photoUrl?: string;
}

export interface CrewMember {
  /** Nom du membre de l'équipe */
  name: string;
  /** Rôle dans la production */
  role: 'director' | 'writer' | 'producer' | 'other';
  /** Détails supplémentaires */
  details?: string;
}

export interface SearchOptions {
  /** Filtrer par année */
  year?: number;
  /** Filtrer par pays */
  country?: string;
  /** Filtrer par statut */
  status?: 'ongoing' | 'completed' | 'upcoming';
  /** Filtrer par genre */
  genre?: string;
  /** Trier par */
  sortBy?: 'relevance' | 'date' | 'rating';
  /** Limite de résultats */
  limit?: number;
  /** Page de résultats */
  page?: number;
}
