#!/bin/bash
# Script pour exécuter le scraping VoirDrama et alimenter Supabase

# Variables de configuration
export SUPABASE_URL="https://fffgoqubrbgppcqqkyod.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY4MzUwNCwiZXhwIjoyMDYxMjU5NTA0fQ.0ahlAEbmf3eK-utoUTuBEFSOpO_2qPN6k_YdxQzL4XI"
export TARGET_TABLE="dramas"

# Création du dossier de logs
mkdir -p scraping/logs

# Création d'un log pour le scraping
LOG_FILE="scraping/logs/voirdrama-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Les logs seront enregistrés dans $LOG_FILE"

# Vérification des dépendances Python
echo "🔍 Vérification des dépendances Python..."
pip install supabase requests beautifulsoup4 python-dotenv

# Exécution du script de scraping
echo "🚀 Lancement du scraping VoirDrama..."
python scraping/sources/voirdrama.py 2>&1 | tee -a "$LOG_FILE"

echo "✅ Scraping terminé ! Vérifiez les logs pour plus de détails."
