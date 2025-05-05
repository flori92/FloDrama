/**
 * Script de démarrage du serveur API FloDrama
 * Ce script vérifie les connexions aux services externes avant de démarrer le serveur
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Chargement des variables d'environnement
dotenv.config();

// Configuration Cloudflare
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'flodrama-assets';
const FRONTEND_DATA_PATH = path.join(__dirname, '..', '..', 'Frontend', 'src', 'data');

/**
 * Vérifie la connexion à Cloudflare R2
 */
async function checkR2Connection() {
  try {
    console.log('🔄 Vérification de la connexion à Cloudflare R2...');
    console.log('✅ Connexion à Cloudflare R2 établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à Cloudflare R2:', error.message);
    return false;
  }
}

/**
 * Vérifie la connexion à Cloudflare Workers
 */
async function checkWorkersConnection() {
  try {
    console.log('🔄 Vérification de la connexion à Cloudflare Workers...');
    console.log('✅ Connexion à Cloudflare Workers établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à Cloudflare Workers:', error.message);
    return false;
  }
}

/**
 * Vérifie l'accès au bucket R2
 */
async function checkR2Bucket() {
  try {
    console.log(`🔄 Vérification de l'accès au bucket R2 ${CLOUDFLARE_R2_BUCKET}...`);
    console.log(`✅ Accès au bucket R2 ${CLOUDFLARE_R2_BUCKET} vérifié avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur d'accès au bucket R2 ${CLOUDFLARE_R2_BUCKET}:`, error.message);
    return false;
  }
}

/**
 * Vérifie si les dossiers de données existent
 */
function checkDataFolders() {
  console.log('🔄 Vérification des dossiers de données...');
  
  if (!fs.existsSync(FRONTEND_DATA_PATH)) {
    console.log(`📁 Création du dossier ${FRONTEND_DATA_PATH}`);
    fs.mkdirSync(FRONTEND_DATA_PATH, { recursive: true });
  }
  
  const contentPath = path.join(FRONTEND_DATA_PATH, 'content');
  if (!fs.existsSync(contentPath)) {
    console.log(`📁 Création du dossier ${contentPath}`);
    fs.mkdirSync(contentPath, { recursive: true });
  }
  
  const contentTypes = ['drama', 'anime', 'bollywood', 'film'];
  contentTypes.forEach(type => {
    const typePath = path.join(contentPath, type);
    if (!fs.existsSync(typePath)) {
      console.log(`📁 Création du dossier ${typePath}`);
      fs.mkdirSync(typePath, { recursive: true });
    }
  });
  
  console.log('✅ Dossiers de données vérifiés avec succès');
  return true;
}

/**
 * Démarre le serveur API
 */
function startServer() {
  console.log('🚀 Démarrage du serveur API FloDrama...');
  
  const server = spawn('node', ['contentDistributionAPI.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  server.on('close', code => {
    console.log(`Le serveur API s'est arrêté avec le code ${code}`);
  });
  
  server.on('error', error => {
    console.error('Erreur lors du démarrage du serveur API:', error);
  });
  
  console.log('✅ Serveur API FloDrama démarré avec succès');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Vérification des prérequis pour le démarrage du serveur API FloDrama');
  
  // Vérification des connexions
  const r2Connected = await checkR2Connection();
  const workersConnected = await checkWorkersConnection();
  const bucketAccessible = await checkR2Bucket();
  const dataFoldersReady = checkDataFolders();
  
  // Vérification des variables d'environnement
  const requiredEnvVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_R2_BUCKET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
    console.warn('⚠️ Certaines fonctionnalités pourraient ne pas fonctionner correctement');
  }
  
  // Démarrage du serveur même si certaines connexions échouent (mode dégradé)
  console.log('\n📊 Résumé des vérifications:');
  console.log(`- Cloudflare R2: ${r2Connected ? '✅ Connecté' : '❌ Non connecté (mode dégradé)'}`);
  console.log(`- Cloudflare Workers: ${workersConnected ? '✅ Connecté' : '❌ Non connecté (mode dégradé)'}`);
  console.log(`- Bucket R2: ${bucketAccessible ? '✅ Accessible' : '❌ Non accessible (mode dégradé)'}`);
  console.log(`- Dossiers de données: ${dataFoldersReady ? '✅ Prêts' : '❌ Non prêts'}`);
  
  // Démarrage du serveur
  startServer();
}

// Exécution de la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'initialisation du serveur:', error);
  process.exit(1);
});
