#!/bin/bash

# Script de configuration des secrets GitHub pour FloDrama
# Ce script permet de configurer automatiquement les secrets nécessaires au déploiement
# de FloDrama sur GitHub Pages et AWS Lambda

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration des secrets GitHub pour FloDrama${NC}"
echo "Ce script va vous guider pour configurer les secrets nécessaires au déploiement."

# Vérification de l'installation de GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) n'est pas installé.${NC}"
    echo "Veuillez l'installer en suivant les instructions sur https://cli.github.com/"
    exit 1
fi

# Vérification de la connexion à GitHub
echo "Vérification de la connexion à GitHub..."
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Vous n'êtes pas connecté à GitHub.${NC}"
    echo "Veuillez vous connecter avec la commande 'gh auth login'"
    exit 1
fi

echo -e "${GREEN}✓ Connecté à GitHub${NC}"

# Demande du nom du dépôt
read -p "Nom du dépôt GitHub (format: utilisateur/repo) [flori92/FloDrama]: " REPO
REPO=${REPO:-flori92/FloDrama}

echo "Configuration des secrets pour le dépôt $REPO"

# Configuration des identifiants AWS
echo -e "\n${YELLOW}Configuration des identifiants AWS${NC}"
echo "Ces identifiants sont nécessaires pour déployer le backend sur AWS Lambda."

# AWS Access Key ID
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${RED}L'AWS Access Key ID est obligatoire.${NC}"
    exit 1
fi

# AWS Secret Access Key
read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}L'AWS Secret Access Key est obligatoire.${NC}"
    exit 1
fi

# AWS Account ID
read -p "AWS Account ID: " AWS_ACCOUNT_ID
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}L'AWS Account ID est obligatoire.${NC}"
    exit 1
fi

# AWS Lambda Role ARN
read -p "AWS Lambda Role ARN (format: arn:aws:iam::123456789012:role/FloDramaLambdaRole): " AWS_LAMBDA_ROLE_ARN
if [ -z "$AWS_LAMBDA_ROLE_ARN" ]; then
    echo -e "${RED}L'AWS Lambda Role ARN est obligatoire.${NC}"
    exit 1
fi

# Configuration des secrets GitHub
echo -e "\n${YELLOW}Configuration des secrets GitHub...${NC}"

# AWS Access Key ID
echo "Configuration de AWS_ACCESS_KEY_ID..."
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID" --repo "$REPO"
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la configuration de AWS_ACCESS_KEY_ID${NC}"
    exit 1
fi

# AWS Secret Access Key
echo "Configuration de AWS_SECRET_ACCESS_KEY..."
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY" --repo "$REPO"
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la configuration de AWS_SECRET_ACCESS_KEY${NC}"
    exit 1
fi

# AWS Account ID
echo "Configuration de AWS_ACCOUNT_ID..."
gh secret set AWS_ACCOUNT_ID --body "$AWS_ACCOUNT_ID" --repo "$REPO"
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la configuration de AWS_ACCOUNT_ID${NC}"
    exit 1
fi

# AWS Lambda Role ARN
echo "Configuration de AWS_LAMBDA_ROLE_ARN..."
gh secret set AWS_LAMBDA_ROLE_ARN --body "$AWS_LAMBDA_ROLE_ARN" --repo "$REPO"
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la configuration de AWS_LAMBDA_ROLE_ARN${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tous les secrets ont été configurés avec succès !${NC}"
echo -e "Vous pouvez maintenant lancer le déploiement avec la commande :"
echo -e "${YELLOW}gh workflow run deploy.yml --ref gh-pages${NC}"

exit 0
