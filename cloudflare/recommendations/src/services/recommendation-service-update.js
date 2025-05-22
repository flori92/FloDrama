/**
 * Mise à jour du service de recommandation pour FloDrama
 * Cette mise à jour permet de cibler dynamiquement les contenus récents
 */

import { RecommendationService } from './recommendation-service.js';

/**
 * Applique les modifications au service de recommandation
 */
export function updateRecommendationService() {
  // Calculer la plage d'années dynamique
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 2; // Prendre en compte l'année courante et les 2 années précédentes
  
  console.log(`Mise à jour du service de recommandation pour cibler les années: ${minYear} à ${currentYear}`);
  
  // Modifier la méthode generateRecommendations pour utiliser une plage d'années dynamique
  const originalGenerateRecommendations = RecommendationService.prototype.generateRecommendations;
  RecommendationService.prototype.generateRecommendations = async function(userProfile, options) {
    const {
      limit = this.options.defaultLimit,
      excludeIds = [],
      types = [],
      genres = []
    } = options;
    
    // Sélectionner les types de contenu à recommander
    const contentTypes = types.length > 0 ? types : Object.values(SOURCE_TYPES);
    
    try {
      // Vérifier d'abord dans le cache KV pour les recommandations précalculées
      const cacheKey = `recommendations:${userProfile.user_id}:${contentTypes.join('_')}:${limit}`;
      
      if (this.kv) {
        const cachedRecommendations = await this.kv.get(cacheKey, { type: 'json' });
        if (cachedRecommendations) {
          console.log(`Utilisation des recommandations en cache pour l'utilisateur ${userProfile.user_id}`);
          return cachedRecommendations;
        }
      }
      
      // Déterminer la plage d'années dynamique (année courante et 2 années précédentes)
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 2;
      
      // Construire la requête SQL avec plage dynamique
      let sql = `
        SELECT id, title, description, poster_url, backdrop_url, release_year, rating, type, source_id, status, metadata
        FROM contents
        WHERE release_year BETWEEN ${minYear} AND ${currentYear}
      `;
      
      const params = [];
      
      // Filtrer par type
      if (contentTypes.length > 0 && contentTypes.length < Object.values(SOURCE_TYPES).length) {
        sql += ` AND type IN (${contentTypes.map(() => '?').join(',')})`;
        params.push(...contentTypes);
      }
      
      // Exclure les contenus déjà vus
      if (excludeIds.length > 0) {
        sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`;
        params.push(...excludeIds);
      }
      
      // Filtrer par genres si spécifiés
      if (genres.length > 0) {
        sql += ` AND metadata LIKE '%"genres":%'`;
        // Note: Nous utilisons une approche simplifiée pour filtrer les genres car les métadonnées sont stockées en JSON
      }
      
      // Trier par note et récence
      sql += ` ORDER BY rating DESC, created_at DESC`;
      
      // Limiter le nombre de résultats
      sql += ` LIMIT ?`;
      params.push(limit * 2); // Récupérer plus de résultats pour le filtrage
      
      // Exécuter la requête
      const { results } = await this.db.prepare(sql).bind(...params).all();
      
      if (!results || results.length === 0) {
        console.warn('Aucun contenu trouvé pour les recommandations');
        return [];
      }
      
      // Convertir les métadonnées JSON en objets
      const contents = results.map(item => ({
        ...item,
        metadata: fromJson(item.metadata)
      }));
      
      // Calculer un score pour chaque recommandation
      const scoredRecommendations = contents.map(item => {
        const recencyScore = this.calculateRecencyScore(item);
        const popularityScore = this.calculatePopularityScore(item);
        const similarityScore = this.calculateSimilarityScore(item, userProfile);
        
        // Score final pondéré
        const finalScore = 
          recencyScore * this.options.weightFactors.recency +
          popularityScore * this.options.weightFactors.popularity +
          similarityScore * this.options.weightFactors.similarity;
        
        return {
          ...item,
          recommendation_score: finalScore
        };
      });
      
      // Trier par score et limiter au nombre demandé
      const recommendations = scoredRecommendations
        .sort((a, b) => b.recommendation_score - a.recommendation_score)
        .slice(0, limit);
      
      // Mettre en cache les recommandations
      if (this.kv && recommendations.length > 0) {
        await this.kv.put(
          cacheKey, 
          JSON.stringify(recommendations),
          { expirationTtl: 3600 } // 1 heure
        );
      }
      
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return [];
    }
  };
  
  // Modifier la méthode getFallbackRecommendations pour utiliser une plage d'années dynamique
  const originalGetFallbackRecommendations = RecommendationService.prototype.getFallbackRecommendations;
  RecommendationService.prototype.getFallbackRecommendations = async function(options = {}) {
    try {
      const { limit = this.options.defaultLimit, types = [] } = options;
      
      // Sélectionner les types de contenu à recommander
      const contentTypes = types.length > 0 ? types : Object.values(SOURCE_TYPES);
      
      // Vérifier d'abord dans le cache KV
      const cacheKey = `recommendations:default:${contentTypes.join('_')}:${limit}`;
      
      if (this.kv) {
        const cachedRecommendations = await this.kv.get(cacheKey, { type: 'json' });
        if (cachedRecommendations) {
          console.log('Utilisation des recommandations par défaut en cache');
          return cachedRecommendations;
        }
      }
      
      // Déterminer la plage d'années dynamique (année courante et 2 années précédentes)
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 2;
      
      // Construire la requête SQL avec plage dynamique
      let sql = `
        SELECT id, title, description, poster_url, backdrop_url, release_year, rating, type, source_id, status, metadata
        FROM contents
        WHERE release_year BETWEEN ${minYear} AND ${currentYear}
      `;
      
      const params = [];
      
      // Filtrer par type
      if (contentTypes.length > 0 && contentTypes.length < Object.values(SOURCE_TYPES).length) {
        sql += ` AND type IN (${contentTypes.map(() => '?').join(',')})`;
        params.push(...contentTypes);
      }
      
      // Trier par note
      sql += ` ORDER BY rating DESC`;
      
      // Limiter le nombre de résultats
      sql += ` LIMIT ?`;
      params.push(limit);
      
      // Exécuter la requête
      const { results } = await this.db.prepare(sql).bind(...params).all();
      
      if (!results || results.length === 0) {
        console.warn('Aucun contenu trouvé pour les recommandations par défaut');
        return [];
      }
      
      // Convertir les métadonnées JSON en objets
      const recommendations = results.map(item => ({
        ...item,
        metadata: fromJson(item.metadata),
        recommendation_score: 0.5 // Score par défaut
      }));
      
      // Mettre en cache les recommandations
      if (this.kv && recommendations.length > 0) {
        await this.kv.put(
          cacheKey, 
          JSON.stringify(recommendations),
          { expirationTtl: 86400 } // 24 heures
        );
      }
      
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations par défaut:', error);
      return [];
    }
  };
  
  console.log('Service de recommandation mis à jour avec succès!');
  return { minYear, currentYear };
}
