#!/bin/bash

# Script pour démarrer le serveur mock du service de paiement FloDrama
# Ce script démarre un serveur Express qui simule les endpoints API

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

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Les dépendances ne sont pas installées. Installation...${NC}"
    npm install
fi

# Démarrer le serveur mock
echo -e "${BLUE}🚀 Démarrage du serveur mock...${NC}"
node mock-server.js
