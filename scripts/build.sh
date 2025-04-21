#!/bin/bash

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m'

# Fonctions d'affichage
log() { echo -e "${BLEU}[INFO] $1${NC}"; }
success() { echo -e "${VERT}[SUCCESS] $1${NC}"; }
error() { echo -e "${ROUGE}[ERROR] $1${NC}"; }
warning() { echo -e "${JAUNE}[WARNING] $1${NC}"; }

# Se positionner dans le répertoire du projet
cd "$(dirname "$0")/.." || exit 1

# Vérifier que les scripts nécessaires existent
if [ ! -f "scripts/compile.sh" ] || [ ! -f "scripts/manage-assets.sh" ]; then
    error "Scripts nécessaires manquants"
    exit 1
fi

# Vérifier les permissions d'exécution
if [ ! -x "scripts/compile.sh" ] || [ ! -x "scripts/manage-assets.sh" ]; then
    log "Ajout des permissions d'exécution aux scripts..."
    chmod +x scripts/compile.sh scripts/manage-assets.sh
fi

# Fonction principale
main() {
    log "Début du processus de build de FloDrama..."
    
    # Gérer les assets d'abord
    log "Étape 1: Gestion des assets..."
    if ! ./scripts/manage-assets.sh; then
        error "Échec de la gestion des assets"
        exit 1
    fi
    success "Gestion des assets terminée"
    
    # Compiler l'application
    log "Étape 2: Compilation de l'application..."
    if ! ./scripts/compile.sh; then
        error "Échec de la compilation"
        exit 1
    fi
    success "Compilation terminée"
    
    # Vérification finale
    log "Étape 3: Vérification finale..."
    if [ -d "Frontend/dist" ] && [ -f "Frontend/dist/index.html" ]; then
        success "Build terminé avec succès !"
        log "L'application est prête dans le dossier Frontend/dist"
    else
        error "Le build semble incomplet"
        exit 1
    fi
}

# Exécuter le script
main 