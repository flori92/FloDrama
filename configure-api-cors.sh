#!/bin/bash

# Script de configuration CORS pour l'API Gateway FloDrama existante
# Ce script configure les paramètres CORS pour toutes les ressources de l'API Gateway

echo "✨ [CHORE] Configuration CORS pour l'API Gateway FloDrama existante"

# ID de l'API Gateway principale (déjà existante)
API_ID="7la2pq33ej"
STAGE_NAME="production"
REGION="us-east-1"
DOMAIN="https://flodrama.surge.sh"

# Récupérer toutes les ressources de l'API
echo "🔍 Récupération des ressources de l'API Gateway existante..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[*].id" --output json)

# Convertir la sortie JSON en tableau
RESOURCE_IDS=($(echo $RESOURCES | jq -r '.[]'))

echo "📋 Ressources trouvées: ${#RESOURCE_IDS[@]}"

# Pour chaque ressource, vérifier si elle a une méthode OPTIONS
for resource_id in "${RESOURCE_IDS[@]}"; do
  echo "🔍 Vérification de la ressource $resource_id..."
  
  # Récupérer les méthodes pour cette ressource
  METHODS=$(aws apigateway get-resource --rest-api-id $API_ID --resource-id $resource_id --region $REGION --query "resourceMethods" --output json 2>/dev/null)
  
  # Si la ressource n'a pas de méthodes, passer à la suivante
  if [ "$METHODS" == "null" ] || [ -z "$METHODS" ]; then
    echo "  ℹ️ Aucune méthode pour cette ressource, passage à la suivante..."
    continue
  fi
  
  # Vérifier si la méthode OPTIONS existe
  if [[ $METHODS == *"OPTIONS"* ]]; then
    echo "  ✅ Méthode OPTIONS trouvée, mise à jour de la configuration CORS..."
    
    # Mettre à jour la réponse d'intégration pour la méthode OPTIONS
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "[{\"op\":\"replace\",\"path\":\"/responseParameters/method.response.header.Access-Control-Allow-Origin\",\"value\":\"'$DOMAIN'\"},{\"op\":\"replace\",\"path\":\"/responseParameters/method.response.header.Access-Control-Allow-Methods\",\"value\":\"'GET,POST,PUT,DELETE,OPTIONS'\"},{\"op\":\"replace\",\"path\":\"/responseParameters/method.response.header.Access-Control-Allow-Headers\",\"value\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\"}]" \
      --region $REGION
  else
    echo "  ℹ️ Méthode OPTIONS non trouvée, création..."
    
    # Créer une méthode OPTIONS pour cette ressource
    aws apigateway put-method \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --authorization-type NONE \
      --region $REGION
    
    # Créer une intégration MOCK pour la méthode OPTIONS
    aws apigateway put-integration \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --type MOCK \
      --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
      --region $REGION
    
    # Configurer la réponse d'intégration
    aws apigateway put-integration-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$DOMAIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\"}" \
      --region $REGION
    
    # Configurer la réponse de méthode
    aws apigateway put-method-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":true,\"method.response.header.Access-Control-Allow-Methods\":true,\"method.response.header.Access-Control-Allow-Headers\":true}" \
      --region $REGION
  fi
  
  # Pour chaque méthode non-OPTIONS, configurer les en-têtes CORS dans les réponses
  for method in $(echo $METHODS | jq -r 'keys[]'); do
    if [ "$method" != "OPTIONS" ]; then
      echo "  🔧 Configuration CORS pour la méthode $method..."
      
      # Vérifier si la méthode a une réponse 200
      RESPONSE_EXISTS=$(aws apigateway get-method-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $method \
        --status-code 200 \
        --region $REGION 2>/dev/null)
      
      if [ $? -eq 0 ]; then
        # Mettre à jour la réponse de méthode existante
        aws apigateway update-method-response \
          --rest-api-id $API_ID \
          --resource-id $resource_id \
          --http-method $method \
          --status-code 200 \
          --patch-operations "[{\"op\":\"add\",\"path\":\"/responseParameters/method.response.header.Access-Control-Allow-Origin\",\"value\":\"true\"}]" \
          --region $REGION
      else
        # Créer une nouvelle réponse de méthode
        aws apigateway put-method-response \
          --rest-api-id $API_ID \
          --resource-id $resource_id \
          --http-method $method \
          --status-code 200 \
          --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":true}" \
          --region $REGION
      fi
      
      # Vérifier si la méthode a une réponse d'intégration 200
      INTEGRATION_RESPONSE_EXISTS=$(aws apigateway get-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $method \
        --status-code 200 \
        --region $REGION 2>/dev/null)
      
      if [ $? -eq 0 ]; then
        # Mettre à jour la réponse d'intégration existante
        aws apigateway update-integration-response \
          --rest-api-id $API_ID \
          --resource-id $resource_id \
          --http-method $method \
          --status-code 200 \
          --patch-operations "[{\"op\":\"add\",\"path\":\"/responseParameters/method.response.header.Access-Control-Allow-Origin\",\"value\":\"'$DOMAIN'\"}]" \
          --region $REGION
      fi
    fi
  done
done

# Déployer les modifications
echo "🚀 Déploiement des modifications sur l'API Gateway existante..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME \
  --region $REGION

echo "✅ Configuration CORS terminée sur l'API Gateway existante!"
echo "📌 Les requêtes depuis $DOMAIN devraient maintenant être autorisées par l'API Gateway."
echo ""
echo "📝 Pour tester la configuration CORS :"
echo "1. Accéder à https://flodrama.surge.sh"
echo "2. Ouvrir la console développeur du navigateur"
echo "3. Vérifier qu'il n'y a pas d'erreurs CORS dans les requêtes vers l'API Gateway"
