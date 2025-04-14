import { EventEmitter } from 'events';
import { ContentMetadata, ContentRecommendation } from '../types/content';
import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';

interface AIServiceConfig {
  updateInterval: number;
  cache: {
    ttl: number;
    maxSize: number;
  };
  thresholds: {
    minScore: number;
    minConfidence: number;
  };
}

interface UserProfile {
  id: string;
  preferences: {
    categories: string[];
    languages: string[];
    watchTime: {
      total: number;
      byCategory: Map<string, number>;
    };
    quality: 'auto' | '1080p' | '720p' | '480p';
    subtitles: boolean;
    autoplay: boolean;
  };
  history: Array<{
    contentId: string;
    timestamp: Date;
    duration: number;
    progress: number;
    rating?: number;
  }>;
}

/**
 * Service de recommandations intelligentes pour FloDrama
 * Utilise l'apprentissage automatique pour fournir des recommandations personnalisées
 */
export class AIRecommendationService {
  protected events: EventEmitter;
  private userProfiles: Map<string, UserProfile>;
  private contentCache: Map<string, ContentMetadata>;
  protected config: AIServiceConfig;
  private updateInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.events = new EventEmitter();
    this.userProfiles = new Map();
    this.contentCache = new Map();
    this.updateInterval = null;
    this.config = {
      updateInterval: 3600000, // 1 heure
      cache: {
        ttl: 300000, // 5 minutes
        maxSize: 1000,
      },
      thresholds: {
        minScore: 0.5,
        minConfidence: 0.7,
      },
    };
  }

  async configure(config: Partial<AIServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async getRecommendations(
    userId: string,
    categories?: string[]
  ): Promise<ContentRecommendation[]> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`Profil non trouvé pour l'utilisateur ${userId}`);
    }

    const contentList = await this.fetchContentByCategories(
      categories || profile.preferences.categories
    );

    const recommendations: ContentRecommendation[] = [];

    for (const content of contentList) {
      const { score, similarities, factors } = await this.calculateRecommendationScore(
        content,
        profile
      );

      if (score >= this.config.thresholds.minScore) {
        recommendations.push({
          content,
          score,
          similarities,
          factors,
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  async recordWatchEvent(
    userId: string,
    contentId: string,
    event: {
      timestamp: Date;
      duration: number;
      progress: number;
      rating?: number;
    }
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`Profil non trouvé pour l'utilisateur ${userId}`);
    }

    const content = await this.getContentMetadata(contentId);
    
    // Mise à jour des statistiques de visionnage par catégorie
    content.categories.forEach(category => {
      const currentTime = profile.preferences.watchTime.byCategory.get(category) || 0;
      profile.preferences.watchTime.byCategory.set(category, currentTime + event.duration);
    });

    // Mise à jour du temps total de visionnage
    profile.preferences.watchTime.total += event.duration;

    // Ajout de l'événement à l'historique
    profile.history.push({
      contentId,
      ...event,
    });

    this.userProfiles.set(userId, profile);
    await this.updateRecommendations();
  }

  async initializeService(): Promise<void> {
    await Promise.all([this.loadUserProfiles(), this.loadContentMetadata()]);
    this.startPeriodicUpdate();
  }

  startPeriodicUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(
      () => this.updateRecommendations(),
      this.config.updateInterval
    );
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = this.createDefaultProfile(userId);
      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      preferences: {
        categories: [],
        languages: ['fr'],
        watchTime: {
          total: 0,
          byCategory: new Map(),
        },
        quality: 'auto',
        subtitles: true,
        autoplay: true,
      },
      history: [],
    };
  }

  private async fetchContentByCategories(
    categories: string[]
  ): Promise<ContentMetadata[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/content`, {
        params: { categories: categories.join(',') },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu :', error);
      return [];
    }
  }

  private async calculateRecommendationScore(
    content: ContentMetadata,
    profile: UserProfile
  ): Promise<{
    score: number;
    similarities: { contentId: string; score: number }[];
    factors: { name: string; weight: number }[];
  }> {
    const categoryScore = this.calculateCategoryScore(content, profile);
    const watchTimeScore = this.calculateWatchTimeScore(content, profile);
    const similarContent = await this.findSimilarContent(content, profile);

    const score = (categoryScore + watchTimeScore) / 2;

    return {
      score,
      similarities: similarContent,
      factors: [
        { name: 'category_match', weight: categoryScore },
        { name: 'watch_time', weight: watchTimeScore },
      ],
    };
  }

  private calculateCategoryScore(
    content: ContentMetadata,
    profile: UserProfile
  ): number {
    const userCategories = new Set(profile.preferences.categories);
    const matchingCategories = content.categories.filter((cat) =>
      userCategories.has(cat)
    );
    return matchingCategories.length / Math.max(content.categories.length, 1);
  }

  private calculateWatchTimeScore(
    content: ContentMetadata,
    profile: UserProfile
  ): number {
    const categoryWatchTime = profile.preferences.watchTime.byCategory;
    const totalWatchTime = profile.preferences.watchTime.total || 1;

    return content.categories.reduce((score, category) => {
      const categoryTime = categoryWatchTime.get(category) || 0;
      return score + categoryTime / totalWatchTime;
    }, 0) / content.categories.length;
  }

  private async findSimilarContent(
    content: ContentMetadata,
    _profile: UserProfile
  ): Promise<{ contentId: string; score: number }[]> {
    const similarities: { contentId: string; score: number }[] = [];

    for (const [id, cachedContent] of this.contentCache.entries()) {
      if (id !== content.id) {
        const similarity = this.calculateContentSimilarity(content, cachedContent);
        similarities.push({ contentId: id, score: similarity });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private calculateContentSimilarity(
    a: ContentMetadata,
    b: ContentMetadata
  ): number {
    const categoryIntersection = a.categories.filter((cat) =>
      b.categories.includes(cat)
    );
    const categoryUnion = new Set([...a.categories, ...b.categories]);

    return categoryIntersection.length / categoryUnion.size;
  }

  private async getContentMetadata(
    contentId: string
  ): Promise<ContentMetadata> {
    let content = this.contentCache.get(contentId);

    if (!content) {
      try {
        const response = await axios.get(`${API_BASE_URL}/content/${contentId}`);
        content = response.data;
        if (!content) {
          throw new Error(`Contenu non trouvé pour l'ID ${contentId}`);
        }
        this.contentCache.set(contentId, content);
      } catch (error) {
        console.error(
          `Erreur lors de la récupération des métadonnées pour ${contentId}:`,
          error
        );
        throw new Error(`Impossible de récupérer les métadonnées pour ${contentId}`);
      }
    }

    return content;
  }

  private async loadUserProfiles(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profiles`);
      const profiles: UserProfile[] = response.data;

      profiles.forEach((profile) => {
        this.userProfiles.set(profile.id, profile);
      });
    } catch (error) {
      console.error('Erreur lors du chargement des profils utilisateurs:', error);
    }
  }

  private async loadContentMetadata(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/content/metadata`);
      const metadata: ContentMetadata[] = response.data;

      metadata.forEach((content) => {
        this.contentCache.set(content.id, content);
      });
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées:', error);
    }
  }

  private async updateRecommendations(): Promise<void> {
    try {
      for (const [userId] of this.userProfiles.entries()) {
        const recommendations = await this.getRecommendations(userId);
        this.events.emit('recommendationsUpdated', userId, recommendations);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des recommandations:', error);
    }
  }
}
