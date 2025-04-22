/**
 * Types communs pour les composants UI de FloDrama
 * Ce fichier centralise les définitions de types pour assurer la cohérence entre les composants
 */

// Type pour les éléments de contenu (films, séries, etc.)
export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  year: number;
  rating: number;
  duration: string;
  category?: string;
  tags?: string[];
}

// Type pour le contenu de la bannière héro
export interface HeroContent {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  videoUrl?: string;
}

// Type pour les catégories
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  sources: Source[];
}

// Type pour les sources de contenu dans les catégories
export interface Source {
  id: string;
  name: string;
  count: number;
  image: string;
  url: string;
}

// Type pour les éléments de statistiques
export interface StatItem {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

// Type pour les recommandations personnalisées
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  source?: string;
  score: number;
  popularity: number;
  releaseDate: string;
}
