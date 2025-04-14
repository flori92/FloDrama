#!/bin/bash

# Script de déploiement manuel pour FloDrama
# Ce script déploie les changements sur AWS Amplify

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déploiement manuel des changements FloDrama ===${NC}"

# Vérification des prérequis
echo -e "${YELLOW}Vérification des prérequis...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
APP_ID="d3v3iochmt8wu6"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BUILD_DIR="./dist"
ZIP_FILE="./dist-$TIMESTAMP.zip"

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

# Création du fichier ZIP pour le déploiement
echo -e "${YELLOW}Création du fichier ZIP pour le déploiement...${NC}"
cd "$BUILD_DIR" && zip -r "../$ZIP_FILE" . && cd ..
echo -e "${GREEN}Fichier ZIP créé: $ZIP_FILE${NC}"

# Déploiement sur Amplify
echo -e "${YELLOW}Création du déploiement sur AWS Amplify...${NC}"
DEPLOYMENT_ID=$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --output json | jq -r '.jobId')

if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    echo -e "${GREEN}Déploiement créé avec l'ID: $DEPLOYMENT_ID${NC}"
    
    # Démarrage du déploiement
    echo -e "${YELLOW}Démarrage du déploiement...${NC}"
    aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$DEPLOYMENT_ID" --source-url "file://$ZIP_FILE"
    echo -e "${GREEN}Déploiement démarré${NC}"
    
    # Vérification du statut du déploiement
    echo -e "${YELLOW}Vérification du statut du déploiement...${NC}"
    aws amplify get-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$DEPLOYMENT_ID"
else
    echo -e "${RED}Erreur lors de la création du déploiement${NC}"
    exit 1
fi

# Nettoyage
echo -e "${YELLOW}Nettoyage des fichiers temporaires...${NC}"
rm -f "$ZIP_FILE"
echo -e "${GREEN}Nettoyage terminé${NC}"

# Invalidation du cache CloudFront
echo -e "${YELLOW}Invalidation du cache CloudFront...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'flodrama.com')]].Id" --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    echo -e "${GREEN}Invalidation du cache CloudFront initiée pour la distribution $DISTRIBUTION_ID${NC}"
else
    echo -e "${YELLOW}Aucune distribution CloudFront trouvée pour flodrama.com${NC}"
fi

echo -e "${GREEN}Déploiement initié avec succès!${NC}"
echo -e "${YELLOW}Le déploiement peut prendre quelques minutes pour être effectif.${NC}"
echo -e "${BLUE}=== Fin du déploiement ===${NC}"

# Création d'un rapport de déploiement
REPORT_FILE="./logs/deploiement-${TIMESTAMP}.log"
mkdir -p ./logs

{
    echo "=== Rapport de déploiement FloDrama ==="
    echo "Date: $(date)"
    echo ""
    echo "Application ID: $APP_ID"
    echo "Branche: $BRANCH"
    echo "Déploiement ID: $DEPLOYMENT_ID"
    echo ""
    echo "Fichiers modifiés:"
    find ./dist -type f | sort
    echo ""
    echo "Statut du déploiement:"
    aws amplify get-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$DEPLOYMENT_ID" || echo "Non disponible"
    echo ""
    echo "=== Fin du rapport ==="
} > "$REPORT_FILE"

echo -e "${GREEN}Rapport généré: $REPORT_FILE${NC}"
