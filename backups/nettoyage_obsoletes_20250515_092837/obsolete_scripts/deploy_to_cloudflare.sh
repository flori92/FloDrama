#!/bin/bash

# Script de déploiement automatisé pour FloDrama sur Cloudflare Pages
# 
# Ce script automatise le processus de déploiement de l'application FloDrama
# sur Cloudflare Pages, avec gestion des environnements et invalidation du cache.

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
DEFAULT_ENV="prod"

# Fonction pour afficher l'aide
show_help() {
  echo -e "${BLUE}Script de déploiement FloDrama sur Cloudflare Pages${NC}"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --env ENV       Environnement de déploiement (dev, staging, prod)"
  echo "  -p, --project ID    ID du projet Cloudflare Pages"
  echo "  -b, --branch NAME   Branche à déployer (par défaut: main)"
  echo "  -h, --help          Afficher cette aide"
  echo ""
  echo "Exemple: $0 --env staging --project flodrama"
}

# Fonction pour afficher un message d'information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher un avertissement
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Fonction pour afficher une erreur
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
  info "Vérification des prérequis..."
  
  # Vérifier si npm est installé
  if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérifier si wrangler est installé
  if ! command -v wrangler &> /dev/null; then
    warning "wrangler n'est pas installé globalement. Utilisation de npx wrangler."
    WRANGLER_CMD="npx wrangler"
  else
    WRANGLER_CMD="wrangler"
  fi
  
  # Vérifier si l'utilisateur est connecté à Cloudflare
  if ! $WRANGLER_CMD whoami &> /dev/null; then
    error "Vous n'êtes pas connecté à Cloudflare. Veuillez exécuter 'wrangler login' avant de continuer."
    exit 1
  fi
  
  success "Tous les prérequis sont satisfaits."
}

# Fonction pour charger les variables d'environnement
load_env_vars() {
  local env=$1
  
  info "Chargement des variables d'environnement pour l'environnement '$env'..."
  
  # Vérifier si le fichier .env existe
  if [ ! -f "$ENV_FILE" ]; then
    warning "Fichier .env non trouvé. Création d'un fichier par défaut."
    echo "# Variables d'environnement pour FloDrama" > "$ENV_FILE"
    echo "CLOUDFLARE_ACCOUNT_ID=42fc982266a2c31b942593b18097e4b3" >> "$ENV_FILE"
    echo "CLOUDFLARE_API_TOKEN=H1ITLGJaq4ZwAh57Y5tOSNdlL8pfXiHNQp8Zz40E" >> "$ENV_FILE"
  fi
  
  # Charger les variables d'environnement
  source "$ENV_FILE"
  
  # Vérifier les variables requises
  if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    error "Variable CLOUDFLARE_ACCOUNT_ID non définie dans le fichier .env"
    exit 1
  fi
  
  if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    error "Variable CLOUDFLARE_API_TOKEN non définie dans le fichier .env"
    exit 1
  fi
  
  # Définir les variables spécifiques à l'environnement
  case "$env" in
    dev)
      API_URL="https://flodrama-api-dev.florifavi.workers.dev"
      WRANGLER_ENV="development"
      ;;
    staging)
      API_URL="https://flodrama-api-staging.florifavi.workers.dev"
      WRANGLER_ENV="staging"
      ;;
    prod|*)
      API_URL="https://flodrama-api-prod.florifavi.workers.dev"
      WRANGLER_ENV="production"
      ;;
  esac
  
  # Exporter les variables pour wrangler
  export CLOUDFLARE_ACCOUNT_ID
  export CLOUDFLARE_API_TOKEN
  
  success "Variables d'environnement chargées avec succès."
}

# Fonction pour construire l'application
build_app() {
  info "Construction de l'application pour l'environnement '$ENV'..."
  
  # Créer un fichier .env.production avec les variables d'environnement
  echo "VITE_API_URL=$API_URL" > "${PROJECT_DIR}/.env.production"
  
  # Nettoyer le répertoire de build
  rm -rf "${PROJECT_DIR}/dist"
  
  # Vérifier si le dossier node_modules existe
  if [ ! -d "${PROJECT_DIR}/node_modules" ]; then
    info "Installation des dépendances..."
    cd "$PROJECT_DIR" && npm install
    
    if [ $? -ne 0 ]; then
      error "Échec de l'installation des dépendances."
      exit 1
    fi
  fi
  
  # Construire l'application
  cd "$PROJECT_DIR" && npm run build
  
  if [ $? -ne 0 ]; then
    error "Échec de la construction de l'application."
    exit 1
  fi
  
  # Vérifier que le répertoire dist a été créé
  if [ ! -d "${PROJECT_DIR}/dist" ]; then
    error "Le répertoire de build 'dist' n'a pas été créé."
    exit 1
  fi
  
  success "Application construite avec succès."
}

# Fonction pour déployer l'application sur Cloudflare Pages
deploy_to_cloudflare() {
  info "Déploiement sur Cloudflare Pages..."
  
  local project_flag=""
  if [ -n "$PROJECT_ID" ]; then
    project_flag="--project-name $PROJECT_ID"
  fi
  
  local branch_flag=""
  if [ -n "$BRANCH" ]; then
    branch_flag="--branch $BRANCH"
  else
    branch_flag="--branch main" # Par défaut, utiliser la branche main
  fi
  
  # Vérifier si wrangler.toml existe
  if [ -f "${PROJECT_DIR}/wrangler.toml" ]; then
    info "Utilisation du fichier wrangler.toml pour le déploiement"
  else
    warning "Fichier wrangler.toml non trouvé. Utilisation des paramètres par défaut."
  fi
  
  # Désactiver temporairement les variables d'environnement Cloudflare pour utiliser OAuth
  local temp_account_id=$CLOUDFLARE_ACCOUNT_ID
  local temp_api_token=$CLOUDFLARE_API_TOKEN
  unset CLOUDFLARE_ACCOUNT_ID
  unset CLOUDFLARE_API_TOKEN
  
  # Déployer l'application avec authentification OAuth
  info "Tentative de déploiement avec authentification OAuth..."
  cd "$PROJECT_DIR" && $WRANGLER_CMD login
  
  if [ $? -ne 0 ]; then
    error "Impossible de se connecter à Cloudflare avec OAuth."
    # Restaurer les variables d'environnement
    export CLOUDFLARE_ACCOUNT_ID=$temp_account_id
    export CLOUDFLARE_API_TOKEN=$temp_api_token
    exit 1
  fi
  
  # Déployer avec OAuth
  cd "$PROJECT_DIR" && $WRANGLER_CMD pages deploy dist $project_flag $branch_flag
  
  if [ $? -ne 0 ]; then
    error "Échec du déploiement sur Cloudflare Pages."
    # Restaurer les variables d'environnement
    export CLOUDFLARE_ACCOUNT_ID=$temp_account_id
    export CLOUDFLARE_API_TOKEN=$temp_api_token
    exit 1
  fi
  
  # Restaurer les variables d'environnement
  export CLOUDFLARE_ACCOUNT_ID=$temp_account_id
  export CLOUDFLARE_API_TOKEN=$temp_api_token
  
  success "Application déployée avec succès sur Cloudflare Pages."
}

# Fonction pour invalider le cache
invalidate_cache() {
  info "Invalidation du cache Cloudflare..."
  
  if [ -z "$PROJECT_ID" ]; then
    warning "ID du projet non spécifié. Impossible d'invalider le cache."
    return
  fi
  
  # Invalider le cache
  $WRANGLER_CMD pages deployment invalidate --project-name "$PROJECT_ID" --everything
  
  if [ $? -ne 0 ]; then
    warning "Échec de l'invalidation du cache. Veuillez l'invalider manuellement si nécessaire."
    return
  fi
  
  success "Cache invalidé avec succès."
}

# Analyser les arguments de la ligne de commande
while [[ $# -gt 0 ]]; do
  key="$1"
  
  case $key in
    -e|--env)
      ENV="$2"
      shift
      shift
      ;;
    -p|--project)
      PROJECT_ID="$2"
      shift
      shift
      ;;
    -b|--branch)
      BRANCH="$2"
      shift
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      error "Option inconnue: $1"
      show_help
      exit 1
      ;;
  esac
done

# Utiliser l'environnement par défaut si non spécifié
if [ -z "$ENV" ]; then
  ENV="$DEFAULT_ENV"
  warning "Environnement non spécifié. Utilisation de l'environnement par défaut: $ENV"
fi

# Exécuter le déploiement
check_prerequisites
load_env_vars "$ENV"
build_app
deploy_to_cloudflare
invalidate_cache

echo ""
success "Déploiement terminé avec succès!"
echo ""
info "Récapitulatif du déploiement:"
echo "  - Environnement: $ENV"
echo "  - URL de l'API: $API_URL"
if [ -n "$PROJECT_ID" ]; then
  echo "  - Projet Cloudflare Pages: $PROJECT_ID"
fi
if [ -n "$BRANCH" ]; then
  echo "  - Branche: $BRANCH"
fi
echo ""
info "Vous pouvez accéder à votre application déployée sur Cloudflare Pages."
