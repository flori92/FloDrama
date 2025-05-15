#!/bin/bash
# Script pour lancer le scraping avec le serveur local

# Définir les variables d'environnement
export RENDER_SERVICE_URL="http://localhost:3000"
export RENDER_API_KEY="rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP"
export USE_RELAY_SERVICE="true"
export DEBUG_MODE="true"

# Vérifier si le serveur local est en cours d'exécution
if ! curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $RENDER_API_KEY" http://localhost:3000/status | grep -q "200"; then
  echo "🚀 Démarrage du serveur local..."
  node $(dirname "$0")/serveur-relay-local.js > $(dirname "$0")/relay-logs.txt 2>&1 &
  SERVER_PID=$!
  echo "✅ Serveur local démarré avec PID $SERVER_PID"
  sleep 2 # Attendre que le serveur démarre
else
  echo "✅ Serveur local déjà en cours d'exécution"
fi

# Exécuter le script de scraping
echo "🔍 Démarrage du scraping..."
cd "$(dirname "$0")/../../"
node .github/scripts/stealth/scraper-optimise.js "$@"

# Vérifier si des données ont été générées
if [ -d "./cloudflare/scraping/output" ] && [ "$(find ./cloudflare/scraping/output -name '*.json' | wc -l)" -gt 0 ]; then
  echo "✅ Scraping terminé avec succès"
  
  # Enrichir les données si TMDB_API_KEY est défini
  if [ -n "$TMDB_API_KEY" ]; then
    echo "🔍 Enrichissement des données via TMDB..."
    node .github/scripts/enrichment/tmdb-enricher.js
    echo "✅ Enrichissement terminé avec succès"
  fi
  
  # Importer les données dans D1 si demandé
  if [ "$1" == "--import" ] || [ "$2" == "--import" ]; then
    echo "📦 Importation des données dans D1..."
    cd cloudflare/scraping
    node ./import-to-d1.js
    echo "✅ Importation terminée avec succès"
  fi
else
  echo "⚠️ Le scraping n'a pas généré de données"
fi

echo "✅ Processus terminé"
