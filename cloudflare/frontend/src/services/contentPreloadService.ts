/**
 * Service de préchargement du contenu pour FloDrama
 * 
 * Ce service permet d'optimiser les performances de chargement des contenus
 * en préchargeant des données et en mettant en cache les résultats de filtrage.
 */

import { ContentItem } from '../types/content';
import { getContentByCategory } from './contentService';
import { CONTENT_TYPES } from './contentDistributionService';

// Cache pour les résultats de filtrage
interface CacheItem {
  timestamp: number;
  items: ContentItem[];
  filters: Record<string, any>;
}

// Durée de vie du cache (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

// Cache pour chaque catégorie
const filterCache: Record<string, CacheItem[]> = {
  [CONTENT_TYPES.MOVIE]: [],
  [CONTENT_TYPES.DRAMA]: [],
  [CONTENT_TYPES.ANIME]: [],
  [CONTENT_TYPES.BOLLYWOOD]: []
};

// Limite du cache par catégorie
const CACHE_LIMIT = 10;

/**
 * Vérifie si un résultat de filtrage est présent dans le cache
 * @param category Catégorie de contenu
 * @param filters Filtres appliqués
 * @returns Contenu en cache ou null
 */
export const getCachedContent = (
  category: string,
  filters: Record<string, any>
): ContentItem[] | null => {
  const cache = filterCache[category] || [];
  const now = Date.now();
  
  // Chercher une correspondance dans le cache
  const cacheMatch = cache.find(item => {
    // Vérifier l'expiration
    if (now - item.timestamp > CACHE_TTL) {
      return false;
    }
    
    // Vérifier si les filtres correspondent
    const filterKeys = Object.keys(filters);
    return filterKeys.every(key => {
      // Ignorer les filtres vides
      if (!filters[key]) {
        return true;
      }
      return item.filters[key] === filters[key];
    });
  });
  
  return cacheMatch ? cacheMatch.items : null;
};

/**
 * Ajoute un résultat de filtrage au cache
 * @param category Catégorie de contenu
 * @param filters Filtres appliqués
 * @param items Résultats du filtrage
 */
export const cacheFilterResult = (
  category: string,
  filters: Record<string, any>,
  items: ContentItem[]
): void => {
  if (!filterCache[category]) {
    filterCache[category] = [];
  }
  
  // Ajouter au cache
  filterCache[category].unshift({
    timestamp: Date.now(),
    items,
    filters: { ...filters }
  });
  
  // Limiter la taille du cache
  if (filterCache[category].length > CACHE_LIMIT) {
    filterCache[category] = filterCache[category].slice(0, CACHE_LIMIT);
  }
};

/**
 * Charge du contenu avec gestion du cache
 * @param category Catégorie de contenu
 * @param filters Filtres à appliquer
 * @returns Liste des contenus correspondant aux critères
 */
export const loadContent = async (
  category: string,
  filters: Record<string, any>
): Promise<ContentItem[]> => {
  // Vérifier si le résultat est en cache
  const cachedResult = getCachedContent(category, filters);
  if (cachedResult) {
    console.log(`[ContentPreload] Utilisation du cache pour ${category}`);
    return cachedResult;
  }
  
  // Sinon, charger depuis le service
  try {
    const items = await getContentByCategory(category, filters);
    
    // Mettre en cache le résultat
    cacheFilterResult(category, filters, items);
    
    return items;
  } catch (error) {
    console.error(`[ContentPreload] Erreur de chargement pour ${category}:`, error);
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
};

/**
 * Précharge du contenu en arrière-plan pour améliorer la réactivité
 * @param categories Catégories à précharger
 */
export const preloadCategories = async (
  categories: string[] = Object.values(CONTENT_TYPES)
): Promise<void> => {
  console.log('[ContentPreload] Préchargement des catégories:', categories);
  
  // Charger chaque catégorie en parallèle avec des filtres vides
  const preloadPromises = categories.map(category => 
    getContentByCategory(category, {})
      .then(items => {
        // Mettre en cache sans filtres
        cacheFilterResult(category, {}, items);
        console.log(`[ContentPreload] Catégorie ${category} préchargée: ${items.length} éléments`);
        return items;
      })
      .catch(error => {
        console.error(`[ContentPreload] Erreur lors du préchargement de ${category}:`, error);
        return [];
      })
  );
  
  // Attendre que toutes les catégories soient chargées
  await Promise.all(preloadPromises);
  console.log('[ContentPreload] Préchargement terminé');
};

/**
 * Précharge des images pour améliorer l'expérience utilisateur
 * @param items Liste des contenus dont les images doivent être préchargées
 */
export const preloadImages = (items: ContentItem[]): void => {
  // Limiter le nombre d'images à précharger pour éviter de surcharger le navigateur
  const MAX_PRELOAD = 10;
  const itemsToPreload = items.slice(0, MAX_PRELOAD);
  
  // Précharger les images en arrière-plan
  requestIdleCallback(() => {
    itemsToPreload.forEach(item => {
      if (item.posterUrl) {
        const img = new Image();
        img.src = item.posterUrl;
      }
    });
  });
};

/**
 * Initialisation du service de préchargement
 * Appeler cette fonction au démarrage de l'application
 */
export const initPreloadService = (): void => {
  // Précharger toutes les catégories au démarrage
  preloadCategories();
  
  // Ajouter un listener pour précharger lors des périodes d'inactivité
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // L'utilisateur n'est plus sur la page, bon moment pour précharger
      console.log('[ContentPreload] Page en arrière-plan, préchargement additionnel...');
      preloadCategories();
    }
  });
};

export default {
  loadContent,
  preloadCategories,
  preloadImages,
  initPreloadService
};
