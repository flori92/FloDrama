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
import { logInfo, logError, logDebug } from '../utils/logger.js';
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
  
  // Route pour tous les contenus
  if (path === '/api/content' || path === '/api/content/all') {
    try {
      const contents = await getAllContents(env);
      
      // Si demandé, enrichir avec les statuts de disponibilité
      const shouldEnrich = url.searchParams.get('enrich') === 'true';
      
      if (shouldEnrich) {
        logInfo('Enrichissement des métadonnées demandé', env);
        contents.data = await enrichContentMetadata(contents.data, env);
      }
      
      return createResponse(contents);
    } catch (error) {
      logError(`Erreur lors de la récupération des contenus: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: 'Erreur lors de la récupération des contenus',
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message
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
          contentId
        });
      }
      
      // Enrichir ce contenu spécifique si demandé
      const shouldEnrich = url.searchParams.get('enrich') === 'true';
      
      if (shouldEnrich) {
        const enrichedContent = await enrichContentMetadata([content], env);
        return createResponse(enrichedContent[0]);
      }
      
      return createResponse(content);
    } catch (error) {
      logError(`Erreur lors de la récupération du contenu ${contentId}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors de la récupération du contenu ${contentId}`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message
      });
    }
  }
  
  // Route pour filtrer les contenus par type
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
      });
    } catch (error) {
      logError(`Erreur lors du filtrage des contenus par type ${contentType}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: `Erreur lors du filtrage des contenus`,
        details: env.ENVIRONMENT === 'production' ? 
          undefined : error.message
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
