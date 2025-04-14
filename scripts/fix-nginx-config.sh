#!/bin/bash
# Script pour corriger la configuration Nginx de FloDrama

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier si le dossier assets/data existe dans le répertoire de déploiement
NGINX_DOC_ROOT="/opt/homebrew/var/www/flodrama"
if [ ! -d "${NGINX_DOC_ROOT}/assets/data" ]; then
  log "Création du dossier assets/data..."
  mkdir -p "${NGINX_DOC_ROOT}/assets/data"
fi

# Vérifier si le fichier metadata.json existe
if [ ! -f "${NGINX_DOC_ROOT}/assets/data/metadata.json" ]; then
  log "Copie du fichier metadata.json..."
  cp -f "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/data/metadata.json" "${NGINX_DOC_ROOT}/assets/data/"
fi

# Créer également une copie dans /data pour les requêtes directes
if [ ! -d "${NGINX_DOC_ROOT}/data" ]; then
  log "Création du dossier /data..."
  mkdir -p "${NGINX_DOC_ROOT}/data"
fi

# Copier le fichier metadata.json dans /data
log "Copie du fichier metadata.json dans /data..."
cp -f "${NGINX_DOC_ROOT}/assets/data/metadata.json" "${NGINX_DOC_ROOT}/data/"

# Vérifier que les fichiers existent
if [ -f "${NGINX_DOC_ROOT}/assets/data/metadata.json" ] && [ -f "${NGINX_DOC_ROOT}/data/metadata.json" ]; then
  success "Fichiers de métadonnées correctement placés"
else
  error "Problème lors de la copie des fichiers de métadonnées"
  exit 1
fi

# Redémarrer Nginx
log "Redémarrage de Nginx..."
brew services restart nginx

if [ $? -eq 0 ]; then
  success "Nginx redémarré avec succès"
else
  error "Échec du redémarrage de Nginx"
  exit 1
fi

echo ""
success "Configuration Nginx corrigée!"
echo -e "${GREEN}URL:${NC} http://localhost:8080"
echo -e "${GREEN}Métadonnées accessibles via:${NC}"
echo -e "  - http://localhost:8080/data/metadata.json"
echo -e "  - http://localhost:8080/assets/data/metadata.json"
echo -e "  - http://localhost:8080/api/metadata"
