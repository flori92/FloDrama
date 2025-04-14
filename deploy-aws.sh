#!/bin/bash

# Script de déploiement de l'infrastructure AWS pour FloDrama

# Variables
STACK_NAME="flodrama-stack"
REGION="eu-west-3"
S3_BUCKET_NAME="flodrama-assets"
LAMBDA_AUTH_NAME="flodrama-auth"
DEPLOYMENT_BUCKET="flodrama-deployment"
API_NAME="flodrama-api"

# Créer le bucket de déploiement s'il n'existe pas
if ! aws s3api head-bucket --bucket $DEPLOYMENT_BUCKET 2>/dev/null; then
    aws s3api create-bucket \
        --bucket $DEPLOYMENT_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION
fi

# Installer les dépendances pour les fonctions Lambda
echo "Installation des dépendances pour les fonctions Lambda..."
cd lambda/auth && npm install && cd ../..

# Créer les archives ZIP pour les fonctions Lambda
echo "Création des archives ZIP pour les fonctions Lambda..."
cd lambda/auth && zip -r ../../$LAMBDA_AUTH_NAME.zip * && cd ../..

# Télécharger les archives ZIP vers le bucket de déploiement
echo "Téléchargement des archives ZIP vers le bucket de déploiement..."
aws s3 cp $LAMBDA_AUTH_NAME.zip s3://$DEPLOYMENT_BUCKET/

# Récupérer les valeurs des variables d'environnement
MONGODB_URI=$(grep MONGODB_URI .env.aws | cut -d '=' -f2)
JWT_SECRET=$(grep JWT_SECRET .env.aws | cut -d '=' -f2)
JWT_EXPIRES_IN=$(grep JWT_EXPIRES_IN .env.aws | cut -d '=' -f2)

# Déployer le stack CloudFormation
echo "Déploiement du stack CloudFormation..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        APIName=$API_NAME \
        LambdaAuthName=$LAMBDA_AUTH_NAME \
        DeploymentBucket=$DEPLOYMENT_BUCKET \
        S3BucketName=$S3_BUCKET_NAME \
        MongoDBURI="$MONGODB_URI" \
        JWTSecret="$JWT_SECRET" \
        JWTExpiresIn="$JWT_EXPIRES_IN"

# Récupérer l'URL de l'API
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
    --output text)

echo "Déploiement terminé avec succès !"
echo "URL de l'API : $API_URL"

# Mettre à jour le fichier .env avec l'URL de l'API
if [[ -n "$API_URL" ]]; then
    sed -i '' "s|VITE_API_URL=.*|VITE_API_URL=$API_URL|g" .env.aws
    echo "Fichier .env.aws mis à jour avec l'URL de l'API : $API_URL"
else
    echo "Attention : L'URL de l'API n'a pas pu être récupérée."
fi
