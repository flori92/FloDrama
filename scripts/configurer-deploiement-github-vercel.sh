#!/bin/bash
# Script de configuration du déploiement GitHub sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration du déploiement GitHub sur Vercel ===${NC}"

# Vérifier si le dépôt est à jour
echo -e "${YELLOW}Vérification de l'état du dépôt Git...${NC}"
if [[ $(git status --porcelain) ]]; then
    echo -e "${RED}Il y a des modifications non commitées dans le dépôt.${NC}"
    echo -e "${YELLOW}Veuillez commiter vos modifications avant de continuer.${NC}"
    exit 1
fi

# Vérifier si le dépôt est lié à GitHub
echo -e "${YELLOW}Vérification de la connexion à GitHub...${NC}"
REMOTE_URL=$(git remote get-url origin 2>/dev/null)

if [[ -z "$REMOTE_URL" ]]; then
    echo -e "${RED}Aucun dépôt distant configuré.${NC}"
    echo -e "${YELLOW}Veuillez configurer un dépôt GitHub avant de continuer.${NC}"
    exit 1
fi

if [[ ! "$REMOTE_URL" == *"github.com"* ]]; then
    echo -e "${RED}Le dépôt distant n'est pas sur GitHub.${NC}"
    echo -e "${YELLOW}Veuillez configurer un dépôt GitHub avant de continuer.${NC}"
    exit 1
fi

echo -e "${GREEN}Dépôt GitHub configuré : $REMOTE_URL${NC}"

# Pousser les dernières modifications vers GitHub
echo -e "${YELLOW}Envoi des dernières modifications vers GitHub...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de l'envoi des modifications vers GitHub.${NC}"
    exit 1
fi

echo -e "${GREEN}Modifications envoyées avec succès vers GitHub.${NC}"

# Instructions pour configurer le déploiement sur Vercel
echo -e "${YELLOW}Pour configurer le déploiement GitHub sur Vercel, suivez ces étapes :${NC}"
echo -e "1. Connectez-vous à votre compte Vercel : https://vercel.com/dashboard"
echo -e "2. Cliquez sur 'Add New...' > 'Project'"
echo -e "3. Sélectionnez le dépôt GitHub 'flori92/FloDrama'"
echo -e "4. Dans la configuration du projet :"
echo -e "   - Framework Preset : Other"
echo -e "   - Build Command : npm run build"
echo -e "   - Output Directory : build"
echo -e "   - Install Command : npm install"
echo -e "5. Cliquez sur 'Deploy'"
echo -e "6. Une fois le déploiement terminé, allez dans 'Settings' > 'Password Protection'"
echo -e "7. Désactivez l'option 'Enable Password Protection'"
echo -e "8. Allez dans 'Settings' > 'General' et assurez-vous que 'Privacy' est défini sur 'Public'"

echo -e "${GREEN}=== Configuration terminée ===${NC}"
echo -e "${YELLOW}Après avoir configuré le déploiement GitHub sur Vercel, notez l'URL du déploiement${NC}"
echo -e "${YELLOW}et mettez à jour le script tester-deploiement-vercel.sh avec cette URL.${NC}"
