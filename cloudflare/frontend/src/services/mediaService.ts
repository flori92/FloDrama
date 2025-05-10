/**
 * Service de gestion des médias pour FloDrama
 * 
 * Ce service centralise toute la logique liée à la gestion des médias (images, vidéos)
 * en tirant pleinement parti des capacités de Cloudflare.
 */

import { API, CACHE_DURATION } from '../api/endpoints';

// Types pour les options d'images
export interface ImageOptions {
  width?: number | 'auto';
  height?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  quality?: number;
  type?: 'poster' | 'backdrop' | 'thumbnail';
  fit?: 'cover' | 'contain' | 'fill';
}

// Types pour les options de streaming
export interface StreamOptions {
  quality?: 'auto' | 'low' | 'medium' | 'high';
  startTime?: number;
  token?: string | null;
  drm?: boolean;
}

// Type pour le contenu média à précharger
export interface MediaItem {
  id: string;
  poster?: string;
  backdrop?: string;
  trailer_url?: string;
}

// Cache pour les images préchargées
const imageCache = new Set<string>();

/**
 * Précharge une image et la stocke dans le cache du navigateur
 */
const preloadImage = (url: string): void => {
  // Éviter de précharger la même image plusieurs fois
  if (imageCache.has(url)) return;
  
  const img = new Image();
  img.src = url;
  imageCache.add(url);
};

/**
 * Service principal de gestion des médias
 */
const mediaService = {
  /**
   * Génère une URL optimisée pour les images via Cloudflare
   */
  getOptimizedImageUrl(
    imageId: string, 
    options: ImageOptions = {}
  ): string {
    // Si pas d'ID valide, retourner un placeholder
    if (!imageId || imageId === 'undefined' || imageId === 'null') {
      return this.getPlaceholder(options.type || 'poster');
    }
    
    const {
      width = 'auto',
      height = 'auto',
      format = 'auto',
      quality = 80,
      type = 'poster',
      fit = 'cover'
    } = options;
    
    // Si l'image est déjà une URL complète, la retourner directement
    if (imageId.startsWith('http')) {
      return imageId;
    }
    
    // Construire les paramètres d'optimisation
    const params: Record<string, string> = {
      type,
      fit,
      quality: quality.toString()
    };
    
    // Ajouter les dimensions si spécifiées
    if (width !== 'auto') params.width = width.toString();
    if (height !== 'auto') params.height = height.toString();
    if (format !== 'auto') params.format = format;
    
    try {
      // Générer l'URL en utilisant l'endpoint centralisé
      return API.MEDIA.OPTIMIZED_IMAGE(imageId, params);
    } catch (error) {
      console.warn(`Erreur lors de la génération de l'URL pour ${imageId}:`, error);
      return this.getPlaceholder(type);
    }
  },
  
  /**
   * Retourne une image placeholder selon le type
   */
  getPlaceholder(type: string): string {
    switch(type) {
      case 'poster':
        return '/assets/placeholder-poster.jpg';
      case 'backdrop':
        return '/assets/placeholder-backdrop.jpg';
      case 'thumbnail':
        return '/assets/placeholder-thumbnail.jpg';
      default:
        return '/assets/placeholder-image.jpg';
    }
  },
  
  /**
   * Utilise un mécanisme de fallback pour obtenir une URL d'image valide
   */
  resolveImageUrl(directUrl?: string, posterUrl?: string, id?: string, type: string = 'poster'): string {
    // Cascade de fallbacks pour éviter les 404
    if (directUrl && directUrl.startsWith('http')) {
      return directUrl;
    }
    
    if (posterUrl && posterUrl.startsWith('http')) {
      return posterUrl;
    }
    
    if (id) {
      // Utiliser l'API pour générer l'URL
      try {
        return this.getOptimizedImageUrl(`${id}_${type}`, { type });
      } catch (error) {
        console.warn(`Erreur lors de la résolution de l'URL pour ${id}:`, error);
      }
    }
    
    // En dernier recours, utiliser un placeholder
    return this.getPlaceholder(type);
  },
  
  
  /**
   * Génère une URL pour le poster d'un contenu
   */
  getPosterUrl(
    contentId: string, 
    options: Partial<ImageOptions> = {}
  ): string {
    if (!contentId) {
      return this.getPlaceholder('poster');
    }
    
    try {
      return this.getOptimizedImageUrl(`${contentId}_poster`, {
        type: 'poster',
        width: options.width || 300,
        height: options.height || 450,
        ...options
      });
    } catch (error) {
      console.warn(`Erreur lors de la récupération du poster pour ${contentId}:`, error);
      return this.getPlaceholder('poster');
    }
  },
  
  /**
   * Génère une URL pour le backdrop d'un contenu
   */
  getBackdropUrl(
    contentId: string, 
    options: Partial<ImageOptions> = {}
  ): string {
    if (!contentId) {
      return this.getPlaceholder('backdrop');
    }
    
    try {
      return this.getOptimizedImageUrl(`${contentId}_backdrop`, {
        type: 'backdrop',
        width: options.width || 1280,
        height: options.height || 720,
        ...options
      });
    } catch (error) {
      console.warn(`Erreur lors de la récupération du backdrop pour ${contentId}:`, error);
      return this.getPlaceholder('backdrop');
    }
  },
  
  /**
   * Génère une URL pour la vignette d'un contenu
   */
  getThumbnailUrl(
    contentId: string, 
    options: Partial<ImageOptions> = {}
  ): string {
    return this.getOptimizedImageUrl(`${contentId}_thumbnail`, {
      type: 'thumbnail',
      width: options.width || 240,
      height: options.height || 135,
      ...options
    });
  },
  
  /**
   * Génère une URL pour le trailer d'un contenu
   */
  getTrailerUrl(
    contentId: string, 
    options: Partial<StreamOptions> = {}
  ): string {
    if (!contentId) {
      return '';
    }
    
    // Si c'est déjà une URL (YouTube, etc.), la retourner directement
    if (contentId.startsWith('http')) {
      return contentId;
    }
    
    const {
      quality = 'auto',
      startTime = 0
    } = options;
    
    try {
      // Utiliser Cloudflare Stream pour les vidéos
      return API.MEDIA.TRAILER(contentId);
    } catch (error) {
      console.warn(`Erreur lors de la récupération du trailer pour ${contentId}:`, error);
      return '';
    }
  },
  
  /**
   * Génère une URL pour le streaming du contenu principal
   */
  getStreamUrl(
    contentId: string, 
    options: Partial<StreamOptions> = {}
  ): string {
    if (!contentId) {
      return '';
    }
    
    // Si c'est déjà une URL complète, la retourner directement
    if (contentId.startsWith('http')) {
      return contentId;
    }
    
    try {
      // Utiliser Cloudflare Stream pour les vidéos
      return API.MEDIA.STREAM(contentId);
    } catch (error) {
      console.warn(`Erreur lors de la récupération du stream pour ${contentId}:`, error);
      return '';
    }
  },
  
  /**
   * Optimise les URLs des médias pour un élément de contenu
   */
  optimizeContentMedia(
    item: any,
    options: {
      posterSize?: { width: number, height: number },
      backdropSize?: { width: number, height: number }
    } = {}
  ): any {
    const { 
      posterSize = { width: 300, height: 450 },
      backdropSize = { width: 1280, height: 720 }
    } = options;
    
    // S'assurer que l'item existe
    if (!item) return null;
    
    // Créer une copie pour éviter de modifier l'original
    const optimizedItem = { ...item };
    
    try {
      // Optimiser les URLs des médias avec cascade de fallbacks
      
      // Optimiser le poster avec gestion robuste des alternatives
      optimizedItem.poster = this.resolveImageUrl(
        item.poster,
        item.posterUrl || item.poster_url || item.imageUrl || item.image_url,
        item.id,
        'poster'
      );
      
      // Optimiser le backdrop
      optimizedItem.backdrop = this.resolveImageUrl(
        item.backdrop,
        item.backdropUrl || item.backdrop_url || item.backgroundUrl || item.background_url,
        item.id,
        'backdrop'
      );
      
      // Optimiser l'URL du trailer
      if (item.trailer_url || item.trailerUrl) {
        optimizedItem.trailer_url = this.getTrailerUrl(
          item.trailer_url || item.trailerUrl || item.id
        );
      }
      
      // Optimiser l'URL de streaming
      if (item.watch_url || item.streamUrl || item.mediaUrl) {
        optimizedItem.watch_url = this.getStreamUrl(
          item.watch_url || item.streamUrl || item.mediaUrl || item.id
        );
      }
      
      // Garantir qu'on a toujours des images, même si ce sont des placeholders
      if (!optimizedItem.poster) {
        optimizedItem.poster = this.getPlaceholder('poster');
      }
      if (!optimizedItem.backdrop) {
        optimizedItem.backdrop = this.getPlaceholder('backdrop');
      }
    } catch (error) {
      console.error("Erreur lors de l'optimisation des médias:", error);
      // Assurer qu'on a toujours au moins des placeholders
      optimizedItem.poster = optimizedItem.poster || this.getPlaceholder('poster');
      optimizedItem.backdrop = optimizedItem.backdrop || this.getPlaceholder('backdrop');
    }
    
    return optimizedItem;
  },
  
  /**
   * Optimise les URLs des médias pour une liste d'éléments de contenu
   */
  optimizeContentMediaBatch(
    items: any[],
    options: {
      posterSize?: { width: number, height: number },
      backdropSize?: { width: number, height: number }
    } = {}
  ): any[] {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => this.optimizeContentMedia(item, options));
  },
  
  /**
   * Précharge les ressources médias pour améliorer l'expérience utilisateur
   */
  preloadResources(
    contentItems: MediaItem[],
    options: {
      priority?: 'high' | 'medium' | 'low',
      posterSize?: { width: number, height: number },
      backdropSize?: { width: number, height: number },
      maxItems?: number
    } = {}
  ): void {
    if (!contentItems?.length) return;
    
    const {
      priority = 'medium',
      posterSize = { width: 300, height: 450 },
      backdropSize = { width: 1280, height: 720 },
      maxItems = {
        high: 10,
        medium: 6,
        low: 3
      }[priority]
    } = options;
    
    // Priorité différente selon l'importance
    const priorityDelay = {
      high: 0,
      medium: 100,
      low: 500
    };
    
    // Précharger les images avec délai pour ne pas saturer
    setTimeout(() => {
      // Limiter le nombre d'éléments à précharger
      contentItems.slice(0, maxItems).forEach((item, index) => {
        if (item.id) {
          // Précharger les posters
          const posterUrl = this.getPosterUrl(item.id, posterSize);
          preloadImage(posterUrl);
          
          // Précharger seulement les premiers backdrops
          if (index < 3) {
            const backdropUrl = this.getBackdropUrl(item.id, backdropSize);
            preloadImage(backdropUrl);
          }
        } else if (item.poster) {
          // Si l'ID n'est pas disponible mais qu'on a une URL directe
          preloadImage(item.poster);
        }
      });
    }, priorityDelay[priority]);
  }
};

export default mediaService;
