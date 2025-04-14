#!/bin/bash
# Script de configuration de l'accès public pour le projet Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration de l'accès public pour le projet Vercel ===${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi

# Nom du projet
PROJECT_NAME="flodrama"

echo -e "${YELLOW}Nom du projet Vercel: $PROJECT_NAME${NC}"

# Configurer le projet en mode public
echo -e "${YELLOW}Configuration du projet en mode public...${NC}"
vercel project update --public $PROJECT_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Projet configuré en mode public avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la configuration du projet en mode public${NC}"
    echo -e "${YELLOW}Alternative: Configurez manuellement le projet en mode public sur https://vercel.com/dashboard${NC}"
fi

# Redéployer le projet
echo -e "${YELLOW}Redéploiement du projet...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Projet redéployé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du redéploiement du projet${NC}"
fi

echo -e "${GREEN}=== Configuration terminée ===${NC}"
echo -e "${YELLOW}Votre projet devrait maintenant être accessible publiquement.${NC}"
echo -e "${YELLOW}Si vous rencontrez toujours des problèmes, veuillez configurer manuellement le projet en mode public sur https://vercel.com/dashboard${NC}"
