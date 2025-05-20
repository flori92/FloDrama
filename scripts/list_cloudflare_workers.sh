#!/bin/bash
# Script pour lister tous les Workers Cloudflare et faciliter le nettoyage
# Auteur: Cascade pour FloDrama
# Date: 16 mai 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ID du compte Cloudflare (obtenu via wrangler whoami)
ACCOUNT_ID="42fc982266a2c31b942593b18097e4b3"

echo -e "${BLUE}=== Liste des Workers Cloudflare pour le compte ${ACCOUNT_ID} ===${NC}\n"

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Le programme 'jq' n'est pas installé. Il est nécessaire pour traiter les réponses JSON.${NC}"
    echo -e "Installez-le avec: ${YELLOW}brew install jq${NC}"
    exit 1
fi

# Obtenir le token OAuth de Wrangler
echo -e "${BLUE}Récupération du token OAuth...${NC}"
npx wrangler login

# Utiliser l'API Cloudflare pour lister les Workers
echo -e "\n${BLUE}Récupération de la liste des Workers...${NC}\n"

# Méthode 1: Utiliser l'API pour lister les scripts
echo -e "${YELLOW}=== Workers déployés (scripts) ===${NC}"
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts" \
  -H "Authorization: Bearer $(grep -A1 oauth_token ~/.wrangler/config/default.json | grep -v oauth_token | tr -d ' ",' | head -1)" \
  -H "Content-Type: application/json" | jq -r '.result[] | "- \(.id) (Dernière modification: \(.modified_on))"' || echo -e "${RED}Erreur lors de la récupération des scripts${NC}"

# Méthode 2: Lister les services Workers
echo -e "\n${YELLOW}=== Services Workers ===${NC}"
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/services" \
  -H "Authorization: Bearer $(grep -A1 oauth_token ~/.wrangler/config/default.json | grep -v oauth_token | tr -d ' ",' | head -1)" \
  -H "Content-Type: application/json" | jq -r '.result[] | "- \(.id) (Environnement: \(.environment))"' || echo -e "${RED}Erreur lors de la récupération des services${NC}"

# Lister les projets Pages (qui utilisent aussi des Workers)
echo -e "\n${YELLOW}=== Projets Pages ===${NC}"
npx wrangler pages project list

echo -e "\n${GREEN}=== Instructions pour le nettoyage ===${NC}"
echo -e "Pour supprimer un Worker, utilisez: ${YELLOW}npx wrangler delete <nom-du-worker>${NC}"
echo -e "Pour supprimer un projet Pages, utilisez: ${YELLOW}npx wrangler pages project delete <nom-du-projet>${NC}"
echo -e "\n${RED}ATTENTION: La suppression est définitive. Assurez-vous de ne pas supprimer des Workers en production.${NC}"
