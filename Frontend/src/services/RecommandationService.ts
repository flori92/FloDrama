import { useEffect, useState } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

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
      const response = await fetch('/data/content.json');
      this.contentCache = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement du cache de contenu:', error);
    }
  }

  private calculateContentScore(content: Content, userPreferences: any): number {
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

    // Score basé sur la récence
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - content.year;
    if (yearDiff <= 2) {
      score += 2;
    }

    return score;
  }

  private generateRecommendationReason(content: Content, score: number): string {
    const reasons = [
      'Basé sur vos genres préférés',
      'Contenu récent et populaire',
      'Similaire à vos favoris',
      'Note élevée de la communauté',
      'Nouveauté dans votre catégorie préférée'
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  public async getRecommendations(
    userPreferences: any,
    limit: number = 10
  ): Promise<Recommendation[]> {
    if (this.contentCache.length === 0) {
      await this.loadContentCache();
    }

    const recommendations = this.contentCache
      .map(content => ({
        content,
        score: this.calculateContentScore(content, userPreferences),
        reason: this.generateRecommendationReason(content, this.calculateContentScore(content, userPreferences))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  public async getSimilarContent(
    contentId: string,
    limit: number = 5
  ): Promise<Content[]> {
    if (this.contentCache.length === 0) {
      await this.loadContentCache();
    }

    const targetContent = this.contentCache.find(c => c.id === contentId);
    if (!targetContent) return [];

    return this.contentCache
      .filter(c => c.id !== contentId)
      .map(c => ({
        content: c,
        score: this.calculateSimilarityScore(c, targetContent)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.content);
  }

  private calculateSimilarityScore(content1: Content, content2: Content): number {
    let score = 0;

    // Similarité des genres
    const commonGenres = content1.genres.filter(g => content2.genres.includes(g));
    score += commonGenres.length * 2;

    // Similarité du type
    if (content1.type === content2.type) {
      score += 3;
    }

    // Similarité de l'année (plus proche = meilleur score)
    const yearDiff = Math.abs(content1.year - content2.year);
    if (yearDiff <= 2) {
      score += 2;
    }

    return score;
  }
}

export const useRecommendations = (limit: number = 10) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userPreferences = useUserPreferences();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const service = RecommandationService.getInstance();
        const recs = await service.getRecommendations(userPreferences, limit);
        setRecommendations(recs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences, limit]);

  return { recommendations, loading, error };
};
