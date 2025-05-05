/**
 * Service API pour FloDrama
 * 
 * Ce fichier contient les fonctions pour interagir avec l'API backend
 * de FloDrama hébergée sur Cloudflare Workers.
 */

// Constantes pour l'API
const API_BASE_URL = process.env.VITE_API_URL || 'https://flodrama-api.florifavi.workers.dev';
const CDN_BASE_URL = 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com';

// Types de contenu
export type ContentType = 'film' | 'drama' | 'anime' | 'bollywood';

// Interface pour les items de contenu
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  year?: number;
  created_at?: string;
  updated_at?: string;
  // Propriétés additionnelles pour la prévisualisation et les catégories
  trailerUrl?: string;
  category?: string;
  genres?: string[];
}

// Fonction fetch avec gestion d'erreur
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}

// Fonctions API pour les différentes catégories
export async function fetchDramas(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/dramas?${params}`);
}

export async function fetchFilms(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/films?${params}`);
}

export async function fetchAnimes(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/animes?${params}`);
}

export async function fetchBollywood(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/bollywood?${params}`);
}

// Fonction pour récupérer un contenu spécifique
export async function fetchContentById(id: string): Promise<ContentItem> {
  return fetchWithErrorHandling(`${API_BASE_URL}/content/${id}`);
}

// Fonction pour récupérer le contenu par catégorie
export async function fetchContentByCategory(category: ContentType, page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  switch (category) {
    case 'drama':
      return fetchDramas(page, limit, year);
    case 'film':
      return fetchFilms(page, limit, year);
    case 'anime':
      return fetchAnimes(page, limit, year);
    case 'bollywood':
      return fetchBollywood(page, limit, year);
    default:
      throw new Error(`Catégorie non supportée: ${category}`);
  }
}

// Fonction pour récupérer l'URL de streaming
export function getStreamUrl(videoId: string) {
  return `${CDN_BASE_URL}/${videoId}/manifest/video.m3u8`;
}

// Fonction pour récupérer l'URL de la miniature
export function getThumbnailUrl(videoId: string, time = '0s') {
  return `${CDN_BASE_URL}/${videoId}/thumbnails/thumbnail.jpg?time=${time}`;
}

// Fonction pour vérifier l'état de l'API
export async function checkApiStatus(): Promise<{ status: string; version: string; environment: string }> {
  return fetchWithErrorHandling(`${API_BASE_URL}/`);
}
