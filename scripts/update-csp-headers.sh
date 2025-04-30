#!/bin/bash

# Script pour mettre à jour les en-têtes de sécurité dans CloudFront
# Ce script configure les en-têtes CSP pour permettre le chargement des ressources

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Mise à jour des en-têtes de sécurité CloudFront...${NC}"

# Récupérer l'ID de la distribution CloudFront
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, 'flodrama.com')].Id" --output text)

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "${RED}Impossible de trouver l'ID de distribution CloudFront.${NC}"
  exit 1
fi

echo -e "${YELLOW}ID de distribution CloudFront trouvé: $CLOUDFRONT_DISTRIBUTION_ID${NC}"

# Récupérer la configuration actuelle
echo -e "${YELLOW}Récupération de la configuration actuelle...${NC}"
aws cloudfront get-distribution-config --id $CLOUDFRONT_DISTRIBUTION_ID > cloudfront-config.json

# Extraire l'ETag
ETAG=$(jq -r '.ETag' cloudfront-config.json)
echo -e "${YELLOW}ETag: $ETAG${NC}"

# Mettre à jour la configuration pour ajouter les en-têtes de sécurité
echo -e "${YELLOW}Mise à jour de la configuration...${NC}"
jq '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = "managed-cors-with-preflight-and-security-headers"' cloudfront-config.json > cloudfront-config-updated.json

# Supprimer l'ETag de la configuration mise à jour
jq 'del(.ETag)' cloudfront-config-updated.json > cloudfront-config-final.json
jq '.DistributionConfig' cloudfront-config-final.json > cloudfront-config-distribution.json

# Mettre à jour la distribution
echo -e "${YELLOW}Application des changements à la distribution CloudFront...${NC}"
aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://cloudfront-config-distribution.json --if-match $ETAG

# Invalider le cache
echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

# Nettoyage
rm cloudfront-config.json cloudfront-config-updated.json cloudfront-config-final.json cloudfront-config-distribution.json

echo -e "${GREEN}Mise à jour des en-têtes de sécurité terminée.${NC}"
echo -e "${YELLOW}Note: Il peut falloir jusqu'à 15 minutes pour que les changements se propagent.${NC}"
