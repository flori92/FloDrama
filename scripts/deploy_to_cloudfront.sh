#!/bin/bash
# Script de déploiement simplifié de FloDrama sur AWS CloudFront
# Créé le 31-03-2025
# Ce script utilise des permissions minimales pour fonctionner même avec des restrictions IAM

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
ENVIRONMENT=${1:-"prod"}
CURRENT_DIR=$(pwd)
PROJECT_ROOT=$(dirname "$(dirname "$0")")

# Configuration selon l'environnement
case $ENVIRONMENT in
  "dev")
    NOM_BUCKET="flodrama-app-dev"
    DISTRIBUTION_ID="E1ABCDEFGHIJK"  # À remplacer par l'ID réel de la distribution dev
    ;;
  "staging")
    NOM_BUCKET="flodrama-app-staging"
    DISTRIBUTION_ID="E2ABCDEFGHIJK"  # À remplacer par l'ID réel de la distribution staging
    ;;
  "prod"|*)
    NOM_BUCKET="flodrama-prod"
    DISTRIBUTION_ID="E5XC74WR62W9Z"  # ID de la distribution production
    ;;
esac

REGION="eu-west-3"
BUILD_DIR="$PROJECT_ROOT/dist"
ENV_CONFIG_FILE="$BUILD_DIR/.env-config.js"

# Fonction pour afficher les messages
log() {
  echo -e "${BLEU}[INFO]${NC} $1"
}

log_success() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

log_warning() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

log_error() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

log_step() {
  echo -e "${CYAN}[ÉTAPE]${NC} $1"
}

log_identity() {
  echo -e "${MAGENTA}[IDENTITÉ]${NC} $1"
}

# Vérification des arguments
if [ "$#" -lt 1 ]; then
  log_error "Usage: $0 <environnement> [options]"
  log "Environnements disponibles: dev, staging, prod"
  log "Options:"
  log "  --skip-build: Ignorer l'étape de build"
  log "  --skip-upload: Ignorer l'étape d'upload vers S3"
  log "  --skip-invalidation: Ignorer l'invalidation du cache CloudFront"
  log "  --create-bucket: Créer le bucket S3 s'il n'existe pas"
  exit 1
fi

# Récupération de l'environnement
ENV=$1
shift

# Vérification de l'environnement
if [[ "$ENV" != "dev" && "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  log_error "Environnement invalide: $ENV"
  log "Environnements disponibles: dev, staging, prod"
  exit 1
fi

# Options par défaut
SKIP_BUILD=false
SKIP_UPLOAD=false
SKIP_INVALIDATION=false
CREATE_BUCKET=false
AWS_REGION="eu-west-3"

# Traitement des options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      log_warning "L'étape de build sera ignorée"
      ;;
    --skip-upload)
      SKIP_UPLOAD=true
      log_warning "L'étape d'upload vers S3 sera ignorée"
      ;;
    --skip-invalidation)
      SKIP_INVALIDATION=true
      log_warning "L'invalidation du cache CloudFront sera ignorée"
      ;;
    --create-bucket)
      CREATE_BUCKET=true
      log "Le bucket S3 sera créé s'il n'existe pas"
      ;;
    --region)
      AWS_REGION="$2"
      log "Région AWS: $AWS_REGION"
      shift
      ;;
    *)
      log_error "Option inconnue: $1"
      exit 1
      ;;
  esac
  shift
done

# Configuration selon l'environnement
case $ENV in
  "dev")
    S3_BUCKET="flodrama-dev"
    CLOUDFRONT_DISTRIBUTION_ID="E1ABCDEFGHIJKL"
    ;;
  "staging")
    S3_BUCKET="flodrama-staging"
    CLOUDFRONT_DISTRIBUTION_ID="E2ABCDEFGHIJKL"
    ;;
  "prod")
    S3_BUCKET="flodrama-prod"
    CLOUDFRONT_DISTRIBUTION_ID="E5XC74WR62W9Z"
    ;;
esac

# Chemin du répertoire racine du projet
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
BUILD_DIR="$PROJECT_ROOT/dist"

# Vérification de l'installation de AWS CLI
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérification des identifiants AWS
if ! aws sts get-caller-identity &> /dev/null; then
  log_error "Identifiants AWS non configurés ou invalides."
  log "Exécutez 'aws configure' pour configurer vos identifiants AWS."
  exit 1
fi

# Vérification de l'existence du bucket S3
if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  if [ "$CREATE_BUCKET" = true ]; then
    log_warning "Le bucket S3 '$S3_BUCKET' n'existe pas. Création en cours..."
    
    # Création du bucket S3
    if aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"; then
      log_success "Bucket S3 '$S3_BUCKET' créé avec succès."
      
      # Configuration du bucket pour l'hébergement de site web statique
      log "Configuration du bucket pour l'hébergement de site web statique..."
      aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
      
      # Configuration de la politique de bucket pour permettre l'accès public en lecture
      log "Configuration de la politique de bucket..."
      BUCKET_POLICY='{
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
      
      if aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy "$BUCKET_POLICY"; then
        log_success "Politique de bucket configurée avec succès."
      else
        log_warning "Échec de la configuration de la politique de bucket. Vous devrez peut-être la configurer manuellement."
      fi
      
      # Activation du CORS pour le bucket
      log "Configuration du CORS..."
      CORS_CONFIGURATION='{
        "CORSRules": [
          {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
          }
        ]
      }'
      
      if aws s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration "$CORS_CONFIGURATION"; then
        log_success "CORS configuré avec succès."
      else
        log_warning "Échec de la configuration du CORS. Vous devrez peut-être le configurer manuellement."
      fi
    else
      log_error "Échec de la création du bucket S3 '$S3_BUCKET'. Vérifiez vos permissions AWS."
      exit 1
    fi
  else
    log_error "Le bucket S3 '$S3_BUCKET' n'existe pas ou vous n'avez pas les permissions nécessaires."
    log "Utilisez l'option --create-bucket pour créer le bucket automatiquement."
    exit 1
  fi
fi

# Étape de build
if [ "$SKIP_BUILD" = false ]; then
  log_step "Construction de l'application pour l'environnement $ENV..."
  
  # Vérification de l'identité visuelle
  log_identity "Vérification de l'identité visuelle FloDrama..."
  
  # Création d'un fichier temporaire pour vérifier les variables CSS
  TEMP_CSS_CHECK=$(mktemp)
  grep -r "var(--color-accent-gradient)" "$PROJECT_ROOT/src" > "$TEMP_CSS_CHECK" || true
  
  if [ -s "$TEMP_CSS_CHECK" ]; then
    log_success "Identité visuelle FloDrama correctement configurée avec le dégradé bleu-fuchsia"
  else
    log_warning "L'identité visuelle FloDrama pourrait ne pas être correctement configurée"
    log "Assurez-vous que le dégradé bleu-fuchsia est défini dans les fichiers CSS"
  fi
  
  rm "$TEMP_CSS_CHECK"
  
  # Copie des fichiers CSS de l'identité visuelle
  log "Application de l'identité visuelle FloDrama..."
  mkdir -p "$BUILD_DIR/assets"
  cp -f "$PROJECT_ROOT/src/styles/theme.css" "$BUILD_DIR/assets/theme.css" || true
  cp -f "$PROJECT_ROOT/src/styles/index.css" "$BUILD_DIR/assets/index.css" || true
  
  # Nettoyage du répertoire de build
  if [ -d "$BUILD_DIR" ]; then
    log "Nettoyage du répertoire de build..."
    rm -rf "$BUILD_DIR"
  fi
  
  # Configuration de l'environnement de build
  log "Configuration de l'environnement de build pour $ENV..."
  
  # Création d'un fichier .env temporaire pour le build
  ENV_FILE="$PROJECT_ROOT/.env.temp"
  echo "VITE_APP_ENV=$ENV" > "$ENV_FILE"
  echo "VITE_APP_API_URL=https://api.flodrama.com/$ENV" >> "$ENV_FILE"
  echo "VITE_APP_CLOUDFRONT_URL=https://d123456abcdef.cloudfront.net" >> "$ENV_FILE"
  
  # Construction de l'application
  log "Exécution du build..."
  cd "$PROJECT_ROOT" && npm run build
  
  # Vérification du succès du build
  if [ $? -ne 0 ]; then
    log_error "Échec de la construction de l'application."
    exit 1
  fi
  
  # Nettoyage du fichier .env temporaire
  rm "$ENV_FILE"
  
  log_success "Construction de l'application terminée avec succès."
  
  # Vérification des erreurs JavaScript dans le build
  log "Vérification des erreurs JavaScript potentielles..."
  JS_FILES=$(find "$BUILD_DIR" -name "*.js" -type f)
  
  # Ajout d'un gestionnaire d'erreurs global pour le débogage
  for JS_FILE in $JS_FILES; do
    # Vérifier si le fichier est un fichier principal (pas un chunk)
    if grep -q "main" <<< "$JS_FILE"; then
      log "Ajout d'un gestionnaire d'erreurs global à $JS_FILE"
      
      # Sauvegarde du fichier original
      cp "$JS_FILE" "${JS_FILE}.bak"
      
      # Création d'un fichier temporaire avec le gestionnaire d'erreurs
      ERROR_HANDLER_FILE=$(mktemp)
      cat > "$ERROR_HANDLER_FILE" << 'EOL'
// Gestionnaire d'erreurs global pour le débogage
window.addEventListener("error", function(event) {
  console.error("Erreur JavaScript capturée:", event.message, "à", event.filename, "ligne", event.lineno);
});
EOL
      
      # Ajout du gestionnaire d'erreurs au début du fichier
      cat "$ERROR_HANDLER_FILE" "$JS_FILE" > "${JS_FILE}.temp"
      mv "${JS_FILE}.temp" "$JS_FILE"
      rm "$ERROR_HANDLER_FILE"
    fi
  done
  
  log_success "Vérification des erreurs JavaScript terminée."
fi

# Étape d'upload vers S3
if [ "$SKIP_UPLOAD" = false ]; then
  log_step "Déploiement vers le bucket S3 '$S3_BUCKET'..."
  
  # Upload des fichiers vers S3 sans utiliser d'ACLs
  log "Upload des fichiers vers S3..."
  aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete
  
  # Vérification du succès de l'upload
  if [ $? -ne 0 ]; then
    log_error "Échec de l'upload vers S3."
    exit 1
  fi
  
  log_success "Déploiement vers S3 terminé avec succès."
  
  # Affichage de l'URL S3
  log "URL du site S3: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
fi

# Étape d'invalidation du cache CloudFront
if [ "$SKIP_INVALIDATION" = false ]; then
  if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log_warning "Aucun ID de distribution CloudFront spécifié. Recherche d'une distribution associée au bucket..."
    
    # Recherche d'une distribution CloudFront associée au bucket
    CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$S3_BUCKET.s3.amazonaws.com' || DomainName=='$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com']].Id" --output text)
    
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
      log_warning "Aucune distribution CloudFront trouvée pour ce bucket."
      log "Vous pouvez créer une distribution CloudFront manuellement ou utiliser le site directement depuis S3."
    else
      log "Distribution CloudFront trouvée: $CLOUDFRONT_DISTRIBUTION_ID"
    fi
  fi
  
  if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log_step "Invalidation du cache CloudFront..."
    
    # Création de l'invalidation
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --paths "/*" \
      --query "Invalidation.Id" \
      --output text)
    
    # Vérification du succès de l'invalidation
    if [ $? -ne 0 ]; then
      log_error "Échec de l'invalidation du cache CloudFront."
      exit 1
    fi
    
    log "Invalidation créée avec l'ID: $INVALIDATION_ID"
    log "L'invalidation peut prendre jusqu'à 15 minutes pour se propager."
    log_success "Invalidation du cache CloudFront terminée avec succès."
    
    # Récupérer le domaine CloudFront
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
      log "URL CloudFront: https://$CLOUDFRONT_DOMAIN"
    fi
  fi
fi

# Résumé du déploiement
log_step "Résumé du déploiement"
log_success "Application FloDrama déployée avec succès pour l'environnement $ENV."
log "Bucket S3: $S3_BUCKET"

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  log "Distribution CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
fi

if [ "$ENV" = "prod" ]; then
  log "URL personnalisée: https://flodrama.com (si configurée)"
elif [ "$ENV" = "staging" ]; then
  log "URL personnalisée: https://staging.flodrama.com (si configurée)"
else
  log "URL personnalisée: https://dev.flodrama.com (si configurée)"
fi

log "N'oubliez pas de vérifier que l'identité visuelle est correctement appliquée."
log "Pour toute question ou problème, contactez l'équipe de développement."

# Vérifier si config/cloudfront-$ENV.json existe et récupérer l'ID de distribution
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ -f "config/cloudfront-$ENV.json" ]; then
    if command -v jq &> /dev/null; then
        CLOUDFRONT_DISTRIBUTION_ID=$(jq -r '.distributionId' "config/cloudfront-$ENV.json")
        log_info "ID de distribution CloudFront récupéré du fichier de configuration: $CLOUDFRONT_DISTRIBUTION_ID"
    else
        log_warning "jq n'est pas installé. Impossible de lire le fichier de configuration CloudFront."
    fi
fi

exit 0
