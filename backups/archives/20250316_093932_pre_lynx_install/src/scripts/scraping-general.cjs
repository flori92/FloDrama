/**
 * Script de scraping général pour FloDrama
 * 
 * Ce script récupère toutes les métadonnées possibles (dramas, films, Bollywood, animés)
 * et les stocke dans un fichier JSON pour alimenter FloDrama en production.
 */

const fs = require('fs');
const path = require('path');
const SmartScrapingService = require('../services/SmartScrapingService.js');

// Configuration
const CONFIG = {
  // Nombre de pages à récupérer pour chaque catégorie
  pageCount: 3,
  
  // Répertoire de sortie pour les données scrapées
  outputDir: path.join(__dirname, '../../data'),
  
  // Préfixe pour les fichiers de sortie
  filePrefix: `${new Date().toISOString().split('T')[0]}_flodrama`,
  
  // Termes de recherche populaires pour enrichir les données
  searchTerms: [
    // Dramas coréens populaires
    'squid game', 'vincenzo', 'crash landing on you', 'itaewon class', 'kingdom',
    'hospital playlist', 'true beauty', 'goblin', 'descendants of the sun',
    
    // Animés populaires
    'attack on titan', 'demon slayer', 'jujutsu kaisen', 'my hero academia',
    'one piece', 'naruto', 'tokyo revengers', 'hunter x hunter',
    
    // Films populaires
    'parasite', 'train to busan', 'the handmaiden', 'oldboy',
    
    // Bollywood
    'rrr', 'bahubali', 'dangal', 'pk', '3 idiots'
  ],
  
  // Délai entre les requêtes (en ms) pour éviter d'être bloqué
  requestDelay: 3000,
  
  // Nombre maximum de tentatives pour chaque requête
  maxRetries: 3,
  
  // Timeout pour chaque requête (en ms)
  requestTimeout: 15000,
  
  // Activer/désactiver le téléchargement des images
  downloadImages: false
};

// Fonction utilitaire pour attendre un certain temps
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour créer le répertoire de sortie s'il n'existe pas
const ensureOutputDir = () => {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Répertoire de sortie créé: ${CONFIG.outputDir}`);
  }
};

// Fonction pour sauvegarder les données dans un fichier JSON
const saveToJson = (data, category) => {
  const filename = `${CONFIG.filePrefix}_${category}.json`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Données sauvegardées dans: ${filepath}`);
  
  return filepath;
};

// Fonction pour récupérer les dramas populaires
const scrapeDramas = async () => {
  console.log('🔍 Récupération des dramas populaires...');
  
  try {
    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
    );
    
    const dramasPromise = SmartScrapingService.getPopularDramas(CONFIG.pageCount);
    const dramas = await Promise.race([dramasPromise, timeoutPromise]);
    
    console.log(`✅ ${dramas.length} dramas populaires récupérés`);
    return dramas;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dramas populaires:', error.message);
    return [];
  }
};

// Fonction pour récupérer les films populaires
const scrapeMovies = async () => {
  console.log('🔍 Récupération des films populaires...');
  
  try {
    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
    );
    
    const moviesPromise = SmartScrapingService.getPopularMovies(CONFIG.pageCount);
    const movies = await Promise.race([moviesPromise, timeoutPromise]);
    
    console.log(`✅ ${movies.length} films populaires récupérés`);
    return movies;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des films populaires:', error.message);
    return [];
  }
};

// Fonction pour récupérer les K-shows populaires
const scrapeKshows = async () => {
  console.log('🔍 Récupération des K-shows populaires...');
  
  try {
    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
    );
    
    const kshowsPromise = SmartScrapingService.getPopularKshows(CONFIG.pageCount);
    const kshows = await Promise.race([kshowsPromise, timeoutPromise]);
    
    console.log(`✅ ${kshows.length} K-shows populaires récupérés`);
    return kshows;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des K-shows populaires:', error.message);
    return [];
  }
};

// Fonction pour récupérer les animés populaires
const scrapeAnimes = async () => {
  console.log('🔍 Récupération des animés populaires...');
  
  try {
    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
    );
    
    const animesPromise = SmartScrapingService.getPopularAnimes(CONFIG.pageCount);
    const animes = await Promise.race([animesPromise, timeoutPromise]);
    
    console.log(`✅ ${animes.length} animés populaires récupérés`);
    return animes;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des animés populaires:', error.message);
    return [];
  }
};

// Fonction pour enrichir les données avec des recherches spécifiques
const enrichWithSearches = async (existingData) => {
  console.log('🔍 Enrichissement des données avec des recherches spécifiques...');
  
  const searchResults = [];
  const existingTitles = new Set(existingData.map(item => item.title?.toLowerCase()));
  
  for (const term of CONFIG.searchTerms) {
    console.log(`  🔎 Recherche pour: "${term}"...`);
    
    try {
      // Ajouter un timeout pour éviter que la requête ne reste bloquée
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
      );
      
      const resultsPromise = SmartScrapingService.searchAll(term);
      const results = await Promise.race([resultsPromise, timeoutPromise]);
      
      // Fusionner tous les résultats
      const allResults = [
        ...(results.dramas || []),
        ...(results.animes || []),
        ...(results.movies || [])
      ];
      
      // Filtrer les doublons
      const newResults = allResults.filter(item => 
        item.title && !existingTitles.has(item.title.toLowerCase())
      );
      
      if (newResults.length > 0) {
        console.log(`  ✅ ${newResults.length} nouveaux résultats trouvés pour "${term}"`);
        searchResults.push(...newResults);
        
        // Ajouter les nouveaux titres à l'ensemble des titres existants
        newResults.forEach(item => {
          if (item.title) {
            existingTitles.add(item.title.toLowerCase());
          }
        });
      } else {
        console.log(`  ℹ️ Aucun nouveau résultat pour "${term}"`);
      }
      
      // Attendre entre chaque recherche pour éviter d'être bloqué
      await sleep(CONFIG.requestDelay);
    } catch (error) {
      console.error(`  ❌ Erreur lors de la recherche pour "${term}":`, error.message);
    }
  }
  
  console.log(`✅ ${searchResults.length} nouveaux éléments ajoutés par recherche`);
  return searchResults;
};

// Fonction pour télécharger les images et les stocker localement
const downloadImages = async (data) => {
  console.log('🖼️ Téléchargement des images...');
  
  const imagesDir = path.join(CONFIG.outputDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Traiter les éléments par lots pour éviter de surcharger le système
  const batchSize = 10;
  const batches = Math.ceil(data.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const batch = data.slice(i * batchSize, (i + 1) * batchSize);
    const batchResults = await Promise.all(batch.map(async (item) => {
      if (!item.image) return { item, success: false, processed: false };
      
      try {
        const imageUrl = item.image;
        const imageId = `${item.source}-${item.id || Math.random().toString(36).substring(2, 10)}`;
        const extension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
        const filename = `${imageId}.${extension}`;
        const filepath = path.join(imagesDir, filename);
        
        // Vérifier si l'image existe déjà
        if (fs.existsSync(filepath)) {
          item.localImage = `images/${filename}`;
          return { item, success: true, processed: false };
        }
        
        // Télécharger l'image
        const response = await SmartScrapingService.proxyService.fetch(imageUrl, {
          headers: SmartScrapingService.fingerprintService.getHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Statut HTTP: ${response.status}`);
        }
        
        const buffer = await response.buffer();
        fs.writeFileSync(filepath, buffer);
        
        // Mettre à jour l'élément avec le chemin local de l'image
        item.localImage = `images/${filename}`;
        return { item, success: true, processed: true };
      } catch (error) {
        console.error(`  ❌ Erreur lors du téléchargement de l'image pour ${item.title}:`, error.message);
        return { item, success: false, processed: true, error: error.message };
      }
    }));
    
    // Mettre à jour les compteurs en dehors de la fonction de rappel
    for (const result of batchResults) {
      if (result.processed) {
        if (result.success) successCount++;
        else errorCount++;
      }
    }
    
    // Mettre à jour les données
    for (let j = 0; j < batchResults.length; j++) {
      batch[j] = batchResults[j].item;
    }
    
    // Attendre entre chaque lot pour éviter d'être bloqué
    if (i < batches - 1) {
      await sleep(CONFIG.requestDelay);
    }
  }
  
  console.log(`✅ Images téléchargées: ${successCount} réussies, ${errorCount} échouées`);
  return data;
};

// Fonction pour générer un fichier de métadonnées consolidé
const generateMetadataFile = (data) => {
  const metadata = {
    totalItems: data.length,
    categories: {
      dramas: data.filter(item => item.type === 'drama').length,
      movies: data.filter(item => item.type === 'movie').length,
      animes: data.filter(item => item.type === 'anime').length,
      kshows: data.filter(item => item.type === 'kshow').length,
      other: data.filter(item => !item.type || !['drama', 'movie', 'anime', 'kshow'].includes(item.type)).length
    },
    sources: {},
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Compter les éléments par source
  data.forEach(item => {
    if (item.source) {
      metadata.sources[item.source] = (metadata.sources[item.source] || 0) + 1;
    }
  });
  
  const filename = `${CONFIG.filePrefix}_metadata.json`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✅ Métadonnées sauvegardées dans: ${filepath}`);
  
  return metadata;
};

// Fonction principale pour exécuter le scraping général
async function runGeneralScraping() {
  console.log('🚀 Démarrage du scraping général pour FloDrama...\n');
  
  // Étape 1: Créer le répertoire de sortie
  ensureOutputDir();
  
  // Étape 2: Récupérer les données de base
  const dramas = await scrapeDramas();
  await sleep(CONFIG.requestDelay);
  
  const movies = await scrapeMovies();
  await sleep(CONFIG.requestDelay);
  
  const kshows = await scrapeKshows();
  await sleep(CONFIG.requestDelay);
  
  const animes = await scrapeAnimes();
  await sleep(CONFIG.requestDelay);
  
  // Étape 3: Fusionner les données de base
  let allData = [
    ...dramas.map(item => ({ ...item, type: 'drama' })),
    ...movies.map(item => ({ ...item, type: 'movie' })),
    ...kshows.map(item => ({ ...item, type: 'kshow' })),
    ...animes.map(item => ({ ...item, type: 'anime' }))
  ];
  
  console.log(`✅ Données de base récupérées: ${allData.length} éléments au total`);
  
  // Étape 4: Enrichir avec des recherches spécifiques
  const searchResults = await enrichWithSearches(allData);
  allData = [...allData, ...searchResults];
  
  // Étape 5: Dédupliquer les données
  const uniqueData = [];
  const seenTitles = new Set();
  
  allData.forEach(item => {
    if (item.title && !seenTitles.has(item.title.toLowerCase())) {
      uniqueData.push(item);
      seenTitles.add(item.title.toLowerCase());
    }
  });
  
  console.log(`✅ Données dédupliquées: ${uniqueData.length} éléments uniques`);
  
  // Étape 6: Télécharger les images si activé
  let dataWithImages = uniqueData;
  if (CONFIG.downloadImages) {
    dataWithImages = await downloadImages(uniqueData);
  } else {
    console.log('🖼️ Téléchargement des images désactivé');
  }
  
  // Étape 7: Sauvegarder les données par catégorie
  const dramasData = dataWithImages.filter(item => item.type === 'drama');
  const moviesData = dataWithImages.filter(item => item.type === 'movie');
  const kshowsData = dataWithImages.filter(item => item.type === 'kshow');
  const animesData = dataWithImages.filter(item => item.type === 'anime');
  
  saveToJson(dramasData, 'dramas');
  saveToJson(moviesData, 'movies');
  saveToJson(kshowsData, 'kshows');
  saveToJson(animesData, 'animes');
  saveToJson(dataWithImages, 'all');
  
  // Étape 8: Générer un fichier de métadonnées
  generateMetadataFile(dataWithImages);
  
  console.log('\n🏁 Scraping général terminé avec succès!');
  console.log(`📊 Statistiques:`);
  console.log(`  - Dramas: ${dramasData.length}`);
  console.log(`  - Films: ${moviesData.length}`);
  console.log(`  - K-shows: ${kshowsData.length}`);
  console.log(`  - Animés: ${animesData.length}`);
  console.log(`  - Total: ${dataWithImages.length}`);
  
  // Étape 9: Afficher les instructions pour déployer les données sur AWS
  console.log('\n📤 Pour déployer ces données sur AWS:');
  console.log(`  1. Compresser le dossier: zip -r ${CONFIG.filePrefix}.zip ${CONFIG.outputDir}`);
  console.log('  2. Télécharger le fichier ZIP sur S3: aws s3 cp flodrama-data.zip s3://flodrama-assets/data/');
  console.log('  3. Mettre à jour la référence dans l\'application: AWS_DATA_URL=https://flodrama-assets.s3.amazonaws.com/data/latest.json');
}

// Exécution du scraping général
runGeneralScraping().catch(error => {
  console.error('❌ Erreur lors du scraping général:', error.message);
});
