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

# Attendre que le serveur soit prêt
log "⏳ Attente du démarrage complet du serveur relay..."
sleep 5

# Lancer le scraping
section "LANCEMENT DU SCRAPING"
log "🔍 Démarrage du scraping sur toutes les sources..."

node "$DIR/test-scraping-local.js"

log "✅ Scraping terminé"

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
  kill $RELAY_PID || true
  rm "$DIR/relay_pid.txt"
  echo "stopped" > "$DIR/relay_status.txt"
  log "✅ Serveur relay arrêté"
else
  log "⚠️ Fichier PID non trouvé, impossible d'arrêter le serveur relay"
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
