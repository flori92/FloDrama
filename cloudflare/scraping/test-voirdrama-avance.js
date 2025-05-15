/**
 * Script de test avancé pour VoirDrama
 * 
 * Ce script analyse en profondeur la structure du site VoirDrama
 * pour identifier les sélecteurs des éléments de contenu.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');

// Ajouter le plugin stealth à puppeteer pour contourner les détections
puppeteer.use(StealthPlugin());

// Configuration
const URL = 'https://voirdrama.org/dramas/';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'analyse avancée pour VoirDrama...');
  
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
    const screenshotPath = path.join(OUTPUT_DIR, 'voirdrama-avance.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capture d'écran enregistrée: ${screenshotPath}`);
    
    // Analyser la structure HTML en profondeur
    console.log('\n🔍 Analyse approfondie de la structure HTML...');
    
    const structure = await page.evaluate(() => {
      // Fonction pour obtenir un sélecteur CSS unique
      function getUniqueSelector(element) {
        if (element.id) return `#${element.id}`;
        
        let selector = element.tagName.toLowerCase();
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selector += `.${classes.join('.')}`;
          }
        }
        
        return selector;
      }
      
      // Fonction pour analyser un élément
      function analyzeElement(element) {
        const rect = element.getBoundingClientRect();
        
        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          classes: element.className ? element.className.split(' ').filter(c => c.trim()) : [],
          selector: getUniqueSelector(element),
          text: element.textContent.trim().substring(0, 100),
          hasImages: element.querySelectorAll('img').length > 0,
          imageCount: element.querySelectorAll('img').length,
          hasLinks: element.querySelectorAll('a').length > 0,
          linkCount: element.querySelectorAll('a').length,
          dimensions: {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          isVisible: rect.width > 0 && rect.height > 0 && 
                    window.getComputedStyle(element).display !== 'none' && 
                    window.getComputedStyle(element).visibility !== 'hidden'
        };
      }
      
      // Trouver tous les éléments qui pourraient contenir des dramas
      const potentialContainers = [];
      
      // 1. Chercher les éléments qui contiennent des images et des liens
      document.querySelectorAll('*').forEach(element => {
        if (element.querySelectorAll('img').length > 0 && 
            element.querySelectorAll('a').length > 0) {
          
          const rect = element.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100) {
            potentialContainers.push(analyzeElement(element));
          }
        }
      });
      
      // 2. Chercher spécifiquement les grilles et listes
      const gridsAndLists = [];
      
      document.querySelectorAll('.grid, .list, .row, .container, section, article, div').forEach(element => {
        const childElements = Array.from(element.children);
        
        // Vérifier si les enfants ont une structure similaire (potentiellement une liste de dramas)
        if (childElements.length >= 3) {
          const firstChildTag = childElements[0].tagName;
          const similarChildren = childElements.filter(child => child.tagName === firstChildTag).length;
          
          // Si au moins 75% des enfants ont le même tag, c'est probablement une liste
          if (similarChildren / childElements.length >= 0.75) {
            gridsAndLists.push({
              ...analyzeElement(element),
              childCount: childElements.length,
              childSelector: getUniqueSelector(childElements[0]),
              childrenHaveImages: childElements[0].querySelectorAll('img').length > 0,
              childrenHaveLinks: childElements[0].querySelectorAll('a').length > 0
            });
          }
        }
      });
      
      // 3. Chercher les éléments qui pourraient être des cartes de dramas
      const potentialCards = [];
      
      document.querySelectorAll('a, div, article, li').forEach(element => {
        // Vérifier si l'élément contient une image et du texte
        if (element.querySelectorAll('img').length > 0 && 
            element.textContent.trim().length > 0) {
          
          const rect = element.getBoundingClientRect();
          // Les cartes de dramas ont généralement une taille minimale
          if (rect.width > 100 && rect.height > 100) {
            potentialCards.push(analyzeElement(element));
          }
        }
      });
      
      // 4. Chercher les éléments avec des classes ou IDs pertinents
      const relevantElements = [];
      
      document.querySelectorAll('*').forEach(element => {
        const id = element.id || '';
        const className = element.className || '';
        
        if (id.toLowerCase().includes('drama') || 
            id.toLowerCase().includes('movie') || 
            id.toLowerCase().includes('film') || 
            id.toLowerCase().includes('series') ||
            className.toLowerCase().includes('drama') || 
            className.toLowerCase().includes('movie') || 
            className.toLowerCase().includes('film') || 
            className.toLowerCase().includes('series')) {
          
          relevantElements.push(analyzeElement(element));
        }
      });
      
      return {
        title: document.title,
        url: window.location.href,
        potentialContainers: potentialContainers.filter(e => e.isVisible),
        gridsAndLists: gridsAndLists.filter(e => e.isVisible),
        potentialCards: potentialCards.filter(e => e.isVisible),
        relevantElements: relevantElements.filter(e => e.isVisible)
      };
    });
    
    // Enregistrer les résultats
    const outputPath = path.join(OUTPUT_DIR, 'voirdrama-structure-avancee.json');
    fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
    console.log(`💾 Résultats enregistrés: ${outputPath}`);
    
    // Analyser les résultats pour déterminer les meilleurs sélecteurs
    console.log('\n📋 Analyse des résultats:');
    
    // Trouver les conteneurs les plus pertinents
    const bestContainers = structure.gridsAndLists
      .filter(container => container.childrenHaveImages && container.childrenHaveLinks)
      .sort((a, b) => b.childCount - a.childCount);
    
    console.log(`  Conteneurs potentiels: ${bestContainers.length}`);
    bestContainers.slice(0, 3).forEach((container, i) => {
      console.log(`    ${i+1}. ${container.selector} (${container.childCount} enfants)`);
    });
    
    // Trouver les cartes les plus pertinentes
    const bestCards = structure.potentialCards
      .filter(card => card.hasImages && card.hasLinks)
      .sort((a, b) => (b.dimensions.width * b.dimensions.height) - (a.dimensions.width * a.dimensions.height));
    
    console.log(`  Cartes potentielles: ${bestCards.length}`);
    bestCards.slice(0, 3).forEach((card, i) => {
      console.log(`    ${i+1}. ${card.selector} (${card.dimensions.width}x${card.dimensions.height})`);
    });
    
    // Trouver les éléments avec des noms pertinents
    console.log(`  Éléments avec noms pertinents: ${structure.relevantElements.length}`);
    structure.relevantElements.slice(0, 3).forEach((element, i) => {
      console.log(`    ${i+1}. ${element.selector}`);
    });
    
    // Générer des recommandations
    console.log('\n💡 Recommandations pour le scraping:');
    
    let waitSelector = '';
    let mainSelector = '';
    
    if (bestContainers.length > 0) {
      waitSelector = bestContainers[0].selector;
    } else if (structure.relevantElements.length > 0) {
      waitSelector = structure.relevantElements[0].selector;
    } else {
      waitSelector = '.container';
    }
    
    if (bestCards.length > 0) {
      mainSelector = bestCards[0].selector;
    } else if (bestContainers.length > 0 && bestContainers[0].childSelector) {
      mainSelector = bestContainers[0].childSelector;
    } else {
      mainSelector = 'a:has(img)';
    }
    
    console.log(`  wait: '${waitSelector}'`);
    console.log(`  main: '${mainSelector}'`);
    
    // Tester les sélecteurs recommandés
    console.log('\n🧪 Test des sélecteurs recommandés:');
    
    const waitCount = await page.$$eval(waitSelector, elements => elements.length);
    console.log(`  ${waitSelector}: ${waitCount} éléments trouvés`);
    
    const mainCount = await page.$$eval(mainSelector, elements => elements.length);
    console.log(`  ${mainSelector}: ${mainCount} éléments trouvés`);
    
    // Prendre une capture d'écran avec les éléments surlignés
    await page.evaluate((waitSelector, mainSelector) => {
      // Surligner les éléments wait
      document.querySelectorAll(waitSelector).forEach(el => {
        el.style.outline = '3px solid blue';
      });
      
      // Surligner les éléments main
      document.querySelectorAll(mainSelector).forEach(el => {
        el.style.outline = '3px solid red';
      });
    }, waitSelector, mainSelector);
    
    const highlightScreenshotPath = path.join(OUTPUT_DIR, 'voirdrama-highlighted.png');
    await page.screenshot({ path: highlightScreenshotPath, fullPage: true });
    console.log(`📸 Capture d'écran avec éléments surlignés: ${highlightScreenshotPath}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n✅ Analyse terminée!');
  }
}

// Exécuter la fonction principale
main().catch(console.error);
