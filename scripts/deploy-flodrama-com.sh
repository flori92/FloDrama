#!/bin/bash
# Script de déploiement de FloDrama vers flodrama.com
# Ce script déploie l'application vers le bucket S3 existant et invalide le cache CloudFront

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configuration
S3_BUCKET_APP="flodrama-app"
S3_BUCKET_PROD="flodrama-prod"
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'flodrama.com')] && Status=='Deployed'].Id" --output text | head -n 1)
DIST_DIR="${PROJECT_ROOT}/dist"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier l'authentification AWS
log "Vérification de l'authentification AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  erreur "Vous n'êtes pas authentifié à AWS. Exécutez 'aws configure' pour configurer vos identifiants."
  exit 1
fi

# Tenter de créer une sauvegarde, mais continuer même en cas d'échec
log "Tentative de sauvegarde du code actuel..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/flodrama_backup_${TIMESTAMP}.zip"

mkdir -p "${BACKUP_DIR}" 2>/dev/null
if zip -r "${BACKUP_FILE}" "${PROJECT_ROOT}" -x "*/node_modules/*" -x "*/dist/*" -x "*/backups/*" > /dev/null 2>&1; then
  succes "Sauvegarde créée: ${BACKUP_FILE}"
else
  attention "Impossible de créer une sauvegarde, mais le déploiement va continuer"
fi

# Construire l'application
log "Construction de l'application..."
cd "${PROJECT_ROOT}" && npm run build

if [ $? -ne 0 ]; then
  erreur "Échec de la construction de l'application"
  exit 1
else
  succes "Application construite avec succès"
fi

# Vérifier si le bucket S3 flodrama-app existe
log "Vérification du bucket S3 flodrama-app..."
if ! aws s3 ls "s3://$S3_BUCKET_APP" &> /dev/null; then
  erreur "Le bucket S3 '$S3_BUCKET_APP' n'existe pas ou vous n'avez pas les permissions nécessaires."
  exit 1
fi

# Vérifier si le bucket S3 flodrama-prod existe, sinon le créer
log "Vérification du bucket S3 flodrama-prod..."
if ! aws s3 ls "s3://$S3_BUCKET_PROD" &> /dev/null; then
  log "Le bucket S3 '$S3_BUCKET_PROD' n'existe pas. Création en cours..."
  if aws s3 mb "s3://$S3_BUCKET_PROD" --region eu-west-1; then
    succes "Bucket S3 '$S3_BUCKET_PROD' créé avec succès"
    
    # Configurer le bucket pour l'hébergement de site web statique
    log "Configuration du bucket pour l'hébergement web..."
    aws s3 website "s3://$S3_BUCKET_PROD" --index-document index.html --error-document index.html
    
    # Configurer la politique du bucket pour permettre l'accès public
    log "Configuration de la politique d'accès public..."
    POLICY='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadForGetBucketObjects",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::'$S3_BUCKET_PROD'/*"
        }
      ]
    }'
    
    echo "$POLICY" > /tmp/bucket-policy.json
    aws s3api put-bucket-policy --bucket "$S3_BUCKET_PROD" --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
    
    succes "Bucket configuré pour l'hébergement web avec accès public"
  else
    erreur "Échec de la création du bucket S3 '$S3_BUCKET_PROD'"
    exit 1
  fi
fi

# Déployer les fichiers vers les deux buckets S3
log "Déploiement des fichiers vers S3..."
if aws s3 sync "${DIST_DIR}" "s3://${S3_BUCKET_APP}" --delete; then
  succes "Fichiers déployés avec succès sur S3 (bucket: $S3_BUCKET_APP)"
else
  erreur "Échec du déploiement des fichiers sur $S3_BUCKET_APP"
  exit 1
fi

log "Déploiement des fichiers vers le bucket de production..."
if aws s3 sync "${DIST_DIR}" "s3://${S3_BUCKET_PROD}" --delete; then
  succes "Fichiers déployés avec succès sur S3 (bucket: $S3_BUCKET_PROD)"
else
  erreur "Échec du déploiement des fichiers sur $S3_BUCKET_PROD"
  exit 1
fi

# S'assurer que le fichier metadata.json est présent dans /data/
log "Copie des métadonnées dans le répertoire /data/..."
if aws s3 cp "s3://${S3_BUCKET_APP}/assets/data/metadata.json" "s3://${S3_BUCKET_APP}/data/metadata.json"; then
  succes "Métadonnées copiées avec succès dans /data/ (bucket: $S3_BUCKET_APP)"
else
  attention "Échec de la copie des métadonnées dans /data/ (bucket: $S3_BUCKET_APP)"
fi

if aws s3 cp "s3://${S3_BUCKET_PROD}/assets/data/metadata.json" "s3://${S3_BUCKET_PROD}/data/metadata.json"; then
  succes "Métadonnées copiées avec succès dans /data/ (bucket: $S3_BUCKET_PROD)"
else
  attention "Échec de la copie des métadonnées dans /data/ (bucket: $S3_BUCKET_PROD)"
fi

# Invalider le cache CloudFront si l'ID de distribution est disponible
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  log "Invalidation du cache CloudFront..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)
  
  if [ -n "$INVALIDATION_ID" ]; then
    succes "Invalidation du cache CloudFront initiée (ID: $INVALIDATION_ID)"
    
    # Attendre que l'invalidation soit terminée
    log "Attente de la fin de l'invalidation du cache..."
    aws cloudfront wait invalidation-completed \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --id "$INVALIDATION_ID"
    
    succes "Invalidation du cache CloudFront terminée"
  else
    attention "Échec de l'invalidation du cache CloudFront"
  fi
else
  attention "ID de distribution CloudFront non trouvé, le cache n'a pas été invalidé"
fi

# Afficher les informations de déploiement
echo ""
succes "Déploiement terminé!"
echo -e "${VERT}URL:${NC} https://flodrama.com"
echo -e "${VERT}URL de développement:${NC} https://dev.flodrama.com"
echo -e "${VERT}Bucket S3 App:${NC} $S3_BUCKET_APP"
echo -e "${VERT}Bucket S3 Production:${NC} $S3_BUCKET_PROD"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "${VERT}Distribution CloudFront:${NC} $CLOUDFRONT_DISTRIBUTION_ID"
fi

# Tenter de mettre à jour l'en-tête personnalisé, mais continuer même en cas d'échec
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  log "Tentative de mise à jour de l'en-tête X-Force-Update..."
  CURRENT_TIMESTAMP=$(date +%s)
  
  # Obtenir la configuration actuelle de la distribution
  TEMP_CONFIG_FILE="/tmp/cloudfront-config-$CURRENT_TIMESTAMP.json"
  if aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" > "$TEMP_CONFIG_FILE" 2>/dev/null; then
    # Extraire l'ETag
    ETAG=$(jq -r '.ETag' "$TEMP_CONFIG_FILE" 2>/dev/null)
    
    if [ -n "$ETAG" ]; then
      # Tenter de mettre à jour l'en-tête X-Force-Update
      if jq --arg ts "$CURRENT_TIMESTAMP" '.DistributionConfig.Origins.Items[0].CustomHeaders.Items[0].HeaderValue = $ts' "$TEMP_CONFIG_FILE" > "${TEMP_CONFIG_FILE}.new" 2>/dev/null; then
        if aws cloudfront update-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --if-match "$ETAG" --distribution-config "$(jq '.DistributionConfig' "${TEMP_CONFIG_FILE}.new")" 2>/dev/null; then
          succes "En-tête X-Force-Update mis à jour avec succès"
        else
          attention "Échec de la mise à jour de l'en-tête X-Force-Update, mais le déploiement a réussi"
        fi
      else
        attention "Problème lors de la préparation de la mise à jour de l'en-tête, mais le déploiement a réussi"
      fi
    else
      attention "Impossible d'extraire l'ETag, mais le déploiement a réussi"
    fi
    
    # Nettoyer les fichiers temporaires
    rm -f "$TEMP_CONFIG_FILE" "${TEMP_CONFIG_FILE}.new" 2>/dev/null
  else
    attention "Impossible d'obtenir la configuration CloudFront, mais le déploiement a réussi"
  fi
fi
