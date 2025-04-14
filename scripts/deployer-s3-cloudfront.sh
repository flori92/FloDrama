#!/bin/bash

# Script de déploiement S3/CloudFront pour FloDrama
# Ce script déploie les changements directement sur S3 et invalide le cache CloudFront

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déploiement S3/CloudFront de FloDrama ===${NC}"

# Vérification des prérequis
echo -e "${YELLOW}Vérification des prérequis...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
S3_BUCKET="flodrama-prod"
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'flodrama.com')]].Id" --output text)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BUILD_DIR="./dist"

# Création du répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarde avant déploiement
echo -e "${YELLOW}Création d'une sauvegarde...${NC}"
tar -czf "$BACKUP_DIR/${TIMESTAMP}_backup_pre_deploiement.tar.gz" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" --exclude="backups" .
echo -e "${GREEN}Sauvegarde créée: $BACKUP_DIR/${TIMESTAMP}_backup_pre_deploiement.tar.gz${NC}"

# Construction du projet
echo -e "${YELLOW}Construction du projet...${NC}"
npm run build
echo -e "${GREEN}Construction terminée${NC}"

# Déploiement sur S3
echo -e "${YELLOW}Déploiement sur S3...${NC}"
# Utilisation de la configuration de propriété d'objet au lieu des ACLs
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete --no-progress --only-show-errors
echo -e "${GREEN}Déploiement sur S3 terminé${NC}"

# Invalidation du cache CloudFront
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" --query "Invalidation.Id" --output text)
    echo -e "${GREEN}Invalidation du cache CloudFront initiée (ID: $INVALIDATION_ID)${NC}"
    
    # Vérification du statut de l'invalidation
    echo -e "${YELLOW}Vérification du statut de l'invalidation...${NC}"
    aws cloudfront get-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$INVALIDATION_ID"
else
    echo -e "${YELLOW}Aucune distribution CloudFront trouvée pour flodrama.com${NC}"
fi

echo -e "${GREEN}Déploiement terminé avec succès!${NC}"
echo -e "${YELLOW}Le déploiement peut prendre quelques minutes pour être entièrement propagé.${NC}"
echo -e "${BLUE}=== Fin du déploiement ===${NC}"

# Création d'un rapport de déploiement
REPORT_FILE="./logs/deploiement-${TIMESTAMP}.log"
mkdir -p ./logs

{
    echo "=== Rapport de déploiement FloDrama ==="
    echo "Date: $(date)"
    echo ""
    echo "Bucket S3: $S3_BUCKET"
    echo "Distribution CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
    echo "Invalidation ID: $INVALIDATION_ID"
    echo ""
    echo "Fichiers déployés:"
    find ./dist -type f | sort
    echo ""
    echo "Statut de l'invalidation CloudFront:"
    aws cloudfront get-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$INVALIDATION_ID" || echo "Non disponible"
    echo ""
    echo "URLs de l'application:"
    echo "- S3: http://$S3_BUCKET.s3-website-us-east-1.amazonaws.com"
    echo "- CloudFront: https://d2r16mhe8i26v2.cloudfront.net"
    echo "- Domaine principal: https://flodrama.com"
    echo "- Sous-domaine: https://www.flodrama.com"
    echo ""
    echo "=== Fin du rapport ==="
} > "$REPORT_FILE"

echo -e "${GREEN}Rapport généré: $REPORT_FILE${NC}"
echo -e "${YELLOW}URLs de l'application:${NC}"
echo -e "- S3: ${GREEN}http://$S3_BUCKET.s3-website-us-east-1.amazonaws.com${NC}"
echo -e "- CloudFront: ${GREEN}https://d2r16mhe8i26v2.cloudfront.net${NC}"
echo -e "- Domaine principal: ${GREEN}https://flodrama.com${NC}"
echo -e "- Sous-domaine: ${GREEN}https://www.flodrama.com${NC}"
