#!/bin/bash

# Script de déploiement de FloDrama sur flodrama.com
# Ce script commit et pousse les modifications pour déclencher le workflow GitHub Actions

set -e

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages avec timestamp
log() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")]${NC} $1"
}

# Fonction pour afficher les messages de succès
success() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
error() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
  exit 1
}

# Fonction pour afficher les messages d'avertissement
warning() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Vérifier que nous sommes dans le répertoire FloDrama
if [[ ! -d "Frontend" || ! -f "package.json" ]]; then
  error "Ce script doit être exécuté depuis le répertoire racine de FloDrama"
fi

# Vérifier que le fichier CNAME existe et contient flodrama.com
log "Vérification du fichier CNAME..."
if [[ ! -f "CNAME" ]]; then
  log "Création du fichier CNAME..."
  echo "flodrama.com" > CNAME
  success "Fichier CNAME créé avec flodrama.com"
else
  if ! grep -q "flodrama.com" CNAME; then
    log "Mise à jour du fichier CNAME..."
    echo "flodrama.com" > CNAME
    success "Fichier CNAME mis à jour avec flodrama.com"
  else
    success "Le fichier CNAME contient déjà flodrama.com"
  fi
fi

# Vérifier que le workflow GitHub Actions existe
log "Vérification du workflow GitHub Actions..."
if [[ ! -f ".github/workflows/deploy.yml" ]]; then
  error "Le fichier .github/workflows/deploy.yml n'existe pas. Exécutez d'abord le script deployer-github-pages-navbar.sh"
fi

# Vérifier que le composant App.jsx utilise bien Navbar
log "Vérification de l'utilisation de Navbar dans App.jsx..."
if ! grep -q "import Navbar from './components/layout/Navbar'" Frontend/App.jsx; then
  error "Le composant Navbar n'est pas importé dans App.jsx. Exécutez d'abord le script deployer-github-pages-navbar.sh"
fi

if ! grep -q "<Navbar />" Frontend/App.jsx; then
  error "Le composant Navbar n'est pas utilisé dans App.jsx. Exécutez d'abord le script deployer-github-pages-navbar.sh"
fi

# Vérifier la branche actuelle
log "Vérification de la branche actuelle..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH="github-pages-clean"

if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  warning "Vous n'êtes pas sur la branche $TARGET_BRANCH. Passage à la branche $TARGET_BRANCH..."
  
  # Vérifier si la branche existe
  if git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    git checkout $TARGET_BRANCH || error "Impossible de passer à la branche $TARGET_BRANCH"
  else
    git checkout -b $TARGET_BRANCH || error "Impossible de créer la branche $TARGET_BRANCH"
  fi
  
  success "Passage à la branche $TARGET_BRANCH réussi"
fi

# Commit des modifications
log "Commit des modifications..."
git add Frontend/App.jsx .github/workflows/deploy.yml CNAME
git commit -m "✨ [FEAT] Remplacement du Header par la Navbar avancée pour flodrama.com" || warning "Erreur lors du commit, peut-être aucune modification à committer"

# Push vers GitHub
log "Push vers GitHub..."
git push origin $TARGET_BRANCH || error "Erreur lors du push, vérifiez vos identifiants et votre connexion"

success "✅ Déploiement vers flodrama.com préparé avec succès!"
log "Le workflow GitHub Actions va maintenant construire et déployer l'application sur la branche gh-pages."
log "L'application sera accessible via https://flodrama.com une fois le déploiement terminé."
log "Vous pouvez suivre l'avancement du déploiement dans l'onglet Actions de votre repository GitHub."
