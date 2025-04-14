#!/bin/bash
# Script de déploiement de FloDrama avec Nginx
# Ce script configure Nginx pour servir l'application FloDrama en local

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
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

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configuration
NGINX_CONFIG_DIR="/opt/homebrew/etc/nginx"
NGINX_SERVERS_DIR="${NGINX_CONFIG_DIR}/servers"
NGINX_CONF_FILE="${NGINX_SERVERS_DIR}/flodrama.conf"
NGINX_DOC_ROOT="/opt/homebrew/var/www/flodrama"
NGINX_PORT=8080

# Vérifier si Nginx est installé
if ! command -v nginx &> /dev/null; then
  error "Nginx n'est pas installé. Veuillez l'installer avec 'brew install nginx'."
  exit 1
fi

# Créer une sauvegarde du code actuel
log "Sauvegarde du code actuel..."
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/flodrama_backup_${TIMESTAMP}.zip"

mkdir -p "${BACKUP_DIR}"
if zip -r "${BACKUP_FILE}" "${PROJECT_ROOT}" -x "*/node_modules/*" -x "*/dist/*" -x "*/backups/*" > /dev/null; then
  success "Sauvegarde créée: ${BACKUP_FILE}"
else
  error "Échec de la création de la sauvegarde"
  exit 1
fi

# Construire l'application
log "Construction de l'application..."
cd "${PROJECT_ROOT}" && npm run build

if [ $? -ne 0 ]; then
  error "Échec de la construction de l'application"
  exit 1
else
  success "Application construite avec succès"
fi

# Créer le répertoire de déploiement
log "Création du répertoire de déploiement Nginx..."
mkdir -p "${NGINX_DOC_ROOT}"

# Copier les fichiers de build vers le répertoire de déploiement
log "Copie des fichiers vers le répertoire de déploiement..."
cp -R "${PROJECT_ROOT}/dist/"* "${NGINX_DOC_ROOT}/"

if [ $? -ne 0 ]; then
  error "Échec de la copie des fichiers"
  exit 1
else
  success "Fichiers copiés avec succès"
fi

# Créer le répertoire des serveurs Nginx s'il n'existe pas
mkdir -p "${NGINX_SERVERS_DIR}"

# Créer la configuration Nginx pour FloDrama
log "Création de la configuration Nginx..."
cat > "${NGINX_CONF_FILE}" << EOF
# Configuration Nginx pour FloDrama
server {
    listen ${NGINX_PORT};
    server_name localhost;

    root ${NGINX_DOC_ROOT};
    index index.html;

    # Compression gzip pour améliorer les performances
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Règles de cache pour les ressources statiques
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Configuration pour les métadonnées
    location /assets/data/ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Redirection de toutes les requêtes vers index.html pour le routage côté client
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Journalisation
    access_log ${NGINX_CONFIG_DIR}/logs/flodrama_access.log;
    error_log ${NGINX_CONFIG_DIR}/logs/flodrama_error.log;
}
EOF

if [ $? -ne 0 ]; then
  error "Échec de la création de la configuration Nginx"
  exit 1
else
  success "Configuration Nginx créée avec succès"
fi

# Créer les répertoires de logs si nécessaire
mkdir -p "${NGINX_CONFIG_DIR}/logs"

# Vérifier la configuration Nginx
log "Vérification de la configuration Nginx..."
nginx -t

if [ $? -ne 0 ]; then
  error "La configuration Nginx contient des erreurs"
  exit 1
else
  success "Configuration Nginx valide"
fi

# Redémarrer Nginx
log "Redémarrage de Nginx..."
brew services restart nginx

if [ $? -ne 0 ]; then
  error "Échec du redémarrage de Nginx"
  exit 1
else
  success "Nginx redémarré avec succès"
fi

# Afficher les informations de déploiement
echo ""
success "Déploiement terminé!"
echo -e "${GREEN}URL:${NC} http://localhost:${NGINX_PORT}"
echo -e "${GREEN}Répertoire de déploiement:${NC} ${NGINX_DOC_ROOT}"
echo -e "${GREEN}Fichier de configuration:${NC} ${NGINX_CONF_FILE}"
echo ""
log "Pour arrêter Nginx: brew services stop nginx"
log "Pour démarrer Nginx: brew services start nginx"
log "Pour redémarrer Nginx: brew services restart nginx"
