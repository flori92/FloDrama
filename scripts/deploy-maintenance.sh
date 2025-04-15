#!/bin/bash

# Script de déploiement de la page de maintenance FloDrama
# Ce script copie la page de maintenance dans les emplacements nécessaires
# et prépare le site pour le déploiement

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Déploiement de la page de maintenance FloDrama${NC}"
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "public/index.html" ]; then
  echo -e "${RED}Erreur: Veuillez exécuter ce script depuis la racine du projet FloDrama${NC}"
  exit 1
fi

# Créer le répertoire de déploiement s'il n'existe pas
mkdir -p deploy_build

# Copier la page de maintenance dans tous les emplacements nécessaires
echo -e "${GREEN}Copie de la page de maintenance...${NC}"
cp public/index.html index.html
cp public/index.html deploy_build/index.html

# Vérifier si un fichier CNAME existe déjà
if [ ! -f "public/CNAME" ]; then
  echo -e "${YELLOW}Création du fichier CNAME...${NC}"
  echo "flodrama.com" > public/CNAME
  echo "flodrama.com" > CNAME
  echo "flodrama.com" > deploy_build/CNAME
else
  echo -e "${GREEN}Copie du fichier CNAME existant...${NC}"
  cp public/CNAME CNAME
  cp public/CNAME deploy_build/CNAME
fi

# Copier le logo et les ressources nécessaires
echo -e "${GREEN}Copie des ressources...${NC}"
if [ -f "public/logo.svg" ]; then
  cp public/logo.svg deploy_build/logo.svg
fi

# Créer un fichier .nojekyll pour GitHub Pages
echo -e "${GREEN}Création du fichier .nojekyll pour GitHub Pages...${NC}"
touch deploy_build/.nojekyll
touch .nojekyll

# Ajouter les fichiers au git
echo -e "${GREEN}Ajout des fichiers au dépôt git...${NC}"
git add index.html .nojekyll CNAME

echo -e "${GREEN}Déploiement terminé avec succès!${NC}"
echo "Vous pouvez maintenant commiter et pousser les modifications:"
echo "git commit -m \"🚀 [DEPLOY] Mise à jour de la page de maintenance\""
echo "git push origin github-pages-clean"
