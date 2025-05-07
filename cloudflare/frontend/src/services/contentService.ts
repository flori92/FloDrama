/**
 * Service de gestion des contenus par catégorie
 */

import { ContentItem } from '../types/content';
// Fonction pour optimiser les URLs des médias dans la liste d'éléments
function optimizeContentItems(items: ContentItem[]): ContentItem[] {
  return items.map(item => ({
    ...item,
    poster: item.poster?.startsWith('http') ? item.poster : `https://flodrama-api.florifavi.workers.dev/media/${item.id}_poster?type=poster`,
    backdrop: item.backdrop?.startsWith('http') ? item.backdrop : `https://flodrama-api.florifavi.workers.dev/media/${item.id}_backdrop?type=backdrop`,
    trailer_url: item.trailer_url?.startsWith('http') ? item.trailer_url : `https://flodrama-api.florifavi.workers.dev/media/${item.id}_trailer?type=trailer`
  }));
}

// URL des données locales
const LOCAL_DATA_URL = '/src/data/content.json';

/**
 * Récupère les contenus pour une catégorie spécifique avec filtrage
 */
export async function getContentByCategory(
  category: string,
  filters: {
    genre?: string;
    country?: string;
    year?: string;
    season?: string;
    decade?: string;
    sort_by?: string;
  } = {}
): Promise<ContentItem[]> {
  try {
    // Récupérer les données depuis le fichier local
    const response = await fetch(LOCAL_DATA_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    const allItems: ContentItem[] = data.data || [];
    
    // Filtrer par catégorie
    let filteredItems = allItems.filter(item => {
      const itemCategory = item.content_type?.toLowerCase() || '';
      return itemCategory === category.toLowerCase();
    });
    
    // Appliquer les filtres supplémentaires
    if (filters.genre) {
      filteredItems = filteredItems.filter(item => {
        const genres = item.genres?.map(g => g.toLowerCase()) || [];
        return genres.includes(filters.genre!.toLowerCase());
      });
    }
    
    if (filters.country) {
      filteredItems = filteredItems.filter(item => {
        return item.country?.toLowerCase() === filters.country!.toLowerCase();
      });
    }
    
    if (filters.year) {
      filteredItems = filteredItems.filter(item => {
        return item.year?.toString() === filters.year;
      });
    }
    
    if (filters.season) {
      filteredItems = filteredItems.filter(item => {
        // On utilise une propriété personnalisée qui peut ne pas exister dans le type
        const itemSeason = (item as any).season;
        return itemSeason?.toLowerCase() === filters.season!.toLowerCase();
      });
    }
    
    if (filters.decade) {
      filteredItems = filteredItems.filter(item => {
        // Convertir en nombre pour éviter les erreurs de typage
        const year = typeof item.year === 'string' ? parseInt(item.year) : (item.year || 0);
        const decade = filters.decade!.toLowerCase();
        
        if (decade === 'classiques') {
          return year < 1980;
        }
        
        const decadeStart = parseInt(decade.substring(0, 4));
        return year >= decadeStart && year < decadeStart + 10;
      });
    }
    
    // Trier les résultats
    if (filters.sort_by) {
      filteredItems.sort((a, b) => {
        switch (filters.sort_by) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'release_date':
            // Convertir en nombre pour éviter les erreurs de typage
            const yearA = typeof a.year === 'string' ? parseInt(a.year) : (a.year || 0);
            const yearB = typeof b.year === 'string' ? parseInt(b.year) : (b.year || 0);
            return yearB - yearA;
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
          case 'popularity':
          default:
            return (b.rating || 0) - (a.rating || 0);
        }
      });
    }
    
    // Optimiser les URLs des médias
    return optimizeContentItems(filteredItems);
  } catch (error) {
    console.error(`Erreur lors du chargement des contenus ${category}:`, error);
    return [];
  }
}
