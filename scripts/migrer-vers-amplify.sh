#!/bin/bash

# Script de migration complète vers AWS Amplify
# Ce script configure AWS Amplify pour le déploiement continu de FloDrama

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Migration de FloDrama vers AWS Amplify ===${NC}"

# Vérification des prérequis
echo -e "${YELLOW}Vérification des prérequis...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}Git n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
APP_ID="d3v3iochmt8wu6"
BRANCH_NAME="main"
REPO_URL=$(git config --get remote.origin.url || echo "")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Sauvegarde avant migration
echo -e "${YELLOW}Création d'une sauvegarde...${NC}"
tar -czf "$BACKUP_DIR/${TIMESTAMP}_backup_pre_migration_amplify.tar.gz" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" --exclude="backups" .
echo -e "${GREEN}Sauvegarde créée: $BACKUP_DIR/${TIMESTAMP}_backup_pre_migration_amplify.tar.gz${NC}"

# Vérification du dépôt Git
if [ -z "$REPO_URL" ]; then
    echo -e "${YELLOW}Aucun dépôt Git distant configuré. Veuillez entrer l'URL du dépôt Git:${NC}"
    read -p "URL du dépôt Git (ex: https://github.com/username/FloDrama): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}Aucune URL de dépôt Git fournie. Impossible de continuer.${NC}"
        exit 1
    fi
    
    # Configuration du dépôt Git si nécessaire
    if ! git remote | grep -q "origin"; then
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}Dépôt Git configuré: $REPO_URL${NC}"
    else
        git remote set-url origin "$REPO_URL"
        echo -e "${GREEN}URL du dépôt Git mise à jour: $REPO_URL${NC}"
    fi
fi

# Vérification du statut de l'application Amplify
echo -e "${YELLOW}Vérification du statut de l'application Amplify...${NC}"
APP_EXISTS=$(aws amplify get-app --app-id "$APP_ID" 2>/dev/null || echo "")

if [ -z "$APP_EXISTS" ]; then
    echo -e "${YELLOW}L'application Amplify avec l'ID $APP_ID n'existe pas. Création d'une nouvelle application...${NC}"
    
    # Création de l'application Amplify
    APP_RESULT=$(aws amplify create-app --name "FloDrama" --description "Plateforme de streaming de films, séries, animés et productions asiatiques" --repository "$REPO_URL" --platform WEB)
    APP_ID=$(echo "$APP_RESULT" | grep -o '"appId": "[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}Application Amplify créée avec l'ID: $APP_ID${NC}"
else
    echo -e "${GREEN}Application Amplify existante trouvée avec l'ID: $APP_ID${NC}"
    
    # Mise à jour de l'application si nécessaire
    aws amplify update-app --app-id "$APP_ID" --description "Plateforme de streaming de films, séries, animés et productions asiatiques" --repository "$REPO_URL" --platform WEB
    echo -e "${GREEN}Application Amplify mise à jour${NC}"
fi

# Vérification de la branche
echo -e "${YELLOW}Vérification de la branche $BRANCH_NAME...${NC}"
BRANCH_EXISTS=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" 2>/dev/null || echo "")

if [ -z "$BRANCH_EXISTS" ]; then
    echo -e "${YELLOW}La branche $BRANCH_NAME n'existe pas. Création de la branche...${NC}"
    
    # Création de la branche
    aws amplify create-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --enable-auto-build --framework "React" --stage PRODUCTION
    echo -e "${GREEN}Branche $BRANCH_NAME créée${NC}"
else
    echo -e "${GREEN}Branche $BRANCH_NAME existante trouvée${NC}"
    
    # Mise à jour de la branche si nécessaire
    aws amplify update-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --enable-auto-build --framework "React" --stage PRODUCTION
    echo -e "${GREEN}Branche $BRANCH_NAME mise à jour${NC}"
fi

# Configuration du domaine
echo -e "${YELLOW}Vérification de la configuration du domaine...${NC}"
DOMAIN_EXISTS=$(aws amplify get-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" 2>/dev/null || echo "")

if [ -z "$DOMAIN_EXISTS" ]; then
    echo -e "${YELLOW}Le domaine flodrama.com n'est pas configuré. Configuration du domaine...${NC}"
    
    # Configuration du domaine
    aws amplify create-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" --sub-domain-settings "[{\"prefix\":\"\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"www\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"dev\",\"branchName\":\"$BRANCH_NAME\"}]"
    echo -e "${GREEN}Domaine flodrama.com configuré${NC}"
else
    echo -e "${GREEN}Domaine flodrama.com déjà configuré${NC}"
    
    # Mise à jour de la configuration du domaine si nécessaire
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

# Démarrage du déploiement
echo -e "${YELLOW}Démarrage du déploiement...${NC}"
git add .
git commit -m "🚀 [DEPLOY] Migration vers AWS Amplify" || echo "Aucun changement à commiter"
git push origin "$BRANCH_NAME" || echo "Impossible de pousser vers la branche $BRANCH_NAME"

# Démarrage manuel du déploiement si nécessaire
echo -e "${YELLOW}Démarrage manuel du déploiement...${NC}"
aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE

echo -e "${GREEN}Migration vers AWS Amplify terminée avec succès!${NC}"
echo -e "${YELLOW}Le déploiement peut prendre quelques minutes pour être effectif.${NC}"
echo -e "${BLUE}=== Fin de la migration ===${NC}"

# Création d'un rapport de migration
REPORT_FILE="$LOG_DIR/migration-amplify-${TIMESTAMP}.log"

{
    echo "=== Rapport de migration vers AWS Amplify ==="
    echo "Date: $(date)"
    echo ""
    echo "Application ID: $APP_ID"
    echo "Branche: $BRANCH_NAME"
    echo "Dépôt Git: $REPO_URL"
    echo ""
    echo "Statut de l'application:"
    aws amplify get-app --app-id "$APP_ID" || echo "Non disponible"
    echo ""
    echo "Statut de la branche:"
    aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" || echo "Non disponible"
    echo ""
    echo "Configuration du domaine:"
    aws amplify get-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" || echo "Non disponible"
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
