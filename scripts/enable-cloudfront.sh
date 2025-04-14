#!/bin/bash

# Script pour activer la distribution CloudFront de FloDrama
# Ce script active la distribution et s'assure que le certificat SSL est correctement configuré

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DISTRIBUTION_ID="E5XC74WR62W9Z"
TIMESTAMP=$(date +%s)
CONFIG_FILE="/tmp/cloudfront-config-$TIMESTAMP.json"
MODIFIED_CONFIG_FILE="/tmp/cloudfront-modified-$TIMESTAMP.json"

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Début de l'activation de la distribution CloudFront pour FloDrama${NC}"
echo -e "${YELLOW}Distribution ID: $DISTRIBUTION_ID${NC}"

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

# Étape 2: Modifier la configuration pour activer la distribution
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Activation de la distribution...${NC}"
cat $CONFIG_FILE | jq '.DistributionConfig.Enabled = true' > $MODIFIED_CONFIG_FILE

# Étape 3: Mettre à jour la distribution
echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Mise à jour de la distribution CloudFront...${NC}"
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://$MODIFIED_CONFIG_FILE --if-match $ETAG

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERREUR] Échec de l'activation de la distribution CloudFront${NC}"
    exit 1
fi

echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] Distribution CloudFront activée avec succès!${NC}"
echo -e "${YELLOW}La propagation des modifications peut prendre jusqu'à 15 minutes.${NC}"
echo -e "${YELLOW}Une fois la propagation terminée, flodrama.com sera accessible en HTTPS.${NC}"

# Nettoyage
rm -f $CONFIG_FILE $MODIFIED_CONFIG_FILE

exit 0
