#!/bin/bash

# Script de déploiement optimisé pour FloDrama
# Ce script prépare, vérifie et déploie l'application FloDrama
# avec une gestion optimisée des ressources statiques

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
BACKUP_DIR="backups/${TIMESTAMP}_backup_deploy"

# Créer le répertoire de sauvegarde
log "Création du répertoire de sauvegarde..."
mkdir -p "$BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r src "$BACKUP_DIR/src"
cp -r public "$BACKUP_DIR/public"
cp package.json "$BACKUP_DIR/"
cp index.html "$BACKUP_DIR/"
cp vite.config.js "$BACKUP_DIR/" 2>/dev/null || true

success "Sauvegarde terminée dans $BACKUP_DIR"

# Vérifier et installer les dépendances
log "Vérification des dépendances..."
if ! npm list react >/dev/null 2>&1; then
  warn "React n'est pas installé. Installation en cours..."
  npm install --save react react-dom
fi

# Vérifier les fichiers statiques essentiels
log "Vérification des fichiers statiques essentiels..."

# Vérifier le manifest.json
if [ ! -f "public/manifest.json" ]; then
  warn "manifest.json non trouvé. Création d'un manifest par défaut..."
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
fi

# Vérifier les icônes
if [ ! -f "public/logo192.png" ]; then
  warn "logo192.png non trouvé. Création d'une image par défaut..."
  # Utiliser une image existante ou créer une image de base
  if [ -f "public/logo.svg" ]; then
    log "Utilisation du logo.svg existant..."
    # Si ImageMagick est disponible, convertir SVG en PNG
    if command -v convert >/dev/null 2>&1; then
      convert -background none -size 192x192 public/logo.svg public/logo192.png
    else
      warn "ImageMagick non disponible. Veuillez créer manuellement logo192.png"
    fi
  else
    warn "Aucun logo trouvé. Veuillez créer manuellement logo192.png"
  fi
fi

if [ ! -f "public/logo512.png" ] && [ -f "public/logo192.png" ]; then
  warn "logo512.png non trouvé. Création à partir de logo192.png..."
  # Si ImageMagick est disponible, redimensionner l'image
  if command -v convert >/dev/null 2>&1; then
    convert -resize 512x512 public/logo192.png public/logo512.png
  else
    warn "ImageMagick non disponible. Veuillez créer manuellement logo512.png"
  fi
fi

# Vérifier si Vite est installé
if ! npm list vite >/dev/null 2>&1; then
  warn "Vite n'est pas installé. Installation en cours..."
  npm install --save-dev vite @vitejs/plugin-react
fi

# Nettoyer le répertoire de build précédent
log "Nettoyage du répertoire de build précédent..."
rm -rf dist

# Construction de l'application
log "Construction de l'application..."
npx vite build

# Vérifier si la construction a réussi
if [ $? -ne 0 ]; then
  error "Échec de la construction de l'application"
  exit 1
fi

success "Construction terminée avec succès"

# Vérifier les fichiers essentiels dans le build
log "Vérification des fichiers essentiels dans le build..."
if [ ! -f "dist/index.html" ]; then
  error "index.html non trouvé dans le build"
  exit 1
fi

if [ ! -f "dist/manifest.json" ]; then
  warn "manifest.json non trouvé dans le build. Copie depuis public..."
  cp public/manifest.json dist/
fi

# Vérifier les icônes dans le build
if [ ! -f "dist/logo192.png" ] && [ -f "public/logo192.png" ]; then
  warn "logo192.png non trouvé dans le build. Copie depuis public..."
  cp public/logo192.png dist/
fi

if [ ! -f "dist/logo512.png" ] && [ -f "public/logo512.png" ]; then
  warn "logo512.png non trouvé dans le build. Copie depuis public..."
  cp public/logo512.png dist/
fi

# Vérifier si AWS CLI est installé pour le déploiement
if command -v aws >/dev/null 2>&1; then
  log "AWS CLI détecté. Voulez-vous déployer sur AWS S3/CloudFront ? (o/n)"
  read -r deploy_aws
  
  if [ "$deploy_aws" = "o" ] || [ "$deploy_aws" = "O" ]; then
    # Demander le nom du bucket S3
    log "Entrez le nom du bucket S3 pour le déploiement :"
    read -r s3_bucket
    
    # Demander l'ID de distribution CloudFront (optionnel)
    log "Entrez l'ID de distribution CloudFront (laissez vide si non applicable) :"
    read -r cloudfront_id
    
    # Déployer sur S3
    log "Déploiement sur S3..."
    aws s3 sync dist/ s3://$s3_bucket/ --delete
    
    if [ $? -eq 0 ]; then
      success "Déploiement sur S3 terminé avec succès"
      
      # Invalider le cache CloudFront si un ID a été fourni
      if [ -n "$cloudfront_id" ]; then
        log "Invalidation du cache CloudFront..."
        aws cloudfront create-invalidation --distribution-id $cloudfront_id --paths "/*"
        
        if [ $? -eq 0 ]; then
          success "Invalidation du cache CloudFront terminée avec succès"
        else
          error "Échec de l'invalidation du cache CloudFront"
        fi
      fi
    else
      error "Échec du déploiement sur S3"
    fi
  fi
else
  log "AWS CLI non détecté. Déploiement sur AWS non disponible."
  log "Vous pouvez déployer manuellement le contenu du répertoire 'dist'."
fi

# Vérifier si Vercel CLI est installé pour le déploiement
if command -v vercel >/dev/null 2>&1; then
  log "Vercel CLI détecté. Voulez-vous déployer sur Vercel ? (o/n)"
  read -r deploy_vercel
  
  if [ "$deploy_vercel" = "o" ] || [ "$deploy_vercel" = "O" ]; then
    # Déployer sur Vercel
    log "Déploiement sur Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
      success "Déploiement sur Vercel terminé avec succès"
    else
      error "Échec du déploiement sur Vercel"
    fi
  fi
else
  log "Vercel CLI non détecté. Déploiement sur Vercel non disponible."
  log "Vous pouvez installer Vercel CLI avec 'npm install -g vercel'."
fi

# Tester localement
log "Voulez-vous tester l'application localement ? (o/n)"
read -r test_local

if [ "$test_local" = "o" ] || [ "$test_local" = "O" ]; then
  log "Démarrage du serveur local..."
  cd dist && python3 -m http.server 8080 || python -m SimpleHTTPServer 8080
fi

success "Processus de déploiement terminé"

# Enregistrer le déploiement dans le journal
log "Enregistrement du déploiement dans le journal..."
mkdir -p logs
echo "Déploiement du $(date) - Version: $(node -p "require('./package.json').version")" >> logs/deploy-history.log

log "Pour des informations détaillées sur ce déploiement, consultez les logs dans le répertoire 'logs'"
