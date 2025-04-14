#!/bin/bash
# Script pour forcer un déploiement complet avec purge du cache sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Purge du cache et déploiement forcé sur Vercel ===${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Erreur: Vercel CLI n'est pas installé. Veuillez l'installer avec 'npm install -g vercel'${NC}"
    exit 1
fi

# Ajouter un timestamp dans un fichier temporaire pour forcer un changement
TIMESTAMP=$(date +%s)
echo -e "${YELLOW}Création d'un fichier temporaire avec timestamp pour forcer un nouveau build...${NC}"
echo "FORCE_REBUILD_${TIMESTAMP}" > .force-rebuild

# Ajouter le fichier au git
git add .force-rebuild
git commit -m "🔄 [BUILD] Force rebuild avec timestamp ${TIMESTAMP}"

# Déployer avec l'option --force
echo -e "${YELLOW}Déploiement forcé sur Vercel...${NC}"
vercel --prod --force

# Attendre que le déploiement soit effectif
echo -e "${YELLOW}Attente de la propagation du déploiement (30 secondes)...${NC}"
sleep 30

# Tester le déploiement
echo -e "${YELLOW}Test du déploiement...${NC}"
./scripts/tester-deploiement-vercel.sh

# Vérifier si le contenu a été mis à jour
echo -e "${YELLOW}Vérification du contenu de la page...${NC}"
CONTENT=$(curl -s https://flodrama.vercel.app)

if echo "$CONTENT" | grep -q "Version déployée le 7 avril 2025"; then
    echo -e "${GREEN}✅ La page a bien été mise à jour avec le nouveau contenu${NC}"
else
    echo -e "${RED}❌ La page n'a pas été mise à jour correctement${NC}"
    echo -e "${YELLOW}Tentative de purge manuelle du cache via l'API Vercel...${NC}"
    
    # Récupérer le token Vercel
    if [ -f ~/.vercel/auth.json ]; then
        VERCEL_TOKEN=$(grep -o '"token":"[^"]*' ~/.vercel/auth.json | cut -d'"' -f4)
        
        # Récupérer l'ID du projet
        PROJECT_ID=$(vercel project ls --json | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        
        if [ -n "$PROJECT_ID" ] && [ -n "$VERCEL_TOKEN" ]; then
            echo -e "${YELLOW}Purge du cache pour le projet ID: ${PROJECT_ID}${NC}"
            curl -X POST "https://api.vercel.com/v9/projects/${PROJECT_ID}/cache/purge" \
                -H "Authorization: Bearer ${VERCEL_TOKEN}" \
                -H "Content-Type: application/json" \
                -d '{"deploymentId": null}'
                
            echo -e "${GREEN}Purge du cache demandée, nouveau déploiement en cours...${NC}"
            vercel --prod
        else
            echo -e "${RED}Impossible de récupérer le token ou l'ID du projet${NC}"
        fi
    else
        echo -e "${RED}Fichier d'authentification Vercel non trouvé${NC}"
    fi
fi

echo -e "${GREEN}=== Processus de purge de cache et déploiement terminé ===${NC}"
echo -e "${YELLOW}Vous pouvez vérifier le résultat en visitant: https://flodrama.vercel.app${NC}"
