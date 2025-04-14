/**
 * Script pour corriger les problèmes de chargement des modules ES
 * Ce script simplifie la structure du fichier HTML pour éviter les conflits
 */

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configuration AWS
const s3 = new AWS.S3();
const BUCKET_NAME = 'flodrama-app-bucket-us-east1-us-east1';

// Fonction principale
async function fixModuleLoading() {
  console.log('🔍 Analyse du fichier HTML...');
  
  try {
    // Télécharger le fichier index.html
    const indexHtml = await downloadIndexHtml();
    
    // Créer un nouveau fichier HTML simplifié
    const simplifiedHtml = createSimplifiedHtml(indexHtml);
    
    // Téléverser le fichier index.html mis à jour
    await uploadIndexHtml(simplifiedHtml);
    
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

// Télécharger le fichier index.html
async function downloadIndexHtml() {
  const params = {
    Bucket: BUCKET_NAME,
    Key: 'index.html'
  };
  
  const response = await s3.getObject(params).promise();
  return response.Body.toString('utf-8');
}

// Créer un fichier HTML simplifié
function createSimplifiedHtml(originalHtml) {
  // Extraire les parties importantes du fichier HTML original
  const headMatch = /<head>([\s\S]*?)<\/head>/i.exec(originalHtml);
  const bodyMatch = /<body>([\s\S]*?)<\/body>/i.exec(originalHtml);
  
  if (!headMatch || !bodyMatch) {
    throw new Error('Impossible de parser le fichier HTML');
  }
  
  let head = headMatch[1];
  const body = bodyMatch[1];
  
  // Supprimer les scripts de chargement dynamique qui causent des problèmes
  head = head.replace(/<script>\s*\/\/ Fonction pour charger dynamiquement[\s\S]*?<\/script>/i, '');
  
  // Conserver uniquement les balises de script de type module et les feuilles de style
  const moduleScriptMatch = /<script type="module"[\s\S]*?<\/script>/i.exec(head);
  const modulePreloads = head.match(/<link rel="modulepreload"[^>]*>/gi) || [];
  const stylesheets = head.match(/<link rel="stylesheet"[^>]*>/gi) || [];
  const metaTags = head.match(/<meta[^>]*>/gi) || [];
  
  // Construire un nouvel en-tête simplifié
  let newHead = `
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#FF00FF" />
    <meta name="description" content="FloDrama - Votre plateforme de streaming dédiée aux dramas et films asiatiques" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>FloDrama - Streaming de Dramas et Films Asiatiques</title>
    
    <!-- Styles pour le splash screen -->
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #111827;
        color: #f3f4f6;
      }
      
      #splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #111827;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.5s ease-out;
      }
      
      #splash-screen.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      .logo {
        width: 150px;
        height: 150px;
        margin-bottom: 30px;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .loading-text {
        font-size: 18px;
        margin-bottom: 20px;
        color: #f3f4f6;
      }
      
      .loading-bar {
        width: 300px;
        height: 4px;
        background-color: #374151;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .loading-progress {
        height: 100%;
        width: 30%;
        background-color: #FF00FF;
        border-radius: 2px;
        animation: loading 2s infinite ease-in-out;
      }
      
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      
      .error-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #111827;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .error-title {
        font-size: 28px;
        font-weight: bold;
        color: #ef4444;
        margin-bottom: 20px;
      }
      
      .error-message {
        font-size: 16px;
        max-width: 80%;
        text-align: center;
        margin-bottom: 30px;
        color: #f3f4f6;
      }
      
      .retry-button {
        padding: 10px 20px;
        background-color: #FF00FF;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .retry-button:hover {
        background-color: #d946ef;
      }
    </style>
  `;
  
  // Ajouter les feuilles de style
  stylesheets.forEach(stylesheet => {
    newHead += `\n    ${stylesheet}`;
  });
  
  // Ajouter les préchargements de modules
  modulePreloads.forEach(preload => {
    newHead += `\n    ${preload}`;
  });
  
  // Ajouter le script de module principal
  if (moduleScriptMatch) {
    newHead += `\n    ${moduleScriptMatch[0]}`;
  }
  
  // Construire le nouveau fichier HTML
  const newHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>${newHead}
  </head>
  <body>
    <noscript>Vous devez activer JavaScript pour exécuter cette application.</noscript>
    <div id="root"></div>
    
    <!-- Splash screen initial (affiché avant que React ne soit chargé) -->
    <div id="splash-screen">
      <img src="/logo512.png" alt="FloDrama Logo" class="logo" id="splash-logo" />
      <div class="loading-text">Chargement de FloDrama...</div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>
    
    <!-- Écran d'erreur -->
    <div id="error-container" class="error-container">
      <div class="error-title">Erreur de chargement</div>
      <div id="error-message" class="error-message">Une erreur est survenue lors du chargement de l'application.</div>
      <button class="retry-button" onclick="window.location.reload()">Réessayer</button>
    </div>
    
    <script>
      // Script simple pour gérer l'affichage du splash screen et des erreurs
      window.addEventListener('load', function() {
        const splashScreen = document.getElementById('splash-screen');
        const errorContainer = document.getElementById('error-container');
        
        // Cacher le splash screen après le chargement
        setTimeout(function() {
          if (splashScreen) {
            splashScreen.classList.add('hidden');
            setTimeout(function() {
              if (splashScreen.parentNode) {
                splashScreen.parentNode.removeChild(splashScreen);
              }
            }, 500);
          }
        }, 1000);
        
        // Gérer les erreurs de chargement
        window.addEventListener('error', function(event) {
          console.error('Erreur détectée:', event);
          if (errorContainer) {
            errorContainer.style.display = 'flex';
          }
          if (splashScreen) {
            splashScreen.style.display = 'none';
          }
        }, true);
      });
    </script>
  </body>
</html>`;

  return newHtml;
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
      CallerReference: `fix-module-loading-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  };
  
  await cloudfront.createInvalidation(params).promise();
}

// Exécuter le script
fixModuleLoading();
