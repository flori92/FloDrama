import { MonitoringService } from '../monitoring/MonitoringService';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  poster: string;
  duration: number;
  views: number;
  likes: number;
  category: string;
  tags: string[];
  quality: {
    [key: string]: string; // Mapping qualité -> URL
  };
}

interface VideoStats {
  totalViews: number;
  averageWatchTime: number;
  completionRate: number;
  qualityDistribution: {
    [key: string]: number;
  };
}

/**
 * Service de gestion des vidéos
 */
export class VideoService {
  private static instance: VideoService;
  private cache: any; 
  private monitoringService: MonitoringService;

  private constructor() {
    this.cache = {
      namespace: 'videos',
      maxSize: 500 * 1024 * 1024, // 500 MB
      ttl: 24 * 60 * 60 * 1000, // 24 heures
      data: new Map<string, any>(),
      
      get: async (key: string) => {
        return this.cache.data.get(key) || null;
      },
      
      set: async (key: string, value: any) => {
        this.cache.data.set(key, value);
        return true;
      },
      
      has: async (key: string) => {
        return this.cache.data.has(key);
      },
      
      delete: async (key: string) => {
        return this.cache.data.delete(key);
      },
      
      clear: async () => {
        this.cache.data.clear();
        return true;
      }
    };

    this.monitoringService = MonitoringService.getInstance();
  }

  /**
   * Obtient l'instance unique du service
   */
  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  /**
   * Récupère toutes les vidéos
   */
  public async getVideos(): Promise<Video[]> {
    try {
      // Vérifie le cache
      const cachedVideos = await this.cache.get('all_videos');
      if (cachedVideos) {
        this.monitoringService.logEvent('videos_cache_hit');
        return cachedVideos as Video[];
      }

      // Appel API
      const response = await fetch('/api/videos');
      const videos = await response.json();

      // Mise en cache
      await this.cache.set('all_videos', videos);
      this.monitoringService.logEvent('videos_fetched', { count: videos.length });

      return videos;
    } catch (error) {
      this.monitoringService.logError('videos_fetch_error', error as Error);
      throw error;
    }
  }

  /**
   * Récupère une vidéo par son ID
   */
  public async getVideoById(id: string): Promise<Video | null> {
    try {
      // Vérifie le cache
      const cacheKey = `video_${id}`;
      const cachedVideo = await this.cache.get(cacheKey);
      if (cachedVideo) {
        this.monitoringService.logEvent('video_cache_hit', { videoId: id });
        return cachedVideo as Video;
      }

      // Appel API
      const response = await fetch(`/api/videos/${id}`);
      const video = await response.json();

      // Mise en cache
      await this.cache.set(cacheKey, video);
      this.monitoringService.logEvent('video_fetched', { videoId: id });

      return video;
    } catch (error) {
      this.monitoringService.logError('video_fetch_error', error as Error);
      return null;
    }
  }

  /**
   * Récupère les statistiques d'une vidéo
   */
  public async getVideoStats(id: string): Promise<VideoStats | null> {
    try {
      // Vérifie le cache
      const cacheKey = `video_stats_${id}`;
      const cachedStats = await this.cache.get(cacheKey);
      if (cachedStats) {
        return cachedStats as VideoStats;
      }

      // Appel API
      const response = await fetch(`/api/videos/${id}/stats`);
      const stats = await response.json();

      // Mise en cache
      await this.cache.set(cacheKey, stats, 5 * 60 * 1000); // 5 minutes
      return stats;
    } catch (error) {
      this.monitoringService.logError('video_stats_error', error as Error);
      return null;
    }
  }

  /**
   * Précharge une vidéo
   */
  public async preloadVideo(id: string): Promise<void> {
    try {
      const video = await this.getVideoById(id);
      if (!video) return;

      // Précharge la miniature
      const posterImage = new Image();
      posterImage.src = video.poster;

      // Précharge la vidéo en basse qualité
      const lowestQuality = Object.keys(video.quality).sort()[0];
      if (lowestQuality) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.src = video.quality[lowestQuality];
      }

      this.monitoringService.logEvent('video_preloaded', { videoId: id });
    } catch (error) {
      this.monitoringService.logError('video_preload_error', error as Error);
    }
  }

  /**
   * Met à jour les vues d'une vidéo
   */
  public async incrementViews(id: string): Promise<void> {
    try {
      await fetch(`/api/videos/${id}/views`, { method: 'POST' });
      
      // Invalide le cache des stats
      await this.cache.delete(`video_stats_${id}`);
      
      this.monitoringService.logEvent('video_view_incremented', { videoId: id });
    } catch (error) {
      this.monitoringService.logError('video_view_increment_error', error as Error);
    }
  }

  /**
   * Met à jour les likes d'une vidéo
   */
  public async toggleLike(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/videos/${id}/like`, { method: 'POST' });
      const { liked } = await response.json();

      // Invalide le cache
      await this.cache.delete(`video_${id}`);
      await this.cache.delete(`video_stats_${id}`);

      this.monitoringService.logEvent('video_like_toggled', {
        videoId: id,
        liked
      });

      return liked;
    } catch (error) {
      this.monitoringService.logError('video_like_error', error as Error);
      return false;
    }
  }

  /**
   * Recherche des vidéos
   */
  public async searchVideos(query: string): Promise<Video[]> {
    try {
      const cacheKey = `search_${query}`;
      const cachedResults = await this.cache.get(cacheKey);
      if (cachedResults) {
        this.monitoringService.logEvent('video_search_cache_hit', { query });
        return cachedResults as Video[];
      }

      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();

      await this.cache.set(cacheKey, results, 5 * 60 * 1000); // 5 minutes
      this.monitoringService.logEvent('video_search', {
        query,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      this.monitoringService.logError('video_search_error', error as Error);
      return [];
    }
  }

  /**
   * Obtient les vidéos recommandées
   */
  public async getRecommendedVideos(videoId: string): Promise<Video[]> {
    try {
      const cacheKey = `recommended_${videoId}`;
      const cachedRecommendations = await this.cache.get(cacheKey);
      if (cachedRecommendations) {
        return cachedRecommendations as Video[];
      }

      const response = await fetch(`/api/videos/${videoId}/recommendations`);
      const recommendations = await response.json();

      await this.cache.set(cacheKey, recommendations, 30 * 60 * 1000); // 30 minutes
      return recommendations;
    } catch (error) {
      this.monitoringService.logError('video_recommendations_error', error as Error);
      return [];
    }
  }

  /**
   * Signale un problème avec une vidéo
   */
  public async reportIssue(videoId: string, issue: {
    type: string;
    description: string;
    timestamp?: number;
  }): Promise<void> {
    try {
      await fetch(`/api/videos/${videoId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issue)
      });

      this.monitoringService.logEvent('video_issue_reported', {
        videoId,
        issueType: issue.type
      });
    } catch (error) {
      this.monitoringService.logError('video_issue_report_error', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour les statistiques de lecture
   */
  public async updatePlaybackStats(videoId: string, stats: {
    watchTime: number;
    quality: string;
    buffering: number;
    completed: boolean;
  }): Promise<void> {
    try {
      await fetch(`/api/videos/${videoId}/playback-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stats)
      });

      this.monitoringService.logEvent('video_playback_stats_updated', {
        videoId,
        ...stats
      });
    } catch (error) {
      this.monitoringService.logError('video_playback_stats_error', error as Error);
    }
  }

  /**
   * Nettoie le cache des vidéos
   */
  public async clearCache(): Promise<void> {
    try {
      await this.cache.clear();
      this.monitoringService.logEvent('video_cache_cleared');
    } catch (error) {
      this.monitoringService.logError('video_cache_clear_error', error as Error);
    }
  }
}
