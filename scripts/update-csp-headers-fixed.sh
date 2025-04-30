#!/bin/bash

# Script pour créer et appliquer une politique d'en-têtes de sécurité personnalisée
# Ce script résout les problèmes de CSP pour permettre le chargement des ressources

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Création et application d'une politique d'en-têtes de sécurité personnalisée...${NC}"

# Récupérer l'ID de la distribution CloudFront
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, 'flodrama.com')].Id" --output text)

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "${RED}Impossible de trouver l'ID de distribution CloudFront.${NC}"
  exit 1
fi

echo -e "${YELLOW}ID de distribution CloudFront trouvé: $CLOUDFRONT_DISTRIBUTION_ID${NC}"

# Créer la politique d'en-têtes de réponse personnalisée
echo -e "${YELLOW}Création de la politique d'en-têtes personnalisée...${NC}"
POLICY_ID=$(aws cloudfront create-response-headers-policy --cli-input-json file://scripts/create-csp-policy.json --query 'ResponseHeadersPolicy.Id' --output text)

if [ -z "$POLICY_ID" ]; then
  echo -e "${RED}Erreur lors de la création de la politique d'en-têtes.${NC}"
  exit 1
fi

echo -e "${YELLOW}Politique d'en-têtes créée avec succès. ID: $POLICY_ID${NC}"

# Récupérer la configuration actuelle
echo -e "${YELLOW}Récupération de la configuration actuelle...${NC}"
aws cloudfront get-distribution-config --id $CLOUDFRONT_DISTRIBUTION_ID > cloudfront-config.json

# Extraire l'ETag
ETAG=$(jq -r '.ETag' cloudfront-config.json)
echo -e "${YELLOW}ETag: $ETAG${NC}"

# Mettre à jour la configuration pour ajouter l'ID de la politique d'en-têtes
echo -e "${YELLOW}Mise à jour de la configuration...${NC}"
jq --arg policy_id "$POLICY_ID" '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id' cloudfront-config.json > cloudfront-config-updated.json

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
echo -e "${YELLOW}Vous pouvez vérifier le statut en visitant https://flodrama.com${NC}"
