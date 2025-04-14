#!/bin/bash
# Script de configuration du projet Vercel en mode public
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration du projet Vercel en mode public ===${NC}"

# ID du projet Vercel
PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"

# Vérifier si curl est installé
if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Récupérer le token Vercel
echo -e "${YELLOW}Récupération du token Vercel...${NC}"
VERCEL_TOKEN=$(cat ~/.vercel/auth.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}Impossible de récupérer le token Vercel. Assurez-vous d'être connecté à Vercel.${NC}"
    echo -e "${YELLOW}Exécutez 'vercel login' pour vous connecter.${NC}"
    exit 1
fi

echo -e "${GREEN}Token Vercel récupéré avec succès.${NC}"

# Configurer le projet en mode public
echo -e "${YELLOW}Configuration du projet en mode public...${NC}"
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"public": true}'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Projet configuré en mode public avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la configuration du projet en mode public${NC}"
fi

# Désactiver la protection par mot de passe
echo -e "${YELLOW}Désactivation de la protection par mot de passe...${NC}"
curl -X DELETE "https://api.vercel.com/v9/projects/$PROJECT_ID/auth" \
  -H "Authorization: Bearer $VERCEL_TOKEN"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Protection par mot de passe désactivée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la désactivation de la protection par mot de passe${NC}"
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
echo -e "${YELLOW}Exécutez './scripts/tester-deploiement-vercel.sh' pour vérifier l'accessibilité.${NC}"
