#!/bin/bash

# Script de mise à jour de la configuration CORS pour l'API Gateway FloDrama
# Ce script configure les en-têtes CORS pour permettre les requêtes depuis flodrama.surge.sh

echo "✨ [CHORE] Mise à jour de la configuration CORS pour l'API Gateway FloDrama"

# ID de l'API Gateway principale
API_ID="7la2pq33ej"
STAGE_NAME="production"
REGION="us-east-1"
DOMAIN="https://flodrama.surge.sh"

# Liste des ressources avec des méthodes OPTIONS (identifiées précédemment)
RESOURCES=("5qylfc" "75xznr" "ncd9ca" "rvizle" "uzdpxe7v2g" "y91vyp" "yre1kq")

# Mettre à jour la configuration CORS pour chaque ressource
for resource_id in "${RESOURCES[@]}"; do
  echo "🔄 Mise à jour de la configuration CORS pour la ressource $resource_id..."
  
  # Vérifier si la méthode OPTIONS existe pour cette ressource
  METHOD_EXISTS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method OPTIONS \
    --region $REGION 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Méthode OPTIONS trouvée, mise à jour..."
    
    # Mettre à jour la réponse d'intégration pour la méthode OPTIONS
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='$DOMAIN'" \
      --region $REGION
    
    # Mettre à jour les méthodes autorisées
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Methods,value='GET,POST,PUT,DELETE,OPTIONS'" \
      --region $REGION
    
    # Mettre à jour les en-têtes autorisés
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Headers,value='Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,Referer'" \
      --region $REGION
  else
    echo "  ⚠️ Méthode OPTIONS non trouvée pour la ressource $resource_id, création..."
    
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
      --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$DOMAIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,Referer'\"}" \
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
  
  # Mettre à jour les méthodes GET, POST, etc. pour ajouter les en-têtes CORS
  for method in GET POST PUT DELETE; do
    # Vérifier si la méthode existe
    METHOD_EXISTS=$(aws apigateway get-method \
      --rest-api-id $API_ID \
      --resource-id $resource_id \
      --http-method $method \
      --region $REGION 2>/dev/null)
    
    if [ $? -eq 0 ]; then
      echo "  🔧 Configuration CORS pour la méthode $method..."
      
      # Mettre à jour la réponse de méthode pour ajouter l'en-tête Access-Control-Allow-Origin
      aws apigateway update-method-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $method \
        --status-code 200 \
        --patch-operations "op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value=true" \
        --region $REGION
      
      # Mettre à jour la réponse d'intégration pour définir la valeur de l'en-tête Access-Control-Allow-Origin
      aws apigateway update-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $method \
        --status-code 200 \
        --patch-operations "op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='$DOMAIN'" \
        --region $REGION
    fi
  done
done

# Déployer les modifications
echo "🚀 Déploiement des modifications..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME \
  --description "Mise à jour de la configuration CORS pour autoriser flodrama.surge.sh" \
  --region $REGION

echo "✅ Configuration CORS mise à jour avec succès !"
echo "📌 Les requêtes depuis $DOMAIN devraient maintenant être autorisées par l'API Gateway."
echo ""
echo "📝 Pour vérifier la configuration :"
echo "1. Accéder à https://flodrama.surge.sh"
echo "2. Ouvrir la console développeur du navigateur"
echo "3. Vérifier qu'il n'y a pas d'erreurs CORS dans les requêtes vers l'API Gateway"
