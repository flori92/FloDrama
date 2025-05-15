#!/bin/bash

# Script de déploiement du service Media Gateway FloDrama
# Ce script déploie le Worker qui gère les redirections d'images et médias

# Variables d'environnement
CLOUDFLARE_ACCOUNT_ID="42fc982266a2c31b942593b18097e4b3"
CLOUDFLARE_API_TOKEN="E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M"
WORKER_NAME="flodrama-media-gateway"

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déploiement du Media Gateway FloDrama ===${NC}"

# 1. Vérification des prérequis
echo -e "\n${BLUE}[1/5] Vérification des prérequis...${NC}"

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo -e "${BLUE}Installation de wrangler...${NC}"
    npm install -g wrangler
fi

# Création du répertoire temporaire
TEMP_DIR="./temp-deploy"
mkdir -p $TEMP_DIR

# 2. Création du fichier wrangler.toml
echo -e "\n${BLUE}[2/5] Création du fichier de configuration wrangler.toml...${NC}"
cat > $TEMP_DIR/wrangler.toml << EOF
name = "$WORKER_NAME"
main = "media-gateway.js"
compatibility_date = "2025-05-11"

account_id = "$CLOUDFLARE_ACCOUNT_ID"
workers_dev = true
route = { pattern = "api-media.flodrama.com/*", zone_name = "flodrama.com" }

[env.production]
route = { pattern = "api-media.flodrama.com/*", zone_name = "flodrama.com" }

[[kv_namespaces]]
binding = "FLODRAMA_METADATA"
id = "7388919bd83241cfab509b44f819bb2f"

[vars]
ENVIRONMENT = "production"

# Configuration des secrets via le script, ne pas les écrire directement dans ce fichier
EOF

# Copier le fichier media-gateway.js dans le dossier temp
cp ./workers/media-gateway.js $TEMP_DIR/

# 3. Configuration de DNS pour api-media.flodrama.com
echo -e "\n${BLUE}[3/5] Configuration du DNS pour api-media.flodrama.com...${NC}"

# Récupérer l'ID de la zone
echo "Récupération de l'ID de zone pour flodrama.com..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=flodrama.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
  echo -e "${RED}Erreur: Impossible de récupérer l'ID de zone pour flodrama.com${NC}"
  exit 1
fi

echo "ID de zone trouvé: $ZONE_ID"

# Création du CNAME pour api-media.flodrama.com
echo "Configuration du DNS pour api-media.flodrama.com..."
DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "api-media",
    "content": "flodrama-media-gateway.florifavi.workers.dev",
    "ttl": 1,
    "proxied": true
  }')

# Vérifier si l'ajout a réussi ou si l'enregistrement existe déjà
if ! echo "$DNS_RESPONSE" | grep -q '"success":true'; then
  echo "Vérification si l'enregistrement existe déjà..."
  EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=CNAME&name=api-media.flodrama.com" \
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
        "name": "api-media",
        "content": "flodrama-media-gateway.florifavi.workers.dev",
        "ttl": 1,
        "proxied": true
      }')
    
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
      echo -e "${GREEN}CNAME mis à jour avec succès!${NC}"
    else
      echo -e "${RED}Erreur lors de la mise à jour du CNAME:${NC}"
      echo "$UPDATE_RESPONSE"
    fi
  else
    echo -e "${RED}Erreur lors de l'ajout du CNAME:${NC}"
    echo "$DNS_RESPONSE"
  fi
else
  echo -e "${GREEN}CNAME ajouté avec succès!${NC}"
fi

# 4. Déploiement du Worker
echo -e "\n${BLUE}[4/5] Déploiement du Worker Media Gateway...${NC}"
cd $TEMP_DIR

# Login avec token (non-interactif)
echo "Configuration de l'authentification Cloudflare..."
echo "$CLOUDFLARE_API_TOKEN" | wrangler config

# Déploiement en production
echo "Déploiement du worker..."
wrangler deploy --env production

# Retour au répertoire parent
cd ..

# 5. Nettoyage et finalisation
echo -e "\n${BLUE}[5/5] Nettoyage et finalisation...${NC}"
rm -rf $TEMP_DIR

echo -e "\n${GREEN}✅ Déploiement du Media Gateway FloDrama terminé avec succès!${NC}"
echo -e "Le service est maintenant accessible via :"
echo -e " - https://api-media.flodrama.com"
echo -e " - https://$WORKER_NAME.florifavi.workers.dev"
echo -e "\nAttendez quelques minutes pour la propagation DNS complète."
echo -e "Vous pouvez tester le service avec : curl -I https://api-media.flodrama.com/health"
