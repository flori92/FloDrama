#!/bin/bash
# Script de configuration AWS simplifié pour FloDrama
# Ce script crée les buckets S3 nécessaires sans modifier les politiques d'accès

# Configuration
APP_NAME="flodrama"
S3_BUCKET="${APP_NAME}-app"
ASSETS_BUCKET="${APP_NAME}-assets"
LOGS_BUCKET="${APP_NAME}-logs"
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

# Créer le bucket S3 principal pour l'application
log "Création du bucket S3 principal: $S3_BUCKET"
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
  if aws s3 mb "s3://$S3_BUCKET" --region "$REGION"; then
    # Configurer le bucket pour l'hébergement de site web statique
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
    success "Bucket S3 principal créé et configuré pour l'hébergement web"
    
    # Avertissement concernant les paramètres d'accès public
    warn "Vous devrez configurer manuellement les paramètres d'accès public du bucket dans la console AWS"
    log "Allez sur https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET?region=$REGION&tab=permissions"
    log "Et désactivez 'Block all public access' si nécessaire pour l'hébergement web"
  else
    error "Échec de la création du bucket S3 principal"
    exit 1
  fi
else
  success "Bucket S3 principal trouvé: $S3_BUCKET"
fi

# Créer le bucket S3 pour les assets (images, vidéos, etc.)
log "Création du bucket S3 pour les assets: $ASSETS_BUCKET"
if ! aws s3 ls "s3://$ASSETS_BUCKET" &> /dev/null; then
  if aws s3 mb "s3://$ASSETS_BUCKET" --region "$REGION"; then
    success "Bucket S3 pour les assets créé"
    
    # Avertissement concernant les paramètres d'accès public
    warn "Vous devrez configurer manuellement les paramètres d'accès public du bucket dans la console AWS"
    log "Allez sur https://s3.console.aws.amazon.com/s3/buckets/$ASSETS_BUCKET?region=$REGION&tab=permissions"
    log "Et désactivez 'Block all public access' si nécessaire pour l'accès aux assets"
  else
    error "Échec de la création du bucket S3 pour les assets"
    exit 1
  fi
else
  success "Bucket S3 pour les assets trouvé: $ASSETS_BUCKET"
fi

# Créer le bucket S3 pour les logs
log "Création du bucket S3 pour les logs: $LOGS_BUCKET"
if ! aws s3 ls "s3://$LOGS_BUCKET" &> /dev/null; then
  if aws s3 mb "s3://$LOGS_BUCKET" --region "$REGION"; then
    success "Bucket S3 pour les logs créé"
  else
    error "Échec de la création du bucket S3 pour les logs"
    exit 1
  fi
else
  success "Bucket S3 pour les logs trouvé: $LOGS_BUCKET"
fi

# Créer un fichier de configuration pour le déploiement
log "Création du fichier de configuration pour le déploiement..."
CONFIG='{
  "app": {
    "name": "'$APP_NAME'",
    "region": "'$REGION'"
  },
  "s3": {
    "app_bucket": "'$S3_BUCKET'",
    "assets_bucket": "'$ASSETS_BUCKET'",
    "logs_bucket": "'$LOGS_BUCKET'"
  }
}'

echo "$CONFIG" > ../aws-config.json
success "Fichier de configuration créé: aws-config.json"

# Afficher les informations de déploiement
echo ""
echo "=== INFORMATIONS DE DÉPLOIEMENT ==="
echo ""
echo -e "${GREEN}Application S3:${NC} http://$S3_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
echo "Pour déployer l'application, exécutez:"
echo "  bash scripts/deploy-aws-simplified.sh"
echo ""
echo "IMPORTANT: Vous devez configurer manuellement les paramètres d'accès public des buckets dans la console AWS"
echo "Allez sur https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET?region=$REGION&tab=permissions"
echo "Et désactivez 'Block all public access' si nécessaire pour l'hébergement web"
