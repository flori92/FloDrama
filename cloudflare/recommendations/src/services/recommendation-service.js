/**
 * Service de recommandation pour FloDrama
 * Génère des recommandations personnalisées basées sur les préférences utilisateur et les données disponibles
 */

import { getDatabase, toJson, fromJson, stringToArray, arrayToString } from './database.js';
import { getSourcesByType, SOURCE_TYPES } from '../config/sources.js';

export class RecommendationService {
  constructor(options = {}) {
    this.db = options.db;
    this.kv = options.kv;
    this.options = {
      defaultLimit: 20,
      maxRecommendations: 100,
      minScore: 0.5,
      weightFactors: {
        recency: 0.3,    // Importance de la récence
        popularity: 0.2, // Importance de la popularité
        similarity: 0.5  // Importance de la similarité
      },
      ...options
    };
  }

  /**
   * Génère des recommandations personnalisées pour un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} Liste des recommandations
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      console.log(`Génération de recommandations pour l'utilisateur ${userId}...`);
      
      // 1. Récupérer les préférences de l'utilisateur
      const preferences = await this.getUserPreferences(userId);
      
      // 2. Récupérer l'historique de visionnage
      const history = await this.getUserHistory(userId);
      
      // 3. Analyser les préférences et l'historique
      const userProfile = this.analyzeUserBehavior(preferences, history);
      
      // 4. Générer les recommandations
      const recommendations = await this.generateRecommendations(userProfile, {
        limit: options.limit || this.options.defaultLimit,
        excludeIds: history.map(item => item.content_id),
        types: options.types || userProfile.preferredTypes,
        genres: options.genres || userProfile.preferredGenres
      });
      
      // 5. Enregistrer les recommandations générées
      await this.storeRecommendations(userId, recommendations);
      
      console.log(`${recommendations.length} recommandations générées pour l'utilisateur ${userId}.`);
      return recommendations;
    } catch (error) {
      console.error(`Erreur lors de la génération des recommandations pour l'utilisateur ${userId}:`, error);
      
      // En cas d'erreur, retourner des recommandations par défaut
      return this.getFallbackRecommendations(options);
    }
  }

  /**
   * Récupère les préférences d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Object>} Préférences de l'utilisateur
   */
  async getUserPreferences(userId) {
    try {
      // Vérifier d'abord dans le cache KV
      if (this.kv) {
        const cachedPreferences = await this.kv.get(`user:${userId}:preferences`, { type: 'json' });
        if (cachedPreferences) {
          return cachedPreferences;
        }
      }
      
      // Si pas en cache, récupérer depuis D1
      const { results } = await this.db
        .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
        .bind(userId)
        .all();
      
      if (!results || results.length === 0) {
        console.warn(`Aucune préférence trouvée pour l'utilisateur ${userId}`);
        return this.getDefaultPreferences();
      }
      
      // Convertir les chaînes en tableaux
      const preferences = results[0];
      const formattedPreferences = {
        ...preferences,
        preferred_types: stringToArray(preferences.preferred_types),
        preferred_genres: stringToArray(preferences.preferred_genres),
        preferred_sources: stringToArray(preferences.preferred_sources),
        avoided_genres: stringToArray(preferences.avoided_genres),
        avoided_sources: stringToArray(preferences.avoided_sources)
      };
      
      // Mettre en cache pour les futures requêtes
      if (this.kv) {
        await this.kv.put(
          `user:${userId}:preferences`, 
          JSON.stringify(formattedPreferences),
          { expirationTtl: 3600 } // 1 heure
        );
      }
      
      return formattedPreferences;
    } catch (error) {
      console.error(`Erreur lors de la récupération des préférences de l'utilisateur ${userId}:`, error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Récupère l'historique de visionnage d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} Historique de visionnage
   */
  async getUserHistory(userId) {
    try {
      // Vérifier d'abord dans le cache KV
      if (this.kv) {
        const cachedHistory = await this.kv.get(`user:${userId}:history`, { type: 'json' });
        if (cachedHistory) {
          return cachedHistory;
        }
      }
      
      // Si pas en cache, récupérer depuis D1
      const { results } = await this.db
        .prepare('SELECT content_id, watched_at FROM user_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT 100')
        .bind(userId)
        .all();
      
      const history = results || [];
      
      // Mettre en cache pour les futures requêtes
      if (this.kv && history.length > 0) {
        await this.kv.put(
          `user:${userId}:history`, 
          JSON.stringify(history),
          { expirationTtl: 1800 } // 30 minutes
        );
      }
      
      return history;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique de l'utilisateur ${userId}:`, error);
      return [];
    }
  }

  /**
   * Analyse le comportement de l'utilisateur pour déterminer ses préférences
   * @param {Object} preferences - Préférences explicites de l'utilisateur
   * @param {Array} history - Historique de visionnage
   * @returns {Object} Profil utilisateur
   */
  analyzeUserBehavior(preferences, history) {
    // Préférences par défaut
    const userProfile = {
      preferredTypes: preferences.preferred_types || Object.values(SOURCE_TYPES),
      preferredGenres: preferences.preferred_genres || [],
      preferredSources: preferences.preferred_sources || [],
      avoidedGenres: preferences.avoided_genres || [],
      avoidedSources: preferences.avoided_sources || [],
      genreWeights: {},
      sourceWeights: {},
      recentlyWatched: []
    };
    
    // Si l'historique est vide, retourner les préférences par défaut
    if (!history || history.length === 0) {
      return userProfile;
    }
    
    // Analyser l'historique pour déterminer les préférences implicites
    const contentIds = history.map(item => item.content_id);
    
    // Récupérer les détails des contenus visionnés
    this.supabase
      .from('contents')
      .select('id, type, source_id, metadata')
      .in('id', contentIds)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          return;
        }
        
        // Compter les occurrences de chaque type et source
        const typeCounts = {};
        const sourceCounts = {};
        
        data.forEach(content => {
          // Compter les types
          typeCounts[content.type] = (typeCounts[content.type] || 0) + 1;
          
          // Compter les sources
          sourceCounts[content.source_id] = (sourceCounts[content.source_id] || 0) + 1;
        });
        
        // Calculer les poids pour chaque type et source
        const totalItems = data.length;
        
        // Types préférés basés sur l'historique
        userProfile.implicitPreferredTypes = Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type]) => type);
        
        // Sources préférées basées sur l'historique
        userProfile.implicitPreferredSources = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([source]) => source);
        
        // Poids des types
        Object.entries(typeCounts).forEach(([type, count]) => {
          userProfile.typeWeights[type] = count / totalItems;
        });
        
        // Poids des sources
        Object.entries(sourceCounts).forEach(([source, count]) => {
          userProfile.sourceWeights[source] = count / totalItems;
        });
        
        // Contenus récemment visionnés
        userProfile.recentlyWatched = history
          .slice(0, 10)
          .map(item => item.content_id);
      })
      .catch(error => {
        console.error('Erreur lors de l\'analyse de l\'historique:', error);
      });
    
    return userProfile;
  }

  /**
   * Génère des recommandations basées sur le profil utilisateur
   * @param {Object} userProfile - Profil de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} Liste des recommandations
   */
  async generateRecommendations(userProfile, options) {
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
      
      // Construire la requête SQL
      let sql = `
        SELECT id, title, description, poster_url, backdrop_url, release_year, rating, type, source_id, status, metadata
        FROM contents
        WHERE release_year BETWEEN 2023 AND 2025
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
  }

  /**
   * Calcule un score de récence pour un contenu
   * @param {Object} item - Contenu à évaluer
   * @returns {number} Score de récence (0-1)
   */
  calculateRecencyScore(item) {
    const currentYear = new Date().getFullYear();
    const itemYear = item.release_year || currentYear - 5;
    const yearDiff = currentYear - itemYear;
    
    // Plus le contenu est récent, plus le score est élevé
    // Score maximum pour les contenus de l'année en cours
    if (yearDiff <= 0) {
      return 1;
    }
    if (yearDiff >= 10) {
      return 0.1; // Score minimum pour les contenus de plus de 10 ans
    }
    
    return 1 - (yearDiff / 10);
  }

  /**
   * Calcule un score de popularité pour un contenu
   * @param {Object} item - Contenu à évaluer
   * @returns {number} Score de popularité (0-1)
   */
  calculatePopularityScore(item) {
    // Utiliser la note comme indicateur de popularité
    const rating = item.rating || 0;
    
    // Normaliser entre 0 et 1
    return Math.min(rating / 10, 1);
  }

  /**
   * Calcule un score de similarité pour un contenu par rapport au profil utilisateur
   * @param {Object} item - Contenu à évaluer
   * @param {Object} userProfile - Profil de l'utilisateur
   * @returns {number} Score de similarité (0-1)
   */
  calculateSimilarityScore(item, userProfile) {
    // Score de base
    let score = 0.5;
    
    // Bonus pour les types préférés
    if (userProfile.preferredTypes.includes(item.type)) {
      score += 0.2;
    }
    
    // Bonus pour les sources préférées
    if (userProfile.preferredSources.includes(item.source_id)) {
      score += 0.1;
    }
    
    // Malus pour les sources évitées
    if (userProfile.avoidedSources.includes(item.source_id)) {
      score -= 0.2;
    }
    
    // Bonus/malus basés sur les poids implicites
    if (userProfile.typeWeights && userProfile.typeWeights[item.type]) {
      score += userProfile.typeWeights[item.type] * 0.2;
    }
    
    if (userProfile.sourceWeights && userProfile.sourceWeights[item.source_id]) {
      score += userProfile.sourceWeights[item.source_id] * 0.1;
    }
    
    // Limiter le score entre 0 et 1
    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Enregistre les recommandations générées
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Array} recommendations - Recommandations générées
   * @returns {Promise<void>}
   */
  async storeRecommendations(userId, recommendations) {
    try {
      // Supprimer les anciennes recommandations
      await this.db
        .prepare('DELETE FROM user_recommendations WHERE user_id = ?')
        .bind(userId)
        .run();
      
      // Insérer les nouvelles recommandations
      if (recommendations.length > 0) {
        const stmt = this.db.prepare(`
          INSERT INTO user_recommendations (user_id, content_id, score, created_at)
          VALUES (?, ?, ?, ?)
        `);
        
        const batchStmt = this.db.batch(recommendations.map(() => stmt));
        
        const batchParams = recommendations.flatMap(item => [
          userId,
          item.id,
          item.recommendation_score,
          new Date().toISOString()
        ]);
        
        await batchStmt.run(...batchParams);
        
        // Mettre à jour le cache KV
        if (this.kv) {
          // Invalider les caches existants
          await this.kv.delete(`user:${userId}:recommendations`);
          
          // Stocker les nouvelles recommandations
          await this.kv.put(
            `user:${userId}:recommendations`, 
            JSON.stringify(recommendations),
            { expirationTtl: 3600 } // 1 heure
          );
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement des recommandations pour l'utilisateur ${userId}:`, error);
    }
  }

  /**
   * Retourne des recommandations par défaut en cas d'erreur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} Liste des recommandations par défaut
   */
  async getFallbackRecommendations(options = {}) {
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
      
      // Construire la requête SQL
      let sql = `
        SELECT id, title, description, poster_url, backdrop_url, release_year, rating, type, source_id, status, metadata
        FROM contents
        WHERE release_year BETWEEN 2023 AND 2025
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
  }

  /**
   * Retourne les préférences par défaut
   * @returns {Object} Préférences par défaut
   */
  getDefaultPreferences() {
    return {
      preferred_types: Object.values(SOURCE_TYPES),
      preferred_genres: [],
      preferred_sources: [],
      avoided_genres: [],
      avoided_sources: []
    };
  }
}
