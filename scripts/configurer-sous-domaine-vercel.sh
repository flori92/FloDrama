#!/bin/bash
# Script de configuration d'un sous-domaine Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration d'un sous-domaine Vercel ===${NC}"

# Token Vercel et ID du projet
TOKEN="BnDQbYpIvKumAkgdt2v87oR9"
PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"

# Exporter le token pour que Vercel CLI puisse l'utiliser
export VERCEL_TOKEN=$TOKEN

# Nom du sous-domaine à configurer
SUBDOMAIN="flodrama"

echo -e "${YELLOW}Configuration du sous-domaine: $SUBDOMAIN.vercel.app${NC}"

# Renommer le projet pour correspondre au sous-domaine souhaité
vercel project rename flodrama $SUBDOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Projet renommé avec succès en $SUBDOMAIN${NC}"
    echo -e "${GREEN}Votre application est maintenant accessible à l'adresse: https://$SUBDOMAIN.vercel.app${NC}"
else
    echo -e "${RED}Erreur lors du renommage du projet${NC}"
    echo -e "${YELLOW}Essai de déploiement avec alias...${NC}"
    
    # Alternative: ajouter un alias au déploiement existant
    vercel alias set flodrama-5vlmnqlqx-flodrama-projects.vercel.app $SUBDOMAIN.vercel.app
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Alias configuré avec succès${NC}"
        echo -e "${GREEN}Votre application est maintenant accessible à l'adresse: https://$SUBDOMAIN.vercel.app${NC}"
    else
        echo -e "${RED}Erreur lors de la configuration de l'alias${NC}"
    fi
fi

# Redéployer l'application pour appliquer les changements
echo -e "${YELLOW}Redéploiement de l'application...${NC}"
vercel --prod

echo -e "${GREEN}=== Configuration terminée ===${NC}"
echo -e "${YELLOW}Vérification de l'accessibilité du site...${NC}"

# Mettre à jour le script de test avec la nouvelle URL
sed -i '' "s|VERCEL_URL=\"https://.*\"|VERCEL_URL=\"https://$SUBDOMAIN.vercel.app\"|g" ./scripts/tester-deploiement-vercel.sh

# Tester l'accessibilité
./scripts/tester-deploiement-vercel.sh
