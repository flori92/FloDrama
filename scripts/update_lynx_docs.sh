#!/bin/bash

# Configuration
PROJECT_DIR="/Users/floriace/Trae/flodrama-react-lynx"
LOG_FILE="$PROJECT_DIR/logs/lynx_docs_update.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Création du dossier de logs s'il n'existe pas
mkdir -p "$PROJECT_DIR/logs"

# Fonction de logging
log() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# Début de la mise à jour
log "🚀 Début de la mise à jour de la documentation Lynx"

# Activation de l'environnement virtuel et exécution du script Python
cd "$PROJECT_DIR" || exit 1
source venv/bin/activate

# Exécution du script de récupération
log "📥 Récupération des données des repos"
python3 scripts/fetch_lynx_repos.py >> "$LOG_FILE" 2>&1

# Vérification du résultat
if [ $? -eq 0 ]; then
    log "✅ Mise à jour réussie"
else
    log "❌ Erreur lors de la mise à jour"
    exit 1
fi

# Désactivation de l'environnement virtuel
deactivate

# Commit des changements si nécessaire
if [[ $(git status --porcelain) ]]; then
    log "📝 Commit des modifications"
    git add data/lynx_repos.json
    git commit -m "📚 [DOC] Mise à jour automatique de la documentation Lynx - $TIMESTAMP"
    git push origin main
    
    if [ $? -eq 0 ]; then
        log "✅ Push réussi"
    else
        log "❌ Erreur lors du push"
    fi
else
    log "ℹ️ Aucune modification à commiter"
fi

log "🏁 Fin de la mise à jour"
