/**
 * IndexationWorker.js
 * 
 * Worker dédié pour l'indexation des données en arrière-plan
 * Permet de ne pas bloquer le thread principal pendant l'indexation
 */

// Importer les services nécessaires
/* global importScripts, SearchIndexService, SmartScrapingService */
importScripts('/services/SearchIndexService.cjs');
importScripts('/services/SmartScrapingService.cjs');

// Référence aux services
const searchIndexService = SearchIndexService;
const smartScrapingService = SmartScrapingService;

// Désactiver les règles ESLint pour ce fichier spécifique
/* eslint-disable no-restricted-globals */

// Écouter les messages du thread principal
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'index_items':
      await handleIndexItems(data.items);
      break;
    
    case 'run_background_indexing':
      await handleBackgroundIndexing();
      break;
    
    case 'health_check':
      await handleHealthCheck();
      break;
      
    default:
      self.postMessage({ 
        type: 'error', 
        error: `Type de message inconnu: ${type}` 
      });
  }
};

/**
 * Gère l'indexation d'une liste d'éléments
 * @param {Array} items - Éléments à indexer
 */
async function handleIndexItems(items) {
  try {
    self.postMessage({ type: 'status', status: 'indexing', count: items.length });
    
    const result = await searchIndexService.indexItems(items);
    
    self.postMessage({ 
      type: 'result', 
      result: {
        successful: result.successful,
        failed: result.failed,
        total: items.length
      }
    });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || 'Erreur inconnue lors de l\'indexation'
    });
  }
}

/**
 * Gère l'indexation en arrière-plan
 */
async function handleBackgroundIndexing() {
  try {
    self.postMessage({ type: 'status', status: 'starting_background_indexing' });
    
    // Récupérer les différents types de contenu en parallèle
    const [popular, movies, kshows, animes] = await Promise.allSettled([
      smartScrapingService.getPopular(2),
      smartScrapingService.getPopularMovies(2),
      smartScrapingService.getPopularKshows(2),
      smartScrapingService.getPopularAnimes(2)
    ]);
    
    // Fusionner tous les résultats pour l'indexation
    const allItems = [
      ...(popular.status === 'fulfilled' ? popular.value : []),
      ...(movies.status === 'fulfilled' ? movies.value : []),
      ...(kshows.status === 'fulfilled' ? kshows.value : []),
      ...(animes.status === 'fulfilled' ? animes.value : [])
    ];
    
    // Dédupliquer les éléments par ID
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id || item.title, item])).values()
    );
    
    self.postMessage({ 
      type: 'status', 
      status: 'indexing_background',
      count: uniqueItems.length
    });
    
    // Indexer les éléments
    const result = await searchIndexService.indexItems(uniqueItems);
    
    // Compter les résultats
    const results = {
      popular: popular.status === 'fulfilled' ? popular.value.length : 0,
      movies: movies.status === 'fulfilled' ? movies.value.length : 0,
      kshows: kshows.status === 'fulfilled' ? kshows.value.length : 0,
      animes: animes.status === 'fulfilled' ? animes.value.length : 0,
      total: uniqueItems.length,
      indexed: result.successful,
      failed: result.failed
    };
    
    self.postMessage({ 
      type: 'result', 
      result: results
    });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || 'Erreur inconnue lors de l\'indexation en arrière-plan'
    });
  }
}

/**
 * Vérifie l'état des services
 */
async function handleHealthCheck() {
  try {
    const health = await searchIndexService.healthCheck();
    
    self.postMessage({ 
      type: 'health_result', 
      health: {
        ...health,
        worker: true,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || 'Erreur lors de la vérification de l\'état des services'
    });
  }
}

// Informer que le worker est prêt
self.postMessage({ type: 'ready' });

/* eslint-enable no-restricted-globals */
