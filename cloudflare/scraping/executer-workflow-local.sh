#!/bin/bash
# Script d'exécution locale du workflow de scraping FloDrama
# Ce script simule l'exécution du workflow GitHub Actions en local
# pour tester et déboguer le processus de scraping

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Dossier racine du projet
PROJET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS_DIR="${PROJET_DIR}/cloudflare/scraping/workflow-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${LOGS_DIR}/execution_locale_${TIMESTAMP}.log"

# Fonction pour logger les messages
log() {
  echo -e "${1}"
  echo "$(date +'[%Y-%m-%dT%H:%M:%S.%3NZ]') ${1}" | sed 's/\x1B\[[0-9;]\{1,\}[A-Za-z]//g' >> "${LOG_FILE}"
}

# Fonction pour afficher l'aide
afficher_aide() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --sources=SOURCE1,SOURCE2    Sources à scraper (séparées par des virgules)"
  echo "  --skip-scraping              Sauter l'étape de scraping"
  echo "  --skip-enrichment            Sauter l'étape d'enrichissement"
  echo "  --skip-distribution          Sauter l'étape de distribution"
  echo "  --debug                      Activer le mode debug"
  echo "  --use-relay                  Utiliser le service relais Render"
  echo "  --no-relay                   Ne pas utiliser le service relais Render"
  echo "  --help                       Afficher cette aide"
  echo ""
  echo "Exemple: $0 --sources=allocine-films,tmdb-films --debug --use-relay"
}

# Créer le dossier de logs s'il n'existe pas
mkdir -p "${LOGS_DIR}"

# Traiter les arguments
SOURCES=""
SKIP_SCRAPING=false
SKIP_ENRICHMENT=false
SKIP_DISTRIBUTION=false
DEBUG_MODE=false
USE_RELAY_SERVICE=true

for arg in "$@"; do
  case $arg in
    --sources=*)
      SOURCES="${arg#*=}"
      ;;
    --skip-scraping)
      SKIP_SCRAPING=true
      ;;
    --skip-enrichment)
      SKIP_ENRICHMENT=true
      ;;
    --skip-distribution)
      SKIP_DISTRIBUTION=true
      ;;
    --debug)
      DEBUG_MODE=true
      ;;
    --use-relay)
      USE_RELAY_SERVICE=true
      ;;
    --no-relay)
      USE_RELAY_SERVICE=false
      ;;
    --help)
      afficher_aide
      exit 0
      ;;
    *)
      echo -e "${ROUGE}Option inconnue: $arg${NC}"
      afficher_aide
      exit 1
      ;;
  esac
done

# Afficher la bannière
echo -e "${BLEU}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLEU}║                                                                ║${NC}"
echo -e "${BLEU}║             EXÉCUTION LOCALE DU WORKFLOW FLODRAMA             ║${NC}"
echo -e "${BLEU}║                                                                ║${NC}"
echo -e "${BLEU}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Afficher la configuration
echo -e "${JAUNE}Configuration:${NC}"
echo -e "  ${JAUNE}Sources:${NC} ${SOURCES:-Toutes}"
echo -e "  ${JAUNE}Skip Scraping:${NC} ${SKIP_SCRAPING}"
echo -e "  ${JAUNE}Skip Enrichment:${NC} ${SKIP_ENRICHMENT}"
echo -e "  ${JAUNE}Skip Distribution:${NC} ${SKIP_DISTRIBUTION}"
echo -e "  ${JAUNE}Debug Mode:${NC} ${DEBUG_MODE}"
echo -e "  ${JAUNE}Use Relay Service:${NC} ${USE_RELAY_SERVICE}"
echo -e "  ${JAUNE}Log File:${NC} ${LOG_FILE}"
echo ""

# Vérifier les dépendances
log "${JAUNE}🔍 Vérification des dépendances...${NC}"
if ! command -v node &> /dev/null; then
  log "${ROUGE}❌ Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  log "${ROUGE}❌ npm n'est pas installé. Veuillez l'installer pour continuer.${NC}"
  exit 1
fi

# Vérifier si les dépendances Node sont installées
if [ ! -d "${PROJET_DIR}/node_modules" ]; then
  log "${JAUNE}⚠️ Les dépendances Node ne semblent pas être installées. Installation...${NC}"
  cd "${PROJET_DIR}" && npm install --ignore-scripts
  
  # Installation des dépendances spécifiques pour le scraping
  npm install --no-save fs-extra axios cheerio playwright playwright-extra playwright-extra-plugin-stealth
else
  log "${VERT}✅ Dépendances Node déjà installées${NC}"
fi

# Définir les variables d'environnement
export DEBUG_MODE=${DEBUG_MODE}
export USE_RELAY_SERVICE=${USE_RELAY_SERVICE}
export RENDER_API_KEY="rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP"

# Vérifier la clé API TMDB
if [ -z "${TMDB_API_KEY}" ]; then
  log "${JAUNE}⚠️ Variable d'environnement TMDB_API_KEY non définie${NC}"
  log "${JAUNE}⚠️ L'enrichissement des données pourrait échouer${NC}"
  
  # Demander la clé API TMDB si nécessaire et si l'enrichissement n'est pas sauté
  if [ "${SKIP_ENRICHMENT}" = false ]; then
    echo -n "Veuillez entrer votre clé API TMDB (ou laissez vide pour continuer sans): "
    read -r TMDB_API_KEY
    export TMDB_API_KEY="${TMDB_API_KEY}"
  fi
fi

# Vérification du service relais Render si activé
if [ "${USE_RELAY_SERVICE}" = true ] && [ "${SKIP_SCRAPING}" = false ]; then
  log "${JAUNE}🔄 Vérification de la disponibilité du service relais Render...${NC}"
  
  RELAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${RENDER_API_KEY}" https://flodrama-scraper.onrender.com/status)
  
  if [ "${RELAY_STATUS}" = "200" ]; then
    log "${VERT}✅ Service relais Render disponible${NC}"
  else
    log "${ROUGE}⚠️ Service relais Render indisponible (code: ${RELAY_STATUS}), utilisation du fallback local${NC}"
    export USE_RELAY_SERVICE=false
  fi
fi

# Étape de scraping
if [ "${SKIP_SCRAPING}" = false ]; then
  log "${JAUNE}🔍 Démarrage du scraping...${NC}"
  
  # Déterminer les sources à scraper
  SOURCES_ARG=""
  if [ -n "${SOURCES}" ]; then
    SOURCES_ARG="--sources=${SOURCES}"
    log "${JAUNE}Sources spécifiées: ${SOURCES}${NC}"
  else
    log "${JAUNE}Scraping de toutes les sources${NC}"
  fi
  
  # Exécuter le script de scraping optimisé
  cd "${PROJET_DIR}" && node .github/scripts/stealth/scraper-optimise.js ${SOURCES_ARG}
  SCRAPING_STATUS=$?
  
  # Vérifier si des données ont été générées
  if [ ${SCRAPING_STATUS} -eq 0 ] && [ -d "${PROJET_DIR}/cloudflare/scraping/output" ] && [ "$(find "${PROJET_DIR}/cloudflare/scraping/output" -name '*.json' | wc -l)" -gt 0 ]; then
    log "${VERT}✅ Scraping terminé avec succès${NC}"
    SCRAPING_SUCCESS=true
  else
    log "${ROUGE}⚠️ Le scraping n'a pas généré de données, vérifiez les logs pour plus d'informations${NC}"
    SCRAPING_SUCCESS=false
  fi
else
  log "${JAUNE}⏩ Étape de scraping sautée${NC}"
  SCRAPING_SUCCESS=true
fi

# Étape d'enrichissement des données
if [ "${SKIP_ENRICHMENT}" = false ] && [ "${SCRAPING_SUCCESS}" = true ]; then
  log "${JAUNE}🔍 Démarrage de l'enrichissement des données...${NC}"
  cd "${PROJET_DIR}" && node .github/scripts/enrichment/tmdb-enricher.js
  ENRICHMENT_STATUS=$?
  
  if [ ${ENRICHMENT_STATUS} -eq 0 ]; then
    log "${VERT}✅ Enrichissement terminé avec succès${NC}"
    ENRICHMENT_SUCCESS=true
  else
    log "${ROUGE}❌ Erreur lors de l'enrichissement des données${NC}"
    ENRICHMENT_SUCCESS=false
  fi
else
  if [ "${SKIP_ENRICHMENT}" = true ]; then
    log "${JAUNE}⏩ Étape d'enrichissement sautée${NC}"
  else
    log "${ROUGE}⏩ Étape d'enrichissement sautée car le scraping a échoué${NC}"
  fi
  ENRICHMENT_SUCCESS=true
fi

# Étape de distribution des données
if [ "${SKIP_DISTRIBUTION}" = false ] && ([ "${SCRAPING_SUCCESS}" = true ] || [ "${SKIP_SCRAPING}" = true ]); then
  log "${JAUNE}📦 Démarrage de la distribution des données...${NC}"
  
  # Vérifier si wrangler est installé
  if ! command -v wrangler &> /dev/null; then
    log "${JAUNE}⚠️ wrangler n'est pas installé, installation...${NC}"
    npm install -g wrangler
  fi
  
  # Vérifier les variables d'environnement Cloudflare
  if [ -z "${CLOUDFLARE_API_TOKEN}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID}" ]; then
    log "${JAUNE}⚠️ Variables d'environnement Cloudflare non définies${NC}"
    log "${JAUNE}⚠️ La distribution vers Cloudflare D1 ne sera pas effectuée${NC}"
    log "${JAUNE}⚠️ Les fichiers SQL seront générés localement${NC}"
    
    # Exécuter uniquement la génération des fichiers SQL
    cd "${PROJET_DIR}/cloudflare/scraping" && node ./import-to-d1.js --local-only
  else
    # Créer la base de données D1 si elle n'existe pas
    cd "${PROJET_DIR}" && wrangler d1 create flodrama-content --json || echo "Base de données existe déjà"
    
    # Exécuter les migrations de schéma
    cd "${PROJET_DIR}/cloudflare/scraping" && wrangler d1 execute flodrama-content --file=./schema.sql
    
    # Importer les données
    cd "${PROJET_DIR}/cloudflare/scraping" && node ./import-to-d1.js
  fi
  
  log "${VERT}✅ Distribution terminée avec succès${NC}"
else
  if [ "${SKIP_DISTRIBUTION}" = true ]; then
    log "${JAUNE}⏩ Étape de distribution sautée${NC}"
  else
    log "${ROUGE}⏩ Étape de distribution sautée car le scraping a échoué${NC}"
  fi
fi

# Afficher un résumé
echo ""
echo -e "${BLEU}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLEU}║                         RÉSUMÉ                                 ║${NC}"
echo -e "${BLEU}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "${SKIP_SCRAPING}" = false ]; then
  if [ "${SCRAPING_SUCCESS}" = true ]; then
    echo -e "${VERT}✅ Scraping: Succès${NC}"
  else
    echo -e "${ROUGE}❌ Scraping: Échec${NC}"
  fi
else
  echo -e "${JAUNE}⏩ Scraping: Sauté${NC}"
fi

if [ "${SKIP_ENRICHMENT}" = false ]; then
  if [ "${ENRICHMENT_SUCCESS}" = true ]; then
    echo -e "${VERT}✅ Enrichissement: Succès${NC}"
  else
    echo -e "${ROUGE}❌ Enrichissement: Échec${NC}"
  fi
else
  echo -e "${JAUNE}⏩ Enrichissement: Sauté${NC}"
fi

if [ "${SKIP_DISTRIBUTION}" = false ]; then
  echo -e "${VERT}✅ Distribution: Terminée${NC}"
else
  echo -e "${JAUNE}⏩ Distribution: Sautée${NC}"
fi

echo ""
echo -e "${VERT}Logs disponibles dans: ${LOG_FILE}${NC}"
echo ""

# Proposer d'analyser les logs
echo -e "${JAUNE}Souhaitez-vous analyser les logs pour détecter les problèmes potentiels? (o/n)${NC}"
read -r ANALYSE_LOGS

if [ "${ANALYSE_LOGS}" = "o" ] || [ "${ANALYSE_LOGS}" = "O" ] || [ "${ANALYSE_LOGS}" = "oui" ]; then
  log "${JAUNE}🔍 Analyse des logs...${NC}"
  cd "${PROJET_DIR}" && node cloudflare/scraping/analyse-workflow-logs.js
  
  echo -e "${VERT}✅ Analyse terminée. Consultez le rapport dans: ${LOGS_DIR}/analyse-resultats.md${NC}"
fi

echo -e "${VERT}✅ Exécution locale du workflow terminée${NC}"
