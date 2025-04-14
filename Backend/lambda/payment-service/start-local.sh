#!/bin/bash

# Script pour démarrer le service de paiement FloDrama en local
# Ce script démarre le serveur local avec serverless-offline

# Couleurs pour les messages
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Logo FloDrama
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}███████╗██╗      ██████╗     ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗${BLUE}  ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██╔════╝██║     ██╔═══██╗    ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}█████╗  ██║     ██║   ██║    ██║  ██║██████╔╝███████║██╔████╔██║███████║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██╔══╝  ██║     ██║   ██║    ██║  ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██║     ███████╗╚██████╔╝    ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}╚═╝     ╚══════╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${BLUE} ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${BLUE}                 Service de Paiement Unifié                      ${NC}"
echo ""

# Vérifier si Serverless Framework est installé
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework n'est pas installé. Installation...${NC}"
    npm install -g serverless
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Les dépendances ne sont pas installées. Installation...${NC}"
    npm install
fi

# Démarrer DynamoDB local en arrière-plan
echo -e "${BLUE}🔄 Démarrage de DynamoDB local...${NC}"
if command -v java &> /dev/null; then
    # Utiliser notre installation locale de DynamoDB
    if [ -d ".dynamodb" ]; then
        echo -e "${GREEN}✅ Utilisation de l'installation locale de DynamoDB.${NC}"
        cd .dynamodb
        java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000 &
        DYNAMODB_PID=$!
        cd ..
    else
        echo -e "${YELLOW}⚠️  DynamoDB local n'est pas installé. Tentative d'utilisation via serverless...${NC}"
        serverless dynamodb start --port 8000 &
        DYNAMODB_PID=$!
    fi
    
    # Attendre que DynamoDB soit prêt
    echo -e "${BLUE}⏳ Attente du démarrage de DynamoDB...${NC}"
    sleep 5
else
    echo -e "${YELLOW}⚠️  Java n'est pas installé. DynamoDB local ne sera pas démarré.${NC}"
    echo -e "${YELLOW}⚠️  Certaines fonctionnalités peuvent ne pas fonctionner correctement.${NC}"
fi

# Démarrer le serveur local
echo -e "${BLUE}🚀 Démarrage du serveur local...${NC}"
echo -e "${GREEN}✅ Le service sera disponible à l'adresse: http://localhost:4000${NC}"
echo -e "${BLUE}📋 Endpoints disponibles:${NC}"
echo -e "${GREEN}GET    http://localhost:4000/subscription${NC}"
echo -e "${GREEN}POST   http://localhost:4000/subscription${NC}"
echo -e "${GREEN}PUT    http://localhost:4000/subscription${NC}"
echo -e "${GREEN}POST   http://localhost:4000/subscription/{id}/cancel${NC}"
echo -e "${GREEN}POST   http://localhost:4000/verify-paypal${NC}"
echo -e "${GREEN}GET    http://localhost:4000/payment-history${NC}"
echo -e "${GREEN}POST   http://localhost:4000/analytics/conversion${NC}"
echo -e "${GREEN}POST   http://localhost:4000/analytics/behavior${NC}"
echo -e "${GREEN}GET    http://localhost:4000/analytics/conversion-metrics${NC}"
echo -e "${GREEN}GET    http://localhost:4000/analytics/behavior-metrics${NC}"
echo ""
echo -e "${BLUE}🔍 Pour tester les endpoints, exécutez: node test-local.js${NC}"
echo -e "${BLUE}🛑 Pour arrêter le serveur, appuyez sur Ctrl+C${NC}"
echo ""

# Démarrer le serveur
serverless offline start --httpPort 4000

# Nettoyer à la sortie
function cleanup {
    echo -e "\n${BLUE}🛑 Arrêt du serveur...${NC}"
    
    if [ ! -z "$DYNAMODB_PID" ]; then
        echo -e "${BLUE}🛑 Arrêt de DynamoDB local...${NC}"
        kill $DYNAMODB_PID
    fi
    
    echo -e "${GREEN}✅ Service arrêté avec succès!${NC}"
}

# Capturer le signal d'interruption (Ctrl+C)
trap cleanup EXIT

# Attendre que le serveur soit arrêté
wait
