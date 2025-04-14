#!/bin/bash
# Script de test du déploiement Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Test du déploiement Vercel ===${NC}"

# URL du déploiement Vercel
VERCEL_URL="https://flodrama.vercel.app"

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/test-vercel-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# Vérifier si l'URL est accessible
log "${YELLOW}Vérification de l'accessibilité de $VERCEL_URL...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $VERCEL_URL)

if [ "$HTTP_CODE" -eq 200 ]; then
    log "${GREEN}✅ L'URL est accessible (HTTP 200)${NC}"
else
    log "${RED}❌ L'URL n'est pas accessible correctement (HTTP $HTTP_CODE)${NC}"
fi

# Vérifier les en-têtes CORS
log "${YELLOW}Vérification des en-têtes CORS...${NC}"
CORS_HEADERS=$(curl -s -I -X OPTIONS $VERCEL_URL/api/test | grep -i "Access-Control-Allow")

if [ -n "$CORS_HEADERS" ]; then
    log "${GREEN}✅ Les en-têtes CORS sont configurés:${NC}"
    echo "$CORS_HEADERS" | tee -a $LOG_FILE
else
    log "${RED}❌ Les en-têtes CORS ne sont pas correctement configurés${NC}"
fi

# Vérifier le routage des assets
log "${YELLOW}Vérification du routage des assets...${NC}"
ASSET_CODE=$(curl -s -o /dev/null -w "%{http_code}" $VERCEL_URL/assets/css/main.css)

if [ "$ASSET_CODE" -eq 200 ]; then
    log "${GREEN}✅ Les assets sont correctement routés${NC}"
else
    log "${RED}❌ Problème de routage des assets (HTTP $ASSET_CODE)${NC}"
fi

# Vérifier la redirection vers index.html
log "${YELLOW}Vérification de la redirection vers index.html...${NC}"
ROUTE_CODE=$(curl -s -o /dev/null -w "%{http_code}" $VERCEL_URL/une-route-qui-nexiste-pas)

if [ "$ROUTE_CODE" -eq 200 ]; then
    log "${GREEN}✅ La redirection vers index.html fonctionne correctement${NC}"
else
    log "${RED}❌ Problème de redirection vers index.html (HTTP $ROUTE_CODE)${NC}"
fi

# Vérifier la connexion à l'API
log "${YELLOW}Vérification de la connexion à l'API...${NC}"
API_RESPONSE=$(curl -s $VERCEL_URL/api/status || echo "Erreur de connexion")

if [[ "$API_RESPONSE" == *"Erreur"* ]]; then
    log "${RED}❌ Problème de connexion à l'API${NC}"
else
    log "${GREEN}✅ Connexion à l'API réussie${NC}"
    echo "$API_RESPONSE" | head -n 10 | tee -a $LOG_FILE
fi

# Résumé des tests
echo -e "\n${GREEN}=== Résumé des tests ===${NC}" | tee -a $LOG_FILE

if [ "$HTTP_CODE" -eq 200 ] && [ "$ROUTE_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Le déploiement Vercel semble fonctionner correctement${NC}" | tee -a $LOG_FILE
    echo -e "${YELLOW}URL de production: $VERCEL_URL${NC}" | tee -a $LOG_FILE
    echo -e "${YELLOW}Prochaine étape: Configurer le domaine personnalisé avec ./scripts/configurer-domaine-vercel.sh${NC}" | tee -a $LOG_FILE
else
    echo -e "${RED}❌ Le déploiement Vercel présente des problèmes qui doivent être corrigés${NC}" | tee -a $LOG_FILE
    echo -e "${YELLOW}Consultez le log pour plus de détails: $LOG_FILE${NC}" | tee -a $LOG_FILE
fi

echo -e "${GREEN}=== Fin des tests ===${NC}"
