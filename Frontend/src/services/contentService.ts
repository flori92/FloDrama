// Service de récupération des contenus depuis Supabase
// Version adaptée pour la migration AWS → Supabase (avril 2025)
import { ContentItem, ContentType, Carousel, HeroBanner, HeroBannerItem, SearchResponse } from '../types/content.types';
import type { ContentDetail } from '../types/content.types';
import { supabase, fromTable, typedData } from '../config/supabase';

// Configuration des variables d'environnement et paramètres
const CONFIG = {
  // Cache
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutes en millisecondes
  USE_LOCAL_CACHE: true,
  
  // Logging
  ENABLE_LOGGING: true,
  
  // Fallback local
  USE_LOCAL_FALLBACK: true
};

// Importation des données locales de secours
import localDramaData from '../data/content/drama/index.json';
import localAnimeData from '../data/content/anime/index.json';
import localFilmData from '../data/content/film/index.json';
import localBollywoodData from '../data/content/bollywood/index.json';
import localCarouselsData from '../data/carousels.json';
import localHeroBannersData from '../data/hero_banners.json';

// Cache local pour optimiser les performances
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheItem<any>> = {};

/**
 * Place des données en cache avec une durée de vie limitée
 * @param key Clé d'identification du cache
 * @param data Données à mettre en cache
 */
const setCache = <T>(key: string, data: T): void => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
  
  if (CONFIG.USE_LOCAL_CACHE && typeof window !== 'undefined') {
    try {
      localStorage.setItem(`flodrama_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.warn('Erreur lors de la sauvegarde dans localStorage:', error);
      }
    }
  }
}

/**
 * Récupère des données depuis le cache si elles sont encore valides
 * @param key Clé d'identification du cache
 * @returns Les données du cache ou null si pas de cache valide
 */
const getCache = <T>(key: string): T | null => {
  // Vérifier le cache en mémoire
  const memoryCache = cache[key];
  if (memoryCache && (Date.now() - memoryCache.timestamp) < CONFIG.CACHE_DURATION) {
    return memoryCache.data as T;
  }

  // Vérifier le cache dans localStorage si activé
  if (CONFIG.USE_LOCAL_CACHE && 
      typeof window !== 'undefined' && 
      window.localStorage) {
    
    const storedCache = localStorage.getItem(`flodrama_${key}`);
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache);
        if ((Date.now() - parsed.timestamp) < CONFIG.CACHE_DURATION) {
          cache[key] = parsed; // Mise à jour du cache en mémoire
          return parsed.data as T;
        }
      } catch (error) {
        if (CONFIG.ENABLE_LOGGING) {
          console.warn('Erreur lors de la lecture du cache local:', error);
        }
      }
    }
  }

  return null;
}

/**
 * Corrige les URLs des images pour les rendre absolues
 * @param items Éléments contenant des URLs d'images
 * @returns Éléments avec les URLs d'images corrigées
 */
const fixImageUrls = <T extends { poster?: string | null; backdrop?: string | null; [key: string]: any }>(items: T[]): T[] => {
  if (!items || !Array.isArray(items) || items.length === 0) return [];

  return items.map(item => {
    if (!item) {
      return item;
    }
    
    const result = { ...item } as T & { imageUrl?: string; posterUrl?: string };
    
    // Corriger l'URL du poster
    if (result.poster) {
      if (!result.poster.startsWith('http')) {
        result.poster = `https://flodrama.com/images/${result.poster}`;
      }
      
      // Ajouter des URLs alternatives pour la compatibilité
      result.imageUrl = result.poster;
      result.posterUrl = result.poster;
    }
    
    // Corriger l'URL du backdrop
    if (result.backdrop) {
      if (!result.backdrop.startsWith('http')) {
        result.backdrop = `https://flodrama.com/images/${result.backdrop}`;
      }
    }
    
    return result;
  });
}

/**
 * Vérifie si la connexion à Supabase est disponible
 * @returns true si la connexion est disponible, false sinon
 */
export const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    // Utiliser une requête générique qui ne dépend pas d'une table spécifique
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.warn('[Supabase] Connexion indisponible:', error.message);
      }
      return false;
    } else {
      return true;
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.warn('[Supabase] Erreur de connexion:', error);
    }
    return false;
  }
}

/**
 * Récupère les contenus par catégorie
 * @param category - La catégorie de contenu à récupérer
 * @param limit - Le nombre d'éléments à récupérer (par défaut 20)
 * @param offset - Le décalage pour la pagination (par défaut 0)
 * @returns Une promesse qui résout avec un tableau d'éléments de contenu
 */
export const getContentsByCategory = async (
  category: ContentType,
  limit: number = 20,
  offset: number = 0
): Promise<ContentItem[]> => {
  const cacheKey = `content_${category}_${limit}_${offset}`;
  
  // Vérifier le cache
  if (CONFIG.USE_LOCAL_CACHE && cache[cacheKey]) {
    if (CONFIG.ENABLE_LOGGING) {
      console.log(`[Cache] Utilisation du cache pour ${cacheKey}`);
    }
    return cache[cacheKey].data;
  }

  try {
    // Déterminer la table en fonction de la catégorie
    let table: string;
    switch (category) {
      case 'drama':
        table = 'dramas';
        break;
      case 'anime':
        table = 'animes';
        break;
      case 'film':
        table = 'films';
        break;
      case 'bollywood':
        table = 'bollywood';
        break;
      default:
        throw new Error(`Catégorie non prise en charge: ${category}`);
    }

    // Effectuer la requête à Supabase
    const { data, error } = await fromTable(table as SupabaseTable)
      .select('id, title, original_title, poster, backdrop, year, rating, language, source')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[Supabase] Erreur lors de la récupération des contenus ${category}:`, error);
      
      // Utiliser les données locales en cas d'erreur si activé
      if (CONFIG.USE_LOCAL_FALLBACK) {
        let localData: any[] = [];
        
        switch (category) {
          case 'drama':
            localData = localDramaData?.items || [];
            break;
          case 'anime':
            localData = localAnimeData?.items || [];
            break;
          case 'film':
            localData = localFilmData?.items || [];
            break;
          case 'bollywood':
            localData = localBollywoodData?.items || [];
            break;
        }
        
        // Paginer les données locales
        const paginatedData = localData.slice(offset, offset + limit);
        
        // Transformer les données locales au format ContentItem
        const contentItems: ContentItem[] = paginatedData.map((item: any) => ({
          id: item.id || '',
          title: item.title || '',
          original_title: item.original_title || undefined,
          poster: item.poster || '',
          backdrop: item.backdrop || undefined,
          year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
          rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
          language: item.language || '',
          source: item.source || '',
          type: category
        }));
        
        // Mettre en cache
        if (CONFIG.USE_LOCAL_CACHE) {
          cache[cacheKey] = {
            data: contentItems,
            timestamp: Date.now()
          };
        }
        
        return contentItems;
      }
      
      throw error;
    }

    // Transformer les données en ContentItem
    const contentItems: ContentItem[] = (data || []).map((item: any) => ({
      id: item.id || '',
      title: item.title || '',
      original_title: item.original_title || undefined,
      poster: item.poster || '',
      backdrop: item.backdrop || undefined,
      year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
      rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
      language: item.language || '',
      source: item.source || '',
      type: category
    }));
    
    // Mettre en cache
    if (CONFIG.USE_LOCAL_CACHE) {
      cache[cacheKey] = {
        data: contentItems,
        timestamp: Date.now()
      };
    }
    
    return contentItems;
  } catch (error) {
    console.error(`[Service] Erreur lors de la récupération des contenus ${category}:`, error);
    
    // Utiliser les données locales en cas d'erreur si activé
    if (CONFIG.USE_LOCAL_FALLBACK) {
      let localData: any[] = [];
      
      switch (category) {
        case 'drama':
          localData = localDramaData?.items || [];
          break;
        case 'anime':
          localData = localAnimeData?.items || [];
          break;
        case 'film':
          localData = localFilmData?.items || [];
          break;
        case 'bollywood':
          localData = localBollywoodData?.items || [];
          break;
      }
      
      // Paginer les données locales
      const paginatedData = localData.slice(offset, offset + limit);
      
      // Transformer les données locales au format ContentItem
      const contentItems: ContentItem[] = paginatedData.map((item: any) => ({
        id: item.id || '',
        title: item.title || '',
        original_title: item.original_title || undefined,
        poster: item.poster || '',
        backdrop: item.backdrop || undefined,
        year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
        rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
        language: item.language || '',
        source: item.source || '',
        type: category
      }));
      
      // Mettre en cache
      if (CONFIG.USE_LOCAL_CACHE) {
        cache[cacheKey] = {
          data: contentItems,
          timestamp: Date.now()
        };
      }
      
      return contentItems;
    }
    
    throw error;
  }
};

/**
 * Alias pour compatibilité ascendante avec les anciens composants/hooks
 */
export const getCategoryContent = getContentsByCategory;

/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @returns Détails du contenu ou null si non trouvé
 */
const getContentDetails = async (contentId: string): Promise<ContentDetail | null> => {
  // Clé de cache unique pour cette requête
  const cacheKey = `content_details_${contentId}`;
  
  // Vérifier le cache
  const cachedData = getCache<ContentDetail>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Rechercher dans toutes les tables de contenu
      const SUPABASE_TABLES = {
        drama: 'dramas',
        anime: 'animes',
        film: 'films',
        bollywood: 'bollywood',
      } as const;
      type SupabaseTable = typeof SUPABASE_TABLES[keyof typeof SUPABASE_TABLES];
      
      const contentTables: SupabaseTable[] = Object.values(SUPABASE_TABLES);
      
      for (const table of contentTables) {
        try {
          // Requête à Supabase
          const { data, error } = await supabase
            .from(table as SupabaseTable)
            .select('*')
            .eq('id', contentId)
            .single();
          
          if (error) {
            // Ignorer les erreurs de "pas de résultat"
            if (error.code === 'PGRST116') {
              continue; // Essayer la table suivante
            }
            throw error;
          }
          
          if (data) {
            // Déterminer le type en fonction de la table
            const type: ContentType = table === 'dramas' ? 'drama' : 
                                    table === 'animes' ? 'anime' : 
                                    table === 'films' ? 'film' : 'bollywood';
            
            // Helper pour vérifier si un objet est bien un résultat attendu Supabase (ContentDetail)
            function isContentDetail(data: any): data is ContentDetail {
              return data && typeof data === 'object' && 'id' in data && 'title' in data;
            }
            
            const details = isContentDetail(data)
              ? {
                  id: data.id,
                  title: data.title,
                  original_title: data.original_title || '',
                  poster: data.poster || '',
                  backdrop: data.backdrop || '',
                  year: typeof data.year === 'number' ? data.year : parseInt(data.year as any) || 0,
                  rating: typeof data.rating === 'number' ? data.rating : parseFloat(data.rating as any) || 0,
                  language: data.language || '',
                  source: data.source || '',
                  type: type,
                  description: data.description || '',
                  synopsis: data.synopsis || '',
                  genres: Array.isArray(data.genres) ? data.genres : [],
                  tags: Array.isArray(data.tags) ? data.tags : [],
                  actors: Array.isArray(data.actors) ? data.actors : [],
                  director: data.director || '',
                  episode_count: data.episode_count || 0,
                  episodes: data.episodes || [],
                  seasons: data.seasons || [],
                  duration: data.duration || 0,
                  status: data.status || '',
                  release_date: data.release_date || '',
                  streaming_urls: data.streaming_urls ? (Array.isArray(data.streaming_urls) ? data.streaming_urls : []) : [],
                  trailers: data.trailers ? (Array.isArray(data.trailers) ? data.trailers : []) : [],
                  images: Array.isArray(data.images) ? data.images : [],
                  subtitles: data.subtitles ? (Array.isArray(data.subtitles) ? data.subtitles : []) : [],
                  related_content: data.related_content ? (Array.isArray(data.related_content) ? data.related_content.map((id: string) => ({ id, title: '', poster: '', year: 0, rating: 0, language: '', source: '', type })) : []) : [],
                  user_ratings: data.user_ratings || {},
                  popularity_score: data.popularity_score || 0,
                  is_premium: data.is_premium || false,
                  gallery: Array.isArray(data.gallery) ? data.gallery : []
                }
              : null;
            
            // Corriger les URLs des images
            const fixedContentDetail = fixImageUrls([details])[0];
            
            // Mettre en cache
            setCache(cacheKey, fixedContentDetail);
            
            return fixedContentDetail;
          }
        } catch (error) {
          if (CONFIG.ENABLE_LOGGING) {
            console.error(`Erreur lors de la récupération des détails depuis ${table}:`, error);
          }
        }
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error(`Erreur lors de la récupération des détails du contenu ${contentId}:`, error);
    }
  }
  
  // Fallback sur les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    // Rechercher dans toutes les données locales
    const allLocalItems = [
      ...(localDramaData?.items || []),
      ...(localAnimeData?.items || []),
      ...(localFilmData?.items || []),
      ...(localBollywoodData?.items || [])
    ];
    
    // Rechercher l'élément par ID
    const localItem = allLocalItems.find((item: any) => item.id === contentId);
    
    if (localItem) {
      // Déterminer le type en fonction des données
      let type: ContentType = 'drama';
      if (localDramaData?.items?.find((item: any) => item.id === contentId)) {
        type = 'drama';
      } else if (localAnimeData?.items?.find((item: any) => item.id === contentId)) {
        type = 'anime';
      } else if (localFilmData?.items?.find((item: any) => item.id === contentId)) {
        type = 'film';
      } else if (localBollywoodData?.items?.find((item: any) => item.id === contentId)) {
        type = 'bollywood';
      }
      
      // Transformer les données en ContentDetail
      const contentDetail: ContentDetail = {
        ...(localItem as Partial<ContentDetail>),
        type,
        synopsis: 'synopsis' in localItem ? String(localItem.synopsis || '') : '',
        genres: Array.isArray(localItem.genres) ? localItem.genres : [],
        description: 'description' in localItem ? String(localItem.description || '') : '',  // Propriété obligatoire
        id: localItem.id || '',                                                              // Propriétés obligatoires
        title: localItem.title || '',
        original_title: localItem.original_title || '',
        poster: localItem.poster || '',
        year: typeof localItem.year === 'number' ? localItem.year : 0,
        rating: typeof localItem.rating === 'number' ? localItem.rating : 0,
        language: localItem.language || '',
        source: localItem.source || ''
      };
      
      // Corriger les URLs des images
      const fixedContentDetail = fixImageUrls([contentDetail])[0];
      
      // Mettre en cache
      setCache(cacheKey, fixedContentDetail);
      
      return fixedContentDetail;
    }
  }
  
  // Si tout échoue, renvoyer null
  return null;
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels
 */
const getCarousels = async (): Promise<Carousel[]> => {
  // Clé de cache unique pour cette requête
  const cacheKey = 'carousels';
  
  // Vérifier le cache
  const cachedData = getCache<Carousel[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Récupérer les carrousels depuis Supabase
      const { data: carouselsData, error } = await supabase
        .from('carousels' as any)
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (carouselsData && carouselsData.length > 0) {
        // Initialiser le tableau de résultats
        const carousels: Carousel[] = [];
        
        // Pour chaque carrousel, récupérer les éléments
        for (const carouselData of carouselsData) {
          // Ignorer les éléments null ou undefined
          if (!carouselData) {
            continue;
          }
          
          try {
            // Vérification du type avant d'accéder aux propriétés
            const carousel = carouselData as { 
              id?: string | number; 
              title?: string; 
              type?: string; 
              items?: any[]; 
              position?: number;
              is_active?: boolean;
            };
            
            if (typeof carousel === 'object' && 'type' in carousel) {
              // Récupérer les éléments en fonction du type de carrousel
              const contentType: ContentType = 
                carousel.type === 'drama' ? 'drama' :
                carousel.type === 'anime' ? 'anime' :
                carousel.type === 'film' ? 'film' : 'bollywood';
              
              // Récupérer les éléments depuis la table correspondante
              const items = await getContentsByCategory(contentType, 10, 0);
              
              // Ajouter le carrousel au tableau de résultats
              carousels.push({
                id: 'id' in carousel ? String(carousel.id || '') : `carousel_${carousels.length}`,
                title: 'title' in carousel ? String(carousel.title || '') : '',
                type: 'type' in carousel ? String(carousel.type) as ContentType : 'drama',
                items,
                position: 'position' in carousel ? Number(carousel.position || 0) : 0,
                is_active: 'is_active' in carousel ? carousel.is_active !== false : true
              });
            } else if (typeof carousel === 'object' && 'items' in carousel) {
              // Accès sécurisé aux propriétés
              const contentItems: ContentItem[] = [];
              
              const itemsArray = Array.isArray(carousel.items) 
                ? carousel.items 
                : (carousel.items && typeof carousel.items === 'object') 
                  ? Object.values(carousel.items) 
                  : [];
              
              for (const item of itemsArray) {
                if (item && typeof item === 'object' && 'id' in item) {
                  // Transformer en ContentItem
                  const contentItem: ContentItem = {
                    id: String(item.id || ''),
                    title: String(item.title || ''),
                    original_title: String(item.original_title || ''),
                    poster: String(item.poster || ''),
                    backdrop: ('backdrop' in item) ? String(item.backdrop || '') : '',  // Cast explicite en string
                    year: typeof item.year === 'number' ? item.year : parseInt(String(item.year)) || 0,
                    rating: typeof item.rating === 'number' ? item.rating : parseFloat(String(item.rating)) || 0,
                    language: String(item.language || ''),
                    source: String(item.source || ''),
                    type: (String(item.type) as ContentType) || 'drama'
                  };
                  
                  contentItems.push(contentItem);
                }
              }
              
              // Corriger les URLs des images
              const fixedItems = fixImageUrls(contentItems);
              
              // Ajouter le carrousel au tableau de résultats
              carousels.push({
                id: 'id' in carousel ? String(carousel.id || '') : `carousel_${carousels.length}`,
                title: 'title' in carousel ? String(carousel.title || '') : '',
                type: 'type' in carousel ? String(carousel.type) as ContentType : 'drama',
                items: fixedItems,
                position: 'position' in carousel ? Number(carousel.position || 0) : 0,
                is_active: 'is_active' in carousel ? carousel.is_active !== false : true
              });
            }
          } catch (carouselError) {
            if (CONFIG.ENABLE_LOGGING) {
              console.error(`Erreur lors de la récupération des éléments d'un carrousel:`, carouselError);
            }
          }
        }
        
        // Mettre en cache
        setCache(cacheKey, carousels);
        
        return carousels;
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error('Erreur lors de la récupération des carrousels:', error);
    }
  }
  
  // Fallback sur les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    try {
      // Transformer les données locales en Carousel[]
      const carousels: Carousel[] = [];
      
      // Récupérer les données locales
      const localData = localCarouselsData;
      
      if (localData && typeof localData === 'object') {
        // Si les données sont un objet, convertir en tableau
        const carouselEntries = Object.entries(localData);
        
        for (const [key, value] of carouselEntries) {
          if (value && typeof value === 'object' && 'title' in value && 'items' in value) {
            // Transformer les éléments en ContentItem[]
            const items: (ContentItem & { backdrop: string })[] = Array.isArray(value.items) ? value.items.map(item => ({
              id: item.id || '',
              title: item.title || '',
              original_title: item.original_title || '',
              poster: item.poster || '',
              backdrop: ('backdrop' in item) ? String(item.backdrop || '') : '',  // Cast explicite en string
              year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
              language: item.language || '',
              source: item.source || '',
              type: (item.type as ContentType) || 'drama'
            })) : [];
            
            // Corriger les URLs des images
            const fixedItems = fixImageUrls(items);
            
            // Ajouter le carrousel au tableau de résultats
            carousels.push({
              id: key,
              title: value.title,
              type: value.type || key,
              items: fixedItems,
              position: 'position' in value ? Number(value.position || 0) : 0,
              is_active: 'is_active' in value ? value.is_active !== false : true
            });
          }
        }
      } else if (Array.isArray(localData)) {
        // Si les données sont déjà un tableau
        for (const carousel of localData) {
          if (carousel && typeof carousel === 'object' && 'title' in carousel) {
            // Transformer les éléments en ContentItem[]
            const items: ContentItem[] = Array.isArray(carousel.items) ? carousel.items.map(item => ({
              id: item.id || '',
              title: item.title || '',
              original_title: item.original_title || '',
              poster: item.poster || '',
              backdrop: ('backdrop' in item) ? String(item.backdrop || '') : '',  // Cast explicite en string
              year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
              language: item.language || '',
              source: item.source || '',
              type: (item.type as ContentType) || 'drama'
            })) : [];
            
            // Corriger les URLs des images
            const fixedItems = fixImageUrls(items);
            
            // Ajouter le carrousel au tableau de résultats
            carousels.push({
              id: 'id' in carousel ? String(carousel.id || '') : `carousel_${carousels.length}`,
              title: 'title' in carousel ? String(carousel.title || '') : '',
              type: 'type' in carousel ? String(carousel.type) as ContentType : 'drama',
              items: fixedItems,
              position: 'position' in carousel ? Number(carousel.position || 0) : 0,
              is_active: 'is_active' in carousel ? carousel.is_active !== false : true
            });
          }
        }
      }
      
      // Mettre en cache
      setCache(cacheKey, carousels);
      
      return carousels;
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.error('Erreur lors de la transformation des données locales de carrousels:', error);
      }
    }
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return [];
}

/**
 * Récupère les bannières pour le hero banner
 * @returns Bannières pour le hero banner
 */
const getHeroBanners = async (): Promise<HeroBanner> => {
  // Clé de cache unique pour cette requête
  const cacheKey = 'hero_banners';
  
  // Vérifier le cache
  const cachedData = getCache<HeroBanner>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Récupérer les bannières depuis Supabase
      const { data: bannersData, error: bannersError } = await supabase
        .from('hero_banners' as any)
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (bannersError) {
        throw bannersError;
      }
      
      if (bannersData && bannersData.length > 0) {
        // Transformer les données en HeroBannerItem[]
        const bannerItems: HeroBannerItem[] = [];
        
        // Pour chaque bannière, récupérer les détails du contenu associé
        for (const bannerData of bannersData) {
          // Ignorer les éléments null ou undefined
          if (!bannerData) {
            continue;
          }
          
          try {
            // Vérification du type avant d'accéder aux propriétés
            const banner = bannerData as {
              id?: string | number;
              title?: string;
              description?: string;
              backdrop?: string;
              image?: string;
              content_id?: string | number;
              content_type?: string;
            };
            
            if (typeof banner === 'object' && 
                'content_id' in banner && 
                banner.content_id && 
                'content_type' in banner && 
                banner.content_type) {
              
              // Récupérer les détails du contenu
              const contentDetail = await getContentDetails(String(banner.content_id));
              
              if (contentDetail) {
                // Ajouter la bannière au tableau de résultats
                bannerItems.push({
                  id: 'id' in banner ? String(banner.id || '') : `banner_${bannerItems.length}`,
                  title: 'title' in banner ? String(banner.title || '') : contentDetail.title,
                  description: 'description' in banner ? String(banner.description || '') : contentDetail.description,
                  backdrop: ('backdrop' in banner && banner.backdrop) ? String(banner.backdrop) : 
                          ('image' in banner && banner.image) ? String(banner.image) : (contentDetail.backdrop || ''),
                  poster: contentDetail.poster,
                  type: contentDetail.type,
                  content_id: 'content_id' in banner ? String(banner.content_id) : contentDetail.id
                });
              }
            }
          } catch (bannerError) {
            if (CONFIG.ENABLE_LOGGING) {
              console.error('Erreur lors du traitement de la bannière:', bannerError);
            }
          }
        }
        
        if (bannerItems.length > 0) {
          // Corriger les URLs des images
          const fixedItems = fixImageUrls(bannerItems);
          
          // Créer l'objet HeroBanner
          const heroBanner: HeroBanner = {
            id: 'hero_banner',
            items: fixedItems
          };
          
          // Mettre en cache
          setCache(cacheKey, heroBanner);
          
          return heroBanner;
        }
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error('Erreur lors de la récupération des bannières:', error);
    }
  }
  
  // Fallback sur les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    try {
      // Transformer les données locales en HeroBannerItem[]
      const bannerItems: HeroBannerItem[] = [];
      
      // Récupérer les données locales
      const localData = localHeroBannersData;
      
      if (localData && Array.isArray(localData)) {
        // Parcourir les bannières locales
        for (const banner of localData) {
          if (banner && typeof banner === 'object' && 'title' in banner) {
            bannerItems.push({
              id: 'id' in banner ? String(banner.id || '') : `banner_${bannerItems.length}`,
              title: 'title' in banner ? String(banner.title || '') : '',
              description: 'description' in banner ? String(banner.description || '') : '',
              backdrop: ('backdrop' in banner && banner.backdrop) ? String(banner.backdrop) : 
                      ('image' in banner && banner.image) ? String(banner.image) : '',
              poster: 'poster' in banner ? String(banner.poster || '') : '',
              type: 'type' in banner ? (String(banner.type) as ContentType) : 'drama',
              content_id: 'content_id' in banner ? String(banner.content_id) : 
                         'id' in banner ? String(banner.id) : ''
            });
          }
        }
      } else if (localData && typeof localData === 'object' && 'banners' in localData) {
        // Si les données sont un objet avec une propriété 'banners'
        const { banners } = localData;
        if (Array.isArray(banners)) {
          for (const banner of banners) {
            if (banner && typeof banner === 'object' && 'title' in banner) {
              bannerItems.push({
                id: 'id' in banner ? String(banner.id || '') : `banner_${bannerItems.length}`,
                title: 'title' in banner ? String(banner.title || '') : '',
                description: 'description' in banner ? String(banner.description || '') : '',
                backdrop: ('backdrop' in banner && banner.backdrop) ? String(banner.backdrop) : 
                        ('image' in banner && banner.image) ? String(banner.image) : '',
                poster: 'poster' in banner ? String(banner.poster || '') : '',
                type: 'type' in banner ? (String(banner.type) as ContentType) : 'drama',
                content_id: 'content_id' in banner ? String(banner.content_id) : 
                           'id' in banner ? String(banner.id) : ''
              });
            }
          }
        }
      }
      
      if (bannerItems.length > 0) {
        // Corriger les URLs des images
        const fixedItems = fixImageUrls(bannerItems);
        
        // Créer l'objet HeroBanner
        const heroBanner: HeroBanner = {
          id: 'hero_banner',
          items: fixedItems
        };
        
        // Mettre en cache
        setCache(cacheKey, heroBanner);
        
        return heroBanner;
      }
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.error('Erreur lors de la transformation des données locales de bannières:', error);
      }
    }
  }
  
  // Si tout échoue, renvoyer un objet vide
  return {
    id: 'hero_banner',
    items: []
  };
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param limit Nombre maximum de résultats
 * @param offset Position de départ pour la pagination
 * @returns Résultats de la recherche
 */
const searchContent = async (query: string, limit = 20, offset = 0): Promise<SearchResponse> => {
  // Clé de cache unique pour cette requête
  const cacheKey = `search_${query}_${limit}_${offset}`;
  
  // Vérifier le cache
  const cachedData = getCache<SearchResponse>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      const searchTerm = `%${query.toLowerCase()}%`;
      const results: ContentItem[] = [];
      
      // Rechercher dans chaque table de contenu
      const SUPABASE_TABLES = {
        drama: 'dramas',
        anime: 'animes',
        film: 'films',
        bollywood: 'bollywood',
      } as const;
      type SupabaseTable = typeof SUPABASE_TABLES[keyof typeof SUPABASE_TABLES];
      
      const contentTables: SupabaseTable[] = Object.values(SUPABASE_TABLES);
      
      for (const table of contentTables) {
        try {
          // Mapper la table au type de contenu
          const contentType: ContentType = table === 'dramas' ? 'drama' : 
                                         table === 'animes' ? 'anime' : 
                                         table === 'films' ? 'film' : 'bollywood';
          
          // Requête à Supabase
          const { data, error } = await supabase
            .from(table as SupabaseTable)
            .select('id, title, original_title, poster, backdrop, year, rating, language, source')
            .or(`title.ilike.${searchTerm},original_title.ilike.${searchTerm}`)
            .limit(limit)
            .range(offset, offset + limit - 1);
          
          if (error) {
            if (CONFIG.ENABLE_LOGGING) {
              console.error(`Erreur lors de la recherche dans ${table}:`, error);
            }
            continue;
          }
          
          if (data && data.length > 0) {
            // Transformer les données en ContentItem[]
            const items: ContentItem[] = data.map(item => ({
              id: item.id || '',
              title: item.title || '',
              original_title: item.original_title || undefined,
              poster: item.poster || '',
              backdrop: item.backdrop || undefined,
              year: typeof item.year === 'number' ? item.year : parseInt(item.year as any) || 0,
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating as any) || 0,
              language: item.language || '',
              source: item.source || '',
              type: contentType
            }));
            
            results.push(...items);
          }
        } catch (error) {
          if (CONFIG.ENABLE_LOGGING) {
            console.error(`Erreur lors de la recherche dans ${table}:`, error);
          }
        }
      }
      
      // Si des résultats ont été trouvés, créer la réponse
      if (results.length > 0) {
        // Corriger les URLs des images
        const fixedResults = fixImageUrls(results);
        
        const searchResponse: SearchResponse = {
          results: fixedResults,
          resultsCount: results.length,
          status: 'completed'
        };
        
        // Mettre en cache
        setCache(cacheKey, searchResponse);
        
        return searchResponse;
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error(`Erreur lors de la recherche de "${query}":`, error);
    }
  }
  
  // Fallback sur les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    try {
      // Récupérer toutes les données locales
      const allLocalItems = [
        ...(localDramaData?.items || []),
        ...(localAnimeData?.items || []),
        ...(localFilmData?.items || []),
        ...(localBollywoodData?.items || [])
      ];
      
      // Recherche locale
      const queryLower = query.toLowerCase().trim();
      const results = allLocalItems.filter((item: any) => {
        const title = item.title?.toLowerCase() || '';
        const originalTitle = item.original_title?.toLowerCase() || '';
        return title.includes(queryLower) || originalTitle.includes(queryLower);
      });
      
      // Pagination
      const paginatedResults = results.slice(offset, offset + limit);
      
      // Transformer les données en ContentItem[]
      const contentItems: ContentItem[] = paginatedResults.map((item: any) => {
        // Déterminer le type en fonction de la source
        let type: ContentType = 'drama';
        if (localDramaData?.items?.find((item: any) => item.id === item.id)) {
          type = 'drama';
        } else if (localAnimeData?.items?.find((item: any) => item.id === item.id)) {
          type = 'anime';
        } else if (localFilmData?.items?.find((item: any) => item.id === item.id)) {
          type = 'film';
        } else if (localBollywoodData?.items?.find((item: any) => item.id === item.id)) {
          type = 'bollywood';
        }
        
        return {
          id: item.id || '',
          title: item.title || '',
          original_title: item.original_title || undefined,
          poster: item.poster || '',
          backdrop: item.backdrop || undefined,
          year: typeof item.year === 'number' ? item.year : 0,
          rating: typeof item.rating === 'number' ? item.rating : 0,
          language: item.language || '',
          source: item.source || '',
          type
        };
      });
      
      // Corriger les URLs des images
      const fixedItems = fixImageUrls(contentItems);
      
      // Créer la réponse
      const searchResponse: SearchResponse = {
        results: fixedItems,
        resultsCount: results.length,
        status: 'completed'
      };
      
      // Mettre en cache
      setCache(cacheKey, searchResponse);
      
      return searchResponse;
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.error(`Erreur lors de la recherche locale de "${query}":`, error);
      }
    }
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return { results: [], resultsCount: 0, status: 'completed' };
}

/**
 * Définition du type pour les tables Supabase
type SupabaseTable = 'dramas' | 'animes' | 'films' | 'bollywood' | 'carousels' | 'hero_banners' | 'scraping_logs' | 'health_check';

// Type guards pour sécuriser l'accès aux données Supabase
/**
 * Vérifie si un objet est un carousel valide avec les propriétés requises
 * @param obj Objet à vérifier
 * @returns true si l'objet est un carousel valide
 */
const isCarousel = (obj: any): obj is { id: string; title: string; type: string; items: any[]; position?: number; is_active?: boolean } => {
  return obj && typeof obj === 'object' && 'id' in obj && 'title' in obj && 'type' in obj;
}

/**
 * Vérifie si un objet est une bannière héro valide avec les propriétés requises
 * @param obj Objet à vérifier
 * @returns true si l'objet est une bannière héro valide
 */
const isHeroBanner = (obj: any): obj is { id: string; items: any[] } => {
  return obj && typeof obj === 'object' && 'id' in obj && 'items' in obj && Array.isArray(obj.items);
}

/**
 * Vérifie si un objet est une bannière héro item valide avec les propriétés requises
 * @param obj Objet à vérifier
 * @returns true si l'objet est une bannière héro item valide
 */
const isHeroBannerItem = (obj: any): obj is { id: string; title: string; description: string; backdrop?: string; image?: string; poster?: string; type: string; content_id?: string } => {
  return obj && typeof obj === 'object' && 'id' in obj && 'title' in obj;
}

const isSupabaseTable = (table: string): table is SupabaseTable => {
  return ['dramas', 'animes', 'films', 'bollywood', 'carousels', 'hero_banners', 'scraping_logs', 'health_check'].includes(table);
}

// Correction des erreurs d'accès aux propriétés dans les résultats Supabase
const isCarouselData = (obj: any): obj is { items: any[] } => {
  return obj && typeof obj === 'object' && 'items' in obj && Array.isArray(obj.items);
}

// Exporter les types et données
export {
  CONFIG,
  fixImageUrls,
  setCache,
  getCache,
  getContentDetails,
  getCarousels,
  getHeroBanners,
  searchContent
};

// Ré-exporter les types depuis le module de types
export type { ContentItem, ContentType, Carousel, HeroBanner, HeroBannerItem, SearchResponse };

interface LocalContentItem extends ContentItem {
  backdrop: string;
}

// Définition du type pour les tables Supabase
type SupabaseTable = 'dramas' | 'animes' | 'films' | 'bollywood' | 'carousels' | 'hero_banners' | 'scraping_logs' | 'health_check';
