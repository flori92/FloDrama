#!/bin/bash
# Script de correction et déploiement du front-end FloDrama
# Créé le 26-03-2025
# Ce script corrige le problème de région AWS sans reconstruire l'application

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
S3_BUCKET="flodrama-app-bucket-us-east1-us-east1"
CLOUDFRONT_DISTRIBUTION_ID="E5XC74WR62W9Z"
TEMP_DIR="/tmp/flodrama-fix-$(date +%s)"

echo -e "${YELLOW}=== Début du processus de correction et déploiement de FloDrama ===${NC}"

# Créer un répertoire temporaire
mkdir -p ${TEMP_DIR}
echo -e "${GREEN}Répertoire temporaire créé: ${TEMP_DIR}${NC}"

# 1. Créer un fichier de configuration AWS global
echo -e "${YELLOW}Création du fichier de configuration AWS global...${NC}"
cat > ${TEMP_DIR}/aws-region-fix.js << EOL
// Configuration AWS globale pour FloDrama
// Généré automatiquement par le script de déploiement le $(date)

// Définir la région AWS globalement
window.AWS_REGION = '${AWS_REGION}';
window.API_BASE_URL = 'https://7la2pq33ej.execute-api.${AWS_REGION}.amazonaws.com/production';
window.MEDIA_CDN_URL = 'https://d1323ouxr1qbdp.cloudfront.net';

// Intercepter et corriger les requêtes AWS
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Si l'URL contient amazonaws.com, s'assurer que la région est correcte
  if (typeof url === 'string' && url.includes('amazonaws.com')) {
    // Forcer la région us-east-1 dans les en-têtes d'autorisation
    if (!options.headers) {
      options.headers = {};
    }
    
    // Convertir les Headers en objet si nécessaire
    if (options.headers instanceof Headers) {
      const headerObj = {};
      for (const [key, value] of options.headers.entries()) {
        headerObj[key] = value;
      }
      options.headers = headerObj;
    }
    
    // Ajouter ou remplacer l'en-tête x-amz-region
    options.headers['x-amz-region'] = '${AWS_REGION}';
  }
  
  return originalFetch(url, options);
};

// Si AWS SDK est présent, configurer la région
if (typeof AWS !== 'undefined') {
  AWS.config.region = '${AWS_REGION}';
  console.log('[AWS Config] Région configurée:', '${AWS_REGION}');
}

// Patch pour les requêtes XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
  this._url = url;
  return originalXHROpen.apply(this, arguments);
};

const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
  if (typeof this._url === 'string' && this._url.includes('amazonaws.com') && header.toLowerCase() === 'x-amz-region') {
    value = '${AWS_REGION}';
  }
  return originalXHRSetRequestHeader.call(this, header, value);
};

// Patch pour AWS SDK
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier si AWS SDK est chargé toutes les 100ms
  const awsConfigInterval = setInterval(function() {
    if (typeof AWS !== 'undefined') {
      AWS.config.region = '${AWS_REGION}';
      console.log('[AWS Config] SDK AWS détecté et configuré avec la région: ${AWS_REGION}');
      clearInterval(awsConfigInterval);
    }
  }, 100);
  
  // Arrêter la vérification après 10 secondes
  setTimeout(function() {
    clearInterval(awsConfigInterval);
  }, 10000);
});

console.log('[AWS Region Fix] Script de correction de région chargé avec succès');
EOL

echo -e "${GREEN}Configuration AWS globale créée avec succès${NC}"

# 2. Créer un fichier index.html modifié
echo -e "${YELLOW}Création du fichier index.html modifié...${NC}"
cat > ${TEMP_DIR}/index.html << EOL
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <meta name="description" content="FloDrama - Streaming de Dramas et Films Asiatiques" />
    <meta name="theme-color" content="#ff4081" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="FloDrama" />
    <meta property="og:title" content="FloDrama - Streaming de Dramas et Films Asiatiques" />
    <meta property="og:description" content="Découvrez les meilleurs dramas et films asiatiques en streaming HD" />
    <meta property="og:image" content="/logo512.png" />
    <meta property="og:url" content="https://flodrama.com" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>FloDrama - Streaming de Dramas et Films Asiatiques</title>
    
    <!-- Script de configuration AWS global - Chargé en premier -->
    <script src="/assets/aws-region-fix.js"></script>
    
    <!-- Configuration de la région AWS -->
    <script>
      window.AWS_REGION = '${AWS_REGION}';
      window.API_BASE_URL = 'https://7la2pq33ej.execute-api.${AWS_REGION}.amazonaws.com/production';
      console.log('[Index HTML] Configuration AWS chargée:', window.AWS_REGION);
      
      // Définir une variable globale pour indiquer que la configuration est chargée
      window.AWS_CONFIG_LOADED = true;
    </script>
    
    <style>
      /* Styles pour le splash screen initial */
      #splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1a1a1a;
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
      #splash-logo {
        width: 150px;
        height: 150px;
        margin-bottom: 20px;
      }
      #splash-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 64, 129, 0.3);
        border-radius: 50%;
        border-top-color: #ff4081;
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="splash-screen">
      <img id="splash-logo" src="/logo512.png" alt="FloDrama Logo" />
      <div id="splash-spinner"></div>
    </div>
    
    <div id="root"></div>
    
    <script>
      // Masquer le splash screen une fois que l'application est chargée
      window.addEventListener('load', function() {
        setTimeout(function() {
          const splashScreen = document.getElementById('splash-screen');
          if (splashScreen) {
            splashScreen.classList.add('hidden');
            setTimeout(function() {
              splashScreen.style.display = 'none';
            }, 500);
          }
        }, 1000);
      });
    </script>
    
    <!-- Chargement des scripts de l'application -->
    <script type="module" src="/assets/index-CDjFv9qA.js"></script>
  </body>
</html>
EOL

echo -e "${GREEN}Fichier index.html modifié avec succès${NC}"

# 3. Télécharger les fichiers vers S3
echo -e "${YELLOW}Téléchargement des fichiers vers S3...${NC}"
aws s3 cp ${TEMP_DIR}/aws-region-fix.js s3://${S3_BUCKET}/assets/aws-region-fix.js --region ${AWS_REGION}
aws s3 cp ${TEMP_DIR}/index.html s3://${S3_BUCKET}/index.html --region ${AWS_REGION}
echo -e "${GREEN}Fichiers téléchargés vers S3 avec succès${NC}"

# 4. Invalider le cache CloudFront
echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*" --region ${AWS_REGION}
echo -e "${GREEN}Invalidation du cache CloudFront lancée avec succès${NC}"

# 5. Nettoyer
echo -e "${YELLOW}Nettoyage...${NC}"
rm -rf ${TEMP_DIR}
echo -e "${GREEN}Nettoyage terminé${NC}"

echo -e "${GREEN}=== Processus de correction et déploiement terminé avec succès ===${NC}"
echo -e "${YELLOW}Note: L'invalidation du cache CloudFront peut prendre quelques minutes pour se propager${NC}"
