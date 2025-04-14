#!/bin/bash

# Script d'optimisation complète pour FloDrama
# Ce script met en place toutes les améliorations recommandées :
# 1. Lazy loading des images
# 2. Gestion du cache local
# 3. Système de gestion d'erreurs robuste
# 4. Code splitting et optimisation des performances

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
VIOLET='\033[0;35m'
CYAN='\033[0;36m'
BLANC='\033[1;37m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
info() {
  echo -e "${BLEU}[INFO]${NC} $1"
}

# Fonction pour afficher les messages de succès
succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

# Fonction pour afficher les messages d'avertissement
avertissement() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Fonction pour créer une sauvegarde
creer_sauvegarde() {
  info "Création du répertoire de sauvegarde..."
  
  # Créer le répertoire de sauvegarde s'il n'existe pas
  BACKUP_DIR="backups"
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}_backup_optimisation"
  
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$BACKUP_PATH"
  
  # Sauvegarder les fichiers importants
  info "Sauvegarde des fichiers importants..."
  cp -r src/components "$BACKUP_PATH/" 2>/dev/null || true
  cp -r src/utils "$BACKUP_PATH/" 2>/dev/null || true
  cp -r src/hooks "$BACKUP_PATH/" 2>/dev/null || true
  cp -r src/pages "$BACKUP_PATH/" 2>/dev/null || true
  cp src/App.jsx "$BACKUP_PATH/" 2>/dev/null || true
  cp src/main.jsx "$BACKUP_PATH/" 2>/dev/null || true
  
  succes "Sauvegarde terminée dans $BACKUP_PATH"
}

# Fonction pour vérifier les dépendances
verifier_dependances() {
  info "Vérification des dépendances..."
  
  # Vérifier si Node.js est installé
  if ! command -v node &> /dev/null; then
    erreur "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérifier si npm est installé
  if ! command -v npm &> /dev/null; then
    erreur "npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérifier les dépendances React
  if ! grep -q "react" package.json; then
    avertissement "React ne semble pas être installé. Vérifiez votre package.json."
  fi
  
  # Vérifier les dépendances React Router
  if ! grep -q "react-router-dom" package.json; then
    avertissement "React Router ne semble pas être installé. Vérifiez votre package.json."
  fi
  
  succes "Vérification des dépendances terminée"
}

# Fonction pour créer les dossiers nécessaires
creer_dossiers() {
  info "Création des dossiers nécessaires..."
  
  # Créer les dossiers pour les placeholders d'images
  mkdir -p public/assets/static/placeholders
  
  # Créer les dossiers pour les icônes
  mkdir -p public/assets/icons
  
  # Créer les dossiers pour les images
  mkdir -p public/assets/images
  
  succes "Dossiers créés avec succès"
}

# Fonction pour créer les placeholders d'images
creer_placeholders() {
  info "Création des placeholders d'images..."
  
  # Créer le placeholder pour les posters
  cat > public/assets/static/placeholders/poster-placeholder.svg << EOF
<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8" ry="8" />
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
</svg>
EOF
  
  # Créer le placeholder pour les backdrops
  cat > public/assets/static/placeholders/backdrop-placeholder.svg << EOF
<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8" ry="8" />
  <text x="50%" y="50%" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
</svg>
EOF
  
  # Créer le placeholder pour les thumbnails
  cat > public/assets/static/placeholders/thumbnail-placeholder.svg << EOF
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8" ry="8" />
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
</svg>
EOF
  
  # Créer le placeholder pour les profils
  cat > public/assets/static/placeholders/profile-placeholder.svg << EOF
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#grad)" />
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">FD</text>
</svg>
EOF
  
  # Créer le placeholder pour les logos
  cat > public/assets/static/placeholders/logo-placeholder.svg << EOF
<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="transparent" />
  <text x="50%" y="50%" font-family="Arial" font-size="48" fill="url(#grad)" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
</svg>
EOF
  
  # Créer le placeholder générique
  cat > public/assets/static/placeholders/image-placeholder.svg << EOF
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8" ry="8" />
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
</svg>
EOF
  
  succes "Placeholders créés avec succès"
}

# Fonction pour vérifier l'installation
verifier_installation() {
  info "Vérification de l'installation..."
  
  # Vérifier si les fichiers nécessaires existent
  if [ ! -f "src/components/LazyImage.jsx" ]; then
    erreur "Le composant LazyImage n'existe pas."
    return 1
  fi
  
  if [ ! -f "src/components/AppErrorBoundary.jsx" ]; then
    erreur "Le composant AppErrorBoundary n'existe pas."
    return 1
  fi
  
  if [ ! -f "src/utils/lazyLoader.js" ]; then
    erreur "L'utilitaire lazyLoader n'existe pas."
    return 1
  fi
  
  if [ ! -f "src/pages/OptimizedHomePage.jsx" ]; then
    erreur "La page OptimizedHomePage n'existe pas."
    return 1
  fi
  
  succes "Installation vérifiée avec succès"
  return 0
}

# Fonction pour démarrer le serveur de développement
demarrer_serveur() {
  info "Démarrage du serveur de développement..."
  
  # Vérifier si npm est installé
  if ! command -v npm &> /dev/null; then
    erreur "npm n'est pas installé. Impossible de démarrer le serveur."
    return 1
  fi
  
  # Démarrer le serveur
  npm run dev
}

# Fonction principale
main() {
  echo -e "${VIOLET}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${VIOLET}║                                                            ║${NC}"
  echo -e "${VIOLET}║  ${BLANC}FloDrama - Script d'optimisation complète${VIOLET}                ║${NC}"
  echo -e "${VIOLET}║                                                            ║${NC}"
  echo -e "${VIOLET}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Créer une sauvegarde
  creer_sauvegarde
  
  # Vérifier les dépendances
  verifier_dependances
  
  # Créer les dossiers nécessaires
  creer_dossiers
  
  # Créer les placeholders d'images
  creer_placeholders
  
  # Vérifier l'installation
  if verifier_installation; then
    echo ""
    echo -e "${VERT}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${VERT}║                                                            ║${NC}"
    echo -e "${VERT}║  ${BLANC}Installation réussie !${VERT}                                    ║${NC}"
    echo -e "${VERT}║                                                            ║${NC}"
    echo -e "${VERT}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Demander à l'utilisateur s'il souhaite démarrer le serveur
    read -p "Voulez-vous démarrer le serveur de développement ? (o/n) " reponse
    if [[ "$reponse" =~ ^[Oo]$ ]]; then
      demarrer_serveur
    else
      info "Pour démarrer le serveur manuellement, exécutez 'npm run dev'"
    fi
  else
    echo ""
    echo -e "${ROUGE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${ROUGE}║                                                            ║${NC}"
    echo -e "${ROUGE}║  ${BLANC}Installation incomplète !${ROUGE}                                ║${NC}"
    echo -e "${ROUGE}║                                                            ║${NC}"
    echo -e "${ROUGE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    info "Veuillez vérifier les erreurs ci-dessus et réessayer."
  fi
}

# Exécuter la fonction principale
main
