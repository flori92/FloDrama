#!/bin/bash

# Script de nettoyage des ressources AWS pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Nettoyage des ressources AWS pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_ID=$(echo $(jq -r '.apiUrl' "$CONFIG_FILE") | cut -d'/' -f3 | cut -d'.' -f1)
CLOUDFRONT_ID=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE" | cut -d'.' -f1)
S3_BUCKET=$(jq -r '.s3Bucket' "$CONFIG_FILE")
DYNAMO_TABLE=$(jq -r '.dynamoTable' "$CONFIG_FILE")
LAMBDA_FUNCTION=$(jq -r '.lambdaFunction' "$CONFIG_FILE")

echo "⚠️ ATTENTION: Ce script va supprimer toutes les ressources AWS créées pour FloDrama."
echo "⚠️ Cette action est irréversible et entraînera la perte de toutes les données."
read -p "Êtes-vous sûr de vouloir continuer? (oui/non) " -r
echo
if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "Opération annulée."
    exit 1
fi

echo "📋 Suppression de l'API Gateway..."
aws apigateway delete-rest-api --rest-api-id $API_ID

echo "📋 Suppression de la distribution CloudFront..."
# Désactiver la distribution avant de la supprimer
aws cloudfront get-distribution-config --id $CLOUDFRONT_ID > /tmp/dist-config.json
ETAG=$(jq -r '.ETag' /tmp/dist-config.json)
jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json > /tmp/dist-config-disabled.json
aws cloudfront update-distribution --id $CLOUDFRONT_ID --if-match $ETAG --distribution-config file:///tmp/dist-config-disabled.json
echo "⚠️ La distribution CloudFront a été désactivée. Elle sera supprimée automatiquement après quelques heures."

echo "📋 Suppression de la fonction Lambda..."
aws lambda delete-function --function-name $LAMBDA_FUNCTION

echo "📋 Suppression du bucket S3..."
aws s3 rm s3://$S3_BUCKET --recursive
aws s3 rb s3://$S3_BUCKET --force

echo "📋 Suppression de la table DynamoDB..."
aws dynamodb delete-table --table-name $DYNAMO_TABLE

echo "✅ Nettoyage terminé avec succès!"
