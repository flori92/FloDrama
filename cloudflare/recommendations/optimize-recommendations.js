/**
 * Script d'optimisation du système de recommandation FloDrama
 * Ce script met à jour la base de données pour se concentrer sur les contenus récents
 * et optimise les requêtes de recommandation.
 */

import { getDatabase } from './src/services/database.js';
import { ScraperService } from './src/services/scraper-service.js';

// Configuration
const YEARS_RANGE = 2; // Nombre d'années à prendre en compte (année courante - YEARS_RANGE)

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'optimisation du système de recommandation...');
  
  try {
    // Récupérer l'environnement depuis les arguments
    const env = process.argv[2] || 'production';
    console.log(`Environnement: ${env}`);
    
    // Charger la configuration Wrangler
    const wranglerConfig = await import('./wrangler.toml', { assert: { type: 'toml' } });
    
    // Créer un environnement simulé pour les tests locaux
    const mockEnv = {
      DB: {}, // Sera remplacé par D1
      FLODRAMA_METADATA: {}, // Sera remplacé par KV
      ENVIRONMENT: env
    };
    
    // Initialiser la base de données
    const db = getDatabase(mockEnv);
    
    // Calculer la plage d'années dynamique
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - YEARS_RANGE;
    
    console.log(`📅 Plage d'années pour les recommandations: ${minYear} - ${currentYear}`);
    
    // 1. Mettre à jour la base de données pour se concentrer sur les contenus récents
    await optimizeDatabase(db, minYear, currentYear);
    
    // 2. Lancer un nouveau scraping ciblé
    await scrapeRecentContent(db, mockEnv, minYear, currentYear);
    
    console.log('✅ Optimisation terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
    process.exit(1);
  }
}

/**
 * Optimise la base de données pour se concentrer sur les contenus récents
 */
async function optimizeDatabase(db, minYear, currentYear) {
  console.log('📊 Optimisation de la base de données...');
  
  try {
    // 1. Compter le nombre total de contenus
    const { results: countResults } = await db
      .prepare('SELECT COUNT(*) as total FROM contents')
      .all();
    
    const totalContents = countResults[0].total;
    console.log(`Nombre total de contenus: ${totalContents}`);
    
    // 2. Compter le nombre de contenus dans la plage d'années cible
    const { results: targetCountResults } = await db
      .prepare('SELECT COUNT(*) as total FROM contents WHERE release_year BETWEEN ? AND ?')
      .bind(minYear, currentYear)
      .all();
    
    const targetContents = targetCountResults[0].total;
    console.log(`Nombre de contenus entre ${minYear} et ${currentYear}: ${targetContents}`);
    
    // 3. Calculer le pourcentage de contenus récents
    const recentPercentage = (targetContents / totalContents * 100).toFixed(2);
    console.log(`Pourcentage de contenus récents: ${recentPercentage}%`);
    
    // 4. Si moins de 50% des contenus sont récents, supprimer les anciens contenus
    if (recentPercentage < 50) {
      console.log('Suppression des contenus anciens...');
      
      const { results: deleteResults } = await db
        .prepare('DELETE FROM contents WHERE release_year < ?')
        .bind(minYear)
        .run();
      
      console.log(`Contenus supprimés: ${deleteResults.count}`);
    }
    
    console.log('Optimisation de la base de données terminée.');
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de la base de données:', error);
    throw error;
  }
}

/**
 * Lance un nouveau scraping ciblé sur les contenus récents
 */
async function scrapeRecentContent(db, env, minYear, currentYear) {
  console.log('🔍 Lancement du scraping ciblé...');
  
  try {
    // Initialiser le service de scraping
    const scraper = new ScraperService({
      db,
      kv: env.FLODRAMA_METADATA,
      concurrency: 2,
      maxRetries: 3,
      targetYears: [minYear, currentYear] // Ajouter la plage d'années cible
    });
    
    // Lancer le scraping pour toutes les sources
    await scraper.scrapeAllSources();
    
    console.log('Scraping ciblé terminé.');
  } catch (error) {
    console.error('Erreur lors du scraping ciblé:', error);
    throw error;
  }
}

// Exécuter la fonction principale
main().catch(console.error);
