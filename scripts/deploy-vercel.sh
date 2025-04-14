#!/bin/bash
# Script de déploiement de FloDrama vers Vercel
# Ce script remplace le déploiement AWS par un déploiement Vercel

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[0;33m'
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

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  erreur "Vercel CLI n'est pas installé. Installation en cours..."
  npm install -g vercel
  if [ $? -ne 0 ]; then
    erreur "Échec de l'installation de Vercel CLI. Veuillez l'installer manuellement avec 'npm install -g vercel'."
    exit 1
  else
    succes "Vercel CLI installé avec succès"
  fi
fi

# Créer une sauvegarde du code actuel
log "Sauvegarde du code actuel..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/flodrama_backup_${TIMESTAMP}.zip"

mkdir -p "${BACKUP_DIR}" 2>/dev/null
if zip -r "${BACKUP_FILE}" "${PROJECT_ROOT}" -x "*/node_modules/*" -x "*/dist/*" -x "*/backups/*" > /dev/null 2>&1; then
  succes "Sauvegarde créée: ${BACKUP_FILE}"
else
  attention "Impossible de créer une sauvegarde, mais le déploiement va continuer"
fi

# Construire l'application
log "Construction de l'application..."
cd "${PROJECT_ROOT}" && npm run build

if [ $? -ne 0 ]; then
  erreur "Échec de la construction de l'application"
  exit 1
else
  succes "Application construite avec succès"
fi

# Déployer sur Vercel
log "Déploiement sur Vercel..."
cd "${PROJECT_ROOT}" && vercel --prod

if [ $? -ne 0 ]; then
  erreur "Échec du déploiement sur Vercel"
  exit 1
else
  succes "Déploiement sur Vercel réussi"
fi

# Afficher les informations de déploiement
echo ""
succes "Déploiement terminé!"
echo -e "${VERT}URL de production:${NC} https://flodrama.vercel.app"
echo -e "${VERT}URL de prévisualisation:${NC} https://flodrama-git-main-<username>.vercel.app"

# Conseils post-déploiement
echo ""
log "Conseils post-déploiement:"
echo "1. Vérifiez votre application sur l'URL de production"
echo "2. Si vous souhaitez utiliser un domaine personnalisé, configurez-le dans les paramètres du projet Vercel"
echo "3. Pour les déploiements futurs, utilisez simplement './scripts/deploy-vercel.sh'"
