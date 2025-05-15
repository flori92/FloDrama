#!/bin/bash
# Script d'extraction massive de contenu pour FloDrama
# Ce script lance le scraping de toutes les sources configurées avec des limites élevées

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Dossier courant
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configuration
OUTPUT_DIR="$DIR/extraction-massive"
LOGS_DIR="$DIR/logs"
LIMIT_DRAMAS=500
LIMIT_ANIMES=500
LIMIT_FILMS=300
LIMIT_BOLLYWOOD=200
RETRY_COUNT=3
DELAY_BETWEEN_SOURCES=5 # En secondes

# Créer les répertoires nécessaires
mkdir -p "$OUTPUT_DIR/dramas"
mkdir -p "$OUTPUT_DIR/animes"
mkdir -p "$OUTPUT_DIR/films"
mkdir -p "$OUTPUT_DIR/bollywood"
mkdir -p "$LOGS_DIR"

# Fonction pour afficher un message avec timestamp
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "$LOGS_DIR/extraction-massive.log"
}

# Fonction pour afficher une section
section() {
  echo ""
  echo -e "${JAUNE}========== $1 ==========${NC}"
  echo "" 
  echo "========== $1 ==========" >> "$LOGS_DIR/extraction-massive.log"
}

# Fonction pour extraire le contenu d'une source
extraire_contenu() {
  SOURCE=$1
  CATEGORIE=$2
  LIMITE=$3
  RETRY=$RETRY_COUNT
  
  log "📥 Début de l'extraction depuis $SOURCE (limite: $LIMITE)..."
  
  while [ $RETRY -gt 0 ]; do
    log "🔄 Tentative d'extraction ($((RETRY_COUNT - RETRY + 1))/$RETRY_COUNT)..."
    
    # Exécuter la commande de scraping et enregistrer le résultat
    OUTPUT_FILE="$OUTPUT_DIR/$CATEGORIE/${SOURCE}_$(date +%Y%m%d_%H%M%S).json"
    LOG_FILE="$LOGS_DIR/${SOURCE}_$(date +%Y%m%d_%H%M%S).log"
    
    node "$DIR/src/cli-scraper.js" --source="$SOURCE" --limit="$LIMITE" --output="$OUTPUT_FILE" --debug --save > "$LOG_FILE" 2>&1
    
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
      # Vérifier si le fichier de sortie existe et n'est pas vide
      if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
        # Compter le nombre d'éléments dans le fichier JSON
        ITEM_COUNT=$(grep -o '"id":' "$OUTPUT_FILE" | wc -l)
        
        if [ $ITEM_COUNT -gt 0 ]; then
          log "${VERT}✅ Extraction réussie depuis $SOURCE: $ITEM_COUNT éléments récupérés${NC}"
          break
        else
          log "${JAUNE}⚠️ Le fichier de sortie ne contient aucun élément. Nouvel essai...${NC}"
          RETRY=$((RETRY - 1))
        fi
      else
        log "${JAUNE}⚠️ Fichier de sortie vide ou inexistant. Nouvel essai...${NC}"
        RETRY=$((RETRY - 1))
      fi
    else
      log "${ROUGE}❌ Échec de l'extraction depuis $SOURCE (code: $RESULT). Nouvel essai...${NC}"
      RETRY=$((RETRY - 1))
    fi
    
    # Attendre avant un nouvel essai
    if [ $RETRY -gt 0 ]; then
      log "⏳ Attente avant le prochain essai (${DELAY_BETWEEN_SOURCES}s)..."
      sleep $DELAY_BETWEEN_SOURCES
    fi
  done
  
  if [ $RETRY -eq 0 ]; then
    log "${ROUGE}❌ Échec définitif de l'extraction depuis $SOURCE après $RETRY_COUNT tentatives${NC}"
    return 1
  fi
  
  return 0
}

# Lancer une extraction optimisée pour une catégorie
extraire_categorie() {
  CATEGORIE=$1
  SOURCES=$2
  LIMITE=$3
  
  section "EXTRACTION DE CONTENU: $CATEGORIE"
  
  SUCCESS_COUNT=0
  FAIL_COUNT=0
  
  for SOURCE in $SOURCES; do
    extraire_contenu "$SOURCE" "$CATEGORIE" "$LIMITE"
    
    if [ $? -eq 0 ]; then
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Pause entre les extractions pour éviter la détection par anti-bot
    log "⏳ Pause de ${DELAY_BETWEEN_SOURCES}s avant la prochaine source..."
    sleep $DELAY_BETWEEN_SOURCES
  done
  
  log "${MAGENTA}📊 Bilan de l'extraction pour $CATEGORIE:${NC}"
  log "${MAGENTA}  - Sources traitées avec succès: $SUCCESS_COUNT${NC}"
  log "${MAGENTA}  - Sources en échec: $FAIL_COUNT${NC}"
}

# Fonction principale
main() {
  section "DÉMARRAGE DE L'EXTRACTION MASSIVE"
  log "📝 Configurations:"
  log "  - Limite dramas: $LIMIT_DRAMAS"
  log "  - Limite animes: $LIMIT_ANIMES"
  log "  - Limite films: $LIMIT_FILMS"
  log "  - Limite bollywood: $LIMIT_BOLLYWOOD"
  log "  - Tentatives par source: $RETRY_COUNT"
  log "  - Délai entre sources: ${DELAY_BETWEEN_SOURCES}s"
  
  # Extraction des dramas
  extraire_categorie "dramas" "dramacool viewasian kissasian voirdrama" $LIMIT_DRAMAS
  
  # Extraction des animes
  extraire_categorie "animes" "gogoanime nekosama voiranime" $LIMIT_ANIMES
  
  # Extraction des films
  extraire_categorie "films" "vostfree streamingdivx filmcomplet" $LIMIT_FILMS
  
  # Extraction des contenus bollywood
  extraire_categorie "bollywood" "bollyplay hindilinks4u" $LIMIT_BOLLYWOOD
  
  # Bilan final
  section "BILAN DE L'EXTRACTION MASSIVE"
  log "${VERT}✅ Extraction massive terminée${NC}"
  log "📁 Résultats disponibles dans: $OUTPUT_DIR"
  log "📝 Logs disponibles dans: $LOGS_DIR"
}

# Démarrer le script
main
