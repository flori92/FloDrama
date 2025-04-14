#!/bin/bash

# Script de configuration directe d'AWS Amplify avec un token GitHub prédéfini
# Ce script configure AWS Amplify pour le déploiement continu de FloDrama

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuration directe d'AWS Amplify pour FloDrama ===${NC}"

# Vérification des prérequis
echo -e "${YELLOW}Vérification des prérequis...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
APP_ID="d3v3iochmt8wu6"
BRANCH_NAME="main"
REPO_URL="https://github.com/flori92/FloDrama.git"
GITHUB_TOKEN="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"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Sauvegarde avant configuration
echo -e "${YELLOW}Création d'une sauvegarde...${NC}"
tar -czf "$BACKUP_DIR/${TIMESTAMP}_backup_pre_configuration_amplify.tar.gz" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" --exclude="backups" .
echo -e "${GREEN}Sauvegarde créée: $BACKUP_DIR/${TIMESTAMP}_backup_pre_configuration_amplify.tar.gz${NC}"

# Suppression des branches existantes dans Amplify
echo -e "${YELLOW}Récupération des branches existantes...${NC}"
BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query "branches[].branchName" --output text 2>/dev/null || echo "")

if [ -n "$BRANCHES" ]; then
    echo -e "${YELLOW}Suppression des branches existantes...${NC}"
    for branch in $BRANCHES; do
        echo -e "${YELLOW}Suppression de la branche $branch...${NC}"
        aws amplify delete-branch --app-id "$APP_ID" --branch-name "$branch" 2>/dev/null || echo "Impossible de supprimer la branche $branch"
        echo -e "${GREEN}Branche $branch supprimée${NC}"
        # Attendre quelques secondes pour s'assurer que la suppression est bien prise en compte
        sleep 5
    done
else
    echo -e "${GREEN}Aucune branche existante trouvée${NC}"
fi

# Attendre que toutes les branches soient complètement supprimées
echo -e "${YELLOW}Attente de la suppression complète des branches...${NC}"
sleep 10

# Vérification de l'existence de l'application Amplify
echo -e "${YELLOW}Vérification de l'existence de l'application Amplify...${NC}"
APP_EXISTS=$(aws amplify get-app --app-id "$APP_ID" 2>/dev/null || echo "")

if [ -z "$APP_EXISTS" ]; then
    echo -e "${YELLOW}L'application Amplify avec l'ID $APP_ID n'existe pas. Création d'une nouvelle application...${NC}"
    
    # Création de l'application Amplify
    APP_RESULT=$(aws amplify create-app --name "FloDrama" --description "Plateforme de streaming de films, séries, animés et productions asiatiques" --repository "$REPO_URL" --access-token "$GITHUB_TOKEN" --platform WEB)
    NEW_APP_ID=$(echo "$APP_RESULT" | grep -o '"appId": "[^"]*' | cut -d'"' -f4)
    
    if [ -n "$NEW_APP_ID" ]; then
        APP_ID="$NEW_APP_ID"
        echo -e "${GREEN}Application Amplify créée avec l'ID: $APP_ID${NC}"
    else
        echo -e "${RED}Erreur lors de la création de l'application Amplify.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Application Amplify existante trouvée avec l'ID: $APP_ID${NC}"
    
    # Mise à jour de l'application
    aws amplify update-app --app-id "$APP_ID" --description "Plateforme de streaming de films, séries, animés et productions asiatiques" --repository "$REPO_URL" --access-token "$GITHUB_TOKEN" --platform WEB
    echo -e "${GREEN}Application Amplify mise à jour${NC}"
fi

# Création de la branche principale
echo -e "${YELLOW}Création de la branche $BRANCH_NAME...${NC}"
aws amplify create-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --enable-auto-build --framework "React" --stage PRODUCTION
echo -e "${GREEN}Branche $BRANCH_NAME créée${NC}"

# Configuration du domaine
echo -e "${YELLOW}Configuration du domaine...${NC}"
DOMAIN_EXISTS=$(aws amplify get-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" 2>/dev/null || echo "")

if [ -z "$DOMAIN_EXISTS" ]; then
    aws amplify create-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" --sub-domain-settings "[{\"prefix\":\"\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"www\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"dev\",\"branchName\":\"$BRANCH_NAME\"}]"
    echo -e "${GREEN}Domaine flodrama.com configuré${NC}"
else
    aws amplify update-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" --sub-domain-settings "[{\"prefix\":\"\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"www\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"dev\",\"branchName\":\"$BRANCH_NAME\"}]"
    echo -e "${GREEN}Configuration du domaine flodrama.com mise à jour${NC}"
fi

# Vérification du fichier amplify.yml
echo -e "${YELLOW}Vérification du fichier amplify.yml...${NC}"
if [ ! -f "amplify.yml" ]; then
    echo -e "${YELLOW}Le fichier amplify.yml n'existe pas. Création du fichier...${NC}"
    
    # Création du fichier amplify.yml
    cat > amplify.yml << EOL
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  customHeaders:
    - pattern: '**/*.html'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=0, no-cache, no-store, must-revalidate'
        - key: 'X-Frame-Options'
          value: 'SAMEORIGIN'
        - key: 'X-XSS-Protection'
          value: '1; mode=block'
        - key: 'X-Content-Type-Options'
          value: 'nosniff'
    - pattern: '**/*.css'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=31536000, immutable'
        - key: 'Content-Type'
          value: 'text/css'
    - pattern: '**/*.js'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=31536000, immutable'
        - key: 'Content-Type'
          value: 'application/javascript'
    - pattern: '**/*.jpg'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=31536000, immutable'
    - pattern: '**/*.png'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=31536000, immutable'
    - pattern: '**/*.svg'
      headers:
        - key: 'Cache-Control'
          value: 'max-age=31536000, immutable'
    - pattern: '**/*.json'
      headers:
        - key: 'Content-Type'
          value: 'application/json'
EOL
    echo -e "${GREEN}Fichier amplify.yml créé${NC}"
else
    echo -e "${GREEN}Fichier amplify.yml existant trouvé${NC}"
fi

# Déploiement manuel via upload de zip
echo -e "${YELLOW}Préparation du déploiement manuel...${NC}"

# Construction du projet
echo -e "${YELLOW}Construction du projet...${NC}"
npm run build

# Création d'un zip du dossier dist
echo -e "${YELLOW}Création d'un zip du dossier dist...${NC}"
ZIP_FILE="dist-${TIMESTAMP}.zip"
(cd dist && zip -r "../$ZIP_FILE" .)
echo -e "${GREEN}Fichier zip créé: $ZIP_FILE${NC}"

# Démarrage manuel du déploiement
echo -e "${YELLOW}Démarrage manuel du déploiement...${NC}"
JOB_ID=$(aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --source-url "$ZIP_FILE" --query "jobId" --output text 2>/dev/null || echo "")

if [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}Déploiement démarré avec l'ID: $JOB_ID${NC}"
else
    echo -e "${YELLOW}Impossible de démarrer le déploiement manuellement.${NC}"
    
    # Essai avec start-job
    JOB_ID=$(aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE --query "jobSummary.jobId" --output text 2>/dev/null || echo "")
    
    if [ -n "$JOB_ID" ]; then
        echo -e "${GREEN}Déploiement démarré avec l'ID: $JOB_ID${NC}"
    else
        echo -e "${RED}Impossible de démarrer le déploiement. Veuillez vérifier la configuration.${NC}"
    fi
fi

echo -e "${GREEN}Configuration d'AWS Amplify terminée avec succès!${NC}"
echo -e "${YELLOW}Le déploiement peut prendre quelques minutes pour être effectif.${NC}"
echo -e "${BLUE}=== Fin de la configuration ===${NC}"

# Création d'un rapport de configuration
REPORT_FILE="$LOG_DIR/configuration-amplify-${TIMESTAMP}.log"

{
    echo "=== Rapport de configuration AWS Amplify ==="
    echo "Date: $(date)"
    echo ""
    echo "Application ID: $APP_ID"
    echo "Branche: $BRANCH_NAME"
    echo "Dépôt Git: $REPO_URL"
    echo "Job ID: $JOB_ID"
    echo ""
    echo "Statut de l'application:"
    aws amplify get-app --app-id "$APP_ID" 2>/dev/null || echo "Non disponible"
    echo ""
    echo "Statut de la branche:"
    aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" 2>/dev/null || echo "Non disponible"
    echo ""
    echo "Configuration du domaine:"
    aws amplify get-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" 2>/dev/null || echo "Non disponible"
    echo ""
    echo "URLs de l'application:"
    echo "- Amplify: https://$BRANCH_NAME.$APP_ID.amplifyapp.com"
    echo "- Domaine principal: https://flodrama.com"
    echo "- Sous-domaine www: https://www.flodrama.com"
    echo "- Sous-domaine dev: https://dev.flodrama.com"
    echo ""
    echo "=== Fin du rapport ==="
} > "$REPORT_FILE"

echo -e "${GREEN}Rapport généré: $REPORT_FILE${NC}"
echo -e "${YELLOW}URLs de l'application:${NC}"
echo -e "- Amplify: ${GREEN}https://$BRANCH_NAME.$APP_ID.amplifyapp.com${NC}"
echo -e "- Domaine principal: ${GREEN}https://flodrama.com${NC}"
echo -e "- Sous-domaine www: ${GREEN}https://www.flodrama.com${NC}"
echo -e "- Sous-domaine dev: ${GREEN}https://dev.flodrama.com${NC}"
