#!/bin/bash

# Script de déploiement de la fonction Lambda d'optimisation d'images
# et de sa configuration avec CloudFront pour FloDrama

set -e

# Configuration
LAMBDA_FUNCTION_NAME="FloDramaImageOptimizer"
S3_BUCKET="flodrama-content-1745269660"
REGION="us-east-1"
CLOUDFRONT_DISTRIBUTION_ID=""
LAMBDA_ROLE_ARN=""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si les variables d'environnement sont définies
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  log_error "Les variables d'environnement AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY doivent être définies"
  exit 1
fi

# Récupérer les variables d'environnement si elles sont définies
if [ -n "$AWS_LAMBDA_ROLE_ARN" ]; then
  LAMBDA_ROLE_ARN="$AWS_LAMBDA_ROLE_ARN"
fi

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  CLOUDFRONT_DISTRIBUTION_ID="$CLOUDFRONT_DISTRIBUTION_ID"
fi

# Vérifier si le rôle Lambda est défini
if [ -z "$LAMBDA_ROLE_ARN" ]; then
  log_error "La variable LAMBDA_ROLE_ARN n'est pas définie"
  log "Vous pouvez la définir avec la variable d'environnement AWS_LAMBDA_ROLE_ARN"
  exit 1
fi

# Vérifier si l'ID de distribution CloudFront est défini
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  log_warning "La variable CLOUDFRONT_DISTRIBUTION_ID n'est pas définie"
  log "L'invalidation du cache CloudFront ne sera pas effectuée"
fi

# Chemin vers le répertoire de la fonction Lambda
LAMBDA_DIR="$(pwd)/Backend/src/lambda/image-optimizer"

# Vérifier si le répertoire existe
if [ ! -d "$LAMBDA_DIR" ]; then
  log_error "Le répertoire $LAMBDA_DIR n'existe pas"
  exit 1
fi

# Se déplacer dans le répertoire de la fonction Lambda
cd "$LAMBDA_DIR"

# Installer les dépendances
log "Installation des dépendances..."
npm install --production

# Créer le package de déploiement
log "Création du package de déploiement..."
zip -r image-optimizer.zip node_modules index.js

# Vérifier si la fonction Lambda existe déjà
FUNCTION_EXISTS=$(aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$LAMBDA_FUNCTION_NAME'].FunctionName" --output text)

if [ -z "$FUNCTION_EXISTS" ]; then
  # Créer la fonction Lambda
  log "Création de la fonction Lambda $LAMBDA_FUNCTION_NAME..."
  aws lambda create-function \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --runtime nodejs18.x \
    --handler index.handler \
    --role "$LAMBDA_ROLE_ARN" \
    --zip-file fileb://image-optimizer.zip \
    --timeout 30 \
    --memory-size 512 \
    --region "$REGION" \
    --environment "Variables={S3_BUCKET=$S3_BUCKET}"
  
  log_success "Fonction Lambda $LAMBDA_FUNCTION_NAME créée avec succès"
else
  # Mettre à jour la fonction Lambda
  log "Mise à jour de la fonction Lambda $LAMBDA_FUNCTION_NAME..."
  aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --zip-file fileb://image-optimizer.zip \
    --region "$REGION"
  
  log_success "Fonction Lambda $LAMBDA_FUNCTION_NAME mise à jour avec succès"
fi

# Publier une version de la fonction Lambda
log "Publication d'une nouvelle version de la fonction Lambda..."
VERSION=$(aws lambda publish-version \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --description "Version $(date +%Y-%m-%d-%H-%M-%S)" \
  --region "$REGION" \
  --query "Version" \
  --output text)

log_success "Version $VERSION publiée avec succès"

# Créer un alias pour la fonction Lambda
ALIAS_NAME="production"
log "Création/mise à jour de l'alias $ALIAS_NAME pour la fonction Lambda..."

# Vérifier si l'alias existe déjà
ALIAS_EXISTS=$(aws lambda list-aliases \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$REGION" \
  --query "Aliases[?Name=='$ALIAS_NAME'].Name" \
  --output text)

if [ -z "$ALIAS_EXISTS" ]; then
  # Créer l'alias
  aws lambda create-alias \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --name "$ALIAS_NAME" \
    --function-version "$VERSION" \
    --region "$REGION"
else
  # Mettre à jour l'alias
  aws lambda update-alias \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --name "$ALIAS_NAME" \
    --function-version "$VERSION" \
    --region "$REGION"
fi

log_success "Alias $ALIAS_NAME créé/mis à jour avec succès"

# Configurer les autorisations pour CloudFront
log "Configuration des autorisations pour CloudFront..."
aws lambda add-permission \
  --function-name "arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query 'Account' --output text):function:$LAMBDA_FUNCTION_NAME:$ALIAS_NAME" \
  --statement-id "AllowCloudFrontInvoke" \
  --action "lambda:InvokeFunction" \
  --principal "edgelambda.amazonaws.com" \
  --region "$REGION" || true

log_success "Autorisations configurées avec succès"

# Si l'ID de distribution CloudFront est défini, configurer la fonction Lambda@Edge
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  log "Configuration de la fonction Lambda@Edge avec CloudFront..."
  
  # Récupérer la configuration actuelle de la distribution CloudFront
  log "Récupération de la configuration de la distribution CloudFront..."
  aws cloudfront get-distribution-config \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query "DistributionConfig" \
    --output json > distribution-config.json
  
  # Récupérer l'ETag
  ETAG=$(aws cloudfront get-distribution-config \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query "ETag" \
    --output text)
  
  # Modifier la configuration pour ajouter la fonction Lambda@Edge
  log "Modification de la configuration CloudFront..."
  python -c "
import json
import sys

# Charger la configuration
with open('distribution-config.json', 'r') as f:
    config = json.load(f)

# Ajouter la fonction Lambda@Edge à la configuration
lambda_arn = f'arn:aws:lambda:us-east-1:{sys.argv[1]}:function:{sys.argv[2]}:{sys.argv[3]}'

# Vérifier si DefaultCacheBehavior existe
if 'DefaultCacheBehavior' not in config:
    config['DefaultCacheBehavior'] = {}

# Vérifier si LambdaFunctionAssociations existe
if 'LambdaFunctionAssociations' not in config['DefaultCacheBehavior']:
    config['DefaultCacheBehavior']['LambdaFunctionAssociations'] = {
        'Quantity': 0,
        'Items': []
    }

# Vérifier si la fonction Lambda@Edge est déjà configurée
lambda_exists = False
for item in config['DefaultCacheBehavior']['LambdaFunctionAssociations'].get('Items', []):
    if item.get('LambdaFunctionARN') == lambda_arn:
        lambda_exists = True
        break

# Ajouter la fonction Lambda@Edge si elle n'existe pas déjà
if not lambda_exists:
    config['DefaultCacheBehavior']['LambdaFunctionAssociations']['Items'].append({
        'EventType': 'origin-request',
        'LambdaFunctionARN': lambda_arn,
        'IncludeBody': False
    })
    config['DefaultCacheBehavior']['LambdaFunctionAssociations']['Quantity'] = len(config['DefaultCacheBehavior']['LambdaFunctionAssociations']['Items'])

# Enregistrer la configuration modifiée
with open('distribution-config-updated.json', 'w') as f:
    json.dump(config, f)
  " "$(aws sts get-caller-identity --query 'Account' --output text)" "$LAMBDA_FUNCTION_NAME" "$ALIAS_NAME"
  
  # Mettre à jour la distribution CloudFront
  log "Mise à jour de la distribution CloudFront..."
  aws cloudfront update-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --distribution-config file://distribution-config-updated.json \
    --if-match "$ETAG"
  
  log_success "Distribution CloudFront mise à jour avec succès"
  
  # Invalider le cache CloudFront
  log "Invalidation du cache CloudFront..."
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"
  
  log_success "Cache CloudFront invalidé avec succès"
else
  log_warning "L'ID de distribution CloudFront n'est pas défini, la configuration avec CloudFront n'a pas été effectuée"
fi

# Nettoyer les fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -f image-optimizer.zip distribution-config.json distribution-config-updated.json

log_success "Déploiement terminé avec succès"
