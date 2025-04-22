/**
 * Module de gestion des données pour FloDrama
 * Ce module permet de charger les données depuis différentes sources :
 * - En développement : données locales (fichiers JSON statiques)
 * - En production : données depuis S3/CloudFront
 */

import { BASE_DATA_URL } from '../config/data';

// Types pour les données
export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  videoUrl?: string;
  score?: number;
  popularity?: number;
  releaseDate?: string;
  addedDate?: string;
  category: string;
  source: string;
  tags: string[];
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sources: {
    id: string;
    name: string;
    count: number;
    image: string;
  }[];
}

export interface StatItem {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export interface Metadata {
  lastUpdate: string;
  contentCounts: {
    total: number;
    popular: number;
    featured: number;
    topRated: number;
    recently: number;
  };
  trends?: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    popularGenres: {
      name: string;
      percentage: number;
    }[];
    popularSources: {
      name: string;
      percentage: number;
    }[];
  };
  userStats?: {
    totalUsers: number;
    activeUsers: number;
    averageWatchTime: number;
    completionRate: number;
  };
  platformPerformance?: {
    averageLoadTime: number;
    cacheHitRate: number;
    cdnPerformance: number;
    apiResponseTime: number;
  };
}

// Fonction pour charger les données depuis la source appropriée
export async function loadData<T>(dataType: string): Promise<T> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  try {
    // En développement, essayer de charger les données locales d'abord
    if (isDevelopment) {
      try {
        // Importer dynamiquement les données locales
        const localData = await import(`./local/${dataType}.json`);
        console.log(`Données ${dataType} chargées depuis les fichiers locaux`);
        return localData.default as T;
      } catch (e) {
        console.warn(`Pas de données locales pour ${dataType}, utilisation du CDN`);
      }
    }
    
    // Charger depuis le CDN/S3
    const response = await fetch(`${BASE_DATA_URL}${dataType}.json`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des données ${dataType}: ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Erreur lors du chargement des données ${dataType}:`, error);
    
    // Fallback sur les données statiques intégrées
    try {
      const fallbackData = await import(`./static/${dataType}.json`);
      console.warn(`Utilisation des données statiques de secours pour ${dataType}`);
      return fallbackData.default as T;
    } catch (e) {
      console.error(`Pas de données de secours pour ${dataType}`);
      return [] as unknown as T;
    }
  }
}

// Fonctions spécifiques pour charger chaque type de données
export async function loadFeaturedContent(): Promise<ContentItem[]> {
  return loadData<ContentItem[]>('featured');
}

export async function loadPopularContent(): Promise<ContentItem[]> {
  return loadData<ContentItem[]>('popular');
}

export async function loadRecentContent(): Promise<ContentItem[]> {
  return loadData<ContentItem[]>('recently');
}

export async function loadTopRatedContent(): Promise<ContentItem[]> {
  return loadData<ContentItem[]>('topRated');
}

export async function loadCategories(): Promise<Category[]> {
  return loadData<Category[]>('categories');
}

export async function loadMetadata(): Promise<Metadata> {
  return loadData<Metadata>('metadata');
}
