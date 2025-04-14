#!/bin/bash
# Script pour forcer la mise à jour du contenu sur Vercel et purger le cache
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Forçage de la mise à jour du contenu sur Vercel ===${NC}"

# Vérifier si le fichier index.html existe
if [ ! -f "index.html" ]; then
    echo -e "${RED}Erreur: Le fichier index.html n'existe pas${NC}"
    exit 1
fi

# Créer un timestamp pour forcer le rafraîchissement
TIMESTAMP=$(date +%s)
echo -e "${YELLOW}Ajout d'un timestamp ($TIMESTAMP) pour forcer le rafraîchissement...${NC}"

# Ajouter un commentaire avec le timestamp pour forcer la mise à jour
sed -i "" "s/<\/html>/<!-- Force refresh: $TIMESTAMP -->\n<\/html>/" index.html
echo -e "${GREEN}Timestamp ajouté avec succès${NC}"

# Forcer le déploiement sur Vercel avec l'option --force
echo -e "${YELLOW}Déploiement forcé sur Vercel...${NC}"
vercel --prod --force

# Attendre quelques secondes pour que le déploiement soit effectif
echo -e "${YELLOW}Attente de la propagation du déploiement (30 secondes)...${NC}"
sleep 30

# Vérifier si le déploiement a fonctionné
echo -e "${YELLOW}Vérification du déploiement...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://flodrama.vercel.app)

if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}Déploiement réussi (HTTP 200)${NC}"
    
    # Vérifier si la page contient le timestamp
    if curl -s https://flodrama.vercel.app | grep -q "Force refresh: $TIMESTAMP"; then
        echo -e "${GREEN}La page a bien été mise à jour avec le nouveau contenu${NC}"
    else
        echo -e "${RED}La page n'a pas été mise à jour correctement${NC}"
        echo -e "${YELLOW}Tentative de purge du cache...${NC}"
        
        # Tentative de purge du cache via des requêtes avec Cache-Control
        curl -X GET -H "Cache-Control: no-cache, no-store, must-revalidate" https://flodrama.vercel.app
        echo -e "${GREEN}Requête de purge de cache envoyée${NC}"
    fi
else
    echo -e "${RED}Erreur lors du déploiement (HTTP $RESPONSE)${NC}"
fi

echo -e "${GREEN}=== Processus de mise à jour forcée terminé ===${NC}"
echo -e "${YELLOW}Vous pouvez vérifier le résultat en visitant: https://flodrama.vercel.app${NC}"
