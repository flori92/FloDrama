#!/bin/bash
# Script final de correction CORS et types MIME pour FloDrama
# Créé le 06-04-2025

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NOM_BUCKET="flodrama-prod"
REGION="eu-west-3"  # Région correcte du bucket
DISTRIBUTION_ID="E5XC74WR62W9Z"

# Fonctions d'affichage
log() {
  echo -e "${VERT}[INFO]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Vérification des outils nécessaires
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Installation requise."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  erreur "jq n'est pas installé. Installation requise."
  exit 1
fi

# 1. Configuration CORS pour le bucket S3
log "Configuration CORS pour le bucket $NOM_BUCKET..."
cat > cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "MaxAgeSeconds": 3000,
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"]
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $NOM_BUCKET --cors-configuration file://cors-config.json --region $REGION
if [ $? -eq 0 ]; then
  log "Configuration CORS appliquée avec succès."
else
  attention "Problème lors de l'application de la configuration CORS."
fi

# 2. Correction des types MIME pour les fichiers JavaScript (sans ACL)
log "Correction des types MIME pour les fichiers JavaScript..."
aws s3 cp s3://$NOM_BUCKET/ s3://$NOM_BUCKET/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE --region $REGION
if [ $? -eq 0 ]; then
  log "Types MIME des fichiers JavaScript corrigés avec succès."
else
  attention "Problème lors de la correction des types MIME des fichiers JavaScript."
fi

# 3. Correction des types MIME pour les fichiers CSS (sans ACL)
log "Correction des types MIME pour les fichiers CSS..."
aws s3 cp s3://$NOM_BUCKET/ s3://$NOM_BUCKET/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE --region $REGION
if [ $? -eq 0 ]; then
  log "Types MIME des fichiers CSS corrigés avec succès."
else
  attention "Problème lors de la correction des types MIME des fichiers CSS."
fi

# 4. Création d'une politique d'en-têtes pour CloudFront (sans en-têtes de sécurité personnalisés)
log "Création d'une politique d'en-têtes pour CloudFront..."
cat > cf-headers-policy.json << EOF
{
  "Name": "FloDramaHeadersPolicy",
  "Comment": "Politique d'en-têtes pour FloDrama",
  "CorsConfig": {
    "AccessControlAllowCredentials": false,
    "AccessControlAllowHeaders": {
      "Items": ["*"],
      "Quantity": 1
    },
    "AccessControlAllowMethods": {
      "Items": ["GET", "HEAD"],
      "Quantity": 2
    },
    "AccessControlAllowOrigins": {
      "Items": ["*"],
      "Quantity": 1
    },
    "AccessControlExposeHeaders": {
      "Items": ["ETag", "Content-Length", "Content-Type"],
      "Quantity": 3
    },
    "AccessControlMaxAgeSec": 3000,
    "OriginOverride": false
  },
  "CustomHeadersConfig": {
    "Items": [
      {
        "Header": "Cache-Control",
        "Override": true,
        "Value": "public, max-age=31536000"
      }
    ],
    "Quantity": 1
  }
}
EOF

# 5. Application de la politique d'en-têtes à CloudFront
log "Application de la politique d'en-têtes à CloudFront..."
POLICY_ID=$(aws cloudfront create-response-headers-policy --response-headers-policy-config file://cf-headers-policy.json --query "ResponseHeadersPolicy.Id" --output text)
if [ $? -eq 0 ] && [ -n "$POLICY_ID" ]; then
  log "Politique d'en-têtes créée avec succès (ID: $POLICY_ID)."
  
  # Récupération de la configuration actuelle
  log "Récupération de la configuration CloudFront actuelle..."
  aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cf-config.json
  
  # Extraction de l'ETag
  ETAG=$(jq -r '.ETag' cf-config.json)
  
  # Mise à jour de la configuration
  log "Mise à jour de la configuration CloudFront..."
  jq --arg policy_id "$POLICY_ID" '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id' cf-config.json | jq 'del(.ETag)' > cf-config-updated.json
  
  # Application de la nouvelle configuration
  aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://cf-config-updated.json --if-match "$ETAG"
  if [ $? -eq 0 ]; then
    log "Configuration CloudFront mise à jour avec succès."
  else
    attention "Problème lors de la mise à jour de la configuration CloudFront."
  fi
else
  erreur "Impossible de créer la politique d'en-têtes pour CloudFront."
fi

# 6. Invalidation du cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
if [ $? -eq 0 ]; then
  log "Invalidation du cache CloudFront lancée avec succès."
else
  attention "Problème lors de l'invalidation du cache CloudFront."
fi

# 7. Vérification de la configuration du bucket S3
log "Vérification de la configuration du bucket S3..."
aws s3api get-bucket-website --bucket $NOM_BUCKET --region $REGION > /dev/null 2>&1
if [ $? -eq 0 ]; then
  log "Le bucket est configuré pour l'hébergement de site web statique."
else
  log "Configuration de l'hébergement de site web statique..."
  cat > website-config.json << EOF
{
  "IndexDocument": {
    "Suffix": "index.html"
  },
  "ErrorDocument": {
    "Key": "index.html"
  }
}
EOF
  aws s3api put-bucket-website --bucket $NOM_BUCKET --website-configuration file://website-config.json --region $REGION
  if [ $? -eq 0 ]; then
    log "Hébergement de site web statique configuré avec succès."
  else
    attention "Problème lors de la configuration de l'hébergement de site web statique."
  fi
fi

# 8. Mise à jour de la politique de bucket pour permettre l'accès public
log "Mise à jour de la politique de bucket pour permettre l'accès public..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$NOM_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $NOM_BUCKET --policy file://bucket-policy.json --region $REGION
if [ $? -eq 0 ]; then
  log "Politique de bucket mise à jour avec succès."
else
  attention "Problème lors de la mise à jour de la politique de bucket."
fi

# Nettoyage
rm -f cors-config.json cf-headers-policy.json cf-config.json cf-config-updated.json website-config.json bucket-policy.json

log "Opérations terminées. Les modifications peuvent prendre jusqu'à 15 minutes pour se propager."
log "URL du site: https://flodrama.com"
log "URL S3 directe: https://$NOM_BUCKET.s3.$REGION.amazonaws.com/index.html"
log "URL CloudFront: https://d1iqf0rt8yz85h.cloudfront.net"
