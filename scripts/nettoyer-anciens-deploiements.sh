#!/bin/bash
# Script pour nettoyer les anciens déploiements Vercel de FloDrama
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nettoyage des anciens déploiements FloDrama sur Vercel ===${NC}"

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Erreur: La commande vercel n'est pas installée. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Récupérer la liste des déploiements (sauf le plus récent)
echo -e "${BLUE}Récupération de la liste des déploiements...${NC}"
DEPLOYMENTS=$(vercel ls | grep "flodrama-" | grep -v "$(vercel ls | grep "flodrama-" | head -n 1 | awk '{print $2}')" | awk '{print $2}')

# Compter le nombre de déploiements à supprimer
DEPLOYMENT_COUNT=$(echo "$DEPLOYMENTS" | wc -l | tr -d ' ')
echo -e "${YELLOW}Nombre de déploiements à supprimer: $DEPLOYMENT_COUNT${NC}"

# Supprimer les déploiements un par un
if [ -n "$DEPLOYMENTS" ]; then
    echo -e "${BLUE}Suppression des anciens déploiements...${NC}"
    
    echo "$DEPLOYMENTS" | while read DEPLOYMENT_URL; do
        if [ -n "$DEPLOYMENT_URL" ]; then
            echo -e "${YELLOW}Suppression du déploiement: $DEPLOYMENT_URL${NC}"
            PROJECT_ID=$(echo $DEPLOYMENT_URL | cut -d'-' -f2 | cut -d'.' -f1)
            vercel remove --yes flodrama-$PROJECT_ID
            sleep 2
        fi
    done
    
    echo -e "${GREEN}Tous les anciens déploiements ont été supprimés.${NC}"
else
    echo -e "${GREEN}Aucun ancien déploiement à supprimer.${NC}"
fi

# Vérifier le statut du déploiement actuel
echo -e "${BLUE}Vérification du déploiement actuel...${NC}"
CURRENT_DEPLOYMENT=$(vercel ls | grep "flodrama-" | head -n 1 | awk '{print $2}')
echo -e "${YELLOW}Déploiement actuel: $CURRENT_DEPLOYMENT${NC}"

# Vérifier l'alias
echo -e "${BLUE}Vérification de l'alias...${NC}"
ALIAS_STATUS=$(vercel alias ls | grep "flodrama.vercel.app")
echo -e "${YELLOW}Statut de l'alias: $ALIAS_STATUS${NC}"

# Vérifier si l'alias est correctement configuré
if echo "$ALIAS_STATUS" | grep -q "$CURRENT_DEPLOYMENT"; then
    echo -e "${GREEN}L'alias flodrama.vercel.app est correctement configuré.${NC}"
else
    echo -e "${RED}L'alias flodrama.vercel.app n'est pas correctement configuré.${NC}"
    echo -e "${YELLOW}Configuration de l'alias...${NC}"
    vercel alias set $CURRENT_DEPLOYMENT flodrama.vercel.app
fi

echo -e "${GREEN}=== Nettoyage des anciens déploiements terminé ===${NC}"
echo -e "${YELLOW}Votre application est disponible à l'adresse: https://flodrama.vercel.app${NC}"
