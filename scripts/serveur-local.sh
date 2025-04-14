#!/bin/bash
# Script pour lancer un serveur local pour FloDrama
# Ce script utilise Python pour créer un serveur HTTP simple

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configuration
PORT=8000
DIST_DIR="${PROJECT_ROOT}/dist"

# Vérifier si le répertoire dist existe
if [ ! -d "$DIST_DIR" ]; then
  log "Construction de l'application..."
  cd "${PROJECT_ROOT}" && npm run build
  
  if [ $? -ne 0 ]; then
    erreur "Échec de la construction de l'application"
    exit 1
  else
    succes "Application construite avec succès"
  fi
fi

# Vérifier si le dossier data existe dans dist
if [ ! -d "${DIST_DIR}/data" ]; then
  log "Création du dossier data..."
  mkdir -p "${DIST_DIR}/data"
fi

# Copier le fichier metadata.json dans dist/data
if [ -f "${PROJECT_ROOT}/public/assets/data/metadata.json" ]; then
  log "Copie du fichier metadata.json dans dist/data..."
  cp "${PROJECT_ROOT}/public/assets/data/metadata.json" "${DIST_DIR}/data/"
  succes "Fichier metadata.json copié avec succès"
else
  erreur "Fichier metadata.json introuvable dans public/assets/data/"
  exit 1
fi

# Lancer le serveur
log "Lancement du serveur sur le port $PORT..."
log "L'application sera accessible à l'adresse: http://localhost:$PORT"
log "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Changer de répertoire et lancer le serveur
cd "${DIST_DIR}" && python3 -m http.server $PORT

# Ce code ne sera exécuté que si le serveur est arrêté
echo ""
log "Serveur arrêté"
