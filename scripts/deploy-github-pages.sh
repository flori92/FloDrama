#!/bin/bash
# Script de déploiement manuel pour GitHub Pages
# Auteur: Cascade AI
# Date: 2025-04-14

# Couleurs pour les logs
VERT='\033[0;32m'
JAUNE='\033[1;33m'
ROUGE='\033[0;31m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "${BLEU}FloDrama${NC} | ${VERT}$1${NC}"
}

# Vérifier si nous sommes dans le répertoire du projet
if [ ! -f "package.json" ]; then
  echo -e "${ROUGE}Erreur:${NC} Ce script doit être exécuté depuis le répertoire racine du projet FloDrama"
  echo "Utilisez: cd /chemin/vers/FloDrama && ./scripts/deploy-github-pages.sh"
  exit 1
fi

# Créer un timestamp pour la sauvegarde
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_github_pages.zip"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Créer une sauvegarde du projet
flodrama_echo "Création d'une sauvegarde du projet..."
zip -r "$BACKUP_FILE" . -x "node_modules/*" "dist/*" ".git/*" "backups/*" &> /dev/null
if [ $? -eq 0 ]; then
  flodrama_echo "Sauvegarde créée avec succès: $BACKUP_FILE"
else
  echo -e "${ROUGE}Erreur:${NC} Échec de la création de la sauvegarde"
  exit 1
fi

# Installer les dépendances
flodrama_echo "Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
  echo -e "${ROUGE}Erreur:${NC} Échec de l'installation des dépendances"
  exit 1
fi

# Copier les variables d'environnement
flodrama_echo "Copie des variables d'environnement pour GitHub Pages..."
cp .env.github-pages .env.production
if [ $? -ne 0 ]; then
  echo -e "${JAUNE}Avertissement:${NC} Impossible de copier .env.github-pages vers .env.production"
  echo "Création d'un fichier .env.production basique..."
  cat > .env.production << EOL
VITE_API_URL=https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod
VITE_APP_ENV=production
VITE_APP_BASE_URL=/FloDrama/
VITE_APP_TITLE=FloDrama - Streaming de dramas et films asiatiques
VITE_APP_DESCRIPTION=Découvrez FloDrama, votre plateforme de streaming dédiée aux dramas coréens, films asiatiques et animés japonais.
EOL
fi

# Vérifier si le fichier .nojekyll existe dans public
if [ ! -f "public/.nojekyll" ]; then
  flodrama_echo "Création du fichier .nojekyll pour GitHub Pages..."
  touch public/.nojekyll
fi

# Construire l'application
flodrama_echo "Construction de l'application pour GitHub Pages..."
VITE_API_URL="https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod" \
VITE_APP_ENV="production" \
VITE_APP_BASE_URL="/FloDrama/" \
npm run build
if [ $? -ne 0 ]; then
  echo -e "${ROUGE}Erreur:${NC} Échec de la construction de l'application"
  exit 1
fi

# Vérifier si le répertoire dist existe
if [ ! -d "dist" ]; then
  echo -e "${ROUGE}Erreur:${NC} Le répertoire dist n'a pas été créé"
  exit 1
fi

# Créer le fichier .nojekyll dans le répertoire dist
flodrama_echo "Création du fichier .nojekyll dans le répertoire dist..."
touch dist/.nojekyll

# Déployer sur la branche gh-pages
flodrama_echo "Déploiement sur la branche gh-pages..."
git checkout -b temp-deploy
git add -f dist
git commit -m "🚀 [DEPLOY] Déploiement manuel vers GitHub Pages - $(date +"%d/%m/%Y à %H:%M")"

# Pousser le contenu du répertoire dist vers la branche gh-pages
flodrama_echo "Poussée du contenu vers la branche gh-pages..."
git subtree split --prefix dist -b gh-pages-update
git push -f origin gh-pages-update:gh-pages

# Nettoyer les branches temporaires
flodrama_echo "Nettoyage des branches temporaires..."
git checkout github-pages-clean
git branch -D temp-deploy
git branch -D gh-pages-update

flodrama_echo "🎉 Déploiement terminé avec succès!"
flodrama_echo "Le site sera disponible dans quelques minutes à l'adresse: https://flori92.github.io/FloDrama/"
