/**
 * Script de test pour la fonctionnalité de traduction de sous-titres
 * Ce script teste la traduction et la mise en cache des sous-titres de manière isolée
 */

const { translate } = require('@vitalets/google-translate-api');
const subtitle = require('subtitle');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const Redis = require('ioredis');

// Configuration Redis (à adapter selon votre configuration)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
});

// Fonction de traduction avec cache Redis
async function translateWithCache(text, targetLang = 'fr') {
  if (!text || text.trim() === '') {
    return text;
  }
  
  // Création d'une clé de cache unique
  const cacheKey = `translation:${targetLang}:${Buffer.from(text).toString('base64')}`;
  
  try {
    // Vérification du cache
    const cachedTranslation = await redis.get(cacheKey);
    if (cachedTranslation) {
      console.log('🔄 Traduction récupérée depuis le cache');
      return cachedTranslation;
    }
    
    // Traduction via l'API
    console.log("🌐 Traduction via l'API Google");
    const { text: translatedText } = await translate(text, { to: targetLang });
    
    // Mise en cache pour les futures requêtes (expiration après 7 jours)
    await redis.set(cacheKey, translatedText, 'EX', 60 * 60 * 24 * 7);
    
    return translatedText;
  } catch (error) {
    console.error(`❌ Erreur de traduction: ${error.message}`);
    return text; // En cas d'erreur, retourner le texte original
  }
}

// Fonction pour traiter un fichier de sous-titres
async function processSubtitleFile(filePath, targetLang = 'fr') {
  try {
    // Lecture du fichier
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parsing du contenu
    const parsed = subtitle.parse(content);
    console.log(`📄 Fichier de sous-titres analysé: ${parsed.length} segments trouvés`);
    
    // Traduction des segments
    console.log('🔄 Début de la traduction des segments...');
    const startTime = Date.now();
    
    const translatedCues = await Promise.all(
      parsed.map(async (cue, index) => {
        // Afficher la progression tous les 5 segments
        if (index % 5 === 0) {
          console.log(`  ⏳ Traduction du segment ${index + 1}/${parsed.length}`);
        }
        
        const translatedText = await translateWithCache(cue.text, targetLang);
        return {
          ...cue,
          text: translatedText
        };
      })
    );
    
    const endTime = Date.now();
    console.log(`✅ Traduction terminée en ${(endTime - startTime) / 1000} secondes`);
    
    // Reconstruction du sous-titre
    const translatedContent = subtitle.stringify(translatedCues);
    
    // Écriture du fichier traduit
    const outputPath = filePath.replace('.srt', `.${targetLang}.srt`);
    await fs.writeFile(outputPath, translatedContent);
    
    console.log(`📝 Sous-titres traduits sauvegardés dans: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement du fichier: ${error.message}`);
    throw error;
  }
}

// Fonction pour télécharger un sous-titre depuis une URL
async function downloadSubtitle(url, outputPath) {
  try {
    console.log(`📥 Téléchargement du sous-titre depuis: ${url}`);
    const response = await axios.get(url);
    
    await fs.writeFile(outputPath, response.data);
    console.log(`✅ Sous-titre téléchargé dans: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement: ${error.message}`);
    throw error;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du test de traduction de sous-titres...');
  
  // Création du dossier de test
  const testDir = path.join(process.cwd(), 'test-subtitles');
  await fs.mkdir(testDir, { recursive: true });
  
  // URL de test pour un fichier de sous-titres
  const subtitleUrl = 'https://raw.githubusercontent.com/libass/libass/master/test/data/sub1.srt';
  const localPath = path.join(testDir, 'test.srt');
  
  try {
    // Téléchargement du sous-titre
    await downloadSubtitle(subtitleUrl, localPath);
    
    // Traitement et traduction du sous-titre
    const translatedPath = await processSubtitleFile(localPath);
    
    // Test du cache
    console.log('\n📦 Test du cache Redis:');
    console.log('Traitement du même fichier une seconde fois (devrait utiliser le cache)');
    const cachedPath = await processSubtitleFile(localPath);
    
    console.log('\n✅ Test terminé avec succès!');
    console.log(`Fichier original: ${localPath}`);
    console.log(`Fichier traduit: ${translatedPath}`);
    console.log(`Fichier depuis le cache: ${cachedPath}`);
    
    // Fermeture de la connexion Redis
    await redis.quit();
  } catch (error) {
    console.error(`❌ Erreur globale: ${error.message}`);
    process.exit(1);
  }
}

// Exécution du script
main();
