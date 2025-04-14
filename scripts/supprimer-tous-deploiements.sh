#!/bin/bash
# Script pour supprimer tous les déploiements Vercel de FloDrama
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Suppression de tous les déploiements FloDrama sur Vercel ===${NC}"

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Erreur: La commande vercel n'est pas installée. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Récupérer la liste des déploiements
echo -e "${BLUE}Récupération de la liste des déploiements...${NC}"
DEPLOYMENTS=$(vercel ls | grep "flodrama-" | awk '{print $2}')

# Compter le nombre de déploiements à supprimer
DEPLOYMENT_COUNT=$(echo "$DEPLOYMENTS" | wc -l | tr -d ' ')
echo -e "${YELLOW}Nombre de déploiements à supprimer: $DEPLOYMENT_COUNT${NC}"

# Supprimer les déploiements un par un
if [ -n "$DEPLOYMENTS" ]; then
    echo -e "${BLUE}Suppression de tous les déploiements...${NC}"
    
    echo "$DEPLOYMENTS" | while read DEPLOYMENT_URL; do
        if [ -n "$DEPLOYMENT_URL" ]; then
            echo -e "${YELLOW}Suppression du déploiement: $DEPLOYMENT_URL${NC}"
            PROJECT_NAME=$(echo $DEPLOYMENT_URL | cut -d'-' -f1-2)
            vercel rm $PROJECT_NAME --yes
            sleep 2
        fi
    done
    
    echo -e "${GREEN}Tous les déploiements ont été supprimés.${NC}"
else
    echo -e "${GREEN}Aucun déploiement à supprimer.${NC}"
fi

echo -e "${GREEN}=== Suppression de tous les déploiements terminée ===${NC}"
echo -e "${YELLOW}Tous les déploiements ont été supprimés. Vous pouvez maintenant redéployer FloDrama avec le script deployer-assets-locaux.sh${NC}"
