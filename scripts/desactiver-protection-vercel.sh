#!/bin/bash
# Script pour désactiver complètement la protection par mot de passe sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Désactivation de la protection Vercel ===${NC}"

# Token Vercel
TOKEN="BnDQbYpIvKumAkgdt2v87oR9"

# ID du projet
PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"

echo -e "${YELLOW}Désactivation de la protection par mot de passe...${NC}"

# Désactiver la protection par mot de passe
curl -X DELETE "https://api.vercel.com/v9/projects/$PROJECT_ID/auth" \
  -H "Authorization: Bearer $TOKEN" \
  -v

echo -e "\n${YELLOW}Configuration du projet en mode public...${NC}"

# Configurer le projet en mode public via l'API Teams
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"framework": null}' \
  -v

echo -e "\n${YELLOW}Désactivation de toutes les protections...${NC}"

# Désactiver toutes les protections
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buildCommand": null,
    "commandForIgnoring": null,
    "devCommand": null,
    "framework": null,
    "installCommand": null,
    "outputDirectory": null,
    "publicSource": true,
    "rootDirectory": null,
    "serverlessFunctionRegion": null,
    "nodeVersion": "18.x"
  }' \
  -v

echo -e "\n${YELLOW}Redéploiement du projet...${NC}"

# Redéployer le projet
VERCEL_TOKEN=$TOKEN vercel --prod

echo -e "\n${GREEN}=== Opération terminée ===${NC}"
echo -e "${YELLOW}Veuillez vérifier l'accès au site en exécutant :${NC}"
echo -e "./scripts/tester-deploiement-vercel.sh"
