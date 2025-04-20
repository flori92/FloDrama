/**
 * Services de scraping FloDrama
 * Exporte les services de scraping pour l'application Next.js
 */

import smartScrapingService from './SmartScrapingService';

// Types pour les contenus
export interface ContentItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: 'drama' | 'movie' | 'anime' | 'bollywood' | 'kshow';
  year?: number;
  country?: string;
  genres?: string[];
  synopsis?: string;
  rating?: number;
  episodes?: number;
  status?: string;
  imageUrl?: string;
  backdropUrl?: string;
  videoUrl?: string;
  releaseDate?: string;
  duration?: string;
  cast?: string[];
  isNew?: boolean;
  isHD?: boolean;
  popularity?: number;
  source?: string;
}

export interface ContentData {
  lastUpdate: string;
  contentIds: string[];
  items: ContentItem[];
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  fuzzy?: boolean;
}

export interface CategoryOptions {
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'popular' | 'rating';
  filter?: Record<string, string>;
}

// Fonctions d'accès aux données
export async function getTrendingContent(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  
  // Récupérer les contenus des 2 dernières années, triés par date de sortie
  const currentYear = new Date().getFullYear();
  const allItems: ContentItem[] = smartScrapingService.contentCache?.items || [];
  
  return allItems
    .filter((item: ContentItem) => item.year && item.year >= currentYear - 2)
    .sort((a: ContentItem, b: ContentItem) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
      const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);
}

export async function getRecommendedContent(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  
  const allItems: ContentItem[] = smartScrapingService.contentCache?.items || [];
  
  return allItems
    .filter((item: ContentItem) => item.rating && item.rating >= 7.5)
    .sort((a: ContentItem, b: ContentItem) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

export async function getDramas(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  return smartScrapingService.getCategoryItems('drama', { limit });
}

export async function getMovies(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  return smartScrapingService.getCategoryItems('movie', { limit });
}

export async function getAnimes(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  return smartScrapingService.getCategoryItems('anime', { limit });
}

export async function getBollywoodContent(limit = 12): Promise<ContentItem[]> {
  await ensureInitialized();
  return smartScrapingService.getCategoryItems('bollywood', { limit });
}

export async function searchContent(query: string, options?: SearchOptions): Promise<ContentItem[]> {
  await ensureInitialized();
  return smartScrapingService.searchContent(query, options);
}

export async function getContentDetails(contentId: string): Promise<ContentItem | null> {
  await ensureInitialized();
  return smartScrapingService.getContentDetails(contentId) as Promise<ContentItem | null>;
}

export function getCategoryItems(category: string, options: SearchOptions = {}): ContentItem[] {
  return smartScrapingService.getCategoryItems(category, options) as ContentItem[];
}

// Fonction utilitaire pour s'assurer que le service est initialisé
async function ensureInitialized(): Promise<void> {
  if (!smartScrapingService.isInitialized) {
    await smartScrapingService.initialize();
  }
}

export default {
  smartScrapingService,
  getTrendingContent,
  getRecommendedContent,
  getDramas,
  getMovies,
  getAnimes,
  getBollywoodContent,
  searchContent,
  getContentDetails,
  getCategoryItems
};
