#!/bin/bash
# Script d'automatisation du pipeline complet : scraping → injection SQL → vérification
# À exécuter périodiquement via cron ou manuellement

# Configuration
SCRAPING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$SCRAPING_DIR/logs/pipeline_$(date +%Y%m%d_%H%M%S).log"
SLACK_WEBHOOK_URL="" # À configurer si notification Slack souhaitée

# Création du dossier de logs s'il n'existe pas
mkdir -p "$SCRAPING_DIR/logs"

# Fonction de logging
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Fonction de notification (Slack ou autre)
notify() {
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$1\"}" "$SLACK_WEBHOOK_URL"
  fi
  log "$1"
}

# Début du pipeline
log "=== DÉBUT DU PIPELINE FLODRAMA ==="

# 1. Exécution des scripts de scraping
log "Étape 1: Lancement du scraping..."
cd "$SCRAPING_DIR" && node src/cli-scraper.js --all
if [ $? -ne 0 ]; then
  notify "❌ ERREUR: Le scraping a échoué. Vérifiez les logs."
  exit 1
fi
log "✅ Scraping terminé avec succès."

# 2. Conversion des résultats (si nécessaire)
log "Étape 2: Conversion des résultats..."
cd "$SCRAPING_DIR" && node src/index.js --convert
if [ $? -ne 0 ]; then
  notify "❌ ERREUR: La conversion a échoué. Vérifiez les logs."
  exit 1
fi
log "✅ Conversion terminée avec succès."

# 3. Injection dans la base SQL
log "Étape 3: Injection dans la base SQL..."
cd "$SCRAPING_DIR/scripts" && node inject_scraped_content.js
if [ $? -ne 0 ]; then
  notify "❌ ERREUR: L'injection SQL a échoué. Vérifiez les logs."
  exit 1
fi
log "✅ Injection SQL terminée avec succès."

# 4. Vérification de la disponibilité des données via l'API
log "Étape 4: Vérification de l'API..."
API_CHECK=$(curl -s "https://flodrama-api.florifavi.workers.dev/api/dramas" | grep -c "success")
if [ "$API_CHECK" -lt 1 ]; then
  notify "⚠️ AVERTISSEMENT: La vérification de l'API a échoué. Les données pourraient ne pas être disponibles."
else
  log "✅ Vérification de l'API réussie. Les données sont disponibles."
fi

# Fin du pipeline
log "=== FIN DU PIPELINE FLODRAMA ==="
notify "🎬 Pipeline FloDrama terminé avec succès! Nouvelles données disponibles."

exit 0
