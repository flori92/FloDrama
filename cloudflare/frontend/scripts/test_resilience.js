/**
 * Script de test de résilience pour FloDrama
 * 
 * Ce script vérifie la résilience de l'application en simulant différentes
 * conditions d'erreur et en vérifiant que les mécanismes de fallback fonctionnent correctement.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_URL = 'http://localhost:5173';
const REPORT_PATH = path.join(__dirname, '../test-reports');
const SCREENSHOT_PATH = path.join(REPORT_PATH, 'screenshots');

// Créer les répertoires de rapport s'ils n'existent pas
if (!fs.existsSync(REPORT_PATH)) {
  fs.mkdirSync(REPORT_PATH, { recursive: true });
}
if (!fs.existsSync(SCREENSHOT_PATH)) {
  fs.mkdirSync(SCREENSHOT_PATH, { recursive: true });
}

// Fonction pour formater la date et l'heure
const formatDateTime = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
};

// Fonction pour générer un rapport
const generateReport = (testResults) => {
  const reportFile = path.join(REPORT_PATH, `resilience-report-${formatDateTime()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
  console.log(`Rapport généré: ${reportFile}`);
};

// Tests de résilience
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  // Fonction utilitaire pour ajouter un résultat de test
  const addTestResult = (name, status, details = {}) => {
    const result = {
      name,
      status,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    testResults.tests.push(result);
    testResults.summary.total++;
    if (status === 'passed') {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }
    
    console.log(`Test: ${name} - ${status.toUpperCase()}`);
    if (details.error) {
      console.error(`  Erreur: ${details.error}`);
    }
  };
  
  try {
    // Test 1: Chargement de la page d'accueil
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    if (title.includes('FloDrama')) {
      addTestResult('Chargement de la page d\'accueil', 'passed');
      await page.screenshot({ path: path.join(SCREENSHOT_PATH, 'home-page.png') });
    } else {
      addTestResult('Chargement de la page d\'accueil', 'failed', { 
        error: 'Titre de page incorrect', 
        expected: 'FloDrama', 
        actual: title 
      });
    }
    
    // Test 2: Vérification du chargement du Hero Banner
    const heroBanner = await page.$('.hero-banner');
    if (heroBanner) {
      addTestResult('Chargement du Hero Banner', 'passed');
    } else {
      addTestResult('Chargement du Hero Banner', 'failed', { 
        error: 'Hero Banner non trouvé' 
      });
    }
    
    // Test 3: Vérification du chargement des carrousels de contenu
    const carousels = await page.$$('.content-carousel');
    if (carousels.length > 0) {
      addTestResult('Chargement des carrousels', 'passed', { 
        count: carousels.length 
      });
    } else {
      addTestResult('Chargement des carrousels', 'failed', { 
        error: 'Aucun carrousel trouvé' 
      });
    }
    
    // Test 4: Vérification du chargement des images
    const images = await page.$$('img');
    const brokenImages = [];
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      
      if (naturalWidth === 0) {
        brokenImages.push(src);
      }
    }
    
    if (brokenImages.length === 0) {
      addTestResult('Chargement des images', 'passed', { 
        count: images.length 
      });
    } else {
      addTestResult('Chargement des images', 'failed', { 
        error: 'Images cassées détectées', 
        brokenImages 
      });
    }
    
    // Test 5: Simulation d'erreur API et vérification du fallback
    await page.evaluate(() => {
      // Simuler une erreur API en modifiant l'URL de base de l'API
      localStorage.setItem('API_BASE_URL_OVERRIDE', 'https://invalid-api-url.example.com');
      
      // Forcer un rechargement pour déclencher le fallback
      window.location.reload();
    });
    
    // Attendre que la page se recharge
    await page.waitForLoadState('networkidle');
    
    // Vérifier si le contenu de fallback est affiché
    const contentAfterError = await page.$$('.content-carousel');
    if (contentAfterError.length > 0) {
      addTestResult('Mécanisme de fallback', 'passed', { 
        count: contentAfterError.length 
      });
    } else {
      addTestResult('Mécanisme de fallback', 'failed', { 
        error: 'Contenu de fallback non affiché' 
      });
    }
    
    // Test 6: Vérification de la page de diagnostic
    await page.goto(`${TEST_URL}/diagnostic`);
    await page.waitForLoadState('networkidle');
    
    const diagnosticTitle = await page.$('.diagnostic-page h1');
    if (diagnosticTitle) {
      const titleText = await diagnosticTitle.innerText();
      if (titleText.includes('Diagnostic')) {
        addTestResult('Page de diagnostic', 'passed');
        await page.screenshot({ path: path.join(SCREENSHOT_PATH, 'diagnostic-page.png') });
      } else {
        addTestResult('Page de diagnostic', 'failed', { 
          error: 'Titre de la page de diagnostic incorrect', 
          actual: titleText 
        });
      }
    } else {
      addTestResult('Page de diagnostic', 'failed', { 
        error: 'Page de diagnostic non chargée' 
      });
    }
    
    // Test 7: Vérification des statistiques de cache sur la page de diagnostic
    const cacheStats = await page.$('.diagnostic-section:has-text("Statistiques du cache")');
    if (cacheStats) {
      addTestResult('Statistiques de cache', 'passed');
    } else {
      addTestResult('Statistiques de cache', 'failed', { 
        error: 'Statistiques de cache non affichées' 
      });
    }
    
    // Test 8: Vérification des erreurs API sur la page de diagnostic
    const apiErrors = await page.$('.diagnostic-section:has-text("Erreurs API")');
    if (apiErrors) {
      addTestResult('Affichage des erreurs API', 'passed');
    } else {
      addTestResult('Affichage des erreurs API', 'failed', { 
        error: 'Section des erreurs API non trouvée' 
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests:', error);
    addTestResult('Exécution des tests', 'failed', { 
      error: error.message 
    });
  } finally {
    // Générer le rapport
    generateReport(testResults);
    
    // Afficher le résumé
    console.log('\nRésumé des tests:');
    console.log(`Total: ${testResults.summary.total}`);
    console.log(`Réussis: ${testResults.summary.passed}`);
    console.log(`Échoués: ${testResults.summary.failed}`);
    
    // Fermer le navigateur
    await browser.close();
  }
})();
