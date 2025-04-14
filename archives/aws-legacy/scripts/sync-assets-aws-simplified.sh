#!/bin/bash
# Script de synchronisation des assets avec AWS S3 (version simplifiée)
# Ce script synchronise les assets locaux avec le bucket S3 pour FloDrama

# Configuration
ASSETS_BUCKET="flodrama-assets"
REGION="eu-west-1"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
LOCAL_ASSETS_DIR="$PROJECT_ROOT/public/assets"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  error "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier l'authentification AWS
log "Vérification de l'authentification AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  error "Vous n'êtes pas authentifié à AWS. Exécutez 'aws configure' pour configurer vos identifiants."
  exit 1
fi

# Vérifier si le bucket S3 existe
log "Vérification du bucket S3 pour les assets..."
if ! aws s3 ls "s3://$ASSETS_BUCKET" &> /dev/null; then
  error "Le bucket S3 pour les assets n'existe pas. Exécutez d'abord le script setup-aws-simplified.sh."
  exit 1
fi

# Vérifier si les dossiers locaux existent et les créer si nécessaire
if [ ! -d "$LOCAL_ASSETS_DIR/data" ]; then
  log "Création du dossier de métadonnées local..."
  mkdir -p "$LOCAL_ASSETS_DIR/data"
fi

if [ ! -d "$LOCAL_ASSETS_DIR/media/posters" ]; then
  log "Création du dossier des posters local..."
  mkdir -p "$LOCAL_ASSETS_DIR/media/posters"
fi

if [ ! -d "$LOCAL_ASSETS_DIR/media/backdrops" ]; then
  log "Création du dossier des backdrops local..."
  mkdir -p "$LOCAL_ASSETS_DIR/media/backdrops"
fi

if [ ! -d "$LOCAL_ASSETS_DIR/media/thumbnails" ]; then
  log "Création du dossier des thumbnails local..."
  mkdir -p "$LOCAL_ASSETS_DIR/media/thumbnails"
fi

if [ ! -d "$LOCAL_ASSETS_DIR/static/placeholders" ]; then
  log "Création du dossier des placeholders local..."
  mkdir -p "$LOCAL_ASSETS_DIR/static/placeholders"
fi

# Vérifier si le fichier de métadonnées existe
if [ ! -f "$LOCAL_ASSETS_DIR/data/metadata.json" ]; then
  log "Copie du fichier de métadonnées depuis dist..."
  cp "$PROJECT_ROOT/dist/assets/data/metadata.json" "$LOCAL_ASSETS_DIR/data/" 2>/dev/null || warn "Impossible de trouver le fichier de métadonnées dans dist"
fi

# Synchroniser les métadonnées
log "Synchronisation des métadonnées..."
if aws s3 sync "$LOCAL_ASSETS_DIR/data" "s3://$ASSETS_BUCKET/data"; then
  success "Métadonnées synchronisées avec succès"
else
  error "Échec de la synchronisation des métadonnées"
  exit 1
fi

# Synchroniser les images des posters
log "Synchronisation des posters..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/posters" "s3://$ASSETS_BUCKET/media/posters"; then
  success "Posters synchronisés avec succès"
else
  error "Échec de la synchronisation des posters"
  exit 1
fi

# Synchroniser les images des backdrops
log "Synchronisation des backdrops..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/backdrops" "s3://$ASSETS_BUCKET/media/backdrops"; then
  success "Backdrops synchronisés avec succès"
else
  error "Échec de la synchronisation des backdrops"
  exit 1
fi

# Synchroniser les thumbnails
log "Synchronisation des thumbnails..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/thumbnails" "s3://$ASSETS_BUCKET/media/thumbnails"; then
  success "Thumbnails synchronisés avec succès"
else
  error "Échec de la synchronisation des thumbnails"
  exit 1
fi

# Synchroniser les placeholders
log "Synchronisation des placeholders..."
if aws s3 sync "$LOCAL_ASSETS_DIR/static/placeholders" "s3://$ASSETS_BUCKET/static/placeholders"; then
  success "Placeholders synchronisés avec succès"
else
  error "Échec de la synchronisation des placeholders"
  exit 1
fi

success "Synchronisation des assets terminée!"

# Afficher l'URL d'accès aux assets
S3_URL="https://${ASSETS_BUCKET}.s3.${REGION}.amazonaws.com"
echo -e "${GREEN}URL S3 des assets:${NC} $S3_URL"

echo ""
log "N'oubliez pas de mettre à jour le fichier src/config/aws-config.js avec la nouvelle URL des assets."
