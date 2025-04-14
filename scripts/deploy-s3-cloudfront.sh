#!/bin/bash

# Script de déploiement de FloDrama sur S3 + CloudFront
# Ce script configure un bucket S3 et une distribution CloudFront pour héberger FloDrama

echo "🔒 Déploiement de FloDrama sur S3 + CloudFront"
echo "=============================================="

# Couleurs pour l'identité visuelle FloDrama
BLUE="#3b82f6"
FUCHSIA="#d946ef"

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "\033[38;2;59;130;246m▶\033[0m \033[38;2;217;70;239m$1\033[0m"
}

# Vérifier les prérequis
flodrama_echo "Vérification des prérequis..."
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI n'est pas installé. Veuillez l'installer et configurer vos identifiants."
  exit 1
fi

# Paramètres
DOMAIN_NAME="flodrama.com"
BUCKET_NAME="flodrama-website"
REGION="eu-west-3"  # Paris
BUILD_DIR="../dist"

# Vérifier si le répertoire de build existe
if [ ! -d "$BUILD_DIR" ]; then
  flodrama_echo "Le répertoire de build n'existe pas. Construction du projet..."
  cd ..
  npm run build
  if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Échec de la construction du projet."
    exit 1
  fi
  cd scripts
fi

# Créer le bucket S3 s'il n'existe pas
flodrama_echo "Création/vérification du bucket S3 $BUCKET_NAME..."
if ! aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
  aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION
  
  echo "✅ Bucket S3 créé avec succès."
else
  echo "✅ Le bucket S3 existe déjà."
fi

# Configurer le bucket S3 pour l'hébergement de site web statique
flodrama_echo "Configuration du bucket S3 pour l'hébergement web..."
aws s3 website s3://$BUCKET_NAME/ \
  --index-document index.html \
  --error-document index.html

# Configurer la politique du bucket pour permettre l'accès public
flodrama_echo "Configuration de la politique du bucket..."
cat > bucket-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOL

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json

# Synchroniser les fichiers du build avec le bucket S3
flodrama_echo "Déploiement des fichiers sur S3..."
aws s3 sync $BUILD_DIR/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "max-age=31536000,public"

# Configurer des règles de cache spécifiques pour certains fichiers
aws s3 cp $BUILD_DIR/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# Créer un certificat SSL pour le domaine
flodrama_echo "Demande d'un certificat SSL pour $DOMAIN_NAME..."
CERTIFICATE_ARN=$(aws acm request-certificate \
  --domain-name $DOMAIN_NAME \
  --subject-alternative-names www.$DOMAIN_NAME \
  --validation-method DNS \
  --region us-east-1 \
  --output text)

if [ -z "$CERTIFICATE_ARN" ]; then
  echo "❌ Échec de la demande de certificat."
  exit 1
fi

echo "✅ Certificat demandé avec succès: $CERTIFICATE_ARN"

# Récupérer les informations de validation DNS
flodrama_echo "Récupération des informations de validation DNS..."
sleep 10

VALIDATION_INFO=$(aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions" \
  --output json)

# Afficher les instructions de validation
flodrama_echo "Instructions de validation DNS:"
echo "Pour valider votre certificat, créez les enregistrements DNS suivants:"
echo ""

echo "$VALIDATION_INFO" | jq -r '.[] | "Domaine: \(.DomainName)\nNom: \(.ResourceRecord.Name)\nType: \(.ResourceRecord.Type)\nValeur: \(.ResourceRecord.Value)\n"'

# Créer une distribution CloudFront
flodrama_echo "Création d'une distribution CloudFront..."
cat > cloudfront-config.json << EOL
{
  "CallerReference": "flodrama-$(date +%s)",
  "Aliases": {
    "Quantity": 2,
    "Items": ["$DOMAIN_NAME", "www.$DOMAIN_NAME"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
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
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "LambdaFunctionAssociations": {
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
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
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
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
  "Comment": "FloDrama Website Distribution",
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERTIFICATE_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true
}
EOL

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  --region us-east-1 \
  --query "Distribution.Id" \
  --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "❌ Échec de la création de la distribution CloudFront."
  exit 1
fi

CLOUDFRONT_DOMAIN=$(aws cloudfront describe-distribution \
  --id $DISTRIBUTION_ID \
  --region us-east-1 \
  --query "Distribution.DomainName" \
  --output text)

echo "✅ Distribution CloudFront créée avec succès:"
echo "ID: $DISTRIBUTION_ID"
echo "Domaine: $CLOUDFRONT_DOMAIN"

# Afficher les instructions pour la configuration DNS
flodrama_echo "Configuration DNS requise pour $DOMAIN_NAME:"
echo "Une fois le certificat validé, configurez les enregistrements DNS suivants:"
echo ""
echo "   $DOMAIN_NAME.             CNAME    $CLOUDFRONT_DOMAIN."
echo "   www.$DOMAIN_NAME.         CNAME    $CLOUDFRONT_DOMAIN."
echo ""

# Enregistrer les informations pour une utilisation ultérieure
cat > ../cloudfront-info.txt << EOL
BUCKET_NAME=$BUCKET_NAME
DISTRIBUTION_ID=$DISTRIBUTION_ID
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
CERTIFICATE_ARN=$CERTIFICATE_ARN
EOL

# Afficher un résumé
flodrama_echo "Déploiement terminé avec succès !"
echo "✅ Bucket S3: $BUCKET_NAME"
echo "✅ Distribution CloudFront: $DISTRIBUTION_ID"
echo "✅ Domaine CloudFront: $CLOUDFRONT_DOMAIN"
echo "✅ Certificat SSL demandé: $CERTIFICATE_ARN"
echo ""
echo "⏱️ La validation du certificat peut prendre jusqu'à 30 minutes."
echo "⏱️ Le déploiement complet de la distribution CloudFront peut prendre jusqu'à 15 minutes."
echo ""
echo "🎉 Une fois configuré, votre site FloDrama sera accessible via HTTPS à l'adresse https://$DOMAIN_NAME !"
