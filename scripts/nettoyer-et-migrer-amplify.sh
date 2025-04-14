#!/bin/bash

# Script de nettoyage et migration vers AWS Amplify
# Ce script supprime les branches existantes et configure AWS Amplify pour le déploiement continu de FloDrama

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Nettoyage et migration de FloDrama vers AWS Amplify ===${NC}"

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
REPO_URL="https://github.com/flori92/FloDrama.git"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_DIR="./logs"
NODE_VERSION="20.10.0" # Version de Node.js à utiliser

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Sauvegarde avant migration
echo -e "${YELLOW}Création d'une sauvegarde...${NC}"
tar -czf "$BACKUP_DIR/${TIMESTAMP}_backup_pre_migration_amplify.tar.gz" --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="build" --exclude="backups" .
echo -e "${GREEN}Sauvegarde créée: $BACKUP_DIR/${TIMESTAMP}_backup_pre_migration_amplify.tar.gz${NC}"

# Configuration du dépôt Git si nécessaire
if ! git remote | grep -q "origin"; then
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}Dépôt Git configuré: $REPO_URL${NC}"
else
    git remote set-url origin "$REPO_URL"
    echo -e "${GREEN}URL du dépôt Git mise à jour: $REPO_URL${NC}"
fi

# Création du fichier .nvmrc s'il n'existe pas
if [ ! -f ".nvmrc" ]; then
    echo -e "${YELLOW}Création du fichier .nvmrc avec la version Node.js $NODE_VERSION${NC}"
    echo "$NODE_VERSION" > .nvmrc
    echo -e "${GREEN}Fichier .nvmrc créé${NC}"
else
    echo -e "${GREEN}Fichier .nvmrc existant trouvé${NC}"
fi

# Création du fichier _redirects dans le dossier public s'il n'existe pas
if [ ! -f "public/_redirects" ]; then
    echo -e "${YELLOW}Création du fichier _redirects pour SPA routing${NC}"
    mkdir -p "public"
    echo "/* /index.html 200" > "public/_redirects"
    echo -e "${GREEN}Fichier _redirects créé${NC}"
else
    echo -e "${GREEN}Fichier _redirects existant trouvé${NC}"
fi

# Suppression des branches existantes dans Amplify
echo -e "${YELLOW}Récupération des branches existantes...${NC}"
BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query "branches[].branchName" --output text || echo "")

if [ -n "$BRANCHES" ]; then
    echo -e "${YELLOW}Suppression des branches existantes...${NC}"
    for branch in $BRANCHES; do
        echo -e "${YELLOW}Suppression de la branche $branch...${NC}"
        aws amplify delete-branch --app-id "$APP_ID" --branch-name "$branch"
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

# Mise à jour de l'application Amplify avec le dépôt Git
echo -e "${YELLOW}Mise à jour de l'application Amplify...${NC}"
aws amplify update-app --app-id "$APP_ID" --description "Plateforme de streaming de films, séries, animés et productions asiatiques" --repository "$REPO_URL" --platform WEB --enable-branch-auto-build
echo -e "${GREEN}Application Amplify mise à jour${NC}"

# Création de la branche principale
echo -e "${YELLOW}Création de la branche $BRANCH_NAME...${NC}"
aws amplify create-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --enable-auto-build --framework "React" --stage PRODUCTION
echo -e "${GREEN}Branche $BRANCH_NAME créée${NC}"

# Configuration du domaine
echo -e "${YELLOW}Configuration du domaine...${NC}"
aws amplify create-domain-association --app-id "$APP_ID" --domain-name "flodrama.com" --sub-domain-settings "[{\"prefix\":\"\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"www\",\"branchName\":\"$BRANCH_NAME\"},{\"prefix\":\"dev\",\"branchName\":\"$BRANCH_NAME\"}]"
echo -e "${GREEN}Domaine flodrama.com configuré${NC}"

# Vérification du fichier amplify.yml
echo -e "${YELLOW}Vérification du fichier amplify.yml...${NC}"
if [ ! -f "amplify.yml" ]; then
    echo -e "${YELLOW}Le fichier amplify.yml n'existe pas. Création du fichier...${NC}"
    
    # Création du fichier amplify.yml avec nvm et headers améliorés
    cat > amplify.yml << EOL
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install
        - nvm use
        - node -v
        - npm -v
        - npm ci
        - echo "Installation des dépendances terminée"
    build:
      commands:
        - npm run build
        - echo "Build terminé"
    postBuild:
      commands:
        - echo "Phase post-build - Vérification des fichiers générés"
        - ls -la dist/
        - echo "Vérification des fichiers CSS et JS"
        - ls -la dist/assets/
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
    - pattern: '**/*'
      headers:
        - key: 'Access-Control-Allow-Origin'
          value: '*'
        - key: 'Access-Control-Allow-Headers'
          value: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
        - key: 'Access-Control-Allow-Methods'
          value: 'GET, POST, OPTIONS, PUT, DELETE'
        - key: 'Referrer-Policy'
          value: 'strict-origin-when-cross-origin'
EOL
    echo -e "${GREEN}Fichier amplify.yml créé${NC}"
else
    echo -e "${GREEN}Fichier amplify.yml existant trouvé${NC}"
fi

# Création du fichier de configuration Amplify JSON
if [ ! -f "amplify.json" ]; then
    echo -e "${YELLOW}Création du fichier amplify.json pour les redirections et règles spéciales${NC}"
    cat > amplify.json << EOL
{
  "redirects": [
    {
      "source": "</^[^.]+$|\\.(?!(css|js|png|jpg|svg|json|ico|html|xml)$)([^.]+$)/>",
      "target": "/index.html",
      "status": "200",
      "condition": null
    }
  ],
  "rewrites": [
    {
      "source": "/assets/<*>",
      "target": "/assets/<*>",
      "status": "200"
    }
  ],
  "headers": [
    {
      "source": "**/*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS, PUT, DELETE"
        }
      ]
    },
    {
      "source": "**/*.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        },
        {
          "key": "Content-Type",
          "value": "application/javascript"
        }
      ]
    },
    {
      "source": "**/*.css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        },
        {
          "key": "Content-Type",
          "value": "text/css"
        }
      ]
    }
  ]
}
EOL
    echo -e "${GREEN}Fichier amplify.json créé${NC}"
else
    echo -e "${GREEN}Fichier amplify.json existant trouvé${NC}"
fi

# Préparation du déploiement
echo -e "${YELLOW}Préparation du déploiement...${NC}"
git add .
git commit -m "🚀 [DEPLOY] Migration vers AWS Amplify avec configuration améliorée" || echo "Aucun changement à commiter"
git push origin "$BRANCH_NAME" || echo "Impossible de pousser vers la branche $BRANCH_NAME"

# Démarrage manuel du déploiement
echo -e "${YELLOW}Démarrage manuel du déploiement...${NC}"
JOB_ID=$(aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE --query "jobSummary.jobId" --output text || echo "")

if [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}Déploiement démarré avec l'ID: $JOB_ID${NC}"
    
    # Vérification périodique du statut du job
    echo -e "${YELLOW}Vérification du statut du déploiement...${NC}"
    STATUS="PENDING"
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ "$STATUS" != "SUCCEED" ] && [ "$STATUS" != "FAILED" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT+1))
        echo -e "${YELLOW}Tentative $ATTEMPT/$MAX_ATTEMPTS - Attente de 30 secondes...${NC}"
        sleep 30
        
        STATUS=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" --query "job.summary.status" --output text || echo "UNKNOWN")
        echo -e "${YELLOW}Statut actuel: $STATUS${NC}"
        
        if [ "$STATUS" == "SUCCEED" ]; then
            echo -e "${GREEN}Le déploiement a réussi!${NC}"
        elif [ "$STATUS" == "FAILED" ]; then
            echo -e "${RED}Le déploiement a échoué. Vérifiez les logs dans la console AWS Amplify.${NC}"
        fi
    done
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ] && [ "$STATUS" != "SUCCEED" ] && [ "$STATUS" != "FAILED" ]; then
        echo -e "${YELLOW}Nombre maximal de tentatives atteint. Veuillez vérifier manuellement le statut du déploiement.${NC}"
    fi
else
    echo -e "${YELLOW}Impossible de démarrer le déploiement manuellement. Le déploiement automatique sera déclenché par Git.${NC}"
fi

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
    echo "Job ID: $JOB_ID"
    echo "Version Node.js: $NODE_VERSION"
    echo ""
    echo "Fichiers de configuration créés/vérifiés:"
    echo "- amplify.yml"
    echo "- amplify.json"
    echo "- .nvmrc"
    echo "- public/_redirects"
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
