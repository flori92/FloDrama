// Script de scraping avec SmartScrapingService pour alimenter FloDrama en contenu
import { SmartScrapingService } from '../features/scraping/services/SmartScrapingService.js';
import ContentDataService from '../services/content/ContentDataService.js';

/**
 * Fonction principale pour lancer le scraping et alimenter la base de données
 */
async function lancerScrapingProduction() {
  console.log('🚀 Lancement du scraping intelligent FloDrama (production) ...');

  try {
    // Instancier les services
    const smartScrapingService = new SmartScrapingService();
    const contentDataService = new ContentDataService();
    
    // Configuration du service de scraping
    await smartScrapingService.configure({
      proxy: {
        useProxy: true,
        timeout: 30000,
        maxRetries: 3
      },
      categorization: {
        enableAI: false,
        defaultType: 'drama'
      },
      useCache: true,
      cacheFile: 'scraping-cache.json'
    });
    
    // Écouter les événements du service de scraping
    smartScrapingService.events.on('updateStart', () => {
      console.log('📡 Début de la mise à jour de la base de données...');
    });
    
    smartScrapingService.events.on('updateComplete', (data) => {
      console.log(`✅ Mise à jour terminée avec ${data.count} éléments récupérés`);
    });
    
    smartScrapingService.events.on('updateError', (error) => {
      console.error('❌ Erreur lors de la mise à jour:', error.message);
    });
    
    smartScrapingService.events.on('scrapeError', (data) => {
      console.warn(`⚠️ Erreur lors du scraping de ${data.source}:`, data.error.message);
    });
    
    // Lancer la mise à jour de la base de données
    console.log('🔍 Récupération des contenus depuis toutes les sources...');
    const allResults = await smartScrapingService.updateContentDatabase();
    
    // Vider le cache pour s'assurer que les nouvelles données seront utilisées
    await contentDataService.clearCache();
    
    // Intégrer les données scrapées dans le ContentDataService
    console.log('📥 Intégration des données scrapées dans la base de données...');
    
    // Créer une nouvelle méthode dans ContentDataService pour intégrer directement les données scrapées
    contentDataService.integrateScrapedContent = function(scrapedContent) {
        // Remplacer le cache interne par les données scrapées
        this.cache.allContent = scrapedContent;
        this.cache.lastFetched = Date.now();
        
        // Mettre à jour les caches secondaires
        this.updateSecondaryCache(scrapedContent);
        
        // Sauvegarder dans le stockage persistant si disponible
        if (this.storageService) {
            this.storageService.set('all_content', scrapedContent);
            this.storageService.set('content_timestamp', Date.now());
        }
        
        // Remplacer la méthode fetchMockContent pour qu'elle retourne les données scrapées
        this.fetchMockContent = async function() {
            console.log('Utilisation des données scrapées au lieu des mocks');
            return scrapedContent;
        };
        
        return scrapedContent.length;
    };
    
    // Intégrer les données scrapées
    const integratedCount = contentDataService.integrateScrapedContent(allResults);
    console.log(`📥 ${integratedCount} éléments intégrés dans la base de données`);
    
    // Afficher un résumé des résultats
    const resultsByType = {};
    allResults.forEach(item => {
      const type = item.type || 'unknown';
      resultsByType[type] = (resultsByType[type] || 0) + 1;
    });
    
    console.log('\n📊 Résumé du scraping:');
    console.log(`📌 Total: ${allResults.length} éléments récupérés`);
    
    Object.entries(resultsByType).forEach(([type, count]) => {
      console.log(`📌 ${type}: ${count} éléments`);
    });
    
    // Vérification finale du contenu disponible
    const allContent = await contentDataService.getAllContent({ forceRefresh: true });
    console.log(`\n📚 Contenu disponible après scraping : ${allContent.length} éléments`);
    
    return {
      success: true,
      totalItems: allResults.length,
      types: resultsByType
    };
  } catch (error) {
    console.error('❌ Erreur globale lors du scraping:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter le script
lancerScrapingProduction()
  .then(result => {
    if (result.success) {
      console.log('✨ Scraping terminé avec succès!');
    } else {
      console.error('❌ Échec du scraping:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ Erreur non gérée:', error);
  });
