#!/bin/bash
# Script de configuration des variables d'environnement Vercel pour FloDrama
# Ce script automatise l'ajout des variables d'environnement à Vercel

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

# Vérifier si l'utilisateur est connecté à Vercel
log "Vérification de la connexion à Vercel..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
  attention "Vous n'êtes pas connecté à Vercel. Connexion en cours..."
  vercel login
  if [ $? -ne 0 ]; then
    erreur "Échec de la connexion à Vercel."
    exit 1
  else
    succes "Connexion à Vercel réussie"
  fi
fi

# Configurer les variables d'environnement à partir du fichier .env
log "Configuration des variables d'environnement Vercel..."

# Variables AWS pour le système hybride
log "Configuration des variables AWS pour le système hybride..."
vercel env add AWS_API_ENDPOINT production < <(echo "https://yqek2f5uph.execute-api.us-east-1.amazonaws.com")
vercel env add AWS_API_KEY production < <(echo "flodrama-api-key-2025")
vercel env add AWS_CLOUDFRONT_URL production < <(echo "https://dyba0cgavum1j.cloudfront.net")
vercel env add AWS_S3_BUCKET production < <(echo "flodrama-video-cache")
vercel env add AWS_DYNAMODB_TABLE production < <(echo "flodrama-streaming-metadata")

# Variables pour le proxy de streaming
log "Configuration des variables pour le proxy de streaming..."
vercel env add VITE_VIDEO_PROXY_ENABLED production < <(echo "true")
vercel env add VITE_VIDEO_PROXY_URL production < <(echo "https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream")
vercel env add VITE_VIDEO_FALLBACK_ENABLED production < <(echo "true")

# Autres variables d'environnement
log "Configuration des autres variables d'environnement..."
vercel env add VITE_MAINTENANCE_MODE production < <(echo "false")
vercel env add VITE_ENABLE_ENHANCED_UI production < <(echo "true")
vercel env add VITE_DEFAULT_INTERFACE production < <(echo "enhanced")
vercel env add VITE_ENABLE_ANALYTICS production < <(echo "true")

# Redéployer l'application pour appliquer les nouvelles variables
log "Redéploiement de l'application pour appliquer les nouvelles variables..."
vercel --prod

if [ $? -ne 0 ]; then
  erreur "Échec du redéploiement de l'application"
  exit 1
else
  succes "Redéploiement réussi avec les nouvelles variables d'environnement"
fi

# Afficher les informations de configuration
echo ""
succes "Configuration des variables d'environnement terminée!"
echo -e "${VERT}URL de production:${NC} https://flodrama.vercel.app"
echo -e "${VERT}Système hybride de lecture vidéo:${NC} Configuré et actif"

# Conseils post-configuration
echo ""
log "Conseils post-configuration:"
echo "1. Vérifiez que le système de lecture vidéo fonctionne correctement sur l'URL de production"
echo "2. Testez le fallback en cas d'indisponibilité du service AWS"
echo "3. Surveillez les performances du système hybride dans le dashboard Vercel"
