/**
 * Script de démarrage du serveur API FloDrama
 * Ce script vérifie les connexions aux services externes avant de démarrer le serveur
 */

const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Chargement des variables d'environnement
dotenv.config();

// Configuration AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Configuration du bucket S3
const BUCKET_NAME = process.env.S3_BUCKET || 'flodrama-content-1745269660';
const FRONTEND_DATA_PATH = path.join(__dirname, '..', '..', 'Frontend', 'src', 'data');

// Initialisation des clients AWS
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

/**
 * Vérifie la connexion à AWS S3
 */
async function checkS3Connection() {
  try {
    console.log('🔄 Vérification de la connexion à AWS S3...');
    await s3.listBuckets().promise();
    console.log('✅ Connexion à AWS S3 établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à AWS S3:', error.message);
    return false;
  }
}

/**
 * Vérifie la connexion à AWS Lambda
 */
async function checkLambdaConnection() {
  try {
    console.log('🔄 Vérification de la connexion à AWS Lambda...');
    await lambda.listFunctions().promise();
    console.log('✅ Connexion à AWS Lambda établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à AWS Lambda:', error.message);
    return false;
  }
}

/**
 * Vérifie l'accès au bucket S3
 */
async function checkS3Bucket() {
  try {
    console.log(`🔄 Vérification de l'accès au bucket S3 ${BUCKET_NAME}...`);
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ Accès au bucket S3 ${BUCKET_NAME} vérifié avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur d'accès au bucket S3 ${BUCKET_NAME}:`, error.message);
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
  const s3Connected = await checkS3Connection();
  const lambdaConnected = await checkLambdaConnection();
  const bucketAccessible = await checkS3Bucket();
  const dataFoldersReady = checkDataFolders();
  
  // Vérification des variables d'environnement
  const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
    console.warn('⚠️ Certaines fonctionnalités pourraient ne pas fonctionner correctement');
  }
  
  // Démarrage du serveur même si certaines connexions échouent (mode dégradé)
  console.log('\n📊 Résumé des vérifications:');
  console.log(`- AWS S3: ${s3Connected ? '✅ Connecté' : '❌ Non connecté (mode dégradé)'}`);
  console.log(`- AWS Lambda: ${lambdaConnected ? '✅ Connecté' : '❌ Non connecté (mode dégradé)'}`);
  console.log(`- Bucket S3: ${bucketAccessible ? '✅ Accessible' : '❌ Non accessible (mode dégradé)'}`);
  console.log(`- Dossiers de données: ${dataFoldersReady ? '✅ Prêts' : '❌ Non prêts'}`);
  
  // Démarrage du serveur
  startServer();
}

// Exécution de la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'initialisation du serveur:', error);
  process.exit(1);
});
