#!/bin/bash

# Script de configuration CORS pour l'API Gateway
# Créé le 8 avril 2025

set -e

echo "🚀 Configuration CORS pour l'API Gateway de FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

# Récupération de l'ID de l'API Gateway depuis le fichier de configuration
API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
API_ID=$(echo $API_URL | cut -d'/' -f3 | cut -d'.' -f1)

echo "📋 ID de l'API Gateway: $API_ID"

# Récupération de l'ID de la ressource /stream
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID)
RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path=="/stream") | .id')

echo "📋 ID de la ressource /stream: $RESOURCE_ID"

# Mise à jour de la méthode OPTIONS pour CORS
echo "📋 Mise à jour de la méthode OPTIONS pour CORS..."

# Mise à jour des en-têtes CORS pour OPTIONS
aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --patch-operations '[
    {
      "op": "replace",
      "path": "/responseParameters/method.response.header.Access-Control-Allow-Headers",
      "value": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept,Referer,User-Agent'"'"'"
    },
    {
      "op": "replace",
      "path": "/responseParameters/method.response.header.Access-Control-Allow-Methods",
      "value": "'"'"'GET,OPTIONS'"'"'"
    },
    {
      "op": "replace",
      "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
      "value": "'"'"'*'"'"'"
    }
  ]'

# Mise à jour de la méthode GET pour CORS
echo "📋 Mise à jour de la méthode GET pour CORS..."

# Mise à jour des en-têtes CORS pour GET
aws apigateway update-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --status-code 200 \
  --patch-operations '[
    {
      "op": "replace",
      "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
      "value": "'"'"'*'"'"'"
    }
  ]'

# Déploiement des modifications
echo "📋 Déploiement des modifications..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

echo "✅ Configuration CORS terminée avec succès!"
echo "📌 L'API Gateway accepte maintenant les requêtes depuis n'importe quelle origine (*)."
echo "⚠️ Note: En production, il est recommandé de restreindre les origines autorisées."
