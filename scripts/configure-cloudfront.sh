#!/bin/bash

# Script de configuration de CloudFront pour FloDrama
# Ce script configure la distribution CloudFront existante pour pointer vers l'application Vercel

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

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Début de la configuration de CloudFront pour FloDrama${NC}"
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

# Étape 2: Modifier la configuration pour pointer vers Vercel
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Modification de la configuration...${NC}"

# Créer une nouvelle origine pour Vercel
cat $CONFIG_FILE | jq '.DistributionConfig' | jq '.Origins.Items += [{
    "Id": "VercelOrigin",
    "DomainName": "'$VERCEL_DOMAIN'",
    "OriginPath": "",
    "CustomHeaders": {
        "Quantity": 0
    },
    "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
        },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
    },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": {
        "Enabled": false
    }
}]' | jq '.Origins.Quantity = (.Origins.Items | length)' > $MODIFIED_CONFIG_FILE

# Modifier le comportement par défaut pour utiliser la nouvelle origine
cat $MODIFIED_CONFIG_FILE | jq '.DefaultCacheBehavior.TargetOriginId = "VercelOrigin"' | jq '.DefaultCacheBehavior.ForwardedValues.Headers.Items += ["Host"]' | jq '.DefaultCacheBehavior.ForwardedValues.Headers.Quantity = (.DefaultCacheBehavior.ForwardedValues.Headers.Items | length)' > /tmp/temp.json && mv /tmp/temp.json $MODIFIED_CONFIG_FILE

# Étape 3: Mettre à jour la distribution
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Mise à jour de la distribution CloudFront...${NC}"
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://$MODIFIED_CONFIG_FILE --if-match $ETAG

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERREUR] Échec de la mise à jour de la distribution CloudFront${NC}"
    exit 1
fi

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Configuration de CloudFront terminée avec succès!${NC}"
echo -e "${YELLOW}La propagation des modifications peut prendre jusqu'à 15 minutes.${NC}"
echo -e "${YELLOW}Une fois la propagation terminée, flodrama.com pointera vers votre application Vercel.${NC}"

# Nettoyage
rm -f $CONFIG_FILE $MODIFIED_CONFIG_FILE

exit 0
