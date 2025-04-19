// Script de scraping massif pour la production FloDrama (TypeScript)
import { SmartScrapingService } from '../features/scraping/services/SmartScrapingService';
import { ContentDataService } from '../services/content/ContentDataService';

(async () => {
  const contentDataService = new ContentDataService();

  console.log('🚀 Lancement du scraping global FloDrama (production) ...');

  try {
    // Récupérer tous les contenus populaires par type
    const dramas    = await SmartScrapingService.getPopularDramas(5);    // 5 pages, ajustable
    const animes    = await SmartScrapingService.getPopularAnimes(3);
    const movies    = await SmartScrapingService.getPopularMovies(3);
    const kshows    = await SmartScrapingService.getPopularKshows(2);
    const allItems  = [
      ...dramas,
      ...animes,
      ...movies,
      ...kshows
    ];

    // Dédupliquer les résultats si besoin (optionnel)
    // const uniqueItems = SmartScrapingService.deduplicateResults(allItems);

    // Sauvegarder dans la base de contenu FloDrama
    await contentDataService.saveBulkContent(allItems);

    console.log(`✅ Scraping terminé : ${allItems.length} éléments intégrés à la production.`);
  } catch (error) {
    console.error('❌ Erreur lors du scraping global production :', error);
  }
})();
