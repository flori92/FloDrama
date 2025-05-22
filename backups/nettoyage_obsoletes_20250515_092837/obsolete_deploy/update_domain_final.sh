#!/bin/bash

# Variables d'environnement nécessaires
CLOUDFLARE_ACCOUNT_ID="42fc982266a2c31b942593b18097e4b3"  # ID confirmé dans l'URL
CLOUDFLARE_API_TOKEN="E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M"  # Token API provenant du script de déploiement des données
PROJECT_NAME="flodrama-frontend"
DOMAIN="flodrama.com"

# 1. Lister les déploiements pour obtenir les informations
echo "Récupération des déploiements..."
DEPLOYMENTS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse de l'API pour les déploiements:"
echo "$DEPLOYMENTS_RESPONSE" | head -n 30

# 2. Modifier directement l'association de domaine
echo "Suppression de l'association de domaine actuelle..."
DELETE_RESPONSE=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains/$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse pour la suppression du domaine:"
echo "$DELETE_RESPONSE"

# 3. Ajouter le domaine au projet
echo "Ajout du domaine $DOMAIN au projet $PROJECT_NAME..."
DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"'$DOMAIN'"}')

echo "Réponse pour l'ajout du domaine:"
echo "$DOMAIN_RESPONSE"

echo "Opération terminée. Vérifiez les réponses de l'API pour déterminer si elle a réussi."
echo "Attends quelques minutes pour la propagation et essaie d'accéder à $DOMAIN avec Ctrl+F5 pour vérifier."
