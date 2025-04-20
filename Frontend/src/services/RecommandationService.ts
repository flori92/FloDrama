import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';

/**
 * Service de recommandation pour FloDrama
 * Gère la logique de recommandation et de filtrage des contenus
 */

export interface ContenuMedia {
  id: string;
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'documentaire';
  genres: string[];
  duree?: number;
  note?: number;
  dateAjout: string;
  langue: string;
  pays: string;
  annee: number;
  acteurs: string[];
  realisateur: string;
  metadonnees: {
    qualite: string;
    sousTitres: Array<{
      langue: string;
      url: string;
    }>;
    audio: string[];
  };
}

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
  private cache: Map<string, { data: ContenuMedia[]; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): RecommandationService {
    if (!RecommandationService.instance) {
      RecommandationService.instance = new RecommandationService();
    }
    return RecommandationService.instance;
  }

  /**
   * Récupère les recommandations pour un utilisateur
   */
  async getRecommandations(
    userId: string,
    nombreElements: number = 10
  ): Promise<ContenuMedia[]> {
    try {
      // Vérifier le cache
      const cacheKey = `${userId}:${nombreElements}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // Appeler l'API
      const response = await axios.get<{ status: string; data: ContenuMedia[] }>(
        `${API_BASE_URL}/api/recommandations/${userId}`,
        {
          params: { limit: nombreElements },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: response.data.data,
        timestamp: Date.now()
      });

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      throw new Error('Impossible de récupérer les recommandations');
    }
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async mettreAJourPreferences(
    userId: string,
    preferences: Partial<PreferencesUtilisateur>
  ): Promise<boolean> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/recommandations/${userId}/preferences`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Invalider le cache pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw new Error('Impossible de mettre à jour les préférences');
    }
  }

  /**
   * Enregistre un visionnage de contenu
   */
  async enregistrerVisionnage(
    userId: string,
    contenuId: string,
    tempsVisionnage: number,
    termine: boolean
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/recommandations/${userId}/visionnages`,
        {
          contenuId,
          tempsVisionnage,
          termine
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Invalider le cache pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du visionnage:', error);
      throw new Error('Impossible d\'enregistrer le visionnage');
    }
  }
}

export default RecommandationService.getInstance();
