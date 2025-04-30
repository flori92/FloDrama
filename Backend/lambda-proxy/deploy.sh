#!/bin/bash
# Script de déploiement du proxy CORS FloDrama sur AWS Lambda

echo "🚀 Déploiement du proxy CORS FloDrama sur AWS Lambda"

# Configuration
LAMBDA_NAME="flodrama-cors-proxy"
LAMBDA_ROLE_NAME="flodrama-cors-proxy-role"
API_NAME="flodrama-cors-proxy-api"
STAGE_NAME="production"
REGION="us-east-1"

# Création du package de déploiement
echo "📦 Création du package de déploiement..."
rm -f lambda-package.zip
zip -r lambda-package.zip index.js package.json

# Vérification si le rôle Lambda existe déjà
ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "🔑 Création du rôle IAM pour Lambda..."
    TRUST_POLICY='{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }'
    
    ROLE_ARN=$(aws iam create-role \
        --role-name $LAMBDA_ROLE_NAME \
        --assume-role-policy-document "$TRUST_POLICY" \
        --query 'Role.Arn' \
        --output text)
    
    # Attacher la politique de base pour Lambda
    aws iam attach-role-policy \
        --role-name $LAMBDA_ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Attendre que le rôle soit disponible
    echo "⏳ Attente de la propagation du rôle IAM..."
    sleep 10
else
    echo "✅ Rôle IAM existant trouvé: $ROLE_ARN"
fi

# Vérification si la fonction Lambda existe déjà
LAMBDA_EXISTS=$(aws lambda get-function --function-name $LAMBDA_NAME 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "🔧 Création de la fonction Lambda..."
    aws lambda create-function \
        --function-name $LAMBDA_NAME \
        --runtime nodejs18.x \
        --handler index.handler \
        --role $ROLE_ARN \
        --zip-file fileb://lambda-package.zip \
        --timeout 30 \
        --memory-size 256
else
    echo "🔄 Mise à jour de la fonction Lambda existante..."
    aws lambda update-function-code \
        --function-name $LAMBDA_NAME \
        --zip-file fileb://lambda-package.zip
fi

# Récupérer l'ARN de la fonction Lambda
LAMBDA_ARN=$(aws lambda get-function --function-name $LAMBDA_NAME --query 'Configuration.FunctionArn' --output text)
echo "✅ Fonction Lambda déployée: $LAMBDA_ARN"

# Vérification si l'API Gateway existe déjà
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)
if [ -z "$API_ID" ]; then
    echo "🔧 Création de l'API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "API Gateway pour le proxy CORS FloDrama" \
        --endpoint-configuration "types=EDGE" \
        --query 'id' \
        --output text)
    
    # Récupérer l'ID de la ressource racine
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --query 'items[?path==`/`].id' \
        --output text)
    
    # Créer une ressource proxy pour capturer tous les chemins
    PROXY_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part "{proxy+}" \
        --query 'id' \
        --output text)
    
    # Créer la méthode ANY pour la ressource proxy
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $PROXY_RESOURCE_ID \
        --http-method ANY \
        --authorization-type NONE
    
    # Configurer l'intégration avec Lambda
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $PROXY_RESOURCE_ID \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
    
    # Créer la méthode OPTIONS pour CORS
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $PROXY_RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE
    
    # Configurer l'intégration pour OPTIONS
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $PROXY_RESOURCE_ID \
        --http-method OPTIONS \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
    
    # Configurer la méthode ANY pour la racine
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $ROOT_RESOURCE_ID \
        --http-method ANY \
        --authorization-type NONE
    
    # Configurer l'intégration avec Lambda pour la racine
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $ROOT_RESOURCE_ID \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
    
    # Configurer la méthode OPTIONS pour la racine
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $ROOT_RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE
    
    # Configurer l'intégration pour OPTIONS pour la racine
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $ROOT_RESOURCE_ID \
        --http-method OPTIONS \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
else
    echo "✅ API Gateway existante trouvée: $API_ID"
fi

# Donner à API Gateway la permission d'invoquer Lambda
aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query 'Account' --output text):$API_ID/*/*/*" \
    2>/dev/null || true

# Déployer l'API
echo "🚀 Déploiement de l'API Gateway..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --description "Déploiement du proxy CORS FloDrama" \
    --query 'id' \
    --output text)

# Récupérer l'URL de l'API
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME"
echo "✅ API déployée avec succès à l'URL: $API_URL"

# Mettre à jour le fichier .env.production avec la nouvelle URL
echo "🔧 Mise à jour du fichier .env.production..."
ENV_FILE="../../Frontend/.env.production"
if [ -f "$ENV_FILE" ]; then
    # Vérifier si VITE_API_URL existe déjà
    if grep -q "VITE_API_URL" "$ENV_FILE"; then
        # Remplacer la valeur existante
        sed -i '' "s|VITE_API_URL=.*|VITE_API_URL=$API_URL|g" "$ENV_FILE"
    else
        # Ajouter la nouvelle variable
        echo "VITE_API_URL=$API_URL" >> "$ENV_FILE"
    fi
    echo "✅ Fichier .env.production mis à jour avec la nouvelle URL de l'API"
else
    echo "❌ Fichier .env.production non trouvé"
fi

echo "✨ Déploiement terminé avec succès!"
echo "📝 URL de l'API: $API_URL"
echo "📝 Pour tester: curl $API_URL/api/content?category=drama"
