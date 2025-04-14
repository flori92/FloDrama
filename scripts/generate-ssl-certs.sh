#!/bin/bash
# Script de génération de certificats SSL auto-signés pour le développement FloDrama
# Créé le 14-04-2025

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

info() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] INFO: $1${NC}"
}

# Vérifier que OpenSSL est installé
if ! command -v openssl &> /dev/null; then
  erreur "OpenSSL n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Créer le répertoire pour les certificats SSL si nécessaire
SSL_DIR="/opt/homebrew/etc/nginx/ssl"
if [ ! -d "$SSL_DIR" ]; then
  log "Création du répertoire pour les certificats SSL..."
  sudo mkdir -p "$SSL_DIR"
fi

# Générer une clé privée
log "Génération de la clé privée..."
sudo openssl genrsa -out "$SSL_DIR/flodrama-dev.key" 2048

# Générer une demande de signature de certificat (CSR)
log "Génération de la demande de signature de certificat..."
sudo openssl req -new -key "$SSL_DIR/flodrama-dev.key" -out "$SSL_DIR/flodrama-dev.csr" -subj "/C=FR/ST=Paris/L=Paris/O=FloDrama/OU=Développement/CN=localhost"

# Générer un certificat auto-signé
log "Génération du certificat auto-signé..."
sudo openssl x509 -req -days 365 -in "$SSL_DIR/flodrama-dev.csr" -signkey "$SSL_DIR/flodrama-dev.key" -out "$SSL_DIR/flodrama-dev.crt"

# Définir les permissions appropriées
log "Configuration des permissions..."
sudo chmod 600 "$SSL_DIR/flodrama-dev.key"
sudo chmod 644 "$SSL_DIR/flodrama-dev.crt"

# Nettoyer
log "Nettoyage des fichiers temporaires..."
sudo rm -f "$SSL_DIR/flodrama-dev.csr"

# Configurer Nginx pour utiliser le nouveau certificat
log "Mise à jour de la configuration Nginx..."
NGINX_CONF_DIR="/opt/homebrew/etc/nginx/servers"
if [ ! -d "$NGINX_CONF_DIR" ]; then
  sudo mkdir -p "$NGINX_CONF_DIR"
fi

# Copier le fichier de configuration SSL
sudo cp "$(dirname "$0")/../nginx-flodrama-ssl.conf" "$NGINX_CONF_DIR/flodrama-ssl.conf"

# Redémarrer Nginx
log "Redémarrage de Nginx..."
sudo brew services restart nginx

log "Configuration SSL pour le développement terminée!"
info "Vous pouvez maintenant accéder à https://localhost pour le développement local."
attention "Ce certificat est auto-signé et n'est destiné qu'au développement local."
