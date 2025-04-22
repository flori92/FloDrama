#!/bin/bash
# Script de déploiement du proxy CORS FloDrama avec AWS SAM

echo "🚀 Déploiement du proxy CORS FloDrama avec AWS SAM"

# Configuration
STACK_NAME="flodrama-cors-proxy"
REGION="us-east-1"
S3_BUCKET="flodrama-deployment-$(date +%s)"

# Vérifier si AWS SAM CLI est installé
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI n'est pas installé. Veuillez l'installer : https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
fi

# Créer un bucket S3 pour le déploiement si nécessaire
echo "📦 Création du bucket S3 pour le déploiement..."
aws s3 mb s3://$S3_BUCKET --region $REGION || true

# Empaqueter l'application
echo "📦 Empaquetage de l'application..."
sam package \
    --template-file template.yaml \
    --s3-bucket $S3_BUCKET \
    --output-template-file packaged.yaml

# Déployer l'application
echo "🚀 Déploiement de l'application..."
sam deploy \
    --template-file packaged.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --region $REGION

# Récupérer l'URL de l'API
echo "📝 Récupération de l'URL de l'API..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text \
    --region $REGION)

if [ -z "$API_URL" ]; then
    echo "❌ Impossible de récupérer l'URL de l'API"
    exit 1
fi

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
echo "📝 Pour tester: curl ${API_URL}api/content?category=drama"
