#!/bin/bash

# Script de déploiement du scraper FloDrama sur Cloudflare Workers
# Ce script déploie le scraper et lance un scraping initial

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Déploiement du scraper FloDrama sur Cloudflare Workers${NC}"

# Vérification de wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler n'est pas installé. Installation...${NC}"
    npm install -g wrangler
fi

# Déploiement du scraper
echo -e "${YELLOW}📦 Déploiement du scraper...${NC}"
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Scraper déployé avec succès !${NC}"
    
    # Lancement d'un scraping initial
    echo -e "${YELLOW}🔍 Lancement d'un scraping initial...${NC}"
    
    # URL du scraper déployé
    SCRAPER_URL="https://flodrama-scraper.florifavi.workers.dev"
    
    # Sources à scraper
    SOURCES=("mydramalist")
    
    for source in "${SOURCES[@]}"; do
        echo -e "${BLUE}🌐 Scraping de la source ${source}...${NC}"
        curl -s "${SCRAPER_URL}?source=${source}&limit=20" | jq .
    done
    
    echo -e "${GREEN}✅ Scraping initial terminé !${NC}"
    echo -e "${BLUE}ℹ️ Le scraper est configuré pour s'exécuter automatiquement tous les jours à minuit.${NC}"
else
    echo -e "${RED}❌ Échec du déploiement du scraper.${NC}"
    exit 1
fi
