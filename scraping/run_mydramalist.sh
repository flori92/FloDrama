#!/bin/bash

# Script pour exécuter le scraper MyDramaList
# Utilisation: ./run_mydramalist.sh

# Configurer le chemin du fichier de logs
LOG_DIR="scraping/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/mydramalist-$TIMESTAMP.log"

# Afficher un message de démarrage
echo "📝 Les logs seront enregistrés dans $LOG_FILE"

# Activer l'environnement virtuel s'il existe
if [ -d "venv" ]; then
    echo "🔍 Activation de l'environnement virtuel Python..."
    source venv/bin/activate
fi

# Vérifier les dépendances Python
echo "🔍 Vérification des dépendances Python..."
pip install supabase requests beautifulsoup4 python-dotenv

# Variables d'environnement pour le scraping
export MIN_ITEMS=20
export TARGET_TABLE=dramas
export SOURCE_ID=mydramalist

# Lancer le scraping
echo "🚀 Lancement du scraping MyDramaList..."
python -m scraping.test_mydramalist | tee -a "$LOG_FILE"

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo "✅ Scraping terminé ! Vérifiez les logs pour plus de détails."
else
    echo "❌ Le scraping a échoué. Consultez les logs pour identifier le problème."
    exit 1
fi
