/**
 * Service de recommandations pour FloDrama
 * 
 * Ce service gère les recommandations personnalisées basées sur les préférences
 * utilisateur et l'historique de visionnage, adapté pour l'architecture Cloudflare.
 */

import { ContentItem, ContentType } from './apiService';

// Base URL de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flodrama-api.florifavi.workers.dev';

// Interface pour les préférences utilisateur
export interface UserPreferences {
  favoriteGenres: string[];
  watchHistory: string[];
  favorites: string[];
  ratings: Record<string, number>;
  lastWatched?: {
    id: string;
    type: ContentType;
    timestamp: number;
  };
}

// Interface pour les paramètres de recommandation
export interface RecommendationParams {
  limit?: number;
  includeGenres?: string[];
  excludeGenres?: string[];
  minRating?: number;
  maxRating?: number;
  releaseYearStart?: number;
  releaseYearEnd?: number;
}

/**
 * Récupère les recommandations personnalisées pour un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param params Paramètres optionnels pour filtrer les recommandations
 * @returns Liste des contenus recommandés
 */
export async function getPersonalizedRecommendations(
  userId: string, 
  params: RecommendationParams = {}
): Promise<ContentItem[]> {
  try {
    // Construction des paramètres de requête
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.includeGenres?.length) queryParams.append('includeGenres', params.includeGenres.join(','));
    if (params.excludeGenres?.length) queryParams.append('excludeGenres', params.excludeGenres.join(','));
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
    if (params.releaseYearStart) queryParams.append('yearStart', params.releaseYearStart.toString());
    if (params.releaseYearEnd) queryParams.append('yearEnd', params.releaseYearEnd.toString());
    
    // Appel à l'API Cloudflare Workers
    const response = await fetch(`${API_BASE_URL}/recommendations?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    throw error;
  }
}

/**
 * Met à jour les préférences utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param preferences Nouvelles préférences à mettre à jour
 * @returns Succès de l'opération
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    return false;
  }
}

/**
 * Ajoute un contenu à l'historique de visionnage
 * @param userId Identifiant de l'utilisateur
 * @param contentId Identifiant du contenu
 * @param contentType Type de contenu
 * @param progress Progression de visionnage (0-100)
 * @returns Succès de l'opération
 */
export async function addToWatchHistory(
  userId: string,
  contentId: string,
  contentType: ContentType,
  progress: number = 0
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        contentType,
        progress,
        timestamp: Date.now(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à l\'historique:', error);
    return false;
  }
}

/**
 * Récupère les contenus similaires à un contenu donné
 * @param contentId Identifiant du contenu
 * @param limit Nombre maximum de résultats
 * @returns Liste des contenus similaires
 */
export async function getSimilarContent(
  contentId: string,
  limit: number = 10
): Promise<ContentItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}/similar?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus similaires:', error);
    throw error;
  }
}

export default {
  getPersonalizedRecommendations,
  updateUserPreferences,
  addToWatchHistory,
  getSimilarContent,
};
