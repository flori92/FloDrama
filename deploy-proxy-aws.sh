#!/bin/bash

# Script de déploiement du proxy CORS sur AWS Lambda
# Ce script crée une fonction Lambda et configure une API Gateway pour servir de proxy CORS

echo "✨ [DEPLOY] Déploiement du proxy CORS sur AWS Lambda"

# Nom de la fonction Lambda et de l'API Gateway
LAMBDA_NAME="flodrama-cors-proxy"
API_NAME="flodrama-cors-proxy-api"
STAGE_NAME="production"
REGION="us-east-1"

# Créer un répertoire temporaire pour le package
echo "🔧 Préparation du package Lambda..."
mkdir -p /tmp/lambda-package
cp proxy-cors-lambda.js /tmp/lambda-package/index.js
cd /tmp/lambda-package

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm init -y
npm install axios --save

# Créer le package ZIP
echo "📦 Création du package ZIP..."
zip -r lambda-package.zip .

# Vérifier si la fonction Lambda existe déjà
LAMBDA_EXISTS=$(aws lambda list-functions --region $REGION --query "Functions[?FunctionName=='$LAMBDA_NAME'].FunctionName" --output text)

if [ -z "$LAMBDA_EXISTS" ]; then
  # Créer la fonction Lambda
  echo "🔧 Création de la fonction Lambda $LAMBDA_NAME..."
  aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-basic-execution \
    --handler index.handler \
    --zip-file fileb://lambda-package.zip \
    --region $REGION
else
  # Mettre à jour la fonction Lambda existante
  echo "🔄 Mise à jour de la fonction Lambda $LAMBDA_NAME..."
  aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://lambda-package.zip \
    --region $REGION
fi

# Configurer la fonction Lambda pour les requêtes OPTIONS (CORS)
echo "🔧 Configuration de la fonction Lambda pour CORS..."
aws lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --region $REGION \
  --environment "Variables={CORS_ENABLED=true}"

# Vérifier si l'API Gateway existe déjà
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
  # Créer une nouvelle API Gateway
  echo "🔧 Création de l'API Gateway $API_NAME..."
  API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "Proxy CORS pour FloDrama" \
    --region $REGION \
    --endpoint-configuration "types=REGIONAL" \
    --query "id" --output text)
  
  # Obtenir l'ID de la ressource racine
  ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?path=='/'].id" --output text)
  
  # Créer une ressource proxy avec {proxy+}
  PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "{proxy+}" \
    --region $REGION \
    --query "id" --output text)
  
  # Obtenir l'ARN de la fonction Lambda
  LAMBDA_ARN=$(aws lambda get-function \
    --function-name $LAMBDA_NAME \
    --region $REGION \
    --query "Configuration.FunctionArn" --output text)
  
  # Créer la méthode ANY pour la ressource proxy
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION
  
  # Intégrer la méthode ANY avec la fonction Lambda
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION
  
  # Créer la méthode OPTIONS pour CORS
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION
  
  # Intégrer la méthode OPTIONS avec la fonction Lambda
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION
  
  # Ajouter les autorisations Lambda pour API Gateway
  aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-proxy \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*/{proxy+}" \
    --region $REGION
  
  # Déployer l'API
  echo "🚀 Déploiement de l'API Gateway..."
  DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --region $REGION \
    --query "id" --output text)
  
  # Configurer les paramètres de l'étape
  aws apigateway update-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --patch-operations "op=replace,path=/*/*/logging/loglevel,value=INFO" \
    --region $REGION
else
  echo "ℹ️ L'API Gateway $API_NAME existe déjà (ID: $API_ID)"
  
  # Redéployer l'API
  echo "🚀 Redéploiement de l'API Gateway..."
  DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --region $REGION \
    --query "id" --output text)
fi

# Afficher l'URL de l'API Gateway
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME"
echo "✅ Déploiement terminé !"
echo "📌 URL du proxy CORS: $API_URL"
echo ""
echo "📝 Instructions pour mettre à jour contentService.ts :"
echo "1. Modifier la constante API_URL pour utiliser le proxy en production :"
echo ""
echo "const API_URL = typeof window !== 'undefined' && window.location.hostname.endsWith('surge.sh')"
echo "  ? '$API_URL'"
echo "  : 'http://localhost:8080';"
echo ""
echo "2. Déployer l'application frontend avec 'npm run build && surge ./dist flodrama.surge.sh'"
