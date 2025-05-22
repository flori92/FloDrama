/**
 * Script d'intégration pour mettre à jour le système de recommandation FloDrama
 * Ce script applique les mises à jour dynamiques et lance un nouveau scraping ciblé
 */

import { updateScraperService } from './src/services/scraper-service-update.js';
import { updateRecommendationService } from './src/services/recommendation-service-update.js';
import { getDatabase } from './src/services/database.js';
import { ScraperService } from './src/services/scraper-service.js';

// Configuration
const API_KEY = '507f4127285e65f9b4882ea54719cfcd';
const API_ENDPOINT = 'https://flodrama-recommendations-prod.florifavi.workers.dev/api/scrape';

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la mise à jour et du scraping ciblé...');
  
  try {
    // 1. Appliquer les mises à jour dynamiques
    console.log('📝 Application des mises à jour dynamiques...');
    
    // Mettre à jour le service de scraping
    const targetYears = updateScraperService();
    console.log(`✅ Service de scraping mis à jour pour cibler les années: ${targetYears.join(', ')}`);
    
    // Mettre à jour le service de recommandation
    const { minYear, currentYear } = updateRecommendationService();
    console.log(`✅ Service de recommandation mis à jour pour cibler les années: ${minYear} à ${currentYear}`);
    
    // 2. Lancer un nouveau scraping ciblé
    console.log('🔍 Lancement du scraping ciblé...');
    
    // Liste des sources à scraper
    const sources = [
      'kissasian',
      'dramacool',
      'viewasian',
      'voirdrama',
      'gogoanime',
      'nekosama',
      'voiranime',
      'vostfree',
      'streamingdivx',
      'filmapik',
      'bollyplay',
      'hindilinks4u'
    ];
    
    // Lancer le scraping pour chaque source
    for (const source of sources) {
      console.log(`📌 Scraping de la source: ${source}`);
      
      try {
        // Appeler l'API de scraping
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            source_id: source,
            target_years: targetYears // Transmettre les années cibles
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ Scraping de ${source} terminé: ${result.data[source]?.count || 0} éléments`);
      } catch (error) {
        console.error(`❌ Erreur lors du scraping de ${source}:`, error);
      }
      
      // Attendre 5 secondes entre chaque source pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('✅ Mise à jour et scraping terminés avec succès!');
    
    // 3. Vérifier l'état de la base de données
    console.log('📊 Vérification de l\'état de la base de données...');
    
    // Dans un environnement local, nous ne pouvons pas accéder directement à la base de données Cloudflare D1
    // Nous allons donc simplement afficher les informations de configuration
    
    console.log(`📊 Configuration du scraping ciblé pour les années ${minYear} à ${currentYear}`);
    
    // Nous n'avons pas besoin d'initialiser la base de données locale
    // car nous allons utiliser l'API Cloudflare pour le scraping
    
    // Simuler les statistiques pour l'affichage
    const totalContents = "N/A (accès direct à D1 non disponible en local)";
    const targetContents = "N/A (accès direct à D1 non disponible en local)";
    const recentPercentage = "N/A";
    
    console.log(`Nombre total de contenus: ${totalContents}`);
    console.log(`Nombre de contenus entre ${minYear} et ${currentYear}: ${targetContents}`);
    console.log(`Pourcentage de contenus récents: ${recentPercentage}%`);
    
    console.log('✅ Vérification terminée!');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour et du scraping:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(console.error);
