/**
 * Script de test pour la fonctionnalité de traduction de sous-titres
 * Ce script teste l'extraction, la traduction et la mise en cache des sous-titres
 */

// Importation directe du service de scraping
const scrapingService = require('../services/ScrapingService');
const fs = require('fs').promises;
const path = require('path');
// Le parser de sous-titres sera utilisé dans une future version pour analyser les résultats

// URLs de test avec sous-titres
const TEST_URLS = [
  {
    name: 'VoirDrama',
    url: 'https://voirdrama.org/voir-drama/goblin-episode-1-vostfr/',
    expectedLang: ['en', 'ko']
  },
  {
    name: 'DramaCool',
    url: 'https://dramacool.com.tr/the-glory-episode-1.html',
    expectedLang: ['en']
  },
  {
    name: 'GogoAnime',
    url: 'https://gogoanime.tel/demon-slayer-kimetsu-no-yaiba-episode-1',
    expectedLang: ['en', 'ja']
  }
];

// Fonction pour créer le dossier de rapports s'il n'existe pas
async function ensureReportDir() {
  const reportDir = path.join(process.cwd(), 'reports');
  try {
    await fs.mkdir(reportDir, { recursive: true });
    return reportDir;
  } catch (error) {
    console.error(`Erreur lors de la création du dossier de rapports: ${error.message}`);
    throw error;
  }
}

// Test d'extraction des sous-titres
async function testSubtitleExtraction(url, name) {
  console.log(`\n🔍 Test d'extraction des sous-titres pour ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const subtitles = await scrapingService._extractSubtitleLinks(url);
    console.log(`✅ ${subtitles.length} sous-titres trouvés`);
    
    subtitles.forEach((sub, index) => {
      console.log(`  ${index + 1}. Langue: ${sub.lang}, URL: ${sub.url}`);
    });
    
    return subtitles;
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction: ${error.message}`);
    return [];
  }
}

// Test de traduction des sous-titres
async function testSubtitleTranslation(subtitles, name) {
  console.log(`\n🔤 Test de traduction pour ${name}`);
  
  if (subtitles.length === 0) {
    console.log('❌ Aucun sous-titre à traduire');
    return [];
  }
  
  try {
    // Prendre seulement le premier sous-titre pour le test
    const firstSubtitle = subtitles[0];
    console.log(`Traduction du sous-titre en ${firstSubtitle.lang}`);
    
    // Simuler un petit extrait de sous-titre pour le test
    const sampleText = "Hello, how are you? This is a test subtitle.";
    console.log(`Texte original: "${sampleText}"`);
    
    const translatedText = await scrapingService._translateSubtitle(sampleText);
    console.log(`Texte traduit: "${translatedText}"`);
    
    // Tester le cache
    console.log('\n📦 Test du cache Redis');
    const cachedText = await scrapingService._translateSubtitle(sampleText);
    console.log(`Texte depuis le cache: "${cachedText}"`);
    
    return { original: sampleText, translated: translatedText };
  } catch (error) {
    console.error(`❌ Erreur lors de la traduction: ${error.message}`);
    return null;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests de sous-titres automatiques...');
  
  const reportDir = await ensureReportDir();
  const results = [];
  
  for (const test of TEST_URLS) {
    console.log(`\n==== Test de ${test.name} ====`);
    
    const subtitles = await testSubtitleExtraction(test.url, test.name);
    const translation = await testSubtitleTranslation(subtitles, test.name);
    
    results.push({
      source: test.name,
      url: test.url,
      subtitlesFound: subtitles.length,
      languages: subtitles.map(s => s.lang),
      translationSuccess: !!translation,
      sampleTranslation: translation
    });
  }
  
  // Sauvegarder les résultats
  const timestamp = Date.now();
  const reportPath = path.join(reportDir, `subtitle-test-results-${timestamp}.json`);
  
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Résultats sauvegardés dans ${reportPath}`);
  
  // Résumé
  console.log('\n📋 Résumé des tests:');
  results.forEach(result => {
    const status = result.translationSuccess ? '✅' : '❌';
    console.log(`${status} ${result.source}: ${result.subtitlesFound} sous-titres trouvés (${result.languages.join(', ')})`);
  });
  
  console.log('\n✅ Tests terminés!');
}

// Exécuter le script
main().catch(error => {
  console.error(`Erreur globale: ${error.message}`);
  process.exit(1);
});
