#!/bin/bash

# Script de correction de la politique d'en-têtes pour FloDrama
# Auteur: Cascade
# Date: 4 avril 2025

# Couleurs pour les messages
BLEU='\033[94m'
VERT='\033[92m'
JAUNE='\033[93m'
ROUGE='\033[91m'
FIN='\033[0m'

# Fonctions d'affichage
function log() { echo -e "${BLEU}[INFO]${FIN} $1"; }
function log_success() { echo -e "${VERT}[SUCCÈS]${FIN} $1"; }
function log_warning() { echo -e "${JAUNE}[ATTENTION]${FIN} $1"; }
function log_error() { echo -e "${ROUGE}[ERREUR]${FIN} $1"; }

# Configuration
BUCKET_NOM="flodrama-prod-20250402173726"
ANCIEN_BUCKET="flodrama-prod"
DISTRIBUTION_ID="E1IG2U5KWWN11Y"
ANCIENNE_DISTRIBUTION="E5XC74WR62W9Z"
REGION="us-east-1"
ENV="prod"
POLICY_NAME="FloDrama-MIME-Types-Policy-$ENV"
POLICY_ID="4ffbb8c0-19da-4cce-8762-52fe092c81a5"

log "=== Correction de la politique d'en-têtes pour FloDrama ==="
log "Date: $(date)"

# Étape 1: Configurer la région AWS
log "Configuration de la région AWS à $REGION..."
export AWS_DEFAULT_REGION=$REGION

# Étape 2: Créer un répertoire temporaire
log "Création d'un répertoire temporaire..."
mkdir -p /tmp/flodrama-policy-fix

# Étape 3: Créer le fichier de politique d'en-têtes
log "Création du fichier de politique d'en-têtes..."
cat > /tmp/flodrama-policy-fix/response-headers-policy.json << EOL
{
  "ResponseHeadersPolicyConfig": {
    "Name": "${POLICY_NAME}",
    "Comment": "Politique d'en-têtes MIME pour FloDrama",
    "CorsConfig": {
      "AccessControlAllowOrigins": {
        "Quantity": 1,
        "Items": [
          "*"
        ]
      },
      "AccessControlAllowHeaders": {
        "Quantity": 1,
        "Items": [
          "*"
        ]
      },
      "AccessControlAllowMethods": {
        "Quantity": 7,
        "Items": [
          "GET",
          "HEAD",
          "OPTIONS",
          "PUT",
          "POST",
          "DELETE",
          "PATCH"
        ]
      },
      "AccessControlAllowCredentials": false,
      "AccessControlExposeHeaders": {
        "Quantity": 1,
        "Items": [
          "*"
        ]
      },
      "OriginOverride": true
    },
    "SecurityHeadersConfig": {
      "XSSProtection": {
        "Override": true,
        "Protection": true,
        "ModeBlock": true
      },
      "FrameOptions": {
        "Override": true,
        "FrameOption": "DENY"
      },
      "ReferrerPolicy": {
        "Override": true,
        "ReferrerPolicy": "strict-origin-when-cross-origin"
      },
      "ContentSecurityPolicy": {
        "Override": true,
        "ContentSecurityPolicy": "default-src 'self' *.flodrama.com *.cloudfront.net *.amazonaws.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.flodrama.com *.cloudfront.net *.amazonaws.com; style-src 'self' 'unsafe-inline' *.flodrama.com *.cloudfront.net *.amazonaws.com; img-src 'self' data: *.flodrama.com *.cloudfront.net *.amazonaws.com; font-src 'self' data: *.flodrama.com *.cloudfront.net *.amazonaws.com; connect-src 'self' *.flodrama.com *.cloudfront.net *.amazonaws.com;"
      },
      "ContentTypeOptions": {
        "Override": true
      },
      "StrictTransportSecurity": {
        "Override": true,
        "IncludeSubdomains": true,
        "Preload": true,
        "AccessControlMaxAgeSec": 63072000
      }
    },
    "CustomHeadersConfig": {
      "Quantity": 2,
      "Items": [
        {
          "Header": "Content-Type",
          "Value": "text/css",
          "Override": true
        },
        {
          "Header": "X-Content-Type-Options",
          "Value": "nosniff",
          "Override": true
        }
      ]
    }
  }
}
EOL

# Étape 4: Mettre à jour la politique d'en-têtes existante
log "Mise à jour de la politique d'en-têtes existante..."
ETAG=$(aws cloudfront get-response-headers-policy --id $POLICY_ID --query 'ETag' --output text)
log "ETag de la politique: $ETAG"

if [ -n "$ETAG" ]; then
    aws cloudfront update-response-headers-policy --id $POLICY_ID --response-headers-policy-config file:///tmp/flodrama-policy-fix/response-headers-policy.json --if-match $ETAG
    log_success "Politique d'en-têtes mise à jour avec succès."
else
    log_error "Impossible de récupérer l'ETag de la politique."
    exit 1
fi

# Étape 5: Mettre à jour les comportements de cache de la distribution CloudFront
log "Mise à jour des comportements de cache de la distribution CloudFront..."

# Étape 5.1: Récupérer la configuration actuelle de la distribution
log "Récupération de la configuration actuelle de la distribution CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/flodrama-policy-fix/distribution-config.json

if [ $? -ne 0 ]; then
    log_error "Échec de la récupération de la configuration CloudFront pour la distribution $DISTRIBUTION_ID"
    exit 1
fi

# Étape 5.2: Extraire l'ETag de la distribution
DISTRIBUTION_ETAG=$(jq -r '.ETag' /tmp/flodrama-policy-fix/distribution-config.json)
jq 'del(.ETag)' /tmp/flodrama-policy-fix/distribution-config.json > /tmp/flodrama-policy-fix/distribution-config-no-etag.json

# Étape 5.3: Mettre à jour les comportements de cache pour utiliser la politique d'en-têtes
jq --arg policy_id "$POLICY_ID" '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id' /tmp/flodrama-policy-fix/distribution-config-no-etag.json > /tmp/flodrama-policy-fix/distribution-config-updated.json

# Étape 5.4: Mettre à jour la distribution CloudFront
log "Mise à jour de la distribution CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file:///tmp/flodrama-policy-fix/distribution-config-updated.json --if-match $DISTRIBUTION_ETAG

if [ $? -ne 0 ]; then
    log_error "Échec de la mise à jour de la distribution CloudFront $DISTRIBUTION_ID"
else
    log_success "Distribution CloudFront mise à jour avec succès."
fi

# Étape 6: Faire de même pour l'ancienne distribution
log "Mise à jour de l'ancienne distribution CloudFront..."

# Étape 6.1: Récupérer la configuration actuelle de la distribution
log "Récupération de la configuration actuelle de l'ancienne distribution CloudFront..."
aws cloudfront get-distribution-config --id $ANCIENNE_DISTRIBUTION > /tmp/flodrama-policy-fix/old-distribution-config.json

if [ $? -ne 0 ]; then
    log_warning "Échec de la récupération de la configuration CloudFront pour la distribution $ANCIENNE_DISTRIBUTION"
else
    # Étape 6.2: Extraire l'ETag de la distribution
    OLD_DISTRIBUTION_ETAG=$(jq -r '.ETag' /tmp/flodrama-policy-fix/old-distribution-config.json)
    jq 'del(.ETag)' /tmp/flodrama-policy-fix/old-distribution-config.json > /tmp/flodrama-policy-fix/old-distribution-config-no-etag.json

    # Étape 6.3: Mettre à jour les comportements de cache pour utiliser la politique d'en-têtes
    jq --arg policy_id "$POLICY_ID" '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id' /tmp/flodrama-policy-fix/old-distribution-config-no-etag.json > /tmp/flodrama-policy-fix/old-distribution-config-updated.json

    # Étape 6.4: Mettre à jour la distribution CloudFront
    log "Mise à jour de l'ancienne distribution CloudFront..."
    aws cloudfront update-distribution --id $ANCIENNE_DISTRIBUTION --distribution-config file:///tmp/flodrama-policy-fix/old-distribution-config-updated.json --if-match $OLD_DISTRIBUTION_ETAG

    if [ $? -ne 0 ]; then
        log_warning "Échec de la mise à jour de l'ancienne distribution CloudFront $ANCIENNE_DISTRIBUTION"
    else
        log_success "Ancienne distribution CloudFront mise à jour avec succès."
    fi
fi

# Étape 7: Invalider le cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
aws cloudfront create-invalidation --distribution-id $ANCIENNE_DISTRIBUTION --paths "/*"

# Étape 8: Nettoyer les fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -rf /tmp/flodrama-policy-fix

log_success "=== Correction de la politique d'en-têtes terminée ==="
log "Le site flodrama.com devrait maintenant charger correctement les fichiers CSS et JS."
log "Veuillez patienter quelques minutes pour la propagation complète des modifications."
