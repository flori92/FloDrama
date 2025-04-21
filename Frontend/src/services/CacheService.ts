import { ContenuMedia } from './RecommandationService';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly defaultExpiration = 1000 * 60 * 60; // 1 heure

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public set<T>(key: string, data: T, expiresIn: number = this.defaultExpiration): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  // Méthodes spécifiques pour le contenu
  public setContent(contentId: string, content: ContenuMedia): void {
    this.set(`content:${contentId}`, content);
  }

  public getContent(contentId: string): ContenuMedia | null {
    return this.get(`content:${contentId}`);
  }

  public setContentList(key: string, contentList: ContenuMedia[]): void {
    this.set(`contentList:${key}`, contentList);
  }

  public getContentList(key: string): ContenuMedia[] | null {
    return this.get(`contentList:${key}`);
  }

  // Méthodes pour les recommandations
  public setRecommendations(userId: string, recommendations: ContenuMedia[]): void {
    this.set(`recommendations:${userId}`, recommendations, 1000 * 60 * 30); // 30 minutes
  }

  public getRecommendations(userId: string): ContenuMedia[] | null {
    return this.get(`recommendations:${userId}`);
  }
}

export const cacheService = CacheService.getInstance(); 