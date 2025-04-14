#!/bin/bash

# Script de préparation au déploiement de FloDrama
# Ce script prépare le projet pour le déploiement en créant une version optimisée

# Couleurs pour les messages
BLUE='\033[0;34m'
FUCHSIA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Afficher le logo FloDrama avec le dégradé signature
echo -e "${BLUE}███████${FUCHSIA}██████  ${BLUE}██       ${FUCHSIA}██████  ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}███    ███${FUCHSIA}  █████  ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}████  ████${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}█████  ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}██ ████ ██${FUCHSIA} ███████ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██  ██  ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██████  ${BLUE}███████ ${FUCHSIA}██████  ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██      ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━${FUCHSIA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Préparation au déploiement${NC}"
echo ""

# Vérifier si nous sommes dans le répertoire du projet
if [ ! -f "package.json" ]; then
    echo -e "${RED}Erreur: Ce script doit être exécuté depuis le répertoire racine du projet FloDrama.${NC}"
    exit 1
fi

# Créer un répertoire temporaire pour le déploiement
DEPLOY_DIR="deploy_build"
echo -e "${YELLOW}Création du répertoire de déploiement: ${DEPLOY_DIR}${NC}"

# Supprimer le répertoire s'il existe déjà
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}Suppression du répertoire de déploiement existant...${NC}"
    rm -rf "$DEPLOY_DIR"
fi

# Créer le répertoire de déploiement
mkdir -p "$DEPLOY_DIR"

# Copier les fichiers essentiels
echo -e "${YELLOW}Copie des fichiers essentiels...${NC}"
cp package.json "$DEPLOY_DIR/"
cp netlify.toml "$DEPLOY_DIR/"
cp .env.public "$DEPLOY_DIR/.env"
cp -r public "$DEPLOY_DIR/"
cp -r src "$DEPLOY_DIR/"
cp -r js "$DEPLOY_DIR/"
cp -r css "$DEPLOY_DIR/"
cp -r assets "$DEPLOY_DIR/"
cp index.html "$DEPLOY_DIR/"
cp vite.config.js "$DEPLOY_DIR/"

# Créer un .gitignore pour le déploiement
echo -e "${YELLOW}Création d'un .gitignore optimisé pour le déploiement...${NC}"
cat > "$DEPLOY_DIR/.gitignore" << EOL
# Ignorer les fichiers non nécessaires au déploiement
node_modules/
.git/
.github/
.vscode/
.idea/
.DS_Store
*.log
*.lock
.env*
!.env
__tests__/
__mocks__/
*.test.js
*.spec.js
docs/
scripts/
temp/
tmp/
*.md
!README.md
EOL

# Nettoyer les fichiers inutiles dans le répertoire de déploiement
echo -e "${YELLOW}Nettoyage des fichiers inutiles...${NC}"
find "$DEPLOY_DIR" -name "*.test.js" -type f -delete
find "$DEPLOY_DIR" -name "*.spec.js" -type f -delete
find "$DEPLOY_DIR" -name "__tests__" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name "__mocks__" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name ".git" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name ".github" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name ".vscode" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name ".idea" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name "docs" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name "scripts" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name "temp" -type d -exec rm -rf {} +
find "$DEPLOY_DIR" -name "tmp" -type d -exec rm -rf {} +

# Compter le nombre de fichiers
FILE_COUNT=$(find "$DEPLOY_DIR" -type f | wc -l)
echo -e "${GREEN}Nombre de fichiers pour le déploiement: ${FILE_COUNT}${NC}"

# Création d'un fichier README.md minimal
echo -e "${YELLOW}Création d'un README.md minimal...${NC}"
cat > "$DEPLOY_DIR/README.md" << EOL
# FloDrama

Plateforme de streaming dédiée aux dramas, films et animés asiatiques.

## Fonctionnalités

- Authentification avec MongoDB Atlas
- Favoris et historique de visionnage
- Interface utilisateur intuitive
- Expérience responsive sur tous les appareils

Version optimisée pour le déploiement.
EOL

echo -e "${GREEN}Préparation au déploiement terminée avec succès !${NC}"
echo -e "${YELLOW}Pour déployer, utilisez la commande:${NC}"
echo -e "${BLUE}cd ${DEPLOY_DIR} && npx netlify deploy${NC}"
