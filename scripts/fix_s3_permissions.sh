#!/bin/bash
# Script de correction des permissions S3 pour FloDrama
# Mis à jour le 06-04-2025 - Version renforcée pour résoudre définitivement les problèmes CORS et MIME

# Configuration
S3_BUCKET="flodrama-prod"
REGION="us-east-1"
DISTRIBUTION_ID="E5XC74WR62W9Z"

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

info() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] INFO: $1${NC}"
}

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier les identifiants AWS
log "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  erreur "Identifiants AWS non configurés ou invalides."
  info "Exécutez 'aws configure' pour configurer vos identifiants AWS."
  exit 1
fi

# Vérifier l'existence du bucket
log "Vérification de l'existence du bucket S3..."
if ! aws s3api head-bucket --bucket $S3_BUCKET 2>/dev/null; then
  erreur "Le bucket S3 '$S3_BUCKET' n'existe pas ou vous n'avez pas les permissions nécessaires."
  exit 1
fi

# Créer une politique de bucket S3 pour permettre l'accès public
log "Création de la politique de bucket S3 avec accès public complet..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$S3_BUCKET",
        "arn:aws:s3:::$S3_BUCKET/*"
      ]
    }
  ]
}
EOF

# Mettre à jour la politique du bucket S3
log "Mise à jour de la politique du bucket S3..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json || {
  attention "Échec de la mise à jour de la politique du bucket S3"
}

# Désactiver le blocage de l'accès public
log "Désactivation complète du blocage de l'accès public..."
aws s3api put-public-access-block --bucket $S3_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || {
  attention "Échec de la désactivation du blocage de l'accès public"
}

# Configuration CORS améliorée pour résoudre les problèmes de chargement
log "Configuration CORS du bucket avec paramètres étendus et permissifs..."
cat > cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
      "MaxAgeSeconds": 3600,
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Content-Disposition", "x-amz-request-id"]
    }
  ]
}
EOF

# Appliquer la configuration CORS
log "Application de la configuration CORS permissive..."
aws s3api put-bucket-cors --bucket $S3_BUCKET --cors-configuration file://cors-config.json || {
  attention "Échec de la configuration CORS du bucket"
}

# Configurer le bucket pour l'hébergement de site web statique
log "Configuration du bucket pour l'hébergement de site web statique..."
aws s3 website s3://$S3_BUCKET/ --index-document index.html --error-document index.html || {
  attention "Échec de la configuration de l'hébergement de site web statique"
}

# Mettre à jour l'ACL de tous les fichiers du bucket avec les types MIME corrects
log "Mise à jour des ACL et types MIME pour tous les fichiers du bucket..."

# Définir les types MIME corrects pour les fichiers statiques
log "Configuration des types MIME pour les fichiers JavaScript..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "application/javascript" --metadata-directive REPLACE --exclude "*" --include "*.js" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers JavaScript"
}

log "Configuration des types MIME pour les fichiers CSS..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "text/css" --metadata-directive REPLACE --exclude "*" --include "*.css" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers CSS"
}

log "Configuration des types MIME pour les fichiers HTML..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "text/html" --metadata-directive REPLACE --exclude "*" --include "*.html" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers HTML"
}

log "Configuration des types MIME pour les fichiers JSON..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "application/json" --metadata-directive REPLACE --exclude "*" --include "*.json" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers JSON"
}

log "Configuration des types MIME pour les fichiers SVG..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "image/svg+xml" --metadata-directive REPLACE --exclude "*" --include "*.svg" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers SVG"
}

log "Configuration des types MIME pour les fichiers PNG..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "image/png" --metadata-directive REPLACE --exclude "*" --include "*.png" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers PNG"
}

log "Configuration des types MIME pour les fichiers JPG/JPEG..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "image/jpeg" --metadata-directive REPLACE --exclude "*" --include "*.jpg" --include "*.jpeg" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers JPG/JPEG"
}

log "Configuration des types MIME pour les fichiers ICO..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --content-type "image/x-icon" --metadata-directive REPLACE --exclude "*" --include "*.ico" || {
  attention "Échec de la mise à jour des types MIME pour les fichiers ICO"
}

log "Mise à jour des ACL pour les autres fichiers du bucket..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --acl public-read --exclude "*.js" --exclude "*.css" --exclude "*.html" --exclude "*.json" --exclude "*.svg" --exclude "*.png" --exclude "*.jpg" --exclude "*.jpeg" --exclude "*.ico" || {
  attention "Échec de la mise à jour des ACL pour les autres fichiers du bucket"
}

# Configuration des en-têtes de réponse CloudFront
log "Configuration des en-têtes de réponse CloudFront..."
cat > cloudfront-headers-policy.json << EOF
{
  "Comment": "Politique d'en-têtes renforcée pour FloDrama",
  "Name": "FloDramaHeadersPolicy",
  "CorsConfig": {
    "AccessControlAllowCredentials": false,
    "AccessControlAllowHeaders": {
      "Items": ["*"],
      "Quantity": 1
    },
    "AccessControlAllowMethods": {
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "DELETE", "PATCH"],
      "Quantity": 7
    },
    "AccessControlAllowOrigins": {
      "Items": ["*"],
      "Quantity": 1
    },
    "AccessControlExposeHeaders": {
      "Items": ["ETag", "Content-Length", "Content-Type", "Content-Disposition", "x-amz-request-id"],
      "Quantity": 5
    },
    "AccessControlMaxAgeSec": 3600,
    "OriginOverride": true
  },
  "CustomHeadersConfig": {
    "Items": [
      {
        "Header": "Cache-Control",
        "Override": true,
        "Value": "public, max-age=31536000"
      },
      {
        "Header": "X-Content-Type-Options",
        "Override": true,
        "Value": "nosniff"
      },
      {
        "Header": "Access-Control-Allow-Headers",
        "Override": true,
        "Value": "*"
      },
      {
        "Header": "Access-Control-Allow-Methods",
        "Override": true,
        "Value": "GET, HEAD, OPTIONS, PUT, POST, DELETE, PATCH"
      },
      {
        "Header": "Access-Control-Allow-Origin",
        "Override": true,
        "Value": "*"
      }
    ],
    "Quantity": 5
  }
}
EOF

# Créer une politique d'en-têtes de réponse CloudFront
log "Création d'une politique d'en-têtes de réponse CloudFront..."
POLICY_ID=$(aws cloudfront create-response-headers-policy --response-headers-policy-config file://cloudfront-headers-policy.json --query "ResponseHeadersPolicy.Id" --output text) || {
  attention "Échec de la création de la politique d'en-têtes de réponse CloudFront"
}

if [ -n "$POLICY_ID" ]; then
  # Récupérer la configuration actuelle de la distribution CloudFront
  log "Récupération de la configuration de la distribution CloudFront..."
  aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cf-config.json
  
  # Extraire l'ETag
  ETAG=$(jq -r '.ETag' cf-config.json)
  
  # Modifier la configuration pour utiliser la nouvelle politique d'en-têtes
  jq --arg policy_id "$POLICY_ID" '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id' cf-config.json | jq 'del(.ETag)' > cf-config-updated.json
  
  # Mettre à jour la distribution CloudFront
  log "Mise à jour de la distribution CloudFront avec la nouvelle politique d'en-têtes..."
  aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://cf-config-updated.json --if-match "$ETAG" || {
    attention "Échec de la mise à jour de la distribution CloudFront"
  }
  
  # Invalider le cache CloudFront
  log "Invalidation complète du cache CloudFront..."
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" || {
    attention "Échec de l'invalidation du cache CloudFront"
  }
else
  erreur "Impossible de créer la politique d'en-têtes de réponse CloudFront"
fi

# Nettoyage
rm -f bucket-policy.json cors-config.json cloudfront-headers-policy.json cf-config.json cf-config-updated.json

log "✅ Correction des permissions S3 et configuration CloudFront terminées!"
log "🌐 URL du bucket S3: http://$S3_BUCKET.s3-website-$REGION.amazonaws.com"
log "🌐 URL CloudFront: https://d1323ouxr1qbdp.cloudfront.net"
log "🌐 URL personnalisée: https://flodrama.com (si configurée)"
log "⏱️ La propagation des modifications CloudFront peut prendre jusqu'à 15 minutes."
log "📝 Vérifiez la console du navigateur pour confirmer l'absence d'erreurs CORS et MIME."
