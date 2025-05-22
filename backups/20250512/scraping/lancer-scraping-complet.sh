#!/bin/bash
# Script de lancement complet du scraping FloDrama
# Ce script lance le scraping, analyse les résultats et surveille la santé des sources

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Dossier courant
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Fonction pour afficher un message avec timestamp
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

# Fonction pour afficher une section
section() {
  echo ""
  echo -e "${JAUNE}========== $1 ==========${NC}"
  echo ""
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  echo -e "${ROUGE}❌ Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
  exit 1
fi

# Créer les dossiers nécessaires
mkdir -p "$DIR/output"
mkdir -p "$DIR/reports"
mkdir -p "$DIR/source-health"

# Fonction pour libérer le port du serveur relay
liberer_port() {
  PORT=$1
  echo -e "${JAUNE}⚠️ Vérification du port $PORT...${NC}"
  
  # Vérifier si le port est utilisé
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${ROUGE}⚠️ Le port $PORT est utilisé. Tentative de libération...${NC}"
    
    # Identifier tous les processus utilisant ce port
    PIDS=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    
    # Tuer chaque processus individuellement
    for PID in $PIDS; do
      echo -e "${JAUNE}🔄 Arrêt du processus $PID...${NC}"
      kill -15 $PID 2>/dev/null || true
      sleep 1
      
      # Si processus toujours en vie, force kill
      if ps -p $PID > /dev/null; then
        echo -e "${ROUGE}⚠️ Processus $PID résistant, force kill...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
      fi
    done
    
    # Vérifier que le port est libéré
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
      echo -e "${ROUGE}❌ Échec de libération du port $PORT après plusieurs tentatives.${NC}"
    else
      echo -e "${VERT}✅ Port $PORT libéré avec succès${NC}"
      return 0
    fi
  else
    echo -e "${VERT}✅ Port $PORT disponible${NC}"
    return 0
  fi
}

# Libérer le port 3000 utilisé par le serveur relay
PORT=3000
liberer_port $PORT

# Démarrer le serveur relay en arrière-plan
section "DÉMARRAGE DU SERVEUR RELAY"
log "🚀 Démarrage du serveur relay local..."

# Sauvegarder le PID dans un fichier pour pouvoir l'arrêter plus tard
node "$DIR/serveur-relay-local-v2.js" > "$DIR/relay-logs.txt" 2>&1 &
RELAY_PID=$!
echo $RELAY_PID > "$DIR/relay_pid.txt"
echo "running" > "$DIR/relay_status.txt"

log "✅ Serveur relay démarré avec PID: $RELAY_PID"
log "📝 Logs disponibles dans: $DIR/relay-logs.txt"

# Attendre que le serveur soit prêt et vérifier qu'il fonctionne correctement
log "⏳ Attente du démarrage complet du serveur relay..."
sleep 5

# Vérifier que le serveur est bien en cours d'exécution
if ! ps -p $RELAY_PID > /dev/null; then
  echo -e "${ROUGE}❌ Le serveur relay n'a pas démarré correctement. Vérifiez les logs pour plus de détails.${NC}"
  cat "$DIR/relay-logs.txt"
  exit 1
fi

# Lancer le scraping
section "LANCEMENT DU SCRAPING GÉNÉRAL"
log "🔍 Démarrage du scraping sur toutes les sources..."

node "$DIR/test-scraping-local.js"

log "✅ Scraping général terminé"

# Fonction pour extraire les URLs de streaming d'une source
extraire_streaming() {
  SOURCE=$1
  LIMIT=$2
  
  log "📺 Extraction depuis $SOURCE (limite: $LIMIT)..."
  
  # Vérifier que la source est configurée
  if ! grep -q "'$SOURCE'" "$DIR/src/sources-config.js"; then
    echo -e "${ROUGE}⚠️ Source '$SOURCE' non trouvée dans la configuration!${NC}"
    return 1
  fi
  
  # Extraire les URLs de streaming avec limitation de temps (macOS compatible)
  # Définir la durée maximale en secondes
  MAX_DURATION=300
  
  # Lancer l'extraction en arrière-plan
  node "$DIR/src/enhanced-streaming-extractor.js" --source "$SOURCE" --limit "$LIMIT" & 
  EXTRACT_PID=$!
  
  # Attendre le processus avec timeout personnalisé
  SECONDS=0
  while kill -0 $EXTRACT_PID 2>/dev/null; do
    if [ $SECONDS -ge $MAX_DURATION ]; then
      echo -e "${ROUGE}⚠️ Durée maximale de $MAX_DURATION secondes atteinte, arrêt forcé...${NC}"
      kill -9 $EXTRACT_PID 2>/dev/null
      wait $EXTRACT_PID 2>/dev/null
      return 124  # Code de retour similaire à timeout
    fi
    # Attendre 1 seconde
    sleep 1
  done
  
  # Récupérer le code de retour du processus
  wait $EXTRACT_PID
  RESULT=$?
  
  # Vérifier le code de retour
  if [ $RESULT -eq 124 ]; then
    echo -e "${ROUGE}⚠️ Timeout atteint lors de l'extraction depuis $SOURCE${NC}"
    return 1
  elif [ $RESULT -ne 0 ]; then
    echo -e "${ROUGE}⚠️ Erreur lors de l'extraction depuis $SOURCE (code: $RESULT)${NC}"
    return $RESULT
  fi
  
  # Vérifier les résultats
  COUNT=$(ls -1 "$DIR/scraping-results/streaming/${SOURCE}_"* 2>/dev/null | wc -l)
  if [ $COUNT -eq 0 ]; then
    echo -e "${JAUNE}⚠️ Aucune URL de streaming extraite depuis $SOURCE${NC}"
    return 0
  else
    echo -e "${VERT}✅ $COUNT URL(s) de streaming extraite(s) depuis $SOURCE${NC}"
    return 0
  fi
}

# Lancer l'extraction des streaming
section "EXTRACTION DES URLS DE STREAMING"
log "🎬 Démarrage de l'extraction des URLs de streaming..."

# Création du dossier pour les résultats de streaming s'il n'existe pas
mkdir -p "$DIR/scraping-results/streaming"

# Définir la liste des sources et la limite d'extraction par catégorie
# Dramas
DRAMAS_SOURCES=("dramacool" "viewasian" "kissasian" "voirdrama")
# Animes
ANIMES_SOURCES=("gogoanime" "nekosama" "voiranime")
# Films
FILMS_SOURCES=("vostfree" "streamingdivx" "filmcomplet")
# Bollywood
BOLLYWOOD_SOURCES=("bollyplay" "hindilinks4u")

# Combiner toutes les sources
SOURCES=(${DRAMAS_SOURCES[@]} ${ANIMES_SOURCES[@]} ${FILMS_SOURCES[@]} ${BOLLYWOOD_SOURCES[@]})
LIMIT=10
SUCCESS_COUNT=0
FAIL_COUNT=0

# Extraire les URLs de streaming pour chaque source
for SOURCE in "${SOURCES[@]}"; do
  extraire_streaming "$SOURCE" "$LIMIT"
  if [ $? -eq 0 ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT+1))
  else
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
done

# Récapitulatif
section "RÉCAPITULATIF DE L'EXTRACTION"
log "📊 Bilan de l'extraction des URLs de streaming:"
log "  - Sources traitées avec succès: $SUCCESS_COUNT/${#SOURCES[@]}"
log "  - Sources en échec: $FAIL_COUNT/${#SOURCES[@]}"
log "  - Dossier des résultats: $DIR/scraping-results/streaming"

log "✅ Extraction des URLs de streaming terminée"

# Analyser les résultats
section "ANALYSE DES RÉSULTATS"
log "📊 Analyse des résultats du scraping..."

node "$DIR/analyze-scraping-results.js"

# Surveiller la santé des sources
section "SURVEILLANCE DE LA SANTÉ DES SOURCES"
log "🏥 Vérification de la santé des sources..."

node "$DIR/monitor-sources-health.js"

# Arrêter le serveur relay
section "ARRÊT DU SERVEUR RELAY"
log "🛑 Arrêt du serveur relay local..."

if [ -f "$DIR/relay_pid.txt" ]; then
  RELAY_PID=$(cat "$DIR/relay_pid.txt")
  if ps -p $RELAY_PID > /dev/null; then
    kill $RELAY_PID || true
    sleep 1
    # Vérifier si le processus est toujours en cours d'exécution
    if ps -p $RELAY_PID > /dev/null; then
      log "⚠️ Le processus ne s'est pas arrêté normalement, utilisation de kill -9"
      kill -9 $RELAY_PID || true
    fi
  else
    log "⚠️ Le processus $RELAY_PID n'est plus en cours d'exécution"
  fi
  rm "$DIR/relay_pid.txt"
  echo "stopped" > "$DIR/relay_status.txt"
  log "✅ Serveur relay arrêté"
else
  log "⚠️ Fichier PID non trouvé, recherche des processus node en cours..."
  # Rechercher les processus node qui pourraient être le serveur relay
  NODE_PIDS=$(ps aux | grep "[n]ode.*serveur-relay" | awk '{print $2}')
  if [ -n "$NODE_PIDS" ]; then
    log "🔍 Processus serveur relay trouvés: $NODE_PIDS"
    for PID in $NODE_PIDS; do
      kill $PID || true
    done
    log "✅ Processus arrêtés"
  else
    log "✅ Aucun processus serveur relay en cours d'exécution"
  fi
fi

# Résumé final
section "RÉSUMÉ"
log "✅ Processus de scraping complet terminé"
log "📁 Résultats disponibles dans:"
log "   - Données: $DIR/output/"
log "   - Rapports: $DIR/reports/"
log "   - Santé des sources: $DIR/source-health/"

echo ""
log "${VERT}Merci d'avoir utilisé le système de scraping FloDrama !${NC}"
echo ""
