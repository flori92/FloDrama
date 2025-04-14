#!/bin/bash
# Script pour configurer l'accès public au bucket S3 de FloDrama

# Configuration
S3_BUCKET="flodrama-app"
REGION="eu-west-1"

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

# Désactiver le blocage de l'accès public
log "Configuration de l'accès public pour le bucket $S3_BUCKET..."

# Créer une politique de bucket pour permettre l'accès public en lecture
POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$S3_BUCKET'/*"
    }
  ]
}'

echo "$POLICY" > /tmp/bucket-policy.json

# Appliquer la politique au bucket
log "Application de la politique d'accès public..."
if aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file:///tmp/bucket-policy.json; then
  success "Politique d'accès public appliquée avec succès"
else
  error "Échec de l'application de la politique d'accès public"
  warn "Vous devrez peut-être configurer manuellement les paramètres d'accès public dans la console AWS"
  log "Allez sur https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET?region=$REGION&tab=permissions"
  log "Et désactivez 'Block all public access' dans les paramètres du bucket"
  exit 1
fi

# Configurer le bucket pour l'hébergement de site web statique
log "Configuration de l'hébergement de site web statique..."
if aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html; then
  success "Hébergement de site web statique configuré avec succès"
else
  error "Échec de la configuration de l'hébergement de site web statique"
  exit 1
fi

# Afficher l'URL du site
S3_URL="http://${S3_BUCKET}.s3-website-${REGION}.amazonaws.com"
success "Configuration terminée!"
echo -e "${GREEN}URL du site:${NC} $S3_URL"
echo ""
log "Si vous rencontrez toujours des problèmes d'accès, vérifiez les paramètres du bucket dans la console AWS:"
echo "https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET?region=$REGION&tab=permissions"
