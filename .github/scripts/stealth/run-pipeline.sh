#!/bin/bash

# Script d'exécution du pipeline complet de scraping pour FloDrama
# Ce script exécute toutes les étapes du pipeline de scraping, d'enrichissement
# et de distribution des données pour FloDrama

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher une bannière
function show_banner() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}                FloDrama - Pipeline Complet de Scraping${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""
}

# Fonction pour afficher l'aide
function show_help() {
    echo -e "Usage: $0 [options]"
    echo ""
    echo -e "Options:"
    echo -e "  -h, --help              Affiche cette aide"
    echo -e "  -s, --skip-scraping     Saute l'étape de scraping"
    echo -e "  -e, --skip-enrichment   Saute l'étape d'enrichissement"
    echo -e "  -d, --skip-distribution Saute l'étape de distribution"
    echo -e "  -c, --clean             Nettoie les fichiers temporaires avant de commencer"
    echo -e "  -v, --verbose           Mode verbeux"
    echo ""
}

# Traitement des arguments
SKIP_SCRAPING=false
SKIP_ENRICHMENT=false
SKIP_DISTRIBUTION=false
CLEAN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--skip-scraping)
            SKIP_SCRAPING=true
            shift
            ;;
        -e|--skip-enrichment)
            SKIP_ENRICHMENT=true
            shift
            ;;
        -d|--skip-distribution)
            SKIP_DISTRIBUTION=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Afficher la bannière
show_banner

# Afficher la configuration
echo -e "${YELLOW}Configuration:${NC}"
echo -e "- Skip scraping: ${SKIP_SCRAPING}"
echo -e "- Skip enrichment: ${SKIP_ENRICHMENT}"
echo -e "- Skip distribution: ${SKIP_DISTRIBUTION}"
echo -e "- Clean: ${CLEAN}"
echo -e "- Verbose: ${VERBOSE}"
echo ""

# Vérifier les dépendances
echo -e "${YELLOW}Vérification des dépendances...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Toutes les dépendances sont installées.${NC}"

# Installer les dépendances npm si nécessaire
echo -e "${YELLOW}Installation des dépendances npm...${NC}"
npm install fs-extra axios cheerio puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

# Nettoyer les fichiers temporaires si demandé
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Nettoyage des fichiers temporaires...${NC}"
    rm -rf ./cloudflare/scraping/scraping-results/*
    rm -rf ./Frontend/src/data/content/*_enriched.json
    echo -e "${GREEN}✓ Fichiers temporaires nettoyés.${NC}"
fi

# Démarrer le chronomètre
START_TIME=$(date +%s)

# Exécuter le pipeline
if [ "$SKIP_SCRAPING" = false ]; then
    echo -e "\n${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}                ÉTAPE 1: SCRAPING DES DONNÉES${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    
    # Exécuter le script de scraping
    if [ "$VERBOSE" = true ]; then
        node ./cloudflare/scraping/src/cli-scraper.js --all --limit=100 --output=./cloudflare/scraping/scraping-results --debug --save
    else
        node ./cloudflare/scraping/src/cli-scraper.js --all --limit=100 --output=./cloudflare/scraping/scraping-results --save
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Échec de l'étape de scraping${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Étape de scraping terminée avec succès${NC}"
fi

if [ "$SKIP_ENRICHMENT" = false ]; then
    echo -e "\n${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}                ÉTAPE 2: ENRICHISSEMENT DES DONNÉES${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    
    # Exécuter le script d'enrichissement
    node .github/scripts/stealth/enrichissement.js
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Échec de l'étape d'enrichissement${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Étape d'enrichissement terminée avec succès${NC}"
fi

if [ "$SKIP_DISTRIBUTION" = false ]; then
    echo -e "\n${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}                ÉTAPE 3: DISTRIBUTION DES DONNÉES${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    
    # Exécuter le script de distribution
    node .github/scripts/stealth/distribution.js
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Échec de l'étape de distribution${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Étape de distribution terminée avec succès${NC}"
fi

# Calculer la durée
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(( (DURATION % 3600) / 60 ))
SECONDS=$((DURATION % 60))

# Afficher le résumé
echo -e "\n${BLUE}=========================================================================${NC}"
echo -e "${BLUE}                RÉSUMÉ DU PIPELINE${NC}"
echo -e "${BLUE}=========================================================================${NC}"
echo -e "${YELLOW}⏱️ Durée totale: ${HOURS}h ${MINUTES}m ${SECONDS}s${NC}"

# Compter les éléments
TOTAL_ITEMS=$(find ./Frontend/src/data/content -name "index.json" -exec cat {} \; | grep -o '"count":[0-9]*' | awk -F: '{sum += $2} END {print sum}')
echo -e "${YELLOW}📊 Total d'éléments: ${TOTAL_ITEMS}${NC}"

# Compter les fichiers
FILE_COUNT=$(find ./Frontend/src/data/content -name "*.json" | wc -l)
echo -e "${YELLOW}📊 Fichiers générés: ${FILE_COUNT}${NC}"

echo -e "\n${GREEN}✨ Pipeline terminé avec succès!${NC}"

# Vérifier si nous sommes dans GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "::set-output name=duration::${HOURS}h ${MINUTES}m ${SECONDS}s"
    echo "::set-output name=total_items::${TOTAL_ITEMS}"
    echo "::set-output name=file_count::${FILE_COUNT}"
fi

exit 0
