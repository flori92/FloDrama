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
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    return !error && !!data;
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error('Erreur de connexion à Supabase:', error);
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
export async function getContentsByCategory(category: ContentType, limit = 20, offset = 0): Promise<ContentItem[]> {
  // Vérifier le cache
  const cacheKey = `category_${category}_${limit}_${offset}`;
  const cachedData = getCache<ContentItem[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Table à utiliser en fonction de la catégorie
      const table = category === 'trending' ? 'dramas' : `${category}s`;
      
      // Requête à Supabase
      let query = supabase
        .from(table)
        .select('id, title, original_title, poster, backdrop, year, rating, language, source');
      
      // Ajouter un tri par popularité pour la catégorie "trending"
      if (category === 'trending') {
        query = query.order('popularity_score', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // Ajouter pagination
      query = query.range(offset, offset + limit - 1);
      
      // Exécuter la requête
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transformer les données au format ContentItem
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
    let localItems: ContentItem[] = [];
    
    // Sélectionner la source locale appropriée
    switch (category) {
      case 'drama':
        localItems = localDramaData?.items || [];
        break;
      case 'anime':
        localItems = localAnimeData?.items || [];
        break;
      case 'film':
        localItems = localFilmData?.items || [];
        break;
      case 'bollywood':
        localItems = localBollywoodData?.items || [];
        break;
      case 'trending':
        // Mélanger des éléments de toutes les catégories
        const dramaItems = (localDramaData?.items || []).slice(0, 5);
        const animeItems = (localAnimeData?.items || []).slice(0, 5);
        const filmItems = (localFilmData?.items || []).slice(0, 5);
        const bollywoodItems = (localBollywoodData?.items || []).slice(0, 5);
        
        localItems = [...dramaItems, ...animeItems, ...filmItems, ...bollywoodItems]
          .sort(() => Math.random() - 0.5) // Mélanger
          .slice(0, limit);
        break;
    }
    
    // Pagination
    const paginatedItems = localItems.slice(offset, offset + limit);
    
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
export async function getContentDetails(contentId: string): Promise<ContentDetail | null> {
  // Vérifier le cache
  const cacheKey = `content_details_${contentId}`;
  const cachedData = getCache<ContentDetail>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      // Rechercher dans toutes les tables de contenu
      const contentTables = ['dramas', 'animes', 'films', 'bollywood'];
      
      // Vérifier chaque table
      for (const table of contentTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', contentId)
          .single();
        
        if (error) {
          // Si l'erreur est "No rows found", continuer à la table suivante
          if (error.code === 'PGRST116') {
            continue;
          }
          
          // Pour les autres erreurs, journaliser et continuer
          if (CONFIG.ENABLE_LOGGING) {
            console.error(`Erreur lors de la recherche dans ${table}:`, error);
          }
          continue;
        }
        
        if (data) {
          // Déterminer le type en fonction de la table
          const type: ContentType = table === 'dramas' ? 'drama' : 
                                   table === 'animes' ? 'anime' : 
                                   table === 'films' ? 'film' : 'bollywood';
          
          // Transformer au format ContentDetail
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
            url: `/${type}/${data.id}`,
            description: data.description || '',
            synopsis: data.synopsis || '',
            genres: Array.isArray(data.genres) ? data.genres : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            actors: Array.isArray(data.actors) ? data.actors : [],
            director: data.director || undefined,
            episode_count: data.episode_count || undefined,
            episodes: data.episodes || undefined,
            seasons: data.seasons || undefined,
            duration: data.duration || undefined,
            status: data.status || undefined,
            release_date: data.release_date || undefined,
            streaming_urls: Array.isArray(data.streaming_urls) ? data.streaming_urls : [],
            trailers: Array.isArray(data.trailers) ? data.trailers : [],
            images: Array.isArray(data.images) ? data.images : [],
            subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
            related_content: Array.isArray(data.related_content) ? data.related_content : [],
            user_ratings: data.user_ratings || { average: 0, count: 0 },
            popularity_score: data.popularity_score || 0,
            is_premium: !!data.is_premium,
            gallery: Array.isArray(data.gallery) ? data.gallery : []
          };
          
          // Corriger les URLs des images
          const fixedDetail = fixImageUrls([contentDetail])[0];
          
          // Mettre en cache
          setCache(cacheKey, fixedDetail);
          
          return fixedDetail;
        }
      }
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error(`Erreur lors de la récupération des détails du contenu ${contentId}:`, error);
    }
  }
  
  // Si Supabase n'est pas disponible ou si le contenu n'est pas trouvé,
  // chercher dans les données locales
  if (CONFIG.USE_LOCAL_FALLBACK) {
    // Chercher dans les données locales
    const allLocalItems = [
      ...(localDramaData?.items || []),
      ...(localAnimeData?.items || []),
      ...(localFilmData?.items || []),
      ...(localBollywoodData?.items || [])
    ];
    
    const localItem = allLocalItems.find(item => item.id === contentId);
    
    if (localItem) {
      // Créer un ContentDetail à partir de l'élément local
      const localDetail: ContentDetail = {
        ...localItem,
        url: `/${localItem.type || 'drama'}/${localItem.id}`,
        description: localItem.description || '',
        synopsis: localItem.synopsis || '',
        genres: [],
        tags: [],
        actors: [],
        streaming_urls: [],
        trailers: [],
        images: [],
        subtitles: [],
        popularity_score: 0,
        is_premium: false,
        gallery: []
      };
      
      // Mettre en cache
      setCache(cacheKey, localDetail);
      
      return localDetail;
    }
  }
  
  // Si aucun contenu n'est trouvé, renvoyer null
  return null;
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels
 */
export async function getCarousels(): Promise<Carousel[]> {
  // Vérifier le cache
  const cacheKey = 'carousels';
  const cachedData = getCache<Carousel[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      const { data, error } = await supabase
        .from('carousels')
        .select('*')
        .order('position', { ascending: true })
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transformer au format Carousel
        const carousels: Carousel[] = data.map(carousel => ({
          title: carousel.title,
          type: carousel.type,
          items: fixImageUrls(carousel.items || [])
        }));
        
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
  if (CONFIG.USE_LOCAL_FALLBACK && localCarouselsData?.carousels) {
    const localCarousels = localCarouselsData.carousels.map(carousel => ({
      ...carousel,
      items: fixImageUrls(carousel.items)
    }));
    
    // Mettre en cache
    setCache(cacheKey, localCarousels);
    
    return localCarousels;
  }
  
  // Si aucun carrousel n'est trouvé, créer des carrousels par défaut
  // basés sur les catégories
  const defaultCarousels: Carousel[] = [];
  
  // Récupérer des éléments pour chaque catégorie
  const categories: ContentType[] = ['drama', 'anime', 'film', 'bollywood', 'trending'];
  
  for (const category of categories) {
    try {
      const items = await getContentsByCategory(category, 10, 0);
      
      if (items.length > 0) {
        defaultCarousels.push({
          title: category === 'drama' ? 'Dramas populaires' :
                category === 'anime' ? 'Animes à découvrir' :
                category === 'film' ? 'Films à voir' :
                category === 'bollywood' ? 'Bollywood' : 'Tendances',
          type: category,
          items
        });
      }
    } catch (error) {
      if (CONFIG.ENABLE_LOGGING) {
        console.error(`Erreur lors de la création du carrousel par défaut pour ${category}:`, error);
      }
    }
  }
  
  // Mettre en cache
  setCache(cacheKey, defaultCarousels);
  
  return defaultCarousels;
}

/**
 * Récupère les bannières pour le hero banner
 * @returns Bannières pour le hero banner
 */
export async function getHeroBanners(): Promise<HeroBanner> {
  // Vérifier le cache
  const cacheKey = 'hero_banners';
  const cachedData = getCache<HeroBanner>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Vérifier si Supabase est disponible
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('position', { ascending: true })
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Récupérer les détails complets pour chaque bannière
        const bannerItems: ContentItem[] = [];
        
        for (const banner of data) {
          if (banner.content_id) {
            // Récupérer les détails du contenu
            const contentDetail = await getContentDetails(banner.content_id);
            
            if (contentDetail) {
              bannerItems.push({
                id: contentDetail.id,
                title: contentDetail.title,
                original_title: contentDetail.original_title,
                poster: contentDetail.poster,
                backdrop: banner.image || contentDetail.backdrop || contentDetail.poster,
                year: contentDetail.year,
                rating: contentDetail.rating,
                language: contentDetail.language,
                source: contentDetail.source,
                type: contentDetail.type,
                description: banner.description || contentDetail.synopsis
              });
            }
          }
        }
        
        // Si des éléments ont été trouvés, créer la bannière
        if (bannerItems.length > 0) {
          const heroBanner: HeroBanner = {
            banners: fixImageUrls(bannerItems)
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
  if (CONFIG.USE_LOCAL_FALLBACK && localHeroBannersData?.banners) {
    const localBanners: HeroBanner = {
      banners: fixImageUrls(localHeroBannersData.banners)
    };
    
    // Mettre en cache
    setCache(cacheKey, localBanners);
    
    return localBanners;
  }
  
  // Si aucune bannière n'est trouvée, créer des bannières par défaut
  // basées sur les contenus populaires
  try {
    const trendingItems = await getContentsByCategory('trending', 5, 0);
    
    if (trendingItems.length > 0) {
      const defaultBanners: HeroBanner = {
        banners: trendingItems
      };
      
      // Mettre en cache
      setCache(cacheKey, defaultBanners);
      
      return defaultBanners;
    }
  } catch (error) {
    if (CONFIG.ENABLE_LOGGING) {
      console.error('Erreur lors de la création des bannières par défaut:', error);
    }
  }
  
  // Si tout échoue, renvoyer un tableau vide
  return { banners: [] };
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param limit Nombre maximum de résultats
 * @param offset Position de départ pour la pagination
 * @returns Résultats de la recherche
 */
export async function searchContent(query: string, limit = 20, offset = 0): Promise<SearchResponse> {
  if (!query || query.trim() === '') {
    return { results: [], resultsCount: 0 };
  }
  
  // Vérifier le cache
  const cacheKey = `search_${query.toLowerCase().trim()}_${limit}_${offset}`;
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
  getContentsByCategory as getCategoryContent,
  getContentDetails,
  getCarousels,
  getHeroBanners,
  searchContent,
  ContentItem,
  ContentDetail,
  ContentType,
  Carousel,
  HeroBanner,
  SearchResponse
};
