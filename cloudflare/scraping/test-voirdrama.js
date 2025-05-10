/**
 * Script de test spécifique pour VoirDrama
 * 
 * Ce script permet de tester différents sélecteurs sur VoirDrama
 * et d'identifier ceux qui fonctionnent le mieux.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');

// Ajouter le plugin stealth à puppeteer pour contourner les détections
puppeteer.use(StealthPlugin());

// Configuration
const URL = 'https://voirdrama.org/dramas/';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
fs.ensureDirSync(SCREENSHOT_DIR);

// Liste des sélecteurs à tester
const SELECTORS_TO_TEST = [
  // Sélecteurs pour les conteneurs
  '.movies-list',
  '.movie-list',
  '.items',
  '.film-list',
  '.movie-container',
  '.drama-list',
  '.drama-container',
  '.content',
  '.main-content',
  '.site-content',
  '.page-content',
  '.container',
  '.row',
  
  // Sélecteurs pour les éléments individuels
  '.ml-item',
  '.movie-item',
  '.item',
  '.film-poster',
  '.drama-item',
  '.card',
  '.post',
  '.entry',
  '.article',
  '.thumbnail'
];

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage du test de sélecteurs pour VoirDrama...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurer le user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Naviguer vers l'URL
    console.log(`📌 Navigation vers ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Attendre un peu pour s'assurer que tout est chargé
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Prendre une capture d'écran
    const screenshotPath = path.join(SCREENSHOT_DIR, 'voirdrama.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capture d'écran enregistrée: ${screenshotPath}`);
    
    // Tester chaque sélecteur
    console.log('\n📋 Test des sélecteurs:');
    
    const results = [];
    
    for (const selector of SELECTORS_TO_TEST) {
      try {
        // Compter le nombre d'éléments correspondant au sélecteur
        const count = await page.$$eval(selector, elements => elements.length);
        
        // Si des éléments sont trouvés, extraire des informations supplémentaires
        let details = '';
        
        if (count > 0) {
          // Extraire les dimensions du premier élément
          const dimensions = await page.$eval(selector, el => {
            const rect = el.getBoundingClientRect();
            return {
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          });
          
          // Extraire le texte du premier élément (limité à 50 caractères)
          const text = await page.$eval(selector, el => el.textContent.trim().substring(0, 50));
          
          details = `Dimensions: ${dimensions.width}x${dimensions.height}, Texte: "${text}"`;
        }
        
        results.push({
          selector,
          count,
          details: count > 0 ? details : ''
        });
        
        console.log(`  ${selector}: ${count} éléments trouvés ${count > 0 ? `(${details})` : ''}`);
        
      } catch (error) {
        console.log(`  ❌ Erreur avec le sélecteur ${selector}: ${error.message}`);
        results.push({
          selector,
          count: 0,
          error: error.message
        });
      }
    }
    
    // Trier les résultats par nombre d'éléments trouvés (décroissant)
    results.sort((a, b) => b.count - a.count);
    
    // Afficher les meilleurs sélecteurs
    console.log('\n💡 Meilleurs sélecteurs:');
    
    const bestSelectors = results.filter(r => r.count > 0).slice(0, 5);
    
    if (bestSelectors.length > 0) {
      bestSelectors.forEach((result, i) => {
        console.log(`  ${i+1}. ${result.selector}: ${result.count} éléments`);
      });
      
      // Suggérer des combinaisons de sélecteurs
      console.log('\n💡 Suggestions pour le scraping:');
      
      // Trouver les meilleurs conteneurs (éléments qui contiennent d'autres éléments)
      const containers = bestSelectors.filter(r => r.count < 10);
      
      // Trouver les meilleurs éléments individuels (nombreux éléments similaires)
      const items = bestSelectors.filter(r => r.count >= 10);
      
      if (containers.length > 0 && items.length > 0) {
        console.log(`  wait: '${containers[0].selector}'`);
        console.log(`  main: '${items[0].selector}'`);
      } else {
        console.log('  Impossible de déterminer une bonne combinaison de sélecteurs');
      }
    } else {
      console.log('  Aucun sélecteur n\'a trouvé d\'éléments');
    }
    
    // Enregistrer les résultats
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'voirdrama-selectors.json'), 
      JSON.stringify(results, null, 2)
    );
    
  } catch (error) {
    console.error(`❌ Erreur globale: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n✅ Test terminé!');
  }
}

// Exécuter la fonction principale
main().catch(console.error);
