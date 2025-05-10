#!/bin/bash

# Script pour lancer l'automatisation complète de FloDrama
# Ce script permet de lancer facilement le processus complet
# de scraping, validation, correction et déploiement.

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  log_error "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si les dépendances npm sont installées
if [ ! -d "node_modules" ]; then
  log_warning "Les dépendances npm ne semblent pas être installées."
  log "Installation des dépendances..."
  npm install
fi

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p logs
mkdir -p output
mkdir -p fixed-output
mkdir -p kv-reports

# Définir la variable d'environnement pour le webhook Discord si fourni
if [ ! -z "$1" ]; then
  export DISCORD_WEBHOOK_URL="$1"
  log "Webhook Discord configuré: $DISCORD_WEBHOOK_URL"
else
  log_warning "Aucun webhook Discord fourni. Les notifications ne seront pas envoyées."
fi

# Lancer le script d'automatisation
log "Démarrage de l'automatisation complète FloDrama..."
node automatisation-complete.js

# Vérifier le code de retour
if [ $? -eq 0 ]; then
  log_success "Automatisation terminée avec succès!"
else
  log_error "L'automatisation a échoué. Consultez les logs pour plus de détails."
fi

# Afficher les statistiques
log "Génération des statistiques..."
log "Nombre de fichiers dans output: $(ls -1 output/*.json 2>/dev/null | wc -l)"
log "Nombre de fichiers dans fixed-output: $(ls -1 fixed-output/*.json 2>/dev/null | wc -l)"
log "Nombre de rapports de santé: $(ls -1 kv-reports/health-report-*.json 2>/dev/null | wc -l)"

# Afficher les derniers logs
log "Derniers logs générés:"
ls -lt logs | head -n 5

log_success "Script terminé. Consultez les rapports dans le dossier logs pour plus de détails."
