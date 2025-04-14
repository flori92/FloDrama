/**
 * Script pour corriger le chargement des ressources statiques
 * Ce script met à jour le fichier index.html pour utiliser les bons chemins de fichiers
 */

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configuration AWS
const s3 = new AWS.S3();
const BUCKET_NAME = 'flodrama-app-bucket-us-east1-us-east1';

// Fonction principale
async function fixResourceLoading() {
  console.log('🔍 Analyse des fichiers statiques dans le bucket S3...');
  
  try {
    // Récupérer la liste des fichiers JS et CSS
    const staticFiles = await listStaticFiles();
    
    // Trouver les fichiers index.js et index.css avec leurs hachages
    const indexJsFile = staticFiles.find(file => file.Key.match(/assets\/index-[a-zA-Z0-9]+\.js$/));
    const indexCssFile = staticFiles.find(file => file.Key.match(/assets\/index-[a-zA-Z0-9]+\.css$/));
    
    if (!indexJsFile || !indexCssFile) {
      throw new Error('Impossible de trouver les fichiers index.js ou index.css');
    }
    
    console.log(`✅ Fichiers trouvés: ${indexJsFile.Key}, ${indexCssFile.Key}`);
    
    // Télécharger le fichier index.html
    const indexHtml = await downloadIndexHtml();
    
    // Extraire les noms de fichiers avec hachage
    const jsFileName = path.basename(indexJsFile.Key);
    const cssFileName = path.basename(indexCssFile.Key);
    
    // Mettre à jour le script de chargement
    const updatedHtml = indexHtml
      // Mettre à jour la référence au fichier JS
      .replace(
        /\{ type: 'script', path: '\/assets\/index\.js' \}/g, 
        `{ type: 'script', path: '/assets/${jsFileName}' }`
      )
      // Ajouter une référence au fichier CSS si nécessaire
      .replace(
        /const resources = \[/g,
        `const resources = [\n            { type: 'style', path: '/assets/${cssFileName}' },`
      );
    
    // Téléverser le fichier index.html mis à jour
    await uploadIndexHtml(updatedHtml);
    
    console.log('✅ Fichier index.html mis à jour avec succès');
    console.log('🔄 Invalidation du cache CloudFront en cours...');
    
    // Invalider le cache CloudFront
    await invalidateCloudFrontCache();
    
    console.log('✅ Correction terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Lister les fichiers statiques
async function listStaticFiles() {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: 'assets/'
  };
  
  const response = await s3.listObjectsV2(params).promise();
  return response.Contents;
}

// Télécharger le fichier index.html
async function downloadIndexHtml() {
  const params = {
    Bucket: BUCKET_NAME,
    Key: 'index.html'
  };
  
  const response = await s3.getObject(params).promise();
  return response.Body.toString('utf-8');
}

// Téléverser le fichier index.html mis à jour
async function uploadIndexHtml(htmlContent) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: 'index.html',
    Body: htmlContent,
    ContentType: 'text/html',
    CacheControl: 'no-cache'
  };
  
  await s3.putObject(params).promise();
}

// Invalider le cache CloudFront
async function invalidateCloudFrontCache() {
  const cloudfront = new AWS.CloudFront();
  
  // Récupérer l'ID de la distribution CloudFront
  const distributions = await cloudfront.listDistributions().promise();
  const distribution = distributions.DistributionList.Items.find(
    dist => dist.Aliases.Items && dist.Aliases.Items.includes('flodrama.com')
  );
  
  if (!distribution) {
    throw new Error('Distribution CloudFront non trouvée');
  }
  
  const params = {
    DistributionId: distribution.Id,
    InvalidationBatch: {
      CallerReference: `fix-resource-loading-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  };
  
  await cloudfront.createInvalidation(params).promise();
}

// Exécuter le script
fixResourceLoading();
