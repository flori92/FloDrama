#!/bin/bash

# Liste des ressources avec des méthodes OPTIONS
RESOURCES=("5qylfc" "75xznr" "ncd9ca" "rvizle" "uzdpxe7v2g" "y91vyp" "yre1kq")
API_ID="7la2pq33ej"

# Mettre à jour la configuration CORS pour chaque ressource
for resource in "${RESOURCES[@]}"; do
  echo "Mise à jour de la configuration CORS pour la ressource $resource..."
  aws apigateway update-integration-response \
    --rest-api-id $API_ID \
    --resource-id $resource \
    --http-method OPTIONS \
    --status-code 200 \
    --patch-operations "op=replace,path='/responseParameters/method.response.header.Access-Control-Allow-Origin',value=\"'https://flodrama.surge.sh'\""
done

# Déployer les modifications
echo "Déploiement des modifications..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name production \
  --description "Mise à jour de la configuration CORS pour autoriser flodrama.surge.sh"

echo "Configuration CORS mise à jour avec succès !"
