#!/bin/bash

# Script de déploiement FloDrama vers AWS Amplify
# Ce script configure et déploie l'application vers AWS Amplify
# pour résoudre les problèmes de CORS, MIME et d'accès aux ressources

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déploiement de FloDrama vers AWS Amplify ===${NC}"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer d'abord.${NC}"
    echo "Suivez les instructions sur: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Vérifier si l'utilisateur est connecté à AWS
echo -e "${YELLOW}Vérification de la connexion AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Vous n'êtes pas connecté à AWS. Veuillez configurer vos identifiants AWS.${NC}"
    echo "Exécutez: aws configure"
    exit 1
fi

# Vérifier si Amplify CLI est installé
if ! command -v amplify &> /dev/null; then
    echo -e "${YELLOW}AWS Amplify CLI n'est pas installé. Installation en cours...${NC}"
    npm install -g @aws-amplify/cli
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Échec de l'installation d'Amplify CLI. Veuillez l'installer manuellement.${NC}"
        echo "Exécutez: npm install -g @aws-amplify/cli"
        exit 1
    fi
fi

# Aller à la racine du projet
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# Vérifier si le projet est déjà initialisé avec Amplify
if [ ! -d "amplify" ]; then
    echo -e "${YELLOW}Initialisation du projet avec Amplify...${NC}"
    
    # Créer une configuration temporaire pour l'initialisation automatique
    cat > amplify-init.json << EOL
{
    "projectName": "FloDrama",
    "appId": "flodrama",
    "envName": "prod",
    "defaultEditor": "vscode"
}
EOL
    
    # Initialiser Amplify avec la configuration automatique
    amplify init --app amplify-init.json
    
    # Supprimer le fichier temporaire
    rm amplify-init.json
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Échec de l'initialisation d'Amplify. Veuillez réessayer manuellement.${NC}"
        echo "Exécutez: amplify init"
        exit 1
    fi
fi

# Créer ou mettre à jour le fichier de configuration Amplify
echo -e "${YELLOW}Configuration du déploiement Amplify...${NC}"

# Créer le fichier amplify.yml s'il n'existe pas déjà
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
    - pattern: '**/*.js'
      headers:
        - key: 'Content-Type'
          value: 'application/javascript'
    - pattern: '**/*.css'
      headers:
        - key: 'Content-Type'
          value: 'text/css'
    - pattern: '**/*'
      headers:
        - key: 'Access-Control-Allow-Origin'
          value: '*'
        - key: 'Access-Control-Allow-Headers'
          value: '*'
        - key: 'Access-Control-Allow-Methods'
          value: 'GET, POST, OPTIONS, PUT, DELETE'
EOL

# Créer un fichier redirects pour gérer les routes SPA
mkdir -p public
cat > public/_redirects << EOL
/*    /index.html   200
EOL

# Ajouter un fichier de configuration pour les en-têtes de sécurité
cat > public/_headers << EOL
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
EOL

# Créer un fichier de configuration pour le routage et les redirections
cat > public/aws-config.json << EOL
{
  "CloudFrontConfig": {
    "Comment": "Configuration for FloDrama",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Items": [
        {
          "Id": "S3-flodrama-prod",
          "DomainName": "flodrama-prod.s3.amazonaws.com",
          "OriginPath": ""
        }
      ]
    },
    "CustomErrorResponses": {
      "Items": [
        {
          "ErrorCode": 403,
          "ResponsePagePath": "/index.html",
          "ResponseCode": 200,
          "ErrorCachingMinTTL": 300
        },
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": 200,
          "ErrorCachingMinTTL": 300
        }
      ]
    }
  }
}
EOL

# Ajouter une configuration pour le hosting
echo -e "${YELLOW}Configuration du hosting...${NC}"
amplify add hosting

# Publier l'application
echo -e "${YELLOW}Publication de l'application...${NC}"
amplify publish

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Déploiement réussi !${NC}"
    echo -e "${BLUE}Votre application FloDrama est maintenant déployée sur AWS Amplify.${NC}"
    echo -e "${BLUE}Tous les problèmes de CORS, MIME et d'accès aux ressources devraient être résolus.${NC}"
    
    # Récupérer l'URL de l'application
    APP_URL=$(grep -o 'https://[^[:space:]]*' <<< "$(amplify status)")
    
    if [ -n "$APP_URL" ]; then
        echo -e "${GREEN}URL de l'application: ${APP_URL}${NC}"
    else
        echo -e "${YELLOW}Pour trouver l'URL de votre application, visitez la console AWS Amplify.${NC}"
    fi
else
    echo -e "${RED}Échec du déploiement. Veuillez vérifier les erreurs ci-dessus.${NC}"
    exit 1
fi

echo -e "${BLUE}=== Fin du déploiement ===${NC}"
