#!/bin/bash
# Script de synchronisation des assets avec AWS S3
# Ce script synchronise les assets locaux avec le bucket S3 pour FloDrama

# Configuration
ASSETS_BUCKET="flodrama-assets"
REGION="eu-west-1"
LOCAL_ASSETS_DIR="../public/assets"
CLOUDFRONT_ASSETS_DISTRIBUTION_ID="E2EXAMPLE"  # À remplacer par votre ID de distribution CloudFront pour les assets

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
  error "Le bucket S3 pour les assets n'existe pas. Exécutez d'abord le script setup-aws-infrastructure.sh."
  exit 1
fi

# Synchroniser les métadonnées
log "Synchronisation des métadonnées..."
if aws s3 sync "$LOCAL_ASSETS_DIR/data" "s3://$ASSETS_BUCKET/data" --acl public-read; then
  success "Métadonnées synchronisées avec succès"
else
  error "Échec de la synchronisation des métadonnées"
  exit 1
fi

# Synchroniser les images des posters
log "Synchronisation des posters..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/posters" "s3://$ASSETS_BUCKET/media/posters" --acl public-read; then
  success "Posters synchronisés avec succès"
else
  error "Échec de la synchronisation des posters"
  exit 1
fi

# Synchroniser les images des backdrops
log "Synchronisation des backdrops..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/backdrops" "s3://$ASSETS_BUCKET/media/backdrops" --acl public-read; then
  success "Backdrops synchronisés avec succès"
else
  error "Échec de la synchronisation des backdrops"
  exit 1
fi

# Synchroniser les thumbnails
log "Synchronisation des thumbnails..."
if aws s3 sync "$LOCAL_ASSETS_DIR/media/thumbnails" "s3://$ASSETS_BUCKET/media/thumbnails" --acl public-read; then
  success "Thumbnails synchronisés avec succès"
else
  error "Échec de la synchronisation des thumbnails"
  exit 1
fi

# Synchroniser les placeholders
log "Synchronisation des placeholders..."
if aws s3 sync "$LOCAL_ASSETS_DIR/static/placeholders" "s3://$ASSETS_BUCKET/static/placeholders" --acl public-read; then
  success "Placeholders synchronisés avec succès"
else
  error "Échec de la synchronisation des placeholders"
  exit 1
fi

# Invalider le cache CloudFront pour les assets si l'ID est spécifié
if [ "$CLOUDFRONT_ASSETS_DISTRIBUTION_ID" != "E2EXAMPLE" ]; then
  log "Invalidation du cache CloudFront pour les assets..."
  if aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ASSETS_DISTRIBUTION_ID" --paths "/data/*" "/media/*" "/static/*"; then
    success "Cache CloudFront pour les assets invalidé avec succès"
  else
    warn "Échec de l'invalidation du cache CloudFront pour les assets"
  fi
else
  warn "ID de distribution CloudFront pour les assets non configuré. Ignoré."
  log "Pour configurer CloudFront, remplacez 'E2EXAMPLE' par votre ID de distribution dans ce script."
fi

success "Synchronisation des assets terminée!"
log "N'oubliez pas de mettre à jour le fichier src/config/aws-config.js pour désactiver le mode local si nécessaire."
