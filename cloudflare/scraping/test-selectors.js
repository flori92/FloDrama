const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Liste des sites à tester
const sitesToTest = [
  {
    name: 'dramacool',
    url: 'https://dramacool.cr/most-popular-drama',
    potentialSelectors: [
      '.block', '.content', '.list-episode-item', '.list-drama-item', 
      '.drama-list', '.drama-item', '.items', '.item'
    ]
  },
  {
    name: 'mydramalist',
    url: 'https://mydramalist.com/shows/top',
    potentialSelectors: [
      '.box', '#content', '.box-body', '.mdl-card', 
      '.mdl-grid', '.mdl-card__supporting-text', '.mdl-card__title'
    ]
  },
  {
    name: 'myanimelist',
    url: 'https://myanimelist.net/topanime.php',
    potentialSelectors: [
      '.ranking-list', '#content', '.ranking-item', '.anime-card', 
      '.seasonal-anime', '.ranking-unit', '.top-ranking-table'
    ]
  },
  {
    name: 'crunchyroll',
    url: 'https://www.crunchyroll.com/fr/videos/popular',
    potentialSelectors: [
      '.browse-card', '.browse-cards-container', '.card', '.erc-browse-card', 
      '.erc-browse-cards-container', '.erc-browse-item', '.browse-item'
    ]
  },
  {
    name: 'bollywood',
    url: 'https://www.bollywoodhungama.com/movies/',
    potentialSelectors: [
      '.movie-item', '.movies-list', '.movie-card', '.movie-listing', 
      '.movie-grid', '.movie-container', '.movie-box'
    ]
  },
  {
    name: 'bollywoodmdb',
    url: 'https://www.bollywoodmdb.com/movies/new-bollywood-movies',
    potentialSelectors: [
      '.movie-card', '.movies-list', '.movie-item', '.movie-grid', 
      '.movie-container', '.movie-box', '.movie-listing'
    ]
  },
  {
    name: 'tmdb-kdrama',
    url: 'https://www.themoviedb.org/tv?with_keywords=45722&with_origin_country=KR',
    potentialSelectors: [
      '.card', '#page_wrapper', '.card_content', '.item', 
      '.media_items', '.results', '.page_wrapper', '.media-item'
    ]
  }
];

// Fonction pour tester les sélecteurs
async function testSelectors() {
  console.log('🔍 Démarrage du test des sélecteurs...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const site of sitesToTest) {
      console.log(`\n📌 Test du site: ${site.name} (${site.url})`);
      
      const page = await browser.newPage();
      
      // Configurer le user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      try {
        // Naviguer vers l'URL
        await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`✅ Navigation réussie vers ${site.url}`);
        
        // Attendre un peu pour s'assurer que tout est chargé
        await page.waitForTimeout(5000);
        
        // Tester chaque sélecteur
        for (const selector of site.potentialSelectors) {
          try {
            const elements = await page.$$(selector);
            console.log(`${selector}: ${elements.length} éléments trouvés`);
            
            // Si des éléments sont trouvés, extraire quelques informations pour vérifier
            if (elements.length > 0) {
              // Extraire le texte du premier élément
              const textContent = await page.evaluate(el => el.textContent.trim(), elements[0]);
              console.log(`  Premier élément: "${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}"`);
              
              // Extraire les attributs href si disponibles
              const hrefs = await page.evaluate(selector => {
                const links = Array.from(document.querySelectorAll(`${selector} a`));
                return links.map(link => link.href).slice(0, 3);
              }, selector);
              
              if (hrefs.length > 0) {
                console.log(`  Liens trouvés: ${hrefs.length}`);
                hrefs.forEach((href, i) => console.log(`    ${i+1}. ${href}`));
              }
            }
          } catch (error) {
            console.log(`❌ Erreur avec le sélecteur ${selector}: ${error.message}`);
          }
        }
        
        // Prendre une capture d'écran pour référence
        await page.screenshot({ path: `${site.name}-screenshot.png` });
        console.log(`📸 Capture d'écran enregistrée: ${site.name}-screenshot.png`);
        
      } catch (error) {
        console.error(`❌ Erreur lors du test de ${site.name}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error(`❌ Erreur globale: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n✅ Test des sélecteurs terminé');
  }
}

// Exécuter le test
testSelectors().catch(console.error);
