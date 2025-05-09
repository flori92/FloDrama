/**
 * @file contentHandler.js
 * @description Gestionnaire des requêtes de contenu pour FloDrama API
 * 
 * Ce module gère les opérations liées au contenu (films, séries, etc.) avec:
 * - Récupération des métadonnées depuis KV Store
 * - Validation proactive des liens médias
 * - Enrichissement des données avec statuts de disponibilité
 */

import { createResponse, errorResponse } from '../utils/responseHelper.js';
import { logInfo, logError, logDebug, logWarn } from '../utils/logger.js';
import { checkMediaExists } from './mediaHandler.js';
import { getMediaType } from '../utils/mediaHelper.js';

/**
 * Récupération de tous les contenus disponibles
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Object>} - Liste des contenus avec métadonnées
 */
async function getAllContents(env) {
  try {
    // Récupérer le contenu depuis KV ou fallback sur le JSON statique
    const cachedContent = await env.METADATA_STORE.get('all_content', 'json');
    
    if (cachedContent) {
      logDebug('Contenu récupéré depuis le cache KV', env);
      return cachedContent;
    }
    
    // Si pas dans KV, charger depuis le JSON de base (sera migré ultérieurement)
    logInfo('Contenu non trouvé dans KV, chargement du JSON statique', env);
    
    // Pour cette version, nous simulons le chargement du contenu
    // Dans la version finale, cela sera remplacé par un fetch du JSON ou DB
    const defaultContent = {
      source: "flodrama-api",
      timestamp: new Date().toISOString(),
      count: 10,
      data: [
        {
          id: "drama_001",
          title: "Crash Landing on You",
          original_title: "사랑의 불시착",
          description: "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente et tombe amoureuse d'un officier de l'armée nord-coréenne.",
          poster: "https://m.media-amazon.com/images/M/MV5BMzRiZWUyN2YtNDI4YS00NTg2LTg0OTgtMGI2ZjU4ODQ4Yjk3XkEyXkFqcGdeQXVyNTI5NjIyMw@@._V1_.jpg",
          backdrop: "https://m.media-amazon.com/images/M/MV5BYmY5N2I1OWYtZjY0Ni00NzIwLTgwZjItZjRkNjk2ZTE1ZDRlXkEyXkFqcGdeQXVyMTMxMTgyMzU4._V1_.jpg",
          content_type: "drama",
          trailer_url: "https://www.youtube.com/watch?v=eXMjTVL5hiY",
          // Autres métadonnées
        },
        // Autres contenus...
      ]
    };
    
    // Stocker dans le cache KV pour les prochaines requêtes
    await env.METADATA_STORE.put('all_content', JSON.stringify(defaultContent), {
      expirationTtl: 3600 // 1 heure
    });
    
    return defaultContent;
  } catch (error) {
    logError(`Erreur lors de la récupération des contenus: ${error.message}`, env);
    throw error;
  }
}

/**
 * Enrichissement des métadonnées de contenu avec statut de disponibilité
 * @param {Array} contents - Liste des contenus à enrichir
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Array>} - Contenus enrichis avec statut de disponibilité
 */
async function enrichContentMetadata(contents, env) {
  // Version simplifiée pour la première implémentation
  // Version complète à développer ultérieurement
  return Promise.all(contents.map(async (item) => {
    try {
      // Vérifier la disponibilité du trailer si présent
      if (item.trailer_url && item.trailer_url.includes('cloudflarestream.com')) {
        const trailerParts = item.trailer_url.split('/');
        const trailerId = trailerParts[trailerParts.length - 2];
        
        if (trailerId) {
          const trailerExists = await checkMediaExists(trailerId, env);
          item.trailer_available = trailerExists;
          
          // Si le trailer n'est pas disponible, ajouter une URL de fallback
          if (!trailerExists) {
            item.trailer_fallback = `/media/placeholders/trailer_${item.content_type}.jpg`;
          }
        }
      }
      
      // Vérifications similaires pour poster et backdrop
      // À implémenter selon la même logique
      
      return item;
    } catch (error) {
      logWarn(`Erreur lors de l'enrichissement du contenu ${item.id}: ${error.message}`, env);
      return item; // Retourner l'item non enrichi en cas d'erreur
    }
  }));
}

/**
 * Mapping des nouveaux patterns d'URL vers les types de contenu
 */
const CONTENT_TYPE_MAPPING = {
  'animes': 'anime',
  'dramas': 'drama',
  'films': 'film',
  'bollywood': 'bollywood',
  // Ajouter d'autres mappings si nécessaire
};

/**
 * Extrait le type de contenu et le filtre éventuel à partir du chemin d'accès
 * @param {string} path - Chemin d'accès de la requête
 * @returns {Object} - Type de contenu et filtre
 */
function extractContentTypeFromPath(path) {
  // Format: /api/{type} ou /api/{type}/{filter}
  const parts = path.split('/').filter(part => part);
  
  if (parts.length >= 2 && parts[0] === 'api') {
    const contentTypePath = parts[1]; // animes, dramas, films, etc.
    const contentType = CONTENT_TYPE_MAPPING[contentTypePath] || contentTypePath;
    
    // Vérifier s'il y a un filtre (featured, trending, etc.)
    const filter = parts.length > 2 ? parts[2] : null;
    
    return { contentType, filter, contentTypePath };
  }
  
  return { contentType: null, filter: null, contentTypePath: null };
}

/**
 * Gestion des requêtes de contenu
 * @param {Request} request - Requête HTTP
 * @param {Object} env - Variables d'environnement
 * @param {Object} ctx - Contexte d'exécution du Worker
 * @param {Object} reqContext - Contexte de la requête pour journalisation
 * @returns {Promise<Response>} - Réponse HTTP
 */
export async function handleContentRequest(request, env, ctx, reqContext) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Détecter les nouveaux patterns d'URL: /api/animes, /api/dramas, etc.
  const { contentType, filter, contentTypePath } = extractContentTypeFromPath(path);
  
  // Traiter les nouveaux formats d'URL
  if (contentType && CONTENT_TYPE_MAPPING[contentTypePath]) {
    try {
      logInfo(`Traitement de la requête de type ${contentType}${filter ? ` avec filtre ${filter}` : ''}`, env);
      
      const contents = await getAllContents(env);
      let filteredContents = contents.data.filter(item => 
        item.content_type === contentType
      );
      
      // Appliquer des filtres supplémentaires si nécessaire
      if (filter) {
        switch(filter) {
          case 'featured':
            // Simuler des contenus mis en avant (les premiers 5)
            filteredContents = filteredContents.slice(0, 5);
            break;
            
          case 'trending':
            // Simuler des contenus tendance (tri aléatoire)
            filteredContents = filteredContents.sort(() => 0.5 - Math.random()).slice(0, 8);
            break;
            
          // Ajouter d'autres filtres selon les besoins
        }
      }
      
      return createResponse({
        source: contents.source,
        timestamp: contents.timestamp,
        count: filteredContents.length,
        content_type: contentType,
        filter: filter,
        data: filteredContents
      }, 200, request);
    } catch (error) {
      logError(`Erreur lors de la récupération des contenus ${contentType}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors de la récupération des contenus`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message,
        request
      });
    }
  }
  
  // Route pour les historiques d'utilisateurs
  if (path.match(/^\/api\/users\/([^\/]+)\/history$/)) {
    const userId = path.match(/^\/api\/users\/([^\/]+)\/history$/)[1];
    
    try {
      // Simuler un historique vide ou générer un historique fictif selon les besoins
      return createResponse({
        user_id: userId,
        timestamp: new Date().toISOString(),
        count: 0,
        data: []
      }, 200, request);
    } catch (error) {
      logError(`Erreur lors de la récupération de l'historique: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors de la récupération de l'historique`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message,
        request
      });
    }
  }
  
  // Route pour tous les contenus (ancienne route maintenue pour compatibilité)
  if (path === '/api/content' || path === '/api/content/all') {
    try {
      const contents = await getAllContents(env);
      
      // Si demandé, enrichir avec les statuts de disponibilité
      const shouldEnrich = url.searchParams.get('enrich') === 'true';
      
      if (shouldEnrich) {
        logInfo('Enrichissement des métadonnées demandé', env);
        contents.data = await enrichContentMetadata(contents.data, env);
      }
      
      return createResponse(contents, 200, request);
    } catch (error) {
      logError(`Erreur lors de la récupération des contenus: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: 'Erreur lors de la récupération des contenus',
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message,
        request
      });
    }
  }
  
  // Route pour un contenu spécifique par ID
  if (path.match(/^\/api\/content\/([^\/]+)$/)) {
    const contentId = path.split('/').pop();
    
    try {
      const contents = await getAllContents(env);
      const content = contents.data.find(item => item.id === contentId);
      
      if (!content) {
        return errorResponse({
          status: 404,
          error: 'Contenu non trouvé',
          contentId,
          request
        });
      }
      
      // Enrichir ce contenu spécifique si demandé
      const shouldEnrich = url.searchParams.get('enrich') === 'true';
      
      if (shouldEnrich) {
        const enrichedContent = await enrichContentMetadata([content], env);
        return createResponse(enrichedContent[0], 200, request);
      }
      
      return createResponse(content, 200, request);
    } catch (error) {
      logError(`Erreur lors de la récupération du contenu ${contentId}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors de la récupération du contenu ${contentId}`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message,
        request
      });
    }
  }
  
  // Route pour filtrer les contenus par type (ancienne route maintenue pour compatibilité)
  if (path.match(/^\/api\/content\/type\/([^\/]+)$/)) {
    const contentType = path.split('/').pop();
    
    try {
      const contents = await getAllContents(env);
      const filteredContents = contents.data.filter(item => 
        item.content_type === contentType
      );
      
      return createResponse({
        source: contents.source,
        timestamp: contents.timestamp,
        count: filteredContents.length,
        content_type: contentType,
        data: filteredContents
      }, 200, request);
    } catch (error) {
      logError(`Erreur lors du filtrage des contenus par type ${contentType}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors du filtrage des contenus`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message,
        request
      });
    }
  }
  
  // Route non supportée
  return errorResponse({
    status: 404,
    error: 'Route de contenu non trouvée',
    path
  });
}
