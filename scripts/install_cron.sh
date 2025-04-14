#!/bin/bash

# Configuration
PROJECT_DIR="/Users/floriace/Trae/flodrama-react-lynx"
CRON_JOB="0 4 * * * $PROJECT_DIR/scripts/update_lynx_docs.sh"

# Vérification des droits d'exécution
if [ ! -x "$PROJECT_DIR/scripts/update_lynx_docs.sh" ]; then
    echo "❌ Le script update_lynx_docs.sh n'est pas exécutable"
    echo "🔧 Application des droits d'exécution..."
    chmod +x "$PROJECT_DIR/scripts/update_lynx_docs.sh"
fi

# Sauvegarde du crontab actuel
crontab -l > crontab.tmp 2>/dev/null || echo "" > crontab.tmp

# Vérification si la tâche existe déjà
if grep -q "update_lynx_docs.sh" crontab.tmp; then
    echo "ℹ️ La tâche cron existe déjà"
else
    # Ajout de la nouvelle tâche
    echo "# Mise à jour quotidienne de la documentation Lynx à 4h du matin" >> crontab.tmp
    echo "$CRON_JOB" >> crontab.tmp
    
    # Installation du nouveau crontab
    crontab crontab.tmp
    echo "✅ Tâche cron installée avec succès"
fi

# Nettoyage
rm crontab.tmp

echo "📋 Tâches cron actuelles :"
crontab -l
