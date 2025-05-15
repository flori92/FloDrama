#!/bin/bash

# Variables d'environnement nécessaires
CLOUDFLARE_ACCOUNT_ID="42fc982266a2c31b942593b18097e4b3"  # ID du compte Cloudflare
CLOUDFLARE_API_TOKEN="H1ITLGJaq4ZwAh57Y5tOSNdlL8pfXiHNQp8Zz40E"  # Token API global
PROJECT_NAME="flodrama-frontend"
DOMAIN="flodrama.com"

# 1. Obtenir l'ID de la zone DNS pour flodrama.com
echo "Récupération de l'ID de zone pour $DOMAIN..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
  echo "Erreur: Impossible de récupérer l'ID de zone pour $DOMAIN"
  exit 1
fi

echo "ID de zone trouvé: $ZONE_ID"

# 2. Supprimer l'association de domaine actuelle (s'il existe)
echo "Suppression de l'association de domaine actuelle..."
curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains/$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

# 3. Ajouter le domaine à la nouvelle version déployée
echo "Ajout du domaine $DOMAIN au projet $PROJECT_NAME..."
DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"'$DOMAIN'"}')

# Vérifier si l'ajout a réussi
if echo "$DOMAIN_RESPONSE" | grep -q '"success":true'; then
  echo "Domaine ajouté avec succès!"
else
  echo "Erreur lors de l'ajout du domaine:"
  echo "$DOMAIN_RESPONSE"
  exit 1
fi

# 4. Purger le cache Cloudflare pour la zone
echo "Purge du cache pour $DOMAIN..."
PURGE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

# Vérifier si la purge a réussi
if echo "$PURGE_RESPONSE" | grep -q '"success":true'; then
  echo "Cache purgé avec succès!"
else
  echo "Erreur lors de la purge du cache:"
  echo "$PURGE_RESPONSE"
  exit 1
fi

echo "Opération terminée. Le domaine $DOMAIN pointe maintenant vers la dernière version déployée."
echo "Attends quelques minutes pour la propagation DNS et essaie d'accéder à $DOMAIN avec Ctrl+F5 pour vérifier."
