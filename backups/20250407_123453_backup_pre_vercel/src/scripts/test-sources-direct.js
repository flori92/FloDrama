/**
 * Script de test direct pour les nouvelles sources
 * Ce script permet de tester directement les nouvelles sources ajoutées
 * en utilisant le proxy CORS pour contourner les protections anti-bot
 */

const axios = require('axios');
const { parse } = require('node-html-parser');
const fs = require('fs');
const path = require('path');

// Configuration du proxy CORS
const PROXY_URL = 'https://d69p5h7093.execute-api.us-east-1.amazonaws.com/prod/proxy';

// Sources à tester
const SOURCES = [
  {
    name: 'VoirDrama',
    url: 'https://voirdrama.org',
    searchUrl: 'https://voirdrama.org/search?keyword=Goblin',
    fallbackUrls: ['https://voirdrama.cc', 'https://voirdrama.tv', 'https://vdrama.org', 'https://voirdrama.me']
  },
  {
    name: 'DramaCool',
    url: 'https://dramacool.com.tr',
    searchUrl: 'https://dramacool.com.tr/search?keyword=Goblin',
    fallbackUrls: ['https://dramacool.hr', 'https://dramacool.com.pa', 'https://dramacool.cy', 'https://dramacool.sr', 'https://dramacool.so']
  },
  {
    name: 'GogoAnime',
    url: 'https://gogoanime.tel',
    searchUrl: 'https://gogoanime.tel/search.html?keyword=Demon%20Slayer',
    fallbackUrls: ['https://gogoanime3.net', 'https://gogoanime.bid', 'https://gogoanime.vc', 'https://anitaku.to']
  }
];

// Rotation des User-Agents pour éviter la détection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

// Fonction pour obtenir un User-Agent aléatoire
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Fonction pour effectuer une requête via le proxy CORS
async function fetchViaProxy(url) {
  console.log(`Requête vers: ${url}`);
  
  try {
    const response = await axios.post(PROXY_URL, {
      url,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Referer': new URL(url).origin
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 secondes de timeout
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error(`Erreur lors de la requête vers ${url}:`, error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Fonction pour tester une source
async function testSource(source) {
  console.log(`\n🔍 Test de la source: ${source.name}`);
  console.log(`URL principale: ${source.url}`);
  
  // Test de l'URL principale
  const mainResult = await fetchViaProxy(source.url);
  
  if (mainResult.success) {
    console.log(`✅ URL principale accessible (${mainResult.status})`);
    
    // Vérifier si Cloudflare est détecté
    const hasCloudflare = typeof mainResult.data === 'string' && (
      mainResult.data.includes('Just a moment...') || 
      mainResult.data.includes('cf-browser-verification') ||
      mainResult.data.includes('cf_chl_opt')
    );
    
    if (hasCloudflare) {
      console.log('⚠️ Protection Cloudflare détectée sur l\'URL principale');
    }
  } else {
    console.log(`❌ URL principale inaccessible: ${mainResult.error}`);
    
    // Tester les URLs alternatives
    console.log('Test des URLs alternatives...');
    let fallbackSuccess = false;
    
    for (const fallbackUrl of source.fallbackUrls) {
      console.log(`Essai de ${fallbackUrl}...`);
      const fallbackResult = await fetchViaProxy(fallbackUrl);
      
      if (fallbackResult.success) {
        console.log(`✅ URL alternative ${fallbackUrl} accessible (${fallbackResult.status})`);
        fallbackSuccess = true;
        break;
      } else {
        console.log(`❌ URL alternative ${fallbackUrl} inaccessible: ${fallbackResult.error}`);
      }
    }
    
    if (!fallbackSuccess) {
      console.log('❌ Toutes les URLs ont échoué pour cette source');
    }
  }
  
  // Test de recherche
  console.log(`\nTest de recherche: ${source.searchUrl}`);
  const searchResult = await fetchViaProxy(source.searchUrl);
  
  if (searchResult.success) {
    console.log(`✅ Recherche réussie (${searchResult.status})`);
    
    // Vérifier si Cloudflare est détecté
    const hasCloudflare = typeof searchResult.data === 'string' && (
      searchResult.data.includes('Just a moment...') || 
      searchResult.data.includes('cf-browser-verification') ||
      searchResult.data.includes('cf_chl_opt')
    );
    
    if (hasCloudflare) {
      console.log('⚠️ Protection Cloudflare détectée sur la recherche');
      return {
        name: source.name,
        mainUrlStatus: mainResult.success ? 'ok' : 'error',
        searchStatus: 'cloudflare',
        cloudflareDetected: true
      };
    }
    
    // Analyser la réponse HTML pour voir si des résultats sont présents
    try {
      const root = parse(searchResult.data);
      let resultCount = 0;
      
      // Logique d'extraction spécifique à chaque source
      switch (source.name) {
        case 'VoirDrama':
          // Essayer plusieurs sélecteurs possibles pour VoirDrama
          resultCount = root.querySelectorAll('.film-list .item').length || 
                       root.querySelectorAll('.film-poster').length ||
                       root.querySelectorAll('.items .item').length;
          
          // Sauvegarder le HTML pour analyse si aucun résultat n'est trouvé
          if (resultCount === 0) {
            const debugDir = path.join(__dirname, '../../debug');
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
            }
            fs.writeFileSync(
              path.join(debugDir, `voirdrama-html-${Date.now()}.html`),
              searchResult.data
            );
            console.log(`HTML sauvegardé dans ${path.join(debugDir, 'voirdrama-html.html')} pour analyse`);
          }
          break;
        case 'DramaCool':
          // Essayer plusieurs sélecteurs possibles pour DramaCool
          resultCount = root.querySelectorAll('.block').length || 
                       root.querySelectorAll('.items .item').length ||
                       root.querySelectorAll('ul.list-episode-item li').length;
          
          // Sauvegarder le HTML pour analyse si aucun résultat n'est trouvé
          if (resultCount === 0) {
            const debugDir = path.join(__dirname, '../../debug');
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
            }
            fs.writeFileSync(
              path.join(debugDir, `dramacool-html-${Date.now()}.html`),
              searchResult.data
            );
            console.log(`HTML sauvegardé dans ${path.join(debugDir, 'dramacool-html.html')} pour analyse`);
          }
          break;
        case 'GogoAnime':
          // Essayer plusieurs sélecteurs possibles pour GogoAnime
          resultCount = root.querySelectorAll('.items .item').length || 
                       root.querySelectorAll('.last_episodes .items li').length ||
                       root.querySelectorAll('.anime_list_body .listing li').length;
          
          // Sauvegarder le HTML pour analyse si aucun résultat n'est trouvé
          if (resultCount === 0) {
            const debugDir = path.join(__dirname, '../../debug');
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
            }
            fs.writeFileSync(
              path.join(debugDir, `gogoanime-html-${Date.now()}.html`),
              searchResult.data
            );
            console.log(`HTML sauvegardé dans ${path.join(debugDir, 'gogoanime-html.html')} pour analyse`);
          }
          break;
        default:
          resultCount = 0;
      }
      
      console.log(`Nombre de résultats trouvés: ${resultCount}`);
      
      return {
        name: source.name,
        mainUrlStatus: mainResult.success ? 'ok' : 'error',
        searchStatus: resultCount > 0 ? 'ok' : 'no_results',
        resultCount,
        cloudflareDetected: false
      };
    } catch (parseError) {
      console.error('Erreur lors de l\'analyse HTML:', parseError.message);
      return {
        name: source.name,
        mainUrlStatus: mainResult.success ? 'ok' : 'error',
        searchStatus: 'parse_error',
        error: parseError.message,
        cloudflareDetected: false
      };
    }
  } else {
    console.log(`❌ Échec de la recherche: ${searchResult.error}`);
    return {
      name: source.name,
      mainUrlStatus: mainResult.success ? 'ok' : 'error',
      searchStatus: 'error',
      error: searchResult.error,
      cloudflareDetected: false
    };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests des nouvelles sources...');
  
  const results = [];
  
  for (const source of SOURCES) {
    const result = await testSource(source);
    results.push(result);
  }
  
  // Tests Bollywood
  await testSource({
    name: 'Hotstar',
    url: 'https://www.hotstar.com/in/search?q=Brahmastra'
  });
  
  // Afficher un résumé
  console.log('\n📊 Résumé des tests:');
  
  results.forEach(result => {
    const status = result.searchStatus === 'ok' ? '✅' : 
                  result.searchStatus === 'cloudflare' ? '⚠️' : '❌';
    
    console.log(`${status} ${result.name}: ${result.searchStatus === 'ok' ? 
      `${result.resultCount} résultats` : 
      result.searchStatus === 'cloudflare' ? 'Protection Cloudflare' : 
      result.error || 'Aucun résultat'}`);
  });
  
  // Sauvegarder les résultats
  const reportDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportDir, `source-test-results-${Date.now()}.json`),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\nRésultats sauvegardés dans ${path.join(reportDir, 'source-test-results.json')}`);
  
  // Recommandations
  console.log('\n📋 Recommandations:');
  
  const cloudflareDetected = results.some(r => r.cloudflareDetected);
  if (cloudflareDetected) {
    console.log(`
⚠️ Protection Cloudflare détectée sur certaines sources.
Recommandations:
1. Vérifiez que le domaine est bien ajouté à la liste des domaines Cloudflare dans ProxyService.js
2. Assurez-vous que la rotation des User-Agents fonctionne correctement
3. Considérez l'utilisation d'un service de proxy externe avec support JavaScript
    `);
  }
  
  const failedSources = results.filter(r => r.searchStatus !== 'ok' && r.searchStatus !== 'cloudflare');
  if (failedSources.length > 0) {
    console.log(`
❌ Certaines sources ont échoué.
Recommandations:
1. Vérifiez que les URLs sont toujours valides
2. Essayez les URLs alternatives
3. Vérifiez si la structure HTML des sites a changé
    `);
  }
  
  console.log('✅ Tests terminés!');
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
