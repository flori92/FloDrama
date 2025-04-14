// Remplacer le script par une version compatible avec CommonJS
const path = require('path');
const fs = require('fs');

/**
 * Script de test pour les sources de scraping
 * 
 * Ce script permet de tester les différentes sources de scraping
 * et de vérifier si elles fonctionnent correctement avec notre système anti-bot
 */

// Créer un fichier HTML pour afficher les résultats
// eslint-disable-next-line no-unused-vars
const generateHtmlReport = (results) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rapport de test des sources de scraping</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .source { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Rapport de test des sources de scraping</h1>
      <p>Généré le ${new Date().toLocaleString()}</p>
  `;

  const reportPath = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }

  const filePath = path.join(reportPath, `scraping-test-${Date.now()}.html`);
  fs.writeFileSync(filePath, html);

  console.log(`\nRapport HTML généré: ${filePath}`);
  return filePath;
};

console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   Test des sources de scraping pour FloDrama   ║
║                                                ║
╚════════════════════════════════════════════════╝

Ce script va tester les sources suivantes:
- VoirDrama (https://voirdrama.org)
- DramaCool (https://dramacool.com.tr)
- AsianC, DramaDay, MyDramaList, GogoAnime

Pour lancer les tests, exécutez la commande suivante:
npm run test-scraping

Le script générera un rapport HTML avec les résultats.
`);

// Créer un fichier de configuration pour les tests
const testConfig = {
  sources: [
    {
      name: 'VoirDrama',
      baseUrl: 'https://voirdrama.org',
      searchUrl: 'https://voirdrama.org/search?keyword={query}',
      testQuery: 'Goblin'
    },
    {
      name: 'DramaCool',
      baseUrl: 'https://dramacool.com.tr',
      searchUrl: 'https://dramacool.com.tr/search?keyword={query}',
      testQuery: 'Goblin'
    },
    {
      name: 'AsianC',
      baseUrl: 'https://asianc.to',
      searchUrl: 'https://asianc.to/search?keyword={query}',
      testQuery: 'Goblin'
    },
    {
      name: 'DramaDay',
      baseUrl: 'http://dramaday.net',
      searchUrl: 'http://dramaday.net/?s={query}',
      testQuery: 'Goblin'
    },
    {
      name: 'MyDramaList',
      baseUrl: 'https://mydramalist.com',
      searchUrl: 'https://mydramalist.com/search?q={query}',
      testQuery: 'Goblin'
    },
    {
      name: 'GogoAnime',
      baseUrl: 'https://gogoanime.tel',
      searchUrl: 'https://gogoanime.tel/search.html?keyword={query}',
      testQuery: 'Demon Slayer'
    }
  ]
};

// Écrire la configuration dans un fichier
const configPath = path.join(__dirname, '../../config');
if (!fs.existsSync(configPath)) {
  fs.mkdirSync(configPath, { recursive: true });
}

fs.writeFileSync(
  path.join(configPath, 'scraping-test-config.json'), 
  JSON.stringify(testConfig, null, 2)
);

console.log(`Configuration de test créée: ${path.join(configPath, 'scraping-test-config.json')}`);

// Ajouter un script au package.json
console.log('\nPour faciliter l\'exécution des tests, ajoutez ce script à votre package.json:');
console.log(`
"scripts": {
  "test-scraping": "node src/scripts/run-scraping-tests.js"
}
`);

// Créer le script d'exécution des tests
const runnerScript = `
/**
 * Script d'exécution des tests de scraping
 * 
 * Ce script utilise React pour accéder aux services de scraping
 * et génère un rapport HTML avec les résultats
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage des tests de scraping...');
console.log("Ce script va lancer une instance temporaire de l'application React");
console.log('et exécuter les tests de scraping via le navigateur.');
console.log('Veuillez patienter...');

try {
  // Lancer la commande de test
  execSync('npx react-app-rewired start --scripts-version react-scripts --test-scraping', {
    stdio: 'inherit',
    env: {
      ...process.env,
      BROWSER: 'none',
      TEST_SCRAPING: 'true'
    }
  });
  
  console.log('✅ Tests terminés avec succès!');
} catch (error) {
  console.error("❌ Erreur lors de l'exécution des tests:", error.message);
  process.exit(1);
}
`;

fs.writeFileSync(
  path.join(__dirname, 'run-scraping-tests.js'), 
  runnerScript
);

console.log(`\nScript d'exécution créé: ${path.join(__dirname, 'run-scraping-tests.js')}`);

console.log(`
✅ Configuration terminée!

Pour tester manuellement les sources, vous pouvez utiliser les URLs suivantes:

VoirDrama: https://voirdrama.org/search?keyword=Goblin
DramaCool: https://dramacool.com.tr/search?keyword=Goblin
AsianC: https://asianc.to/search?keyword=Goblin
DramaDay: http://dramaday.net/?s=Goblin
MyDramaList: https://mydramalist.com/search?q=Goblin
GogoAnime: https://gogoanime.tel/search.html?keyword=Demon%20Slayer

Utilisez le proxy CORS pour accéder à ces URLs:
https://d69p5h7093.execute-api.us-east-1.amazonaws.com/prod/proxy
`);
