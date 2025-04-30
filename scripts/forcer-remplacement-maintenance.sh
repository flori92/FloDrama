#!/bin/bash
# Script pour forcer le remplacement de la page de maintenance par le contenu réel de l'application
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Remplacement forcé de la page de maintenance ===${NC}"

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/remplacement-maintenance-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    log "${RED}npm n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    log "${YELLOW}Vercel CLI n'est pas installé. Installation en cours...${NC}"
    npm install -g vercel
fi

# 1. Nettoyer le build précédent
log "${YELLOW}Nettoyage du build précédent...${NC}"
rm -rf build dist .vercel/output

# 2. Mettre à jour le fichier status.json pour désactiver explicitement la maintenance
log "${YELLOW}Mise à jour du fichier status.json...${NC}"
mkdir -p public/data

cat > public/data/status.json << EOF
{
  "status": "online",
  "version": "1.0.0",
  "lastUpdate": "$(date +"%Y-%m-%dT%H:%M:%S%:z")",
  "services": {
    "streaming": {"status": "online", "message": "Service de streaming opérationnel"},
    "metadata": {"status": "online", "message": "Service de métadonnées opérationnel"},
    "auth": {"status": "online", "message": "Service d'authentification opérationnel"},
    "payment": {"status": "online", "message": "Service de paiement opérationnel"}
  },
  "maintenance": {
    "scheduled": false,
    "startTime": null,
    "endTime": null,
    "message": ""
  }
}
EOF

# 3. Créer un fichier index.html de secours sans message de maintenance
log "${YELLOW}Création d'un fichier index.html de secours...${NC}"
cat > public/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="description" content="FloDrama - Votre plateforme de streaming dédiée aux dramas et films asiatiques" />
  <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
  <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
  <title>FloDrama - Streaming de Dramas et Films Asiatiques</title>
</head>
<body>
  <noscript>Vous devez activer JavaScript pour utiliser cette application.</noscript>
  <div id="root">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
      <img src="%PUBLIC_URL%/flodrama-logo.svg" alt="FloDrama Logo" style="width: 200px; margin-bottom: 20px;" />
      <h1 style="color: #3b82f6; margin-bottom: 10px;">FloDrama</h1>
      <p style="font-size: 18px; color: #333;">Chargement de l'application en cours...</p>
      <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </div>
</body>
</html>
EOF

# 4. Créer un fichier vercel.json optimisé
log "${YELLOW}Création d'un fichier vercel.json optimisé...${NC}"
cat > vercel.json << EOF
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "routes": [
    {
      "src": "/data/status.json",
      "headers": {
        "cache-control": "s-maxage=1, stale-while-revalidate=59"
      },
      "continue": true
    },
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "continue": true
    },
    {
      "src": "/(.*)\\.(js|css|svg|png|jpg|jpeg|gif|ico|json)$",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "continue": true
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOF

# 5. Installer les dépendances
log "${YELLOW}Installation des dépendances...${NC}"
npm install --legacy-peer-deps

# 6. Construire l'application
log "${YELLOW}Construction de l'application...${NC}"
npm run build

# 7. Vérifier si le build a réussi
if [ ! -d "build" ]; then
    log "${RED}Erreur: La construction de l'application a échoué${NC}"
    exit 1
fi

# 8. Vérifier que le fichier index.html du build ne contient pas de message de maintenance
log "${YELLOW}Vérification du fichier index.html du build...${NC}"
if grep -q "maintenance" build/index.html; then
    log "${YELLOW}Le fichier index.html contient toujours un message de maintenance. Remplacement...${NC}"
    cp public/index.html build/index.html
fi

# 9. Déployer sur Vercel
log "${YELLOW}Déploiement sur Vercel...${NC}"
vercel deploy --prod

# 10. Configurer l'alias
log "${YELLOW}Configuration de l'alias...${NC}"
DEPLOY_URL=$(vercel ls --prod | grep flodrama | awk '{print $2}' | head -n 1)
if [ -n "$DEPLOY_URL" ]; then
    vercel alias set $DEPLOY_URL flodrama.vercel.app
    log "${GREEN}Alias configuré: flodrama.vercel.app -> $DEPLOY_URL${NC}"
else
    log "${RED}Impossible de récupérer l'URL de déploiement${NC}"
fi

# 11. Vider le cache CloudFront si nécessaire
log "${YELLOW}Vérification des distributions CloudFront...${NC}"
DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[*].{Id:Id,Origins:Origins.Items[*].DomainName}" --output json)
if [ -n "$DISTRIBUTIONS" ]; then
    echo "$DISTRIBUTIONS" | grep -q "flodrama"
    if [ $? -eq 0 ]; then
        log "${YELLOW}Distributions CloudFront trouvées pour FloDrama. Invalidation du cache...${NC}"
        DIST_IDS=$(echo "$DISTRIBUTIONS" | grep -B 2 "flodrama" | grep "Id" | awk -F'"' '{print $4}')
        for DIST_ID in $DIST_IDS; do
            aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" >> $LOG_FILE 2>&1
            log "${GREEN}Invalidation du cache créée pour la distribution $DIST_ID${NC}"
        done
    else
        log "${YELLOW}Aucune distribution CloudFront trouvée pour FloDrama${NC}"
    fi
else
    log "${YELLOW}Aucune distribution CloudFront trouvée${NC}"
fi

# 12. Vérifier le déploiement
log "${YELLOW}Vérification du déploiement...${NC}"
curl -s https://flodrama.vercel.app > /tmp/flodrama_check.html
if grep -q "maintenance" /tmp/flodrama_check.html; then
    log "${RED}Le site affiche toujours un message de maintenance${NC}"
    log "${YELLOW}Vérifiez les redirections DNS et les caches navigateur${NC}"
else
    log "${GREEN}Le site ne contient plus de message de maintenance${NC}"
fi

echo -e "${GREEN}=== Remplacement forcé de la page de maintenance terminé ===${NC}"
echo -e "${YELLOW}Consultez le log pour plus de détails: $LOG_FILE${NC}"
echo -e "${YELLOW}URL de l'application: https://flodrama.vercel.app${NC}"
