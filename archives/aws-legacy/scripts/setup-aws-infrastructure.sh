#!/bin/bash
# Script de configuration de l'infrastructure AWS pour FloDrama
# Ce script crée tous les services AWS nécessaires pour héberger l'application

# Configuration
APP_NAME="flodrama"
S3_BUCKET="${APP_NAME}-app"
REGION="eu-west-1"
CLOUDFRONT_PRICE_CLASS="PriceClass_100" # Options: PriceClass_100, PriceClass_200, PriceClass_All
ASSETS_BUCKET="${APP_NAME}-assets"
LOGS_BUCKET="${APP_NAME}-logs"

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

# Vérifier si JQ est installé (pour le traitement JSON)
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer avant de continuer."
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
    
    # Configurer la politique de bucket pour permettre l'accès public
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
    aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file:///tmp/bucket-policy.json
    
    # Configurer CORS
    CORS='{
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
    
    echo "$CORS" > /tmp/cors-config.json
    aws s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration file:///tmp/cors-config.json
    
    success "Bucket S3 principal créé et configuré pour l'hébergement web"
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
    # Configurer la politique de bucket pour permettre l'accès public
    POLICY='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::'$ASSETS_BUCKET'/*"
        }
      ]
    }'
    
    echo "$POLICY" > /tmp/assets-policy.json
    aws s3api put-bucket-policy --bucket "$ASSETS_BUCKET" --policy file:///tmp/assets-policy.json
    
    # Configurer CORS
    aws s3api put-bucket-cors --bucket "$ASSETS_BUCKET" --cors-configuration file:///tmp/cors-config.json
    
    success "Bucket S3 pour les assets créé et configuré"
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

# Créer une distribution CloudFront pour l'application
log "Création de la distribution CloudFront pour l'application..."

# Vérifier si la distribution existe déjà
CF_DISTRIBUTION_ID=""
CF_DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$S3_BUCKET.s3.amazonaws.com'].Id" --output json)

if [ "$CF_DISTRIBUTIONS" != "[]" ] && [ "$CF_DISTRIBUTIONS" != "" ]; then
  CF_DISTRIBUTION_ID=$(echo $CF_DISTRIBUTIONS | jq -r '.[0]')
  success "Distribution CloudFront existante trouvée: $CF_DISTRIBUTION_ID"
else
  # Créer le fichier de configuration CloudFront
  CF_CONFIG='{
    "CallerReference": "'$APP_NAME'-'$(date +%s)'",
    "Aliases": {
      "Quantity": 0
    },
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "'$S3_BUCKET'-origin",
          "DomainName": "'$S3_BUCKET'.s3.amazonaws.com",
          "OriginPath": "",
          "CustomHeaders": {
            "Quantity": 0
          },
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "'$S3_BUCKET'-origin",
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {
          "Forward": "none"
        },
        "Headers": {
          "Quantity": 0
        },
        "QueryStringCacheKeys": {
          "Quantity": 0
        }
      },
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ViewerProtocolPolicy": "redirect-to-https",
      "MinTTL": 0,
      "AllowedMethods": {
        "Quantity": 2,
        "Items": [
          "HEAD",
          "GET"
        ],
        "CachedMethods": {
          "Quantity": 2,
          "Items": [
            "HEAD",
            "GET"
          ]
        }
      },
      "SmoothStreaming": false,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000,
      "Compress": true,
      "LambdaFunctionAssociations": {
        "Quantity": 0
      },
      "FieldLevelEncryptionId": ""
    },
    "CacheBehaviors": {
      "Quantity": 0
    },
    "CustomErrorResponses": {
      "Quantity": 1,
      "Items": [
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        }
      ]
    },
    "Comment": "Distribution CloudFront pour '$APP_NAME'",
    "Logging": {
      "Enabled": true,
      "IncludeCookies": false,
      "Bucket": "'$LOGS_BUCKET'.s3.amazonaws.com",
      "Prefix": "cloudfront/"
    },
    "PriceClass": "'$CLOUDFRONT_PRICE_CLASS'",
    "Enabled": true,
    "ViewerCertificate": {
      "CloudFrontDefaultCertificate": true,
      "MinimumProtocolVersion": "TLSv1",
      "CertificateSource": "cloudfront"
    },
    "Restrictions": {
      "GeoRestriction": {
        "RestrictionType": "none",
        "Quantity": 0
      }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
  }'
  
  echo "$CF_CONFIG" > /tmp/cf-config.json
  
  # Créer la distribution CloudFront
  CF_RESULT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json)
  
  if [ $? -eq 0 ]; then
    CF_DISTRIBUTION_ID=$(echo $CF_RESULT | jq -r '.Distribution.Id')
    CF_DOMAIN=$(echo $CF_RESULT | jq -r '.Distribution.DomainName')
    success "Distribution CloudFront créée: $CF_DISTRIBUTION_ID"
    success "Domaine CloudFront: $CF_DOMAIN"
  else
    error "Échec de la création de la distribution CloudFront"
    exit 1
  fi
fi

# Créer une distribution CloudFront pour les assets
log "Création de la distribution CloudFront pour les assets..."

# Vérifier si la distribution existe déjà
ASSETS_CF_DISTRIBUTION_ID=""
ASSETS_CF_DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$ASSETS_BUCKET.s3.amazonaws.com'].Id" --output json)

if [ "$ASSETS_CF_DISTRIBUTIONS" != "[]" ] && [ "$ASSETS_CF_DISTRIBUTIONS" != "" ]; then
  ASSETS_CF_DISTRIBUTION_ID=$(echo $ASSETS_CF_DISTRIBUTIONS | jq -r '.[0]')
  success "Distribution CloudFront pour les assets existante trouvée: $ASSETS_CF_DISTRIBUTION_ID"
else
  # Créer le fichier de configuration CloudFront pour les assets
  ASSETS_CF_CONFIG='{
    "CallerReference": "'$APP_NAME'-assets-'$(date +%s)'",
    "Aliases": {
      "Quantity": 0
    },
    "DefaultRootObject": "",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "'$ASSETS_BUCKET'-origin",
          "DomainName": "'$ASSETS_BUCKET'.s3.amazonaws.com",
          "OriginPath": "",
          "CustomHeaders": {
            "Quantity": 0
          },
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "'$ASSETS_BUCKET'-origin",
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {
          "Forward": "none"
        },
        "Headers": {
          "Quantity": 0
        },
        "QueryStringCacheKeys": {
          "Quantity": 0
        }
      },
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ViewerProtocolPolicy": "redirect-to-https",
      "MinTTL": 0,
      "AllowedMethods": {
        "Quantity": 2,
        "Items": [
          "HEAD",
          "GET"
        ],
        "CachedMethods": {
          "Quantity": 2,
          "Items": [
            "HEAD",
            "GET"
          ]
        }
      },
      "SmoothStreaming": false,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000,
      "Compress": true,
      "LambdaFunctionAssociations": {
        "Quantity": 0
      },
      "FieldLevelEncryptionId": ""
    },
    "CacheBehaviors": {
      "Quantity": 0
    },
    "CustomErrorResponses": {
      "Quantity": 0
    },
    "Comment": "Distribution CloudFront pour les assets de '$APP_NAME'",
    "Logging": {
      "Enabled": true,
      "IncludeCookies": false,
      "Bucket": "'$LOGS_BUCKET'.s3.amazonaws.com",
      "Prefix": "cloudfront-assets/"
    },
    "PriceClass": "'$CLOUDFRONT_PRICE_CLASS'",
    "Enabled": true,
    "ViewerCertificate": {
      "CloudFrontDefaultCertificate": true,
      "MinimumProtocolVersion": "TLSv1",
      "CertificateSource": "cloudfront"
    },
    "Restrictions": {
      "GeoRestriction": {
        "RestrictionType": "none",
        "Quantity": 0
      }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
  }'
  
  echo "$ASSETS_CF_CONFIG" > /tmp/assets-cf-config.json
  
  # Créer la distribution CloudFront pour les assets
  ASSETS_CF_RESULT=$(aws cloudfront create-distribution --distribution-config file:///tmp/assets-cf-config.json)
  
  if [ $? -eq 0 ]; then
    ASSETS_CF_DISTRIBUTION_ID=$(echo $ASSETS_CF_RESULT | jq -r '.Distribution.Id')
    ASSETS_CF_DOMAIN=$(echo $ASSETS_CF_RESULT | jq -r '.Distribution.DomainName')
    success "Distribution CloudFront pour les assets créée: $ASSETS_CF_DISTRIBUTION_ID"
    success "Domaine CloudFront pour les assets: $ASSETS_CF_DOMAIN"
  else
    error "Échec de la création de la distribution CloudFront pour les assets"
    exit 1
  fi
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
  },
  "cloudfront": {
    "app_distribution_id": "'$CF_DISTRIBUTION_ID'",
    "app_domain": "'$(aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)'",
    "assets_distribution_id": "'$ASSETS_CF_DISTRIBUTION_ID'",
    "assets_domain": "'$(aws cloudfront get-distribution --id "$ASSETS_CF_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)'"
  }
}'

echo "$CONFIG" > ../aws-config.json
success "Fichier de configuration créé: aws-config.json"

# Afficher les informations de déploiement
echo ""
echo "=== INFORMATIONS DE DÉPLOIEMENT ==="
echo ""
echo -e "${GREEN}Application S3:${NC} http://$S3_BUCKET.s3-website-$REGION.amazonaws.com"
echo -e "${GREEN}Application CloudFront:${NC} https://$(aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)"
echo -e "${GREEN}Assets CloudFront:${NC} https://$(aws cloudfront get-distribution --id "$ASSETS_CF_DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)"
echo ""
echo "Pour déployer l'application, exécutez:"
echo "  bash scripts/deploy-aws.sh"
echo ""
echo "N'oubliez pas de mettre à jour le fichier src/config/aws-config.js avec les nouvelles URLs CloudFront."
