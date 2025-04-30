#!/bin/bash

# Script de surveillance des ressources AWS pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Surveillance des ressources AWS pour FloDrama"

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

echo "📋 Surveillance de l'API Gateway ($API_ID)..."
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Sum \
  --dimensions Name=ApiName,Value=$API_ID

echo "📋 Surveillance de CloudFront ($CLOUDFRONT_ID)..."
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Sum \
  --dimensions Name=DistributionId,Value=$CLOUDFRONT_ID Name=Region,Value=Global

echo "📋 Surveillance de Lambda ($LAMBDA_FUNCTION)..."
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Sum \
  --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION

echo "📋 Surveillance de S3 ($S3_BUCKET)..."
aws s3 ls s3://$S3_BUCKET --summarize

echo "📋 Surveillance de DynamoDB ($DYNAMO_TABLE)..."
aws dynamodb describe-table --table-name $DYNAMO_TABLE --query "Table.ItemCount"

echo "✅ Surveillance terminée avec succès!"
