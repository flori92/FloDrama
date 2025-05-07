#!/bin/bash

# Script de démarrage pour FloDrama Frontend
# 
# Ce script permet de démarrer l'application FloDrama en mode développement ou production
# avec une configuration automatique pour utiliser les données locales.

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
DEFAULT_MODE="dev"

# Fonction pour afficher l'aide
show_help() {
  echo -e "${BLUE}Script de démarrage FloDrama Frontend${NC}"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -m, --mode MODE     Mode de démarrage (dev, preview, prod)"
  echo "  -p, --port PORT     Port à utiliser (par défaut: 3000 pour dev, 4173 pour preview)"
  echo "  -h, --help          Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0                  Démarrer en mode développement (par défaut)"
  echo "  $0 --mode preview   Démarrer en mode prévisualisation"
  echo "  $0 --mode prod      Construire et démarrer en mode production"
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
  
  # Vérifier si le dossier node_modules existe
  if [ ! -d "${PROJECT_DIR}/node_modules" ]; then
    warning "Les dépendances ne sont pas installées. Installation en cours..."
    cd "$PROJECT_DIR" && npm install
    
    if [ $? -ne 0 ]; then
      error "Échec de l'installation des dépendances."
      exit 1
    fi
    
    success "Dépendances installées avec succès."
  fi
  
  success "Tous les prérequis sont satisfaits."
}

# Fonction pour démarrer l'application en mode développement
start_dev() {
  local port=$1
  
  info "Démarrage de l'application en mode développement sur le port $port..."
  
  # Créer un fichier .env.development avec les variables d'environnement
  echo "VITE_API_URL=http://localhost:$port" > "${PROJECT_DIR}/.env.development"
  echo "VITE_USE_LOCAL_DATA=true" >> "${PROJECT_DIR}/.env.development"
  
  # Démarrer l'application
  cd "$PROJECT_DIR" && npm run dev -- --port $port
}

# Fonction pour démarrer l'application en mode prévisualisation
start_preview() {
  local port=$1
  
  info "Construction et démarrage de l'application en mode prévisualisation sur le port $port..."
  
  # Créer un fichier .env.production avec les variables d'environnement
  echo "VITE_API_URL=http://localhost:$port" > "${PROJECT_DIR}/.env.production"
  echo "VITE_USE_LOCAL_DATA=true" >> "${PROJECT_DIR}/.env.production"
  
  # Construire l'application
  cd "$PROJECT_DIR" && npm run build
  
  if [ $? -ne 0 ]; then
    error "Échec de la construction de l'application."
    exit 1
  fi
  
  # Démarrer la prévisualisation
  cd "$PROJECT_DIR" && npm run preview -- --port $port
}

# Fonction pour construire et démarrer l'application en mode production
start_prod() {
  info "Construction de l'application en mode production..."
  
  # Créer un fichier .env.production avec les variables d'environnement
  echo "VITE_API_URL=https://flodrama-api-prod.florifavi.workers.dev" > "${PROJECT_DIR}/.env.production"
  echo "VITE_USE_LOCAL_DATA=true" >> "${PROJECT_DIR}/.env.production"
  
  # Construire l'application
  cd "$PROJECT_DIR" && npm run build
  
  if [ $? -ne 0 ]; then
    error "Échec de la construction de l'application."
    exit 1
  fi
  
  success "Application construite avec succès."
  info "Pour déployer l'application, utilisez le script deploy_to_cloudflare.sh."
  info "Pour prévisualiser l'application en local, utilisez la commande: $0 --mode preview"
}

# Analyser les arguments de la ligne de commande
MODE="$DEFAULT_MODE"
PORT=""

while [[ $# -gt 0 ]]; do
  key="$1"
  
  case $key in
    -m|--mode)
      MODE="$2"
      shift
      shift
      ;;
    -p|--port)
      PORT="$2"
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

# Définir le port par défaut en fonction du mode
if [ -z "$PORT" ]; then
  case "$MODE" in
    dev)
      PORT=3000
      ;;
    preview)
      PORT=4173
      ;;
    *)
      PORT=3000
      ;;
  esac
fi

# Exécuter les actions en fonction du mode
check_prerequisites

case "$MODE" in
  dev)
    start_dev "$PORT"
    ;;
  preview)
    start_preview "$PORT"
    ;;
  prod)
    start_prod
    ;;
  *)
    error "Mode non reconnu: $MODE"
    show_help
    exit 1
    ;;
esac
