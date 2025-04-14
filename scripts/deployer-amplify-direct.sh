#!/bin/bash

# Script de déploiement direct sur AWS Amplify sans passer par GitHub
# Ce script déploie directement le build de FloDrama sur AWS Amplify

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déploiement direct sur AWS Amplify pour FloDrama ===${NC}"

# Vérification des prérequis
echo -e "${YELLOW}Vérification des prérequis...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
APP_ID="d3v3iochmt8wu6"
BRANCH_NAME="main"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_DIR="./logs"
BUILD_DIR="./dist"

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Sauvegarde avant déploiement
echo -e "${YELLOW}Création d'une sauvegarde...${NC}"
tar -czf "$BACKUP_DIR/${TIMESTAMP}_backup_pre_deploiement_amplify.tar.gz" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" --exclude="backups" .
echo -e "${GREEN}Sauvegarde créée: $BACKUP_DIR/${TIMESTAMP}_backup_pre_deploiement_amplify.tar.gz${NC}"

# Construction du projet
echo -e "${YELLOW}Construction du projet...${NC}"
npm run build

# Création d'un zip du dossier dist
echo -e "${YELLOW}Création d'un zip du dossier dist...${NC}"
ZIP_FILE="dist-${TIMESTAMP}.zip"
(cd dist && zip -r "../$ZIP_FILE" .)
echo -e "${GREEN}Fichier zip créé: $ZIP_FILE${NC}"

# Mise à jour du fichier amplify.yml
echo -e "${YELLOW}Mise à jour du fichier amplify.yml...${NC}"
cat > amplify.yml << EOL
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm use 20
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
echo -e "${GREEN}Fichier amplify.yml mis à jour${NC}"

# Déploiement manuel via upload de zip
echo -e "${YELLOW}Déploiement manuel via upload de zip...${NC}"
JOB_ID=$(aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --source-url "$ZIP_FILE" --query "jobId" --output text 2>/dev/null || echo "")

if [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}Déploiement démarré avec l'ID: $JOB_ID${NC}"
    
    # Attente du déploiement
    echo -e "${YELLOW}Attente du déploiement...${NC}"
    
    # Vérification périodique du statut du job au lieu d'utiliser wait
    JOB_STATUS="PENDING"
    while [ "$JOB_STATUS" == "PENDING" ] || [ "$JOB_STATUS" == "RUNNING" ]; do
        echo -e "${YELLOW}Vérification du statut du déploiement...${NC}"
        JOB_STATUS=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" --query "job.summary.status" --output text)
        echo -e "${YELLOW}Statut actuel: $JOB_STATUS${NC}"
        
        if [ "$JOB_STATUS" != "PENDING" ] && [ "$JOB_STATUS" != "RUNNING" ]; then
            break
        fi
        
        echo -e "${YELLOW}En attente de la fin du déploiement...${NC}"
        sleep 30
    done
    
    echo -e "${GREEN}Déploiement terminé${NC}"
    
    # Vérification du statut final du déploiement
    if [ "$JOB_STATUS" == "SUCCEED" ]; then
        echo -e "${GREEN}Déploiement réussi!${NC}"
    else
        echo -e "${RED}Déploiement échoué avec le statut: $JOB_STATUS${NC}"
        echo -e "${YELLOW}Vérification des logs...${NC}"
        aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID"
    fi
else
    echo -e "${YELLOW}Impossible de démarrer le déploiement avec start-deployment. Essai avec start-job...${NC}"
    
    # Essai avec start-job
    JOB_ID=$(aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE --query "jobSummary.jobId" --output text 2>/dev/null || echo "")
    
    if [ -n "$JOB_ID" ]; then
        echo -e "${GREEN}Déploiement démarré avec l'ID: $JOB_ID${NC}"
        
        # Attente du déploiement
        echo -e "${YELLOW}Attente du déploiement...${NC}"
        
        # Vérification périodique du statut du job au lieu d'utiliser wait
        JOB_STATUS="PENDING"
        while [ "$JOB_STATUS" == "PENDING" ] || [ "$JOB_STATUS" == "RUNNING" ]; do
            echo -e "${YELLOW}Vérification du statut du déploiement...${NC}"
            JOB_STATUS=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" --query "job.summary.status" --output text)
            echo -e "${YELLOW}Statut actuel: $JOB_STATUS${NC}"
            
            if [ "$JOB_STATUS" != "PENDING" ] && [ "$JOB_STATUS" != "RUNNING" ]; then
                break
            fi
            
            echo -e "${YELLOW}En attente de la fin du déploiement...${NC}"
            sleep 30
        done
        
        echo -e "${GREEN}Déploiement terminé${NC}"
        
        # Vérification du statut final du déploiement
        if [ "$JOB_STATUS" == "SUCCEED" ]; then
            echo -e "${GREEN}Déploiement réussi!${NC}"
        else
            echo -e "${RED}Déploiement échoué avec le statut: $JOB_STATUS${NC}"
            echo -e "${YELLOW}Vérification des logs...${NC}"
            aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID"
        fi
    else
        echo -e "${RED}Impossible de démarrer le déploiement. Veuillez vérifier la configuration.${NC}"
    fi
fi

echo -e "${GREEN}Déploiement direct sur AWS Amplify terminé!${NC}"
echo -e "${BLUE}=== Fin du déploiement ===${NC}"

# Création d'un rapport de déploiement
REPORT_FILE="$LOG_DIR/deploiement-amplify-${TIMESTAMP}.log"

{
    echo "=== Rapport de déploiement AWS Amplify ==="
    echo "Date: $(date)"
    echo ""
    echo "Application ID: $APP_ID"
    echo "Branche: $BRANCH_NAME"
    echo "Job ID: $JOB_ID"
    echo "Statut: $JOB_STATUS"
    echo ""
    echo "Statut de l'application:"
    aws amplify get-app --app-id "$APP_ID" 2>/dev/null || echo "Non disponible"
    echo ""
    echo "Statut de la branche:"
    aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" 2>/dev/null || echo "Non disponible"
    echo ""
    echo "URLs de l'application:"
    echo "- Amplify: https://$BRANCH_NAME.$APP_ID.amplifyapp.com"
    echo "- URL par défaut: https://$APP_ID.amplifyapp.com"
    echo ""
    echo "=== Fin du rapport ==="
} > "$REPORT_FILE"

echo -e "${GREEN}Rapport généré: $REPORT_FILE${NC}"
echo -e "${YELLOW}URLs de l'application:${NC}"
echo -e "- Amplify: ${GREEN}https://$BRANCH_NAME.$APP_ID.amplifyapp.com${NC}"
echo -e "- URL par défaut: ${GREEN}https://$APP_ID.amplifyapp.com${NC}"
