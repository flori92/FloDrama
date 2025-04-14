#!/bin/bash

# Script de correction pour FloDrama
# Ce script corrige les problèmes critiques sans nécessiter de build complet

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier si nous sommes dans le répertoire du projet
if [ ! -f "package.json" ]; then
  error "Ce script doit être exécuté depuis le répertoire racine du projet FloDrama"
  exit 1
fi

# Créer un timestamp pour les sauvegardes
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}_backup_fix"

# Créer le répertoire de sauvegarde
log "Création du répertoire de sauvegarde..."
mkdir -p "$BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r src "$BACKUP_DIR/src"
cp index.html "$BACKUP_DIR/"

success "Sauvegarde terminée dans $BACKUP_DIR"

# Vérifier et corriger le manifest.json
log "Vérification du manifest.json..."
mkdir -p public

if [ ! -f "public/manifest.json" ]; then
  warn "manifest.json non trouvé. Création d'un manifest..."
  cat > public/manifest.json << EOF
{
  "short_name": "FloDrama",
  "name": "FloDrama - Streaming asiatique",
  "icons": [
    {
      "src": "/logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#121118",
  "background_color": "#121118"
}
EOF
  success "manifest.json créé avec succès"
else
  success "manifest.json existe déjà"
fi

# Vérifier et créer les icônes si nécessaire
log "Vérification des icônes..."

if [ ! -f "public/logo.svg" ]; then
  warn "logo.svg non trouvé. Création d'un logo de base..."
  cat > public/logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6" />
      <stop offset="100%" style="stop-color:#d946ef" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="10" fill="url(#gradient)" />
  <text x="50" y="60" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">FD</text>
</svg>
EOF
  success "logo.svg créé avec succès"
fi

# Créer une image PNG simple pour logo192.png si elle n'existe pas
if [ ! -f "public/logo192.png" ]; then
  warn "logo192.png non trouvé. Création d'une image simple..."
  
  # Si ImageMagick est disponible, créer une image
  if command -v convert >/dev/null 2>&1; then
    convert -size 192x192 xc:none -fill "gradient:#3b82f6-#d946ef" -draw "roundrectangle 0,0 192,192 20,20" -font Arial -pointsize 60 -gravity center -fill white -annotate 0 "FD" public/logo192.png
    success "logo192.png créé avec ImageMagick"
  else
    # Sinon, créer un fichier texte indiquant qu'il faut créer l'image manuellement
    warn "ImageMagick non disponible. Création d'un fichier texte..."
    echo "Veuillez créer manuellement une image logo192.png de 192x192 pixels" > public/logo192.png.txt
  fi
fi

# Créer une image PNG simple pour logo512.png si elle n'existe pas
if [ ! -f "public/logo512.png" ]; then
  warn "logo512.png non trouvé. Création d'une image simple..."
  
  # Si ImageMagick est disponible, créer une image
  if command -v convert >/dev/null 2>&1; then
    convert -size 512x512 xc:none -fill "gradient:#3b82f6-#d946ef" -draw "roundrectangle 0,0 512,512 40,40" -font Arial -pointsize 160 -gravity center -fill white -annotate 0 "FD" public/logo512.png
    success "logo512.png créé avec ImageMagick"
  else
    # Sinon, créer un fichier texte indiquant qu'il faut créer l'image manuellement
    warn "ImageMagick non disponible. Création d'un fichier texte..."
    echo "Veuillez créer manuellement une image logo512.png de 512x512 pixels" > public/logo512.png.txt
  fi
fi

# Démarrer un serveur local pour tester
log "Voulez-vous démarrer un serveur local pour tester les corrections ? (o/n)"
read -r start_server

if [ "$start_server" = "o" ] || [ "$start_server" = "O" ]; then
  log "Démarrage du serveur local..."
  
  # Vérifier si Python est disponible
  if command -v python3 >/dev/null 2>&1; then
    python3 -m http.server 8080
  elif command -v python >/dev/null 2>&1; then
    python -m SimpleHTTPServer 8080
  else
    error "Python n'est pas disponible. Impossible de démarrer le serveur local."
    log "Vous pouvez utiliser un autre serveur local comme 'npx serve' ou 'npx http-server'"
  fi
fi

success "Corrections terminées. Les problèmes critiques de FloDrama devraient être résolus."
log "Vous pouvez maintenant ouvrir l'application dans un navigateur pour vérifier les corrections."
