#!/bin/bash

# Script de nettoyage des ressources AWS obsolètes pour FloDrama
# Ce script supprime progressivement les API Gateway obsolètes avec des délais entre chaque opération

echo "✨ [CHORE] Début du nettoyage des ressources AWS obsolètes"

# Liste des API Gateway à conserver
API_PRINCIPALE="7la2pq33ej"  # FloDrama-API-Production

# Liste des API Gateway à supprimer
API_OBSOLETES=(
  "1r7q2qw8r4"  # flodrama-video-api (REGIONAL)
  "45ipnitfag"  # flodrama-cors-proxy-api
  "d69p5h7093"  # prod-flodrama-proxy-v2
  "oap57blam8"  # flodrama-video-api (EDGE)
  "t2omkpktte"  # flodrama-rest-api
  "yqek2f5uph"  # flodrama-api
)

# Fonction pour supprimer une API Gateway avec gestion des erreurs
supprimer_api() {
  local api_id=$1
  local nom_api=$2
  
  echo "🔄 Suppression de l'API Gateway $nom_api (ID: $api_id)..."
  
  if aws apigateway delete-rest-api --rest-api-id $api_id; then
    echo "✅ API Gateway $nom_api supprimée avec succès"
  else
    echo "❌ Échec de la suppression de l'API Gateway $nom_api"
    return 1
  fi
  
  return 0
}

# Supprimer les API Gateway obsolètes une par une avec un délai entre chaque suppression
for api_id in "${API_OBSOLETES[@]}"; do
  # Obtenir le nom de l'API pour l'affichage
  api_info=$(aws apigateway get-rest-api --rest-api-id $api_id 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    api_name=$(echo $api_info | jq -r '.name')
    supprimer_api $api_id "$api_name"
    
    # Attendre 30 secondes entre chaque suppression pour éviter les limitations de taux
    echo "⏳ Attente de 30 secondes avant la prochaine opération..."
    sleep 30
  else
    echo "ℹ️ L'API Gateway $api_id n'existe pas ou a déjà été supprimée"
  fi
done

echo "✨ [CHORE] Nettoyage des API Gateway terminé"

# Vérifier les fonctions Lambda inutilisées
echo "🔍 Recherche des fonctions Lambda potentiellement inutilisées..."
aws lambda list-functions --query "Functions[?!starts_with(FunctionName, 'FloDrama')].FunctionName" --output text

echo "✨ [CHORE] Nettoyage des ressources AWS terminé"
echo "ℹ️ Pour finaliser le nettoyage, vérifiez manuellement les fonctions Lambda, les buckets S3 et les distributions CloudFront"
