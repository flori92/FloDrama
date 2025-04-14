#!/bin/bash
# Script de déploiement AWS pour FloDrama
# Ce script déploie l'application sur AWS S3 et configure CloudFront

# Configuration
S3_BUCKET="flodrama-app"
CLOUDFRONT_DISTRIBUTION_ID="E2EXAMPLE"  # À remplacer par votre ID de distribution CloudFront
REGION="eu-west-1"
BUILD_DIR="dist"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Créer un répertoire de sauvegarde si nécessaire
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  log "Répertoire de sauvegarde créé: $BACKUP_DIR"
fi

# Sauvegarder le code actuel
log "Sauvegarde du code actuel..."
BACKUP_FILE="${BACKUP_DIR}/flodrama_backup_${TIMESTAMP}.zip"
zip -r "$BACKUP_FILE" . -x "node_modules/*" "dist/*" "backups/*" ".git/*" &> /dev/null
success "Sauvegarde créée: $BACKUP_FILE"

# Construire l'application
log "Construction de l'application..."
if npm run build; then
  success "Application construite avec succès"
else
  error "Échec de la construction de l'application"
  exit 1
fi

# Vérifier si le bucket S3 existe, sinon le créer
log "Vérification du bucket S3..."
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
  log "Création du bucket S3: $S3_BUCKET"
  if aws s3 mb "s3://$S3_BUCKET" --region "$REGION"; then
    # Configurer le bucket pour l'hébergement de site web statique
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
    success "Bucket S3 créé et configuré pour l'hébergement web"
  else
    error "Échec de la création du bucket S3"
    exit 1
  fi
else
  success "Bucket S3 trouvé: $S3_BUCKET"
fi

# Synchroniser les fichiers avec S3
log "Déploiement des fichiers vers S3..."
if aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete --acl public-read; then
  success "Fichiers déployés avec succès sur S3"
else
  error "Échec du déploiement des fichiers sur S3"
  exit 1
fi

# Créer ou mettre à jour la distribution CloudFront si l'ID est spécifié
if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "E2EXAMPLE" ]; then
  log "Invalidation du cache CloudFront..."
  if aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"; then
    success "Cache CloudFront invalidé avec succès"
  else
    warn "Échec de l'invalidation du cache CloudFront"
  fi
else
  warn "ID de distribution CloudFront non configuré. Ignoré."
  log "Pour configurer CloudFront, remplacez 'E2EXAMPLE' par votre ID de distribution dans ce script."
fi

# Afficher les URLs d'accès
S3_URL="http://${S3_BUCKET}.s3-website-${REGION}.amazonaws.com"
success "Déploiement terminé!"
echo -e "${GREEN}URL S3:${NC} $S3_URL"

if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "E2EXAMPLE" ]; then
  # Récupérer le domaine CloudFront
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)
  echo -e "${GREEN}URL CloudFront:${NC} https://$CF_DOMAIN"
fi

echo ""
log "N'oubliez pas de configurer les CORS sur votre bucket S3 si nécessaire."
