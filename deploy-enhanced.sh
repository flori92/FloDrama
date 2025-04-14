#!/bin/bash

# Script de déploiement pour la version améliorée de FloDrama
# Ce script compile l'application et déploie les fichiers vers le bucket S3

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Démarrage du déploiement de FloDrama (version améliorée)...${NC}"

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo -e "${RED}Erreur: Vous n'êtes pas dans le répertoire du projet.${NC}"
  exit 1
fi

# Créer un timestamp pour la sauvegarde
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}_backup_enhanced-frontend"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarder les fichiers importants
echo -e "${YELLOW}Sauvegarde des fichiers importants...${NC}"
cp -r ./src "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp -r ./public "$BACKUP_DIR/" 2>/dev/null || :

# Installer les dépendances
echo -e "${YELLOW}Installation des dépendances...${NC}"
npm install || { echo -e "${RED}Erreur lors de l'installation des dépendances.${NC}"; exit 1; }

# Créer un fichier index.js temporaire pour utiliser la version améliorée
echo -e "${YELLOW}Configuration de l'application pour utiliser la version améliorée...${NC}"
cp ./src/index.enhanced.js ./src/index.js.bak
cp ./src/index.enhanced.js ./src/index.js

# Compiler l'application
echo -e "${YELLOW}Compilation de l'application...${NC}"
REACT_APP_USE_ENHANCED=true npm run build || { 
  echo -e "${RED}Erreur lors de la compilation.${NC}"
  # Restaurer le fichier index.js original
  mv ./src/index.js.bak ./src/index.js
  exit 1
}

# Restaurer le fichier index.js original
mv ./src/index.js.bak ./src/index.js

# Déployer vers S3
echo -e "${YELLOW}Déploiement vers S3...${NC}"
if command -v aws &> /dev/null; then
  aws s3 sync ./dist/ s3://flodrama-app-bucket-us-east1-us-east1/ --delete || { 
    echo -e "${RED}Erreur lors du déploiement vers S3.${NC}"
    exit 1
  }
  
  # Invalider le cache CloudFront
  echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
  CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, 'flodrama.com')].Id" --output text)
  
  if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" || {
      echo -e "${RED}Erreur lors de l'invalidation du cache CloudFront.${NC}"
      exit 1
    }
  else
    echo -e "${RED}Impossible de trouver l'ID de distribution CloudFront.${NC}"
  fi
else
  echo -e "${RED}AWS CLI n'est pas installé. Veuillez déployer manuellement le contenu du répertoire 'dist' vers S3.${NC}"
  exit 1
fi

# Commit des changements
echo -e "${YELLOW}Commit des changements...${NC}"
git add .
git commit -m "✨ [FEAT] Refonte complète du front-end avec composants améliorés" || {
  echo -e "${RED}Erreur lors du commit.${NC}"
  exit 1
}

# Push des changements
echo -e "${YELLOW}Push des changements...${NC}"
git push origin main || {
  echo -e "${RED}Erreur lors du push.${NC}"
  exit 1
}

echo -e "${GREEN}Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}L'application est maintenant disponible sur https://flodrama.com${NC}"
