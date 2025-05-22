/**
 * Script d'analyse de la structure HTML des sites pour déterminer les sélecteurs appropriés
 * 
 * Ce script permet d'analyser la structure HTML d'un site web et de déterminer
 * les sélecteurs CSS les plus pertinents pour le scraping.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');

// Ajouter le plugin stealth à puppeteer pour contourner les détections
puppeteer.use(StealthPlugin());

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'structure-analysis');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');

// Créer les dossiers de sortie s'ils n'existent pas
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(SCREENSHOT_DIR);

// Sites à analyser
const SITES = [
  {
    name: 'voirdrama',
    url: 'https://voirdrama.org/dramas/',
    description: 'Site de streaming de dramas asiatiques'
  },
  {
    name: 'dramavostfr',
    url: 'https://dramavostfr.cc/films/',
    description: 'Site de streaming de dramas en VOSTFR'
  },
  {
    name: 'mydramalist',
    url: 'https://mydramalist.com/shows/top',
    description: 'Base de données de dramas asiatiques'
  }
];

/**
 * Analyse la structure HTML d'un site web
 * @param {Object} site - Informations sur le site à analyser
 */
async function analyseSite(site) {
  console.log(`\n🔍 Analyse du site ${site.name} (${site.url})`);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurer le user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Activer l'interception des requêtes pour les logs
    await page.setRequestInterception(true);
    page.on('request', request => {
      request.continue();
    });
    
    // Naviguer vers l'URL
    console.log(`📌 Navigation vers ${site.url}`);
    await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Attendre un peu pour s'assurer que tout est chargé
    await page.waitForTimeout(5000);
    
    // Prendre une capture d'écran
    const screenshotPath = path.join(SCREENSHOT_DIR, `${site.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capture d'écran enregistrée: ${screenshotPath}`);
    
    // Analyser la structure HTML
    console.log(`🔍 Analyse de la structure HTML...`);
    
    const structure = await page.evaluate(() => {
      // Fonction pour obtenir le XPath d'un élément
      function getXPath(element) {
        if (element.tagName === 'HTML') return '/HTML';
        if (element === document.body) return '/HTML/BODY';
        
        let ix = 0;
        const siblings = element.parentNode.childNodes;
        
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return `${getXPath(element.parentNode)}/${element.tagName}[${ix + 1}]`;
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
      }
      
      // Fonction pour obtenir un sélecteur CSS unique
      function getCssSelector(element) {
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
      
      // Fonction pour analyser les éléments potentiellement intéressants
      function analyzeElement(element, depth = 0) {
        // Ignorer les éléments non visibles ou trop petits
        const rect = element.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50 || 
            rect.top < 0 || rect.left < 0 || 
            rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
          return null;
        }
        
        // Ignorer les éléments de navigation, header, footer
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'nav' || tagName === 'header' || tagName === 'footer') {
          return null;
        }
        
        // Analyser l'élément
        const info = {
          tagName,
          id: element.id || null,
          classes: element.className ? element.className.split(' ').filter(c => c.trim()) : [],
          cssSelector: getCssSelector(element),
          xpath: getXPath(element),
          children: element.children.length,
          text: element.textContent.trim().substring(0, 100),
          rect: {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left)
          }
        };
        
        // Vérifier si c'est un conteneur d'items (liste, grille, etc.)
        const childrenInfo = [];
        let isContainer = false;
        
        if (element.children.length >= 3) {
          const firstChildRect = element.children[0].getBoundingClientRect();
          const secondChildRect = element.children[1].getBoundingClientRect();
          
          // Si les enfants ont des dimensions similaires et sont alignés, c'est probablement un conteneur
          if (Math.abs(firstChildRect.width - secondChildRect.width) < 20 &&
              Math.abs(firstChildRect.height - secondChildRect.height) < 20) {
            isContainer = true;
            
            // Analyser les 3 premiers enfants
            for (let i = 0; i < Math.min(3, element.children.length); i++) {
              const child = element.children[i];
              childrenInfo.push({
                tagName: child.tagName.toLowerCase(),
                id: child.id || null,
                classes: child.className ? child.className.split(' ').filter(c => c.trim()) : [],
                cssSelector: getCssSelector(child),
                text: child.textContent.trim().substring(0, 50)
              });
            }
          }
        }
        
        info.isContainer = isContainer;
        info.childrenInfo = childrenInfo;
        
        return info;
      }
      
      // Trouver tous les éléments potentiellement intéressants
      const allElements = document.querySelectorAll('*');
      const interestingElements = [];
      
      for (const element of allElements) {
        const info = analyzeElement(element);
        if (info) {
          interestingElements.push(info);
        }
      }
      
      // Trouver les conteneurs potentiels (qui contiennent plusieurs éléments similaires)
      const containers = interestingElements.filter(e => e.isContainer);
      
      // Trouver les éléments qui pourraient être des cartes de contenu (films, séries, etc.)
      const contentCards = interestingElements.filter(e => {
        return (e.classes.some(c => 
          c.includes('item') || c.includes('card') || c.includes('poster') || 
          c.includes('movie') || c.includes('drama') || c.includes('anime')
        )) && e.rect.width > 100 && e.rect.height > 150;
      });
      
      return {
        title: document.title,
        url: window.location.href,
        containers,
        contentCards,
        potentialSelectors: {
          containers: containers.map(c => c.cssSelector),
          contentCards: contentCards.map(c => c.cssSelector)
        }
      };
    });
    
    // Enregistrer les résultats
    const outputPath = path.join(OUTPUT_DIR, `${site.name}_structure.json`);
    fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
    console.log(`💾 Résultats enregistrés: ${outputPath}`);
    
    // Afficher les sélecteurs potentiels
    console.log('\n📋 Sélecteurs potentiels pour les conteneurs:');
    structure.potentialSelectors.containers.forEach((selector, i) => {
      console.log(`  ${i+1}. ${selector}`);
    });
    
    console.log('\n📋 Sélecteurs potentiels pour les cartes de contenu:');
    structure.potentialSelectors.contentCards.forEach((selector, i) => {
      console.log(`  ${i+1}. ${selector}`);
    });
    
    // Générer des recommandations
    console.log('\n💡 Recommandations pour le scraping:');
    
    // Sélecteur pour le conteneur principal
    const containerSelector = structure.potentialSelectors.containers.length > 0 
      ? structure.potentialSelectors.containers[0] 
      : '';
    
    // Sélecteur pour les éléments individuels
    const itemSelector = structure.potentialSelectors.contentCards.length > 0 
      ? structure.potentialSelectors.contentCards[0] 
      : '';
    
    console.log(`  wait: '${containerSelector}'`);
    console.log(`  main: '${itemSelector}'`);
    
    // Fermer la page
    await page.close();
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${site.name}: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'analyse des sites...');
  
  for (const site of SITES) {
    await analyseSite(site);
  }
  
  console.log('\n✅ Analyse terminée!');
}

// Exécuter la fonction principale
main().catch(console.error);
