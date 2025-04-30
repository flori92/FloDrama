// Service de récupération des contenus depuis Supabase
// Version adaptée pour la migration AWS → Supabase (avril 2025)
import { ContentItem, ContentDetail, ContentType, Carousel, HeroBanner, SearchResponse } from '../types/content.types';
import { supabase } from '../config/supabase';

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
function setCache<T>(key: string, data: T): void {
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
function getCache<T>(key: string): T | null {
  // Vérifier le cache en mémoire
  const memoryCache = cache[key];
  if (memoryCache && (Date.now() - memoryCache.timestamp) < CONFIG.CACHE_DURATION) {
    return memoryCache.data as T;
  }
  
  // Vérifier le cache dans localStorage si activé
  if (CONFIG.USE_LOCAL_CACHE && typeof window !== 'undefined') {
    try {
      const storedCache = localStorage.getItem(`flodrama_${key}`);
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        if ((Date.now() - parsed.timestamp) < CONFIG.CACHE_DURATION) {
          cache[key] = parsed; // Mise à jour du cache en mémoire
          return parsed.data as T;
        }
      }
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.warn('Erreur lors de la récupération depuis localStorage:', error);
      }
    }
  }
  
  return null;
}

/**
 * Corrige les URLs des images pour utiliser Supabase Storage ou un domaine complet
 * @param items Tableau d'éléments contenant des URLs d'images
 * @returns Tableau avec les URLs d'images corrigées
 */
function fixImageUrls<T extends {poster?: string; imageUrl?: string; posterUrl?: string; backdrop?: string}>(items: T[]): T[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => {
    if (!item) return item;
    
    // Copier l'élément pour éviter de modifier l'original
    const fixedItem = { ...item };
    
    // Normaliser les champs d'image
    if (fixedItem.imageUrl && !fixedItem.poster) {
      fixedItem.poster = fixedItem.imageUrl;
    }
    
    if (fixedItem.posterUrl && !fixedItem.poster) {
      fixedItem.poster = fixedItem.posterUrl;
    }
    
    // Corriger l'URL du poster si nécessaire
    if (fixedItem.poster && !fixedItem.poster.startsWith('http')) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co';
      fixedItem.poster = `${supabaseUrl}/storage/v1/object/public/images/${fixedItem.poster}`;
    }
    
    // Corriger l'URL du backdrop si nécessaire
    if (fixedItem.backdrop && !fixedItem.backdrop.startsWith('http')) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co';
      fixedItem.backdrop = `${supabaseUrl}/storage/v1/object/public/images/${fixedItem.backdrop}`;
    }
    
    return fixedItem;
  });
}

/**
 * Vérifie si la connexion à Supabase est disponible
 * @returns true si la connexion est disponible, false sinon
 */
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    return !error && data !== null;
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.warn('Erreur lors de la vérification de la connexion Supabase:', error);
    }
    return false;
  }
}

/**
 * Récupère les contenus d'une catégorie spécifique
 * @param category Catégorie de contenu (drama, anime, film, bollywood)
 * @param limit Nombre maximum d'éléments à récupérer
 * @param offset Position de départ pour la pagination
 * @returns Liste des contenus de la catégorie
 */
async function getContentsByCategory(category: ContentType, limit = 20, offset = 0): Promise<ContentItem[]> {
  // Clé de cache unique pour cette requête
  const cacheKey = `content_${category}_${limit}_${offset}`;
  
  // Vérifier le cache
  const cachedData = getCache<ContentItem[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Déterminer la table Supabase en fonction de la catégorie
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
          throw new Error(`Catégorie non supportée: ${category}`);
      }
      
      // Récupérer les données depuis Supabase
      const { data, error } = await supabase
        .from(table)
        .select('id, title, original_title, poster, backdrop, year, rating, language, source')
        .order('year', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transformer les données en ContentItem
        const items: ContentItem[] = data.map(item => ({
          id: item.id,
          title: item.title,
          original_title: item.original_title || undefined,
          poster: item.poster || '',
          backdrop: item.backdrop || undefined,
          year: typeof item.year === 'number' ? item.year : parseInt(item.year) || 0,
          rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 0,
          language: item.language,
          source: item.source,
          type: category
        }));
        
        // Corriger les URLs des images
        const fixedItems = fixImageUrls(items);
        
        // Mettre en cache
        setCache(cacheKey, fixedItems);
        
        return fixedItems;
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error(`Erreur lors de la récupération des contenus ${category}:`, error);
    }
  }
  
  // Fallback sur les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    let localData;
    switch (category) {
      case 'drama':
        localData = localDramaData;
        break;
      case 'anime':
        localData = localAnimeData;
        break;
      case 'film':
        localData = localFilmData;
        break;
      case 'bollywood':
        localData = localBollywoodData;
        break;
      default:
        localData = { items: [] };
    }
    
    // Pagination des données locales
    const items = localData?.items || [];
    const paginatedItems = items.slice(offset, offset + limit);
    
    // Corriger les URLs des images
    const fixedItems = fixImageUrls(paginatedItems);
    
    // Mettre en cache
    setCache(cacheKey, fixedItems);
    
    return fixedItems;
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return [];
}

/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @returns Détails du contenu ou null si non trouvé
 */
async function getContentDetails(contentId: string): Promise<ContentDetail | null> {
  // Clé de cache unique pour cette requête
  const cacheKey = `content_detail_${contentId}`;
  
  // Vérifier le cache
  const cachedData = getCache<ContentDetail | null>(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Essayer de récupérer le contenu depuis chaque table
      const tables = ['dramas', 'animes', 'films', 'bollywood'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', contentId)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // Code d'erreur pour "No rows found"
            throw error;
          }
          continue; // Essayer la table suivante
        }
        
        if (data) {
          // Déterminer le type en fonction de la table
          const type: ContentType = table === 'dramas' ? 'drama' : 
                                  table === 'animes' ? 'anime' : 
                                  table === 'films' ? 'film' : 'bollywood';
          
          // Transformer les données en ContentDetail
          const contentDetail: ContentDetail = {
            id: data.id,
            title: data.title,
            original_title: data.original_title || undefined,
            poster: data.poster || '',
            backdrop: data.backdrop || undefined,
            year: typeof data.year === 'number' ? data.year : parseInt(data.year) || 0,
            rating: typeof data.rating === 'number' ? data.rating : parseFloat(data.rating) || 0,
            language: data.language,
            source: data.source,
            type,
            description: data.description || '',
            synopsis: data.synopsis || '',
            genres: data.genres || [],
            tags: data.tags || undefined,
            actors: data.actors || undefined,
            director: data.director || undefined,
            episode_count: data.episode_count || undefined,
            episodes: data.episodes || undefined,
            seasons: data.seasons || undefined,
            duration: data.duration || undefined,
            status: data.status || undefined,
            release_date: data.release_date || undefined,
            streaming_urls: data.streaming_urls || undefined,
            trailers: data.trailers || undefined,
            images: data.images || undefined,
            subtitles: data.subtitles || undefined,
            related_content: data.related_content || undefined,
            user_ratings: data.user_ratings || undefined,
            popularity_score: data.popularity_score || undefined,
            is_premium: data.is_premium || undefined,
            gallery: data.gallery || undefined
          };
          
          // Corriger les URLs des images
          const fixedItem = fixImageUrls([contentDetail])[0];
          
          // Mettre en cache
          setCache(cacheKey, fixedItem);
          
          return fixedItem;
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
    const allLocalItems = [
      ...(localDramaData?.items || []),
      ...(localAnimeData?.items || []),
      ...(localFilmData?.items || []),
      ...(localBollywoodData?.items || [])
    ];
    
    const localItem = allLocalItems.find(item => item.id === contentId);
    
    if (localItem) {
      // Transformer en ContentDetail
      const contentDetail: ContentDetail = {
        ...localItem,
        description: localItem.description || '',
        synopsis: localItem.synopsis || '',
        genres: localItem.genres || []
      };
      
      // Corriger les URLs des images
      const fixedItem = fixImageUrls([contentDetail])[0];
      
      // Mettre en cache
      setCache(cacheKey, fixedItem);
      
      return fixedItem;
    }
  }
  
  // Si le contenu n'est pas trouvé, mettre null en cache pour éviter des requêtes répétées
  setCache(cacheKey, null);
  
  return null;
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels
 */
async function getCarousels(): Promise<Carousel[]> {
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
      const { data: carouselsData, error: carouselsError } = await supabase
        .from('carousels')
        .select('*')
        .order('position', { ascending: true });
      
      if (carouselsError) {
        throw carouselsError;
      }
      
      if (carouselsData && carouselsData.length > 0) {
        // Transformer les données en Carousel
        const carousels: Carousel[] = [];
        
        for (const carousel of carouselsData) {
          // Récupérer les éléments du carrousel
          const { data: itemsData, error: itemsError } = await supabase
            .from('carousel_items')
            .select('content_id, content_type')
            .eq('carousel_id', carousel.id);
          
          if (itemsError) {
            throw itemsError;
          }
          
          if (itemsData && itemsData.length > 0) {
            // Récupérer les détails de chaque élément
            const items: ContentItem[] = [];
            
            for (const item of itemsData) {
              const contentDetail = await getContentDetails(item.content_id);
              if (contentDetail) {
                items.push({
                  id: contentDetail.id,
                  title: contentDetail.title,
                  original_title: contentDetail.original_title,
                  poster: contentDetail.poster,
                  backdrop: contentDetail.backdrop,
                  year: contentDetail.year,
                  rating: contentDetail.rating,
                  language: contentDetail.language,
                  source: contentDetail.source,
                  type: contentDetail.type
                });
              }
            }
            
            if (items.length > 0) {
              carousels.push({
                id: carousel.id,
                title: carousel.title,
                type: carousel.type,
                items: fixImageUrls(items),
                position: carousel.position,
                is_active: carousel.is_active
              });
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
  if (CONFIG.USE_LOCAL_FALLBACK && localCarouselsData) {
    const carousels: Carousel[] = [];
    
    for (const carousel of localCarouselsData) {
      const items: ContentItem[] = [];
      
      // Récupérer les détails de chaque élément
      for (const itemId of carousel.item_ids || []) {
        const contentDetail = await getContentDetails(itemId);
        if (contentDetail) {
          items.push({
            id: contentDetail.id,
            title: contentDetail.title,
            original_title: contentDetail.original_title,
            poster: contentDetail.poster,
            backdrop: contentDetail.backdrop,
            year: contentDetail.year,
            rating: contentDetail.rating,
            language: contentDetail.language,
            source: contentDetail.source,
            type: contentDetail.type
          });
        }
      }
      
      if (items.length > 0) {
        carousels.push({
          id: carousel.id,
          title: carousel.title,
          type: carousel.type,
          items: fixImageUrls(items),
          position: carousel.position,
          is_active: carousel.is_active
        });
      }
    }
    
    // Mettre en cache
    setCache(cacheKey, carousels);
    
    return carousels;
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return [];
}

/**
 * Récupère les bannières pour le hero banner
 * @returns Bannières pour le hero banner
 */
async function getHeroBanners(): Promise<HeroBanner> {
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
        .from('hero_banners')
        .select('*')
        .single();
      
      if (bannersError) {
        throw bannersError;
      }
      
      if (bannersData) {
        // Récupérer les éléments de la bannière
        const { data: itemsData, error: itemsError } = await supabase
          .from('hero_banner_items')
          .select('*')
          .eq('banner_id', bannersData.id);
        
        if (itemsError) {
          throw itemsError;
        }
        
        if (itemsData && itemsData.length > 0) {
          // Transformer les données en HeroBanner
          const heroBanner: HeroBanner = {
            id: bannersData.id,
            items: []
          };
          
          for (const item of itemsData) {
            // Récupérer les détails du contenu associé
            const contentDetail = await getContentDetails(item.content_id);
            
            if (contentDetail) {
              heroBanner.items.push({
                id: item.id,
                title: item.title || contentDetail.title,
                description: item.description || contentDetail.description,
                backdrop: item.backdrop || contentDetail.backdrop || '',
                poster: item.poster || contentDetail.poster,
                type: contentDetail.type,
                content_id: item.content_id
              });
            }
          }
          
          // Corriger les URLs des images
          heroBanner.items = fixImageUrls(heroBanner.items);
          
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
  if (CONFIG.USE_LOCAL_FALLBACK && localHeroBannersData) {
    const heroBanner: HeroBanner = {
      id: localHeroBannersData.id || 'local_hero_banner',
      items: []
    };
    
    for (const item of localHeroBannersData.items || []) {
      // Récupérer les détails du contenu associé
      const contentDetail = await getContentDetails(item.content_id);
      
      if (contentDetail) {
        heroBanner.items.push({
          id: item.id,
          title: item.title || contentDetail.title,
          description: item.description || contentDetail.description,
          backdrop: item.backdrop || contentDetail.backdrop || '',
          poster: item.poster || contentDetail.poster,
          type: contentDetail.type,
          content_id: item.content_id
        });
      }
    }
    
    // Corriger les URLs des images
    heroBanner.items = fixImageUrls(heroBanner.items);
    
    // Mettre en cache
    setCache(cacheKey, heroBanner);
    
    return heroBanner;
  }
  
  // Si tout échoue, renvoyer une bannière vide
  return { id: 'empty_banner', items: [] };
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param limit Nombre maximum de résultats
 * @param offset Position de départ pour la pagination
 * @returns Résultats de la recherche
 */
async function searchContent(query: string, limit = 20, offset = 0): Promise<SearchResponse> {
  if (!query || query.trim() === '') {
    return { results: [], resultsCount: 0, status: 'completed' };
  }
  
  // Clé de cache unique pour cette requête
  const cacheKey = `search_${query.toLowerCase()}_${limit}_${offset}`;
  
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
      const contentTables = ['dramas', 'animes', 'films', 'bollywood'];
      
      for (const table of contentTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id, title, original_title, poster, backdrop, year, rating, language, source')
            .or(`title.ilike.${searchTerm},original_title.ilike.${searchTerm}`)
            .limit(limit)
            .range(offset, offset + limit - 1);
          
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            // Déterminer le type en fonction de la table
            const type: ContentType = table === 'dramas' ? 'drama' : 
                                    table === 'animes' ? 'anime' : 
                                    table === 'films' ? 'film' : 'bollywood';
            
            // Ajouter les résultats
            const items: ContentItem[] = data.map(item => ({
              id: item.id,
              title: item.title,
              original_title: item.original_title || undefined,
              poster: item.poster || '',
              backdrop: item.backdrop || undefined,
              year: typeof item.year === 'number' ? item.year : parseInt(item.year) || 0,
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 0,
              language: item.language,
              source: item.source,
              type
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
        const searchResponse: SearchResponse = {
          results: fixImageUrls(results),
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
    const allLocalItems = [
      ...(localDramaData?.items || []),
      ...(localAnimeData?.items || []),
      ...(localFilmData?.items || []),
      ...(localBollywoodData?.items || [])
    ];
    
    // Recherche locale
    const queryLower = query.toLowerCase().trim();
    const results = allLocalItems.filter(item => 
      item.title.toLowerCase().includes(queryLower) || 
      (item.original_title && item.original_title.toLowerCase().includes(queryLower))
    );
    
    // Pagination
    const paginatedResults = results.slice(offset, offset + limit);
    
    // Créer la réponse
    const searchResponse: SearchResponse = {
      results: fixImageUrls(paginatedResults),
      resultsCount: results.length,
      status: 'completed'
    };
    
    // Mettre en cache
    setCache(cacheKey, searchResponse);
    
    return searchResponse;
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return { results: [], resultsCount: 0, status: 'completed' };
}

// Exporter les types et données
export {
  CONFIG,
  fixImageUrls,
  setCache,
  getCache,
  getContentsByCategory,
  getContentsByCategory as getCategoryContent,
  getContentDetails,
  getCarousels,
  getHeroBanners,
  searchContent
};

// Ré-exporter les types depuis le module de types
export type { ContentItem, ContentDetail, ContentType, Carousel, HeroBanner, SearchResponse };
