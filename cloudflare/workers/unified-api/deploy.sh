#!/bin/bash

# Script de déploiement pour l'API FloDrama sur Cloudflare Workers
# Auteur: FloDrama Team

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
  error "Wrangler n'est pas installé. Veuillez l'installer avec 'npm install -g wrangler'"
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  error "npm n'est pas installé. Veuillez l'installer avant de continuer."
fi

# Vérifier si l'utilisateur est connecté à Cloudflare
wrangler whoami &> /dev/null
if [ $? -ne 0 ]; then
  warn "Vous n'êtes pas connecté à Cloudflare. Connexion en cours..."
  wrangler login
  if [ $? -ne 0 ]; then
    error "Échec de la connexion à Cloudflare."
  fi
fi

# Demander l'environnement de déploiement
read -p "Environnement de déploiement (production/staging) [production]: " ENV
ENV=${ENV:-production}

if [ "$ENV" != "production" ] && [ "$ENV" != "staging" ]; then
  error "Environnement non valide. Veuillez choisir 'production' ou 'staging'."
fi

# Installer les dépendances
log "Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
  error "Échec de l'installation des dépendances."
fi

# Exécuter les tests
log "Exécution des tests..."
npm test
if [ $? -ne 0 ]; then
  warn "Certains tests ont échoué. Voulez-vous continuer le déploiement ? (y/n)"
  read -p "" CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    error "Déploiement annulé."
  fi
fi

# Construire le projet
log "Construction du projet..."
npm run build
if [ $? -ne 0 ]; then
  error "Échec de la construction du projet."
fi

# Déployer sur Cloudflare Workers
log "Déploiement sur Cloudflare Workers (environnement: $ENV)..."
if [ "$ENV" == "production" ]; then
  npm run deploy
else
  npm run deploy:staging
fi

if [ $? -ne 0 ]; then
  error "Échec du déploiement sur Cloudflare Workers."
fi

log "Déploiement terminé avec succès!"

# Afficher l'URL de l'API
if [ "$ENV" == "production" ]; then
  log "L'API est maintenant disponible à l'adresse: https://flodrama-content-api.workers.dev"
else
  log "L'API est maintenant disponible à l'adresse: https://flodrama-content-api-staging.workers.dev"
fi

log "Documentation disponible à l'adresse: https://flodrama-content-api.workers.dev/api"
