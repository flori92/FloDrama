#!/bin/bash

# Script pour corriger les problèmes de chargement des modules ES
# Ce script simplifie la structure du fichier HTML pour éviter les conflits

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Correction des problèmes de chargement des modules ES...${NC}"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer pour exécuter ce script.${NC}"
  exit 1
fi

# Vérifier que le fichier AWS SDK est installé
if [ ! -d "node_modules/aws-sdk" ]; then
  echo -e "${YELLOW}Installation d'AWS SDK...${NC}"
  npm install aws-sdk --no-save
fi

# Exécuter le script de correction
echo -e "${YELLOW}Exécution du script de correction...${NC}"
node scripts/fix-module-loading.js

# Vérifier le résultat
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Correction terminée avec succès !${NC}"
  echo -e "${YELLOW}Les changements devraient être visibles dans environ 5-10 minutes (temps de propagation CloudFront).${NC}"
  echo -e "${YELLOW}Vous pouvez vérifier le site à l'adresse : https://flodrama.com${NC}"
else
  echo -e "${RED}La correction a échoué. Veuillez vérifier les erreurs ci-dessus.${NC}"
  exit 1
fi
