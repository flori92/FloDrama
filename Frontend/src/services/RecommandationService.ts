import { useEffect, useState } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { BASE_DATA_URL } from '../config/data';

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

interface Content {
  id: string;
  title: string;
  type: 'drama' | 'movie' | 'anime' | 'bollywood';
  genres: string[];
  rating: number;
  year: number;
  image: string;
}

interface Recommendation {
  content: Content;
  score: number;
  reason: string;
}

interface UserPreferences {
  favoriteGenres: string[];
  preferredContentTypes: string[];
  language: string;
  subtitlesEnabled: boolean;
  autoplayEnabled: boolean;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: Error | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
}

export class RecommandationService {
  private static instance: RecommandationService;
  private userPreferences: any;
  private contentCache: Content[] = [];

  private constructor() {
    this.loadContentCache();
  }

  public static getInstance(): RecommandationService {
    if (!RecommandationService.instance) {
      RecommandationService.instance = new RecommandationService();
    }
    return RecommandationService.instance;
  }

  private async loadContentCache() {
    try {
      // Charger les données scrappées depuis S3 (données publiques)
      const response = await fetch(`${BASE_DATA_URL}content.json`);
      this.contentCache = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement du cache de contenu:', error);
    }
  }

  private calculateContentScore(content: Content, userPreferences: UserPreferences): number {
    let score = 0;

    // Score basé sur les genres préférés
    const genreMatches = content.genres.filter(genre => 
      userPreferences.favoriteGenres.includes(genre)
    ).length;
    score += genreMatches * 2;

    // Score basé sur le type de contenu
    if (userPreferences.preferredContentTypes.includes(content.type)) {
      score += 3;
    }

    // Score basé sur la note
    score += content.rating;

    return score;
  }

  private generateRecommendationReason(content: Content, score: number): string {
    const reasons = [];
    if (score > 8) reasons.push('Correspond parfaitement à vos goûts');
    if (content.rating > 4) reasons.push('Très bien noté par la communauté');
    if (content.year >= new Date().getFullYear() - 1) reasons.push('Nouveau contenu');
    
    return reasons.length > 0 ? reasons.join(', ') : 'Recommandé pour vous';
  }

  private contentToContenuMedia(content: Content): ContenuMedia {
    return {
      id: content.id,
      titre: content.title,
      description: 'Description à venir...',
      imageUrl: content.image,
      type: this.mapContentType(content.type),
      genres: content.genres,
      note: content.rating,
      dateAjout: new Date().toISOString(),
      langue: 'fr',
      pays: 'FR',
      annee: content.year,
      acteurs: [],
      realisateur: 'À déterminer',
      metadonnees: {
        qualite: 'HD',
        sousTitres: [
          {
            langue: 'fr',
            url: '#'
          }
        ],
        audio: ['fr']
      }
    };
  }

  private mapContentType(type: 'drama' | 'movie' | 'anime' | 'bollywood'): 'film' | 'serie' | 'documentaire' {
    switch (type) {
      case 'movie':
      case 'bollywood':
        return 'film';
      case 'drama':
      case 'anime':
        return 'serie';
      default:
        return 'film';
    }
  }

  public async getRecommendations(
    userPreferences: UserPreferences | undefined,
    limit: number = 10
  ): Promise<ContenuMedia[]> {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500));

      const defaultPreferences: UserPreferences = {
        favoriteGenres: ['action', 'drama'],
        preferredContentTypes: ['drama', 'movie'],
        language: 'fr',
        subtitlesEnabled: true,
        autoplayEnabled: false,
      };

      const preferences = userPreferences || defaultPreferences;

      // Calculer les scores pour chaque contenu
      const scoredContent = this.contentCache.map(content => ({
        content,
        score: this.calculateContentScore(content, preferences)
      }));

      // Trier par score et prendre les meilleurs
      const recommendations = scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ content, score }) => ({
          content,
          score,
          reason: this.generateRecommendationReason(content, score)
        }));

      // Convertir les recommandations en ContenuMedia
      return recommendations.map(rec => this.contentToContenuMedia(rec.content));
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  public async getSimilarContent(
    contentId: string,
    limit: number = 5
  ): Promise<ContenuMedia[]> {
    try {
      const targetContent = this.contentCache.find(content => content.id === contentId);
      if (!targetContent) {
        throw new Error('Contenu non trouvé');
      }

      const similarContent = this.contentCache
        .filter(content => content.id !== contentId)
        .map(content => ({
          content,
          similarity: this.calculateSimilarityScore(targetContent, content)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(({ content }) => this.contentToContenuMedia(content));

      return similarContent;
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu similaire:', error);
      throw error;
    }
  }

  private calculateSimilarityScore(content1: Content, content2: Content): number {
    let score = 0;

    // Score basé sur les genres communs
    const commonGenres = content1.genres.filter(genre => 
      content2.genres.includes(genre)
    ).length;
    score += commonGenres * 2;

    // Score basé sur le type
    if (content1.type === content2.type) {
      score += 3;
    }

    // Score basé sur l'année
    const yearDiff = Math.abs(content1.year - content2.year);
    if (yearDiff <= 2) score += 2;
    else if (yearDiff <= 5) score += 1;

    return score;
  }
}

export const useRecommendations = (limit: number = 10) => {
  const [recommendations, setRecommendations] = useState<ContenuMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userPreferences = useUserPreferences();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const service = RecommandationService.getInstance();
        const recs = await service.getRecommendations(userPreferences.preferences, limit);
        setRecommendations(recs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences, limit]);

  return {
    recommendations,
    loading,
    error,
  };
};
