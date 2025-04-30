#!/bin/bash
# Script de reconstruction et déploiement du front-end FloDrama
# Créé le 26-03-2025
# Ce script résout le problème de région AWS en forçant la configuration correcte

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
BUILD_DIR="dist"

echo -e "${YELLOW}=== Début du processus de reconstruction et déploiement de FloDrama ===${NC}"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo -e "${RED}Erreur: Vous devez exécuter ce script depuis le répertoire racine du projet Frontend${NC}"
  exit 1
fi

# 1. Créer un fichier de configuration AWS global
echo -e "${YELLOW}Création du fichier de configuration AWS global...${NC}"
cat > src/aws-config-global.js << EOL
// Configuration AWS globale pour FloDrama
// Généré automatiquement par le script de déploiement

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

console.log('[AWS Config Global] Chargé avec succès');
EOL

echo -e "${GREEN}Configuration AWS globale créée avec succès${NC}"

# 2. Modifier le fichier index.html pour inclure le script de configuration AWS global
echo -e "${YELLOW}Modification du fichier index.html...${NC}"
cat > public/index.html << EOL
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
    <script src="/aws-config-global.js"></script>
    
    <!-- Configuration de la région AWS -->
    <script>
      window.AWS_REGION = '${AWS_REGION}';
      window.API_BASE_URL = 'https://7la2pq33ej.execute-api.${AWS_REGION}.amazonaws.com/production';
      console.log('[Index HTML] Configuration AWS chargée:', window.AWS_REGION);
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOL

echo -e "${GREEN}Fichier index.html modifié avec succès${NC}"

# 3. Mettre à jour le fichier .env.production
echo -e "${YELLOW}Mise à jour du fichier .env.production...${NC}"
cat > .env.production << EOL
# Configuration de l'API
VITE_API_BASE_URL=https://7la2pq33ej.execute-api.${AWS_REGION}.amazonaws.com/production

# Configuration de l'environnement
VITE_NODE_ENV=production
VITE_AWS_REGION=${AWS_REGION}

# Configuration du système de recommandation
VITE_RECOMMANDATION_CACHE_DURATION=1800000
VITE_RECOMMANDATION_MAX_ITEMS=50

# Configuration de l'authentification
VITE_AUTH_TOKEN_KEY=flodrama_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=flodrama_refresh_token

# Configuration des médias
VITE_MEDIA_CDN_URL=https://d1323ouxr1qbdp.cloudfront.net
VITE_MEDIA_UPLOAD_MAX_SIZE=100000000 # 100MB

# Configuration des logs
VITE_LOG_LEVEL=error
EOL

echo -e "${GREEN}Fichier .env.production mis à jour avec succès${NC}"

# 4. Nettoyer le répertoire de build
echo -e "${YELLOW}Nettoyage du répertoire de build...${NC}"
rm -rf ${BUILD_DIR}
echo -e "${GREEN}Répertoire de build nettoyé${NC}"

# 5. Installer les dépendances
echo -e "${YELLOW}Installation des dépendances...${NC}"
npm install
echo -e "${GREEN}Dépendances installées avec succès${NC}"

# 6. Construire l'application
echo -e "${YELLOW}Construction de l'application...${NC}"
npm run build
echo -e "${GREEN}Application construite avec succès${NC}"

# 7. Copier le fichier de configuration AWS global dans le répertoire de build
echo -e "${YELLOW}Copie du fichier de configuration AWS global dans le répertoire de build...${NC}"
cp src/aws-config-global.js ${BUILD_DIR}/aws-config-global.js
echo -e "${GREEN}Fichier de configuration AWS global copié avec succès${NC}"

# 8. Déployer vers S3
echo -e "${YELLOW}Déploiement vers S3...${NC}"
aws s3 sync ${BUILD_DIR} s3://${S3_BUCKET} --delete --region ${AWS_REGION}
echo -e "${GREEN}Déploiement vers S3 terminé avec succès${NC}"

# 9. Invalider le cache CloudFront
echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*" --region ${AWS_REGION}
echo -e "${GREEN}Invalidation du cache CloudFront lancée avec succès${NC}"

echo -e "${GREEN}=== Processus de reconstruction et déploiement terminé avec succès ===${NC}"
echo -e "${YELLOW}Note: L'invalidation du cache CloudFront peut prendre quelques minutes pour se propager${NC}"
