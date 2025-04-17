import axios from 'axios';
import { API_BASE_URL } from '../../../src/config/constants';
import type { ContentMetadata, ContentRecommendation } from '../../../src/features/recommendations/types/content';

/**
 * Service de recommandation pour FloDrama
 * Gère la logique de recommandation et de filtrage des contenus
 */

export interface PreferencesUtilisateur {
  genresPrefers: string[];
  languesPreferees: string[];
  parametres: {
    autoplay: boolean;
    qualitePreferee: string;
    sousTitresParDefaut: boolean;
    langueAudioPreferee: string;
  };
}

class RecommandationService {
  private static instance: RecommandationService;
  private cache: Map<string, { data: ContentMetadata[]; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): RecommandationService {
    if (!RecommandationService.instance) {
      RecommandationService.instance = new RecommandationService();
    }
    return RecommandationService.instance;
  }

  async getRecommandations(userId: string, nombreElements: number = 10): Promise<ContentMetadata[]> {
    const cacheKey = `${userId}-${nombreElements}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await this.apiClient.get(`/recommendations/${userId}`, {
        params: { limit: nombreElements },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      return [];
    }
  }

  async mettreAJourPreferences(
    userId: string,
    preferences: Partial<PreferencesUtilisateur>
  ): Promise<boolean> {
    try {
      await this.apiClient.put(`/recommendations/${userId}/preferences`, preferences, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Invalider le cache pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key);
        }
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      return false;
    }
  }

  async enregistrerVisionnage(
    userId: string,
    contenuId: string,
    tempsVisionnage: number,
    termine: boolean
  ): Promise<void> {
    try {
      await this.apiClient.post(`/recommendations/${userId}/visionnages`, {
        contenuId,
        tempsVisionnage,
        termine
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Invalider le cache pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du visionnage:', error);
    }
  }

  async getRecommendations(userId: string, categories: string[]): Promise<ContentRecommendation[]> {
    try {
      const response = await this.apiClient.get('/recommendations', {
        params: {
          userId,
          categories: categories.join(','),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération des recommandations');
    }
  }

  async getContentMetadata(contentId: string): Promise<ContentMetadata | null> {
    try {
      const response = await this.apiClient.get(`/content/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées:', error);
      return null;
    }
  }
}

export default RecommandationService.getInstance();
