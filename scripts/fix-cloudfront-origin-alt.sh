#!/bin/bash

# Script pour corriger la configuration d'origine CloudFront pour FloDrama
# Cette version alternative évite d'utiliser l'en-tête Host non autorisé

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DISTRIBUTION_ID="E5XC74WR62W9Z"
VERCEL_DOMAIN="flodrama-pbw8isvvc-flodrama-projects.vercel.app"
TIMESTAMP=$(date +%s)
CONFIG_FILE="/tmp/cloudfront-config-$TIMESTAMP.json"
MODIFIED_CONFIG_FILE="/tmp/cloudfront-modified-$TIMESTAMP.json"

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Début de la correction de l'origine CloudFront pour FloDrama${NC}"
echo -e "${YELLOW}Distribution ID: $DISTRIBUTION_ID${NC}"
echo -e "${YELLOW}Domaine Vercel: $VERCEL_DOMAIN${NC}"

# Étape 1: Récupérer la configuration actuelle
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Récupération de la configuration actuelle...${NC}"
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > $CONFIG_FILE

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERREUR] Impossible de récupérer la configuration CloudFront${NC}"
    exit 1
fi

# Extraire l'ETag
ETAG=$(cat $CONFIG_FILE | jq -r '.ETag')
echo -e "${YELLOW}ETag: $ETAG${NC}"

# Étape 2: Modifier la configuration pour corriger l'origine
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Modification de la configuration d'origine...${NC}"

# Créer une configuration mise à jour avec les paramètres corrigés
jq '.DistributionConfig.Origins.Items[] |= if .Id == "VercelOrigin" then 
    . + {
        "CustomHeaders": {
            "Quantity": 1,
            "Items": [
                {
                    "HeaderName": "X-Forwarded-Host",
                    "HeaderValue": "'"$VERCEL_DOMAIN"'"
                }
            ]
        },
        "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "https-only",
            "OriginSslProtocols": {
                "Quantity": 1,
                "Items": ["TLSv1.2"]
            },
            "OriginReadTimeout": 60,
            "OriginKeepaliveTimeout": 30
        }
    } 
else . end' $CONFIG_FILE > $MODIFIED_CONFIG_FILE

# Mettre à jour le comportement par défaut pour améliorer la mise en cache
jq '.DistributionConfig.DefaultCacheBehavior.ForwardedValues.QueryString = true | .DistributionConfig.DefaultCacheBehavior.AllowedMethods.Items = ["HEAD", "GET", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"] | .DistributionConfig.DefaultCacheBehavior.AllowedMethods.Quantity = 7' $MODIFIED_CONFIG_FILE > /tmp/temp.json && mv /tmp/temp.json $MODIFIED_CONFIG_FILE

# Étape 3: Mettre à jour la distribution
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Mise à jour de la distribution CloudFront...${NC}"
aws cloudfront update-distribution --id $DISTRIBUTION_ID --if-match $ETAG --distribution-config "$(jq '.DistributionConfig' $MODIFIED_CONFIG_FILE)"

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERREUR] Échec de la mise à jour de la distribution CloudFront${NC}"
    exit 1
fi

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Configuration de l'origine CloudFront corrigée avec succès!${NC}"
echo -e "${YELLOW}La propagation des modifications peut prendre jusqu'à 15 minutes.${NC}"
echo -e "${YELLOW}Une fois la propagation terminée, l'erreur 502 devrait être résolue.${NC}"

# Nettoyage
rm -f $CONFIG_FILE $MODIFIED_CONFIG_FILE

exit 0
