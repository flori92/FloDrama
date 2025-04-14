#!/bin/bash
# Script pour purger le cache Vercel via l'API
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Purge du cache Vercel via l'API ===${NC}"

# Demander le token Vercel si non fourni
read -p "Entrez votre token Vercel (trouvable dans les paramètres de votre compte Vercel): " VERCEL_TOKEN

# Vérifier si le token est fourni
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}Erreur: Token Vercel non fourni${NC}"
    exit 1
fi

# Récupérer l'ID du projet
echo -e "${YELLOW}Récupération de l'ID du projet...${NC}"
PROJECT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v9/projects)

# Extraire l'ID du projet FloDrama
PROJECT_ID=$(echo "$PROJECT_INFO" | grep -o '"id":"[^"]*' | grep -i flodrama | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Erreur: Impossible de trouver l'ID du projet FloDrama${NC}"
    echo -e "${YELLOW}Liste des projets disponibles:${NC}"
    echo "$PROJECT_INFO" | grep -o '"name":"[^"]*' | cut -d'"' -f4
    
    read -p "Entrez manuellement l'ID du projet: " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Erreur: ID du projet non fourni${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}ID du projet trouvé: $PROJECT_ID${NC}"

# Purger le cache du projet
echo -e "${YELLOW}Purge du cache pour le projet...${NC}"
PURGE_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects/${PROJECT_ID}/cache/purge" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"deploymentId": null}')

if echo "$PURGE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Purge du cache réussie!${NC}"
else
    echo -e "${RED}❌ Échec de la purge du cache:${NC}"
    echo "$PURGE_RESPONSE"
fi

# Forcer un nouveau déploiement
echo -e "${YELLOW}Force d'un nouveau déploiement...${NC}"

# Créer un fichier temporaire avec timestamp
TIMESTAMP=$(date +%s)
echo "FORCE_REBUILD_${TIMESTAMP}" > .force-rebuild-api

# Ajouter et commit
git add .force-rebuild-api
git commit -m "🔄 [BUILD] Force rebuild après purge du cache (${TIMESTAMP})"

# Déployer avec l'option --force
vercel --prod --force

echo -e "${GREEN}=== Processus de purge du cache et déploiement terminé ===${NC}"
echo -e "${YELLOW}Vérifiez le résultat en visitant: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Utilisez 'curl -s -I https://flodrama.vercel.app | grep -E \"Cache-Control|x-vercel-cache\"' pour vérifier l'état du cache${NC}"
