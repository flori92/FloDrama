#!/bin/bash

# Variables d'environnement
CLOUDFLARE_ACCOUNT_ID="42fc982266a2c31b942593b18097e4b3"
CLOUDFLARE_API_TOKEN="E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M"
DOMAIN="flodrama.com"
SUBDOMAIN="images"
FULL_DOMAIN="images.flodrama.com"

# 1. Récupérer l'ID de la zone
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

# 2. Création du CNAME pour images.flodrama.com
echo "Configuration du CNAME $FULL_DOMAIN vers le service Cloudflare R2..."
DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'$SUBDOMAIN'",
    "content": "customer-ehlynuge6dnzfnfd.cloudflarestream.com",
    "ttl": 1,
    "proxied": true
  }')

# Vérifier si l'ajout a réussi
if echo "$DNS_RESPONSE" | grep -q '"success":true'; then
  echo "CNAME ajouté avec succès!"
else
  echo "Erreur lors de l'ajout du CNAME:"
  echo "$DNS_RESPONSE"
  
  # Vérifier si l'enregistrement existe déjà
  echo "Vérification si l'enregistrement existe déjà..."
  EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=CNAME&name=$FULL_DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")
  
  RECORD_ID=$(echo $EXISTING_RECORD | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ ! -z "$RECORD_ID" ]; then
    echo "Enregistrement existant trouvé avec ID: $RECORD_ID. Mise à jour..."
    
    UPDATE_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{
        "type": "CNAME",
        "name": "'$SUBDOMAIN'",
        "content": "customer-ehlynuge6dnzfnfd.cloudflarestream.com",
        "ttl": 1,
        "proxied": true
      }')
    
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
      echo "CNAME mis à jour avec succès!"
    else
      echo "Erreur lors de la mise à jour du CNAME:"
      echo "$UPDATE_RESPONSE"
    fi
  fi
fi

echo "Configuration des DNS terminée."
echo "Attends quelques minutes pour la propagation DNS."
echo "Le service images.flodrama.com sera ensuite disponible pour servir les images optimisées."
