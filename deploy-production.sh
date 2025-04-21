#!/bin/bash
# Script de déploiement en production pour FloDrama
# Ce script prépare et déploie l'application en environnement de production

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration de production
BACKEND_API_URL="https://api.flodrama.com"
FRONTEND_URL="https://flodrama.com"
AWS_REGION="us-east-1"
S3_BUCKET="flodrama-content-1745269660"

# Fonction pour afficher un message avec une couleur
print_message() {
  echo -e "${2}${1}${NC}"
}

# Fonction pour afficher une bannière
print_banner() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════╗"
  echo "║                                                ║"
  echo "║   FloDrama - Déploiement en Production         ║"
  echo "║                                                ║"
  echo "╚════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Définir le répertoire de base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${BASE_DIR}/Frontend"
BACKEND_DIR="${BASE_DIR}/Backend"
BACKEND_API_DIR="${BACKEND_DIR}/api"

# Afficher la bannière
print_banner

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  print_message "❌ AWS CLI n'est pas installé. Veuillez l'installer pour continuer." "$RED"
  exit 1
fi

# Vérifier si les répertoires existent
if [ ! -d "$FRONTEND_DIR" ]; then
  print_message "❌ Le répertoire Frontend n'existe pas." "$RED"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  print_message "❌ Le répertoire Backend n'existe pas." "$RED"
  exit 1
fi

# Étape 1: Préparation du backend
print_message "\n🔄 Préparation du backend..." "$YELLOW"

# Créer un fichier .env de production
cat > "${BACKEND_API_DIR}/.env" << EOL
NODE_ENV=production
PORT=3001
AWS_REGION=${AWS_REGION}
S3_BUCKET=${S3_BUCKET}
FRONTEND_URL=${FRONTEND_URL}
EOL

print_message "✅ Fichier .env de production créé" "$GREEN"

# Installation des dépendances du backend
print_message "🔄 Installation des dépendances du backend..." "$YELLOW"
cd "$BACKEND_API_DIR" && npm ci
if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors de l'installation des dépendances du backend." "$RED"
  exit 1
fi
print_message "✅ Dépendances du backend installées" "$GREEN"

# Création du package de déploiement pour AWS Lambda
print_message "🔄 Création du package Lambda pour le backend..." "$YELLOW"
cd "$BACKEND_API_DIR" && zip -r ../backend-api.zip . -x "node_modules/aws-sdk/*" -x "*.git*" -x "*.env.example"
if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors de la création du package Lambda." "$RED"
  exit 1
fi
print_message "✅ Package Lambda créé: ${BACKEND_DIR}/backend-api.zip" "$GREEN"

# Étape 2: Déploiement du backend sur AWS Lambda
print_message "\n🔄 Déploiement du backend sur AWS Lambda..." "$YELLOW"

# Vérifier si la fonction Lambda existe déjà
LAMBDA_EXISTS=$(aws lambda list-functions --region $AWS_REGION --query "Functions[?FunctionName=='FloDramaAPI'].FunctionName" --output text)

if [ -z "$LAMBDA_EXISTS" ]; then
  # Créer la fonction Lambda
  print_message "🔄 Création de la fonction Lambda FloDramaAPI..." "$YELLOW"
  aws lambda create-function \
    --function-name FloDramaAPI \
    --runtime nodejs18.x \
    --role arn:aws:iam::123456789012:role/FloDramaLambdaRole \
    --handler contentDistributionAPI.handler \
    --zip-file fileb://${BACKEND_DIR}/backend-api.zip \
    --region $AWS_REGION \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=production,S3_BUCKET=${S3_BUCKET}}"
else
  # Mettre à jour la fonction Lambda existante
  print_message "🔄 Mise à jour de la fonction Lambda FloDramaAPI..." "$YELLOW"
  aws lambda update-function-code \
    --function-name FloDramaAPI \
    --zip-file fileb://${BACKEND_DIR}/backend-api.zip \
    --region $AWS_REGION
fi

if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors du déploiement du backend sur AWS Lambda." "$RED"
  exit 1
fi
print_message "✅ Backend déployé sur AWS Lambda" "$GREEN"

# Étape 3: Configuration d'API Gateway
print_message "\n🔄 Configuration d'API Gateway..." "$YELLOW"

# Vérifier si l'API existe déjà
API_ID=$(aws apigateway get-rest-apis --region $AWS_REGION --query "items[?name=='FloDramaAPI'].id" --output text)

if [ -z "$API_ID" ]; then
  # Créer une nouvelle API
  print_message "🔄 Création d'une nouvelle API Gateway..." "$YELLOW"
  API_ID=$(aws apigateway create-rest-api \
    --name FloDramaAPI \
    --region $AWS_REGION \
    --endpoint-configuration "types=REGIONAL" \
    --query "id" --output text)
  
  # Configurer l'API
  ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query "items[?path=='/'].id" --output text)
  
  # Créer la ressource /api
  API_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "api" \
    --region $AWS_REGION \
    --query "id" --output text)
  
  # Configurer la méthode ANY pour /api
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $API_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $AWS_REGION
  
  # Configurer l'intégration avec Lambda
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $API_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS_REGION}:123456789012:function:FloDramaAPI/invocations \
    --region $AWS_REGION
  
  # Déployer l'API
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $AWS_REGION
else
  print_message "✅ API Gateway existe déjà, mise à jour du déploiement..." "$GREEN"
  # Mettre à jour le déploiement
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $AWS_REGION
fi

if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors de la configuration d'API Gateway." "$RED"
  exit 1
fi

# Récupérer l'URL de l'API
API_URL=$(aws apigateway get-stage \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $AWS_REGION \
  --query "invokeUrl" --output text)

print_message "✅ API Gateway configurée: ${API_URL}" "$GREEN"

# Étape 4: Préparation du frontend
print_message "\n🔄 Préparation du frontend..." "$YELLOW"

# Créer un fichier .env de production pour le frontend
cat > "${FRONTEND_DIR}/.env.production" << EOL
VITE_API_URL=${API_URL}/api
VITE_ENVIRONMENT=production
EOL

print_message "✅ Fichier .env.production créé pour le frontend" "$GREEN"

# Installation des dépendances du frontend
print_message "🔄 Installation des dépendances du frontend..." "$YELLOW"
cd "$FRONTEND_DIR" && npm ci
if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors de l'installation des dépendances du frontend." "$RED"
  exit 1
fi
print_message "✅ Dépendances du frontend installées" "$GREEN"

# Build du frontend
print_message "🔄 Build du frontend..." "$YELLOW"
cd "$FRONTEND_DIR" && npm run build
if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors du build du frontend." "$RED"
  exit 1
fi
print_message "✅ Build du frontend terminé" "$GREEN"

# Étape 5: Déploiement du frontend
print_message "\n🔄 Déploiement du frontend..." "$YELLOW"

# Créer un bucket S3 pour le frontend si nécessaire
FRONTEND_BUCKET="flodrama-frontend"
BUCKET_EXISTS=$(aws s3api head-bucket --bucket $FRONTEND_BUCKET 2>&1 || echo "not exists")

if [[ $BUCKET_EXISTS == *"not exists"* ]]; then
  print_message "🔄 Création du bucket S3 pour le frontend..." "$YELLOW"
  aws s3api create-bucket \
    --bucket $FRONTEND_BUCKET \
    --region $AWS_REGION
  
  # Configurer le bucket pour l'hébergement de site web statique
  aws s3 website $FRONTEND_BUCKET \
    --index-document index.html \
    --error-document index.html
fi

# Synchroniser les fichiers du build avec le bucket S3
print_message "🔄 Synchronisation des fichiers du frontend avec S3..." "$YELLOW"
aws s3 sync "$FRONTEND_DIR/dist" "s3://$FRONTEND_BUCKET" --delete
if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors du déploiement du frontend sur S3." "$RED"
  exit 1
fi
print_message "✅ Frontend déployé sur S3: http://${FRONTEND_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com" "$GREEN"

# Étape 6: Configuration de CloudFront (CDN)
print_message "\n🔄 Configuration de CloudFront..." "$YELLOW"

# Vérifier si la distribution CloudFront existe déjà
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='${FRONTEND_BUCKET}.s3.amazonaws.com'].Id" --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
  # Créer une nouvelle distribution CloudFront
  print_message "🔄 Création d'une nouvelle distribution CloudFront..." "$YELLOW"
  
  # Créer un fichier de configuration temporaire
  CLOUDFRONT_CONFIG=$(mktemp)
  cat > $CLOUDFRONT_CONFIG << EOL
{
  "CallerReference": "flodrama-$(date +%s)",
  "Aliases": {
    "Quantity": 1,
    "Items": ["${FRONTEND_URL#https://}"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${FRONTEND_BUCKET}",
        "DomainName": "${FRONTEND_BUCKET}.s3.amazonaws.com",
        "OriginPath": "",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${FRONTEND_BUCKET}",
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
    "DefaultTTL": 86400
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
  "Comment": "FloDrama Frontend",
  "Enabled": true
}
EOL
  
  # Créer la distribution CloudFront
  DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file://$CLOUDFRONT_CONFIG \
    --query "Distribution.Id" --output text)
  
  # Supprimer le fichier temporaire
  rm $CLOUDFRONT_CONFIG
else
  print_message "✅ Distribution CloudFront existe déjà: ${DISTRIBUTION_ID}" "$GREEN"
fi

if [ $? -ne 0 ]; then
  print_message "❌ Erreur lors de la configuration de CloudFront." "$RED"
  exit 1
fi

# Récupérer l'URL de la distribution CloudFront
CLOUDFRONT_URL=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query "Distribution.DomainName" --output text)

print_message "✅ CloudFront configuré: https://${CLOUDFRONT_URL}" "$GREEN"

# Étape 7: Récapitulatif du déploiement
print_message "\n📋 Récapitulatif du déploiement:" "$BLUE"
print_message "- Backend API: ${API_URL}/api" "$BLUE"
print_message "- Frontend (S3): http://${FRONTEND_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com" "$BLUE"
print_message "- Frontend (CloudFront): https://${CLOUDFRONT_URL}" "$BLUE"
print_message "- Fonction Lambda: FloDramaAPI" "$BLUE"
print_message "- Bucket S3 pour le contenu: ${S3_BUCKET}" "$BLUE"
print_message "- Bucket S3 pour le frontend: ${FRONTEND_BUCKET}" "$BLUE"

print_message "\n✅ Déploiement en production terminé avec succès!" "$GREEN"
print_message "Pour accéder à l'application, visitez: https://${CLOUDFRONT_URL}" "$GREEN"
