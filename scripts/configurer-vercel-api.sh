#!/bin/bash
# Script de configuration du projet Vercel via l'API
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration du projet Vercel via l'API ===${NC}"

# ID du projet Vercel
PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Installation de jq...${NC}"
    brew install jq
fi

# Créer un token Vercel temporaire
echo -e "${YELLOW}Création d'un token Vercel temporaire...${NC}"
echo -e "${YELLOW}Veuillez vous connecter à Vercel dans le navigateur qui va s'ouvrir${NC}"
echo -e "${YELLOW}Puis allez dans Settings > Tokens et créez un nouveau token${NC}"
echo -e "${YELLOW}Copiez le token et collez-le ci-dessous${NC}"

read -p "Token Vercel: " VERCEL_TOKEN

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}Aucun token fourni. Abandon.${NC}"
    exit 1
fi

# Enregistrer le token pour une utilisation ultérieure
mkdir -p ~/.vercel
echo "{\"token\":\"$VERCEL_TOKEN\"}" > ~/.vercel/auth.json
chmod 600 ~/.vercel/auth.json

echo -e "${GREEN}Token Vercel enregistré avec succès.${NC}"

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

# Mettre à jour la configuration de build
echo -e "${YELLOW}Mise à jour de la configuration de build...${NC}"
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buildCommand": "npm run build",
    "outputDirectory": "build",
    "installCommand": "npm install",
    "framework": "other"
  }'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration de build mise à jour avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la mise à jour de la configuration de build${NC}"
fi

# Redéployer le projet
echo -e "${YELLOW}Redéploiement du projet...${NC}"
vercel --prod --token $VERCEL_TOKEN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Projet redéployé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du redéploiement du projet${NC}"
fi

echo -e "${GREEN}=== Configuration terminée ===${NC}"
echo -e "${YELLOW}Votre projet devrait maintenant être accessible publiquement.${NC}"
echo -e "${YELLOW}Exécutez './scripts/tester-deploiement-vercel.sh' pour vérifier l'accessibilité.${NC}"
