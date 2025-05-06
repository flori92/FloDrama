/**
 * Service d'intégration Cloudflare D1 pour FloDrama
 * 
 * Ce module fournit des fonctions pour interagir avec la base de données D1
 * tout en offrant un fallback sur les données mockées en cas d'erreur.
 */

// Importation des données mockées pour le fallback
import { mockData } from './mock-data';

/**
 * Vérifie si la base de données D1 est disponible
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<boolean>} - true si D1 est disponible, false sinon
 */
export async function isD1Available(db) {
  if (!db) return false;
  
  try {
    // Tentative d'exécution d'une requête simple
    const result = await db.prepare('SELECT 1 AS test').first();
    return result && result.test === 1;
  } catch (error) {
    console.error('Erreur lors de la vérification de D1 :', error);
    return false;
  }
}

/**
 * Récupère le statut de la base de données D1
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<Object>} - Informations sur le statut de D1
 */
export async function getD1Status(db) {
  const status = {
    available: false,
    tables: [],
    tablesCount: 0,
    error: null
  };
  
  if (!db) return status;
  
  try {
    // Vérification de la disponibilité
    status.available = await isD1Available(db);
    
    if (status.available) {
      // Récupération des tables
      const tables = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('dramas', 'films', 'animes', 'bollywood')
      `).all();
      
      status.tables = tables.results.map(table => table.name);
      status.tablesCount = tables.results.length;
    }
  } catch (error) {
    status.error = error.message;
  }
  
  return status;
}

/**
 * Récupère tous les éléments d'une table
 * @param {D1Database} db - Instance de la base de données D1
 * @param {string} table - Nom de la table
 * @param {Array} mockItems - Données mockées pour fallback
 * @returns {Promise<Array>} - Liste des éléments
 */
export async function getAllItems(db, table, mockItems) {
  if (!db || !(await isD1Available(db))) {
    return mockItems;
  }
  
  try {
    const items = await db.prepare(`SELECT * FROM ${table}`).all();
    
    // Conversion des champs JSON
    return items.results.map(item => {
      // Convertir les genres de JSON string à array
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des éléments depuis ${table}:`, error);
    return mockItems;
  }
}

/**
 * Récupère un élément par son ID
 * @param {D1Database} db - Instance de la base de données D1
 * @param {string} table - Nom de la table
 * @param {string} id - ID de l'élément
 * @param {Array} mockItems - Données mockées pour fallback
 * @returns {Promise<Object|null>} - L'élément trouvé ou null
 */
export async function getItemById(db, table, id, mockItems) {
  if (!db || !(await isD1Available(db))) {
    return mockItems.find(item => item.id === id) || null;
  }
  
  try {
    const item = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    
    if (!item) {
      return mockItems.find(item => item.id === id) || null;
    }
    
    // Convertir les genres de JSON string à array
    if (item.genres && typeof item.genres === 'string') {
      try {
        item.genres = JSON.parse(item.genres);
      } catch (e) {
        // En cas d'erreur, laisser tel quel
        console.error(`Erreur lors du parsing des genres pour ${id}:`, e);
      }
    }
    
    return item;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'élément ${id} depuis ${table}:`, error);
    return mockItems.find(item => item.id === id) || null;
  }
}

/**
 * Recherche des éléments dans toutes les tables
 * @param {D1Database} db - Instance de la base de données D1
 * @param {string} query - Terme de recherche
 * @returns {Promise<Array>} - Résultats de la recherche
 */
export async function searchItems(db, query) {
  if (!db || !(await isD1Available(db))) {
    return searchInMockData(query);
  }
  
  try {
    const searchQuery = `%${query}%`;
    
    const results = await db.prepare(`
      SELECT *, 'drama' as type FROM dramas 
      WHERE title LIKE ? OR description LIKE ?
      UNION ALL
      SELECT *, 'film' as type FROM films 
      WHERE title LIKE ? OR description LIKE ?
      UNION ALL
      SELECT *, 'anime' as type FROM animes 
      WHERE title LIKE ? OR description LIKE ?
      UNION ALL
      SELECT *, 'bollywood' as type FROM bollywood 
      WHERE title LIKE ? OR description LIKE ?
      LIMIT 20
    `).bind(
      searchQuery, searchQuery,
      searchQuery, searchQuery,
      searchQuery, searchQuery,
      searchQuery, searchQuery
    ).all();
    
    // Convertir les genres de JSON string à array pour chaque résultat
    return results.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Erreur lors de la recherche dans D1:', error);
    return searchInMockData(query);
  }
}

/**
 * Recherche dans les données mockées
 * @param {string} query - Terme de recherche
 * @returns {Array} - Résultats de la recherche
 */
function searchInMockData(query) {
  // Recherche dans toutes les catégories
  const allContent = [
    ...mockData.drama.map(item => ({ ...item, type: 'drama' })),
    ...mockData.film.map(item => ({ ...item, type: 'film' })),
    ...mockData.anime.map(item => ({ ...item, type: 'anime' })),
    ...mockData.bollywood.map(item => ({ ...item, type: 'bollywood' }))
  ];
  
  // Recherche par titre ou description
  const lowercaseQuery = query.toLowerCase();
  return allContent.filter(item => 
    item.title.toLowerCase().includes(lowercaseQuery) || 
    item.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Récupère les recommandations
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<Array>} - Liste des recommandations
 */
export async function getRecommendations(db) {
  if (!db || !(await isD1Available(db))) {
    return getRecommendationsFromMockData();
  }
  
  try {
    // Récupération de quelques éléments aléatoires de chaque catégorie
    const recommendations = await db.prepare(`
      SELECT * FROM (
        SELECT *, 'drama' as type FROM dramas ORDER BY RANDOM() LIMIT 2
        UNION ALL
        SELECT *, 'film' as type FROM films ORDER BY RANDOM() LIMIT 2
        UNION ALL
        SELECT *, 'anime' as type FROM animes ORDER BY RANDOM() LIMIT 2
        UNION ALL
        SELECT *, 'bollywood' as type FROM bollywood ORDER BY RANDOM() LIMIT 2
      ) ORDER BY RANDOM() LIMIT 10
    `).all();
    
    // Convertir les genres de JSON string à array pour chaque résultat
    return recommendations.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations depuis D1:', error);
    return getRecommendationsFromMockData();
  }
}

/**
 * Récupère les recommandations à partir des données mockées
 * @returns {Array} - Liste des recommandations
 */
function getRecommendationsFromMockData() {
  // Sélection aléatoire de contenus à partir des données mockées
  const allContent = [
    ...mockData.drama.map(item => ({ ...item, type: 'drama' })),
    ...mockData.film.map(item => ({ ...item, type: 'film' })),
    ...mockData.anime.map(item => ({ ...item, type: 'anime' })),
    ...mockData.bollywood.map(item => ({ ...item, type: 'bollywood' }))
  ];
  
  // Mélange aléatoire et sélection des 10 premiers éléments
  const shuffled = allContent.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

/**
 * Récupère les contenus mis en avant
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<Array>} - Liste des contenus mis en avant
 */
export async function getFeatured(db) {
  if (!db || !(await isD1Available(db))) {
    return getFeaturedFromMockData();
  }
  
  try {
    // Récupération des contenus les mieux notés
    const featured = await db.prepare(`
      SELECT * FROM (
        SELECT *, 'drama' as type FROM dramas ORDER BY rating DESC LIMIT 2
        UNION ALL
        SELECT *, 'film' as type FROM films ORDER BY rating DESC LIMIT 2
        UNION ALL
        SELECT *, 'anime' as type FROM animes ORDER BY rating DESC LIMIT 2
        UNION ALL
        SELECT *, 'bollywood' as type FROM bollywood ORDER BY rating DESC LIMIT 2
      ) ORDER BY rating DESC LIMIT 8
    `).all();
    
    // Convertir les genres de JSON string à array pour chaque résultat
    return featured.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus mis en avant depuis D1:', error);
    return getFeaturedFromMockData();
  }
}

/**
 * Récupère les contenus mis en avant à partir des données mockées
 * @returns {Array} - Liste des contenus mis en avant
 */
function getFeaturedFromMockData() {
  // Sélection des contenus les mieux notés à partir des données mockées
  const allContent = [
    ...mockData.drama.map(item => ({ ...item, type: 'drama' })),
    ...mockData.film.map(item => ({ ...item, type: 'film' })),
    ...mockData.anime.map(item => ({ ...item, type: 'anime' })),
    ...mockData.bollywood.map(item => ({ ...item, type: 'bollywood' }))
  ];
  
  // Tri par note et sélection des 8 premiers éléments
  return allContent.sort((a, b) => b.rating - a.rating).slice(0, 8);
}

/**
 * Récupère les contenus récents
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<Array>} - Liste des contenus récents
 */
export async function getRecent(db) {
  if (!db || !(await isD1Available(db))) {
    return getRecentFromMockData();
  }
  
  try {
    // Récupération des contenus les plus récents
    const recent = await db.prepare(`
      SELECT * FROM (
        SELECT *, 'drama' as type FROM dramas ORDER BY created_at DESC LIMIT 2
        UNION ALL
        SELECT *, 'film' as type FROM films ORDER BY created_at DESC LIMIT 2
        UNION ALL
        SELECT *, 'anime' as type FROM animes ORDER BY created_at DESC LIMIT 2
        UNION ALL
        SELECT *, 'bollywood' as type FROM bollywood ORDER BY created_at DESC LIMIT 2
      ) ORDER BY created_at DESC LIMIT 8
    `).all();
    
    // Convertir les genres de JSON string à array pour chaque résultat
    return recent.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus récents depuis D1:', error);
    return getRecentFromMockData();
  }
}

/**
 * Récupère les contenus récents à partir des données mockées
 * @returns {Array} - Liste des contenus récents
 */
function getRecentFromMockData() {
  // Sélection des contenus les plus récents à partir des données mockées
  const allContent = [
    ...mockData.drama.map(item => ({ ...item, type: 'drama' })),
    ...mockData.film.map(item => ({ ...item, type: 'film' })),
    ...mockData.anime.map(item => ({ ...item, type: 'anime' })),
    ...mockData.bollywood.map(item => ({ ...item, type: 'bollywood' }))
  ];
  
  // Tri par année (décroissant) et sélection des 8 premiers éléments
  return allContent.sort((a, b) => b.year - a.year).slice(0, 8);
}

/**
 * Récupère les contenus en cours de visionnage
 * @param {D1Database} db - Instance de la base de données D1
 * @returns {Promise<Array>} - Liste des contenus en cours de visionnage
 */
export async function getContinueWatching(db) {
  if (!db || !(await isD1Available(db))) {
    return getContinueWatchingFromMockData();
  }
  
  try {
    // Dans une version réelle, cela nécessiterait une authentification et un suivi des vues par utilisateur
    // Pour l'instant, nous retournons simplement quelques éléments aléatoires avec un statut de progression
    const continueWatching = await db.prepare(`
      SELECT * FROM (
        SELECT *, 'drama' as type FROM dramas ORDER BY RANDOM() LIMIT 2
        UNION ALL
        SELECT *, 'film' as type FROM films ORDER BY RANDOM() LIMIT 2
      ) ORDER BY RANDOM() LIMIT 4
    `).all();
    
    // Convertir les genres de JSON string à array et ajouter une progression aléatoire
    return continueWatching.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      
      // Ajouter une progression aléatoire
      return {
        ...item,
        progress: Math.floor(Math.random() * 90) + 10 // Progression entre 10% et 99%
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus en cours de visionnage depuis D1:', error);
    return getContinueWatchingFromMockData();
  }
}

/**
 * Récupère les contenus en cours de visionnage à partir des données mockées
 * @returns {Array} - Liste des contenus en cours de visionnage
 */
function getContinueWatchingFromMockData() {
  // Sélection aléatoire de contenus à partir des données mockées
  const allContent = [
    ...mockData.drama.map(item => ({ ...item, type: 'drama' })),
    ...mockData.film.map(item => ({ ...item, type: 'film' }))
  ];
  
  // Mélange aléatoire et sélection des 4 premiers éléments
  const shuffled = allContent.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4).map(item => ({
    ...item,
    progress: Math.floor(Math.random() * 90) + 10 // Progression entre 10% et 99%
  }));
}

/**
 * Récupère des contenus similaires
 * @param {D1Database} db - Instance de la base de données D1
 * @param {string} contentId - ID du contenu de référence
 * @param {number} limit - Nombre de résultats à retourner
 * @returns {Promise<Array>} - Liste des contenus similaires
 */
export async function getSimilarContent(db, contentId, limit = 6) {
  if (!db || !(await isD1Available(db))) {
    return getSimilarContentFromMockData(contentId, limit);
  }
  
  try {
    // Trouver le contenu de référence et sa catégorie
    let referenceContent = null;
    let referenceCategory = '';
    
    // Chercher dans les dramas
    referenceContent = await db.prepare('SELECT * FROM dramas WHERE id = ?').bind(contentId).first();
    if (referenceContent) {
      referenceCategory = 'dramas';
    } else {
      // Chercher dans les films
      referenceContent = await db.prepare('SELECT * FROM films WHERE id = ?').bind(contentId).first();
      if (referenceContent) {
        referenceCategory = 'films';
      } else {
        // Chercher dans les animes
        referenceContent = await db.prepare('SELECT * FROM animes WHERE id = ?').bind(contentId).first();
        if (referenceContent) {
          referenceCategory = 'animes';
        } else {
          // Chercher dans les bollywood
          referenceContent = await db.prepare('SELECT * FROM bollywood WHERE id = ?').bind(contentId).first();
          if (referenceContent) {
            referenceCategory = 'bollywood';
          }
        }
      }
    }
    
    if (!referenceContent) {
      // Si le contenu n'est pas trouvé dans D1, essayer avec les données mockées
      return getSimilarContentFromMockData(contentId, limit);
    }
    
    // Récupérer des contenus similaires (même catégorie, pour simplifier)
    const similar = await db.prepare(`
      SELECT *, '${referenceCategory.slice(0, -1)}' as type 
      FROM ${referenceCategory} 
      WHERE id != ? 
      ORDER BY RANDOM() 
      LIMIT ?
    `).bind(contentId, limit).all();
    
    // Convertir les genres de JSON string à array
    return similar.results.map(item => {
      if (item.genres && typeof item.genres === 'string') {
        try {
          item.genres = JSON.parse(item.genres);
        } catch (e) {
          // En cas d'erreur, laisser tel quel
          console.error(`Erreur lors du parsing des genres pour ${item.id}:`, e);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus similaires depuis D1:', error);
    return getSimilarContentFromMockData(contentId, limit);
  }
}

/**
 * Récupère des contenus similaires à partir des données mockées
 * @param {string} contentId - ID du contenu de référence
 * @param {number} limit - Nombre de résultats à retourner
 * @returns {Array} - Liste des contenus similaires
 */
function getSimilarContentFromMockData(contentId, limit = 6) {
  // Trouver le contenu de référence
  let referenceContent = null;
  let referenceCategory = '';
  
  for (const [category, items] of Object.entries(mockData)) {
    const item = items.find(item => item.id === contentId);
    if (item) {
      referenceContent = item;
      referenceCategory = category;
      break;
    }
  }
  
  if (!referenceContent) {
    return [];
  }
  
  // Trouver des contenus similaires (même catégorie, pour simplifier)
  return mockData[referenceCategory]
    .filter(item => item.id !== contentId) // Exclure le contenu de référence
    .sort(() => 0.5 - Math.random()) // Mélanger aléatoirement
    .slice(0, limit) // Limiter le nombre de résultats
    .map(item => ({
      ...item,
      type: referenceCategory.slice(0, -1) // Ajouter le type (sans le 's' final)
    }));
}
