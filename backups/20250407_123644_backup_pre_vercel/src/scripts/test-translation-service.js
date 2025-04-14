/**
 * Script de test pour le service de traduction hybride
 * Ce script teste les deux méthodes de traduction et le système de fallback
 */

const TranslationService = require('../services/TranslationService');
const fs = require('fs').promises;
const path = require('path');
const subtitle = require('subtitle');

// Textes de test pour la traduction
const TEST_TEXTS = [
  {
    text: "Hello, how are you? This is a test of the translation service.",
    description: "Texte simple en anglais"
  },
  {
    text: "안녕하세요, 어떻게 지내세요? 이것은 번역 서비스의 테스트입니다.",
    description: "Texte en coréen"
  },
  {
    text: "こんにちは、お元気ですか？これは翻訳サービスのテストです。",
    description: "Texte en japonais"
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

// Test du service de traduction
async function testTranslationService() {
  console.log("\n🔍 Test du service de traduction hybride");
  
  // Vérification du statut des services
  console.log("\n📊 Vérification du statut des services de traduction:");
  const status = await TranslationService.checkStatus();
  
  console.log(`Redis: ${status.redis ? '✅ Connecté' : '❌ Non connecté'}`);
  console.log(`Cache mémoire: ${status.memoryCache ? '✅ Disponible' : '❌ Non disponible'}`);
  console.log(`Google Translate: ${status.google ? '✅ Disponible' : '❌ Non disponible'}`);
  console.log(`LibreTranslate: ${status.libre ? '✅ Disponible' : '❌ Non disponible'}`);
  
  if (!status.redis && status.memoryCache) {
    console.warn("⚠️ Redis n'est pas connecté, utilisation du cache mémoire");
  }
  
  if (!status.google && !status.libre) {
    console.error("❌ Aucun service de traduction n'est disponible, les tests ne peuvent pas continuer");
    return { success: false, results: [] };
  }
  
  // Test de traduction pour chaque texte
  console.log("\n🔤 Test de traduction pour différentes langues:");
  const results = [];
  
  for (const test of TEST_TEXTS) {
    console.log(`\n- ${test.description}:`);
    console.log(`  Original: "${test.text}"`);
    
    try {
      // Premier appel (devrait utiliser le service principal)
      console.log("  Premier appel (service principal):");
      const startTime1 = Date.now();
      const translation1 = await TranslationService.translate(test.text, 'fr');
      const endTime1 = Date.now();
      
      console.log(`  Traduit: "${translation1}"`);
      console.log(`  Temps: ${endTime1 - startTime1}ms`);
      
      // Deuxième appel (devrait utiliser le cache)
      console.log("  Deuxième appel (cache):");
      const startTime2 = Date.now();
      const translation2 = await TranslationService.translate(test.text, 'fr');
      const endTime2 = Date.now();
      
      console.log(`  Traduit: "${translation2}"`);
      console.log(`  Temps: ${endTime2 - startTime2}ms`);
      
      const speedup = (endTime1 - startTime1) / Math.max(1, (endTime2 - startTime2));
      console.log(`  Accélération grâce au cache: ${speedup.toFixed(2)}x`);
      
      results.push({
        original: test.text,
        description: test.description,
        translation: translation1,
        firstCallTime: endTime1 - startTime1,
        secondCallTime: endTime2 - startTime2,
        speedup: speedup,
        success: true
      });
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}`);
      results.push({
        original: test.text,
        description: test.description,
        error: error.message,
        success: false
      });
    }
  }
  
  return { success: results.every(r => r.success), results };
}

// Test de traduction de sous-titres
async function testSubtitleTranslation() {
  console.log("\n🎬 Test de traduction de sous-titres");
  
  // Création d'un fichier de sous-titres de test
  const testDir = path.join(process.cwd(), 'test-subtitles');
  await fs.mkdir(testDir, { recursive: true });
  
  const subtitleFile = path.join(testDir, 'test-subtitle.srt');
  const subtitleContent = `1
00:00:01,000 --> 00:00:04,000
Hello, this is a test subtitle.

2
00:00:05,000 --> 00:00:09,000
We are testing the translation functionality.

3
00:00:10,000 --> 00:00:15,000
This should be translated to French.

4
00:00:16,000 --> 00:00:20,000
Thank you for using our service.`;
  
  await fs.writeFile(subtitleFile, subtitleContent);
  console.log(`📝 Fichier de sous-titres de test créé: ${subtitleFile}`);
  
  // Parsing du fichier
  const fileContent = await fs.readFile(subtitleFile, 'utf-8');
  const parsed = subtitle.parse(fileContent);
  console.log(`📄 Fichier analysé: ${parsed.length} segments trouvés`);
  
  try {
    // Traduction des sous-titres
    console.log("🔄 Traduction des sous-titres...");
    const startTime = Date.now();
    const translatedCues = await TranslationService.translateSubtitles(parsed, 'fr');
    const endTime = Date.now();
    
    console.log(`✅ Traduction terminée en ${(endTime - startTime) / 1000} secondes`);
    
    // Affichage des résultats
    console.log("\n📊 Résultats de la traduction:");
    translatedCues.forEach((cue, index) => {
      console.log(`\nSegment ${index + 1}:`);
      console.log(`Original: "${parsed[index].text}"`);
      console.log(`Traduit: "${cue.text}"`);
    });
    
    // Sauvegarde du fichier traduit
    const translatedContent = subtitle.stringify(translatedCues);
    const translatedFile = path.join(testDir, 'test-subtitle.fr.srt');
    await fs.writeFile(translatedFile, translatedContent);
    
    console.log(`\n📝 Sous-titres traduits sauvegardés dans: ${translatedFile}`);
    
    return {
      success: true,
      originalFile: subtitleFile,
      translatedFile,
      segments: translatedCues.length,
      time: endTime - startTime
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la traduction des sous-titres: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests du service de traduction hybride...');
  
  try {
    const reportDir = await ensureReportDir();
    const results = {};
    
    // Test du service de traduction
    results.translation = await testTranslationService();
    
    // Test de traduction de sous-titres
    results.subtitles = await testSubtitleTranslation();
    
    // Sauvegarde des résultats
    const timestamp = Date.now();
    const reportPath = path.join(reportDir, `translation-test-results-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Résultats sauvegardés dans ${reportPath}`);
    
    // Résumé
    console.log('\n📋 Résumé des tests:');
    console.log(`Service de traduction: ${results.translation.success ? '✅ Succès' : '❌ Échec'}`);
    console.log(`Traduction de sous-titres: ${results.subtitles.success ? '✅ Succès' : '❌ Échec'}`);
    
    if (results.subtitles.success) {
      console.log(`Segments traduits: ${results.subtitles.segments}`);
      console.log(`Temps de traduction: ${results.subtitles.time / 1000} secondes`);
    }
    
    console.log('\n✅ Tests terminés!');
  } catch (error) {
    console.error(`❌ Erreur critique: ${error.message}`);
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error(`Erreur globale: ${error.message}`);
  process.exit(1);
});
