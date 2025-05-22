/**
 * Worker planifié pour FloDrama
 * Exécute automatiquement le scraping et la mise à jour des recommandations
 */

import { ScraperService } from '../services/scraper-service.js';
import { RecommendationService } from '../services/recommendation-service.js';
import { getDatabase } from '../services/database.js';

export default {
  /**
   * Fonction exécutée selon la planification définie
   * @param {Object} event - Événement Cloudflare
   * @param {Object} env - Variables d'environnement
   * @param {Object} ctx - Contexte d'exécution
   */
  async scheduled(event, env, ctx) {
    console.log(`Exécution planifiée démarrée à ${new Date().toISOString()}`);
    
    try {
      // Initialiser les services
      const db = getDatabase(env);
      const kv = env.FLODRAMA_METADATA;
      
      const scraper = new ScraperService({ db, kv });
      const recommender = new RecommendationService({ db, kv });
      
      // 1. Exécuter le scraping
      console.log('Démarrage du scraping...');
      const scrapingResults = await scraper.scrapeAllSources();
      
      // 2. Mettre à jour les recommandations pour les utilisateurs actifs
      console.log('Mise à jour des recommandations...');
      await this.updateRecommendations(recommender, db);
      
      // 3. Enregistrer les résultats de l'exécution
      await this.logExecutionResults(db, {
        success: true,
        scraping_results: scrapingResults,
        timestamp: new Date().toISOString()
      });
      
      console.log('Exécution planifiée terminée avec succès.');
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'exécution planifiée:', error);
      
      // Enregistrer l'erreur
      try {
        const db = getDatabase(env);
        
        await this.logExecutionResults(db, {
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement de l\'erreur:', logError);
      }
      
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour les recommandations pour les utilisateurs actifs
   * @param {RecommendationService} recommender - Service de recommandation
   * @param {Object} db - Client de base de données D1
   * @returns {Promise<void>}
   */
  async updateRecommendations(recommender, db) {
    try {
      // Récupérer les utilisateurs actifs (dernière activité < 30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
      
      const { results: activeUsers } = await db
        .prepare('SELECT id FROM users WHERE last_active > ? LIMIT 100')
        .bind(thirtyDaysAgoStr)
        .all();
      
      if (!activeUsers || activeUsers.length === 0) {
        console.log('Aucun utilisateur actif trouvé');
        return;
      }
      
      console.log(`Mise à jour des recommandations pour ${activeUsers.length} utilisateurs actifs...`);
      
      // Mettre à jour les recommandations pour chaque utilisateur
      for (const user of activeUsers) {
        try {
          await recommender.getPersonalizedRecommendations(user.id);
        } catch (userError) {
          console.error(`Erreur lors de la mise à jour des recommandations pour l'utilisateur ${user.id}:`, userError);
        }
      }
      
      console.log('Mise à jour des recommandations terminée.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des recommandations:', error);
      throw error;
    }
  },

  /**
   * Enregistre les résultats de l'exécution
   * @param {Object} db - Client de base de données D1
   * @param {Object} results - Résultats de l'exécution
   * @returns {Promise<void>}
   */
  async logExecutionResults(db, results) {
    try {
      const resultsJson = JSON.stringify(results);
      const timestamp = new Date().toISOString();
      
      await db
        .prepare('INSERT INTO scheduled_executions (type, results, created_at) VALUES (?, ?, ?)')
        .bind('scraping_and_recommendations', resultsJson, timestamp)
        .run();
      
      console.log('Résultats d\'exécution enregistrés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des résultats d\'exécution:', error);
    }
  }
};
