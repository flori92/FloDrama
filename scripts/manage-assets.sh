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

# Configuration
ASSETS_DIR="Frontend/public/assets"
IMAGES_DIR="$ASSETS_DIR/images"
POSTERS_DIR="$IMAGES_DIR/posters"
BACKGROUNDS_DIR="$IMAGES_DIR/backgrounds"
PLACEHOLDERS_DIR="$IMAGES_DIR/placeholders"

# Créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires d'assets..."
    mkdir -p "$POSTERS_DIR"
    mkdir -p "$BACKGROUNDS_DIR"
    mkdir -p "$PLACEHOLDERS_DIR"
    success "Répertoires créés avec succès"
}

# Vérifier les images manquantes
check_missing_images() {
    log "Vérification des images manquantes..."
    local missing=0
    
    # Vérifier les posters
    for drama in $(ls "$POSTERS_DIR" 2>/dev/null); do
        if [ ! -f "$POSTERS_DIR/$drama" ]; then
            warning "Poster manquant: $drama"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        success "Aucune image manquante détectée"
    else
        warning "$missing image(s) manquante(s) détectée(s)"
    fi
}

# Générer les placeholders pour les images manquantes
generate_placeholders() {
    log "Génération des placeholders..."
    
    # Vérifier si ImageMagick est installé
    if ! command -v convert &> /dev/null; then
        error "ImageMagick est requis pour générer les placeholders"
        return 1
    fi
    
    # Générer un placeholder par défaut
    convert -size 500x750 gradient:blue-purple \
        -gravity center \
        -pointsize 40 \
        -draw "text 0,0 'FloDrama'" \
        "$PLACEHOLDERS_DIR/default.jpg" || {
        error "Échec de la génération du placeholder par défaut"
        return 1
    }
    
    success "Placeholders générés avec succès"
    return 0
}

# Optimiser les images
optimize_images() {
    log "Optimisation des images..."
    
    # Vérifier si ImageMagick est installé
    if ! command -v convert &> /dev/null; then
        error "ImageMagick est requis pour l'optimisation des images"
        return 1
    fi
    
    # Optimiser les posters
    if [ -d "$POSTERS_DIR" ]; then
        find "$POSTERS_DIR" -type f \( -name "*.jpg" -o -name "*.png" \) -exec convert {} \
            -strip \
            -quality 85 \
            -resize 500x750\> \
            {} \; || {
            error "Échec de l'optimisation des posters"
            return 1
        }
    fi
    
    # Optimiser les backgrounds
    if [ -d "$BACKGROUNDS_DIR" ]; then
        find "$BACKGROUNDS_DIR" -type f \( -name "*.jpg" -o -name "*.png" \) -exec convert {} \
            -strip \
            -quality 85 \
            -resize 1920x1080\> \
            {} \; || {
            error "Échec de l'optimisation des backgrounds"
            return 1
        }
    fi
    
    success "Images optimisées avec succès"
    return 0
}

# Fonction principale
main() {
    log "Début de la gestion des assets..."
    
    # Créer les répertoires
    create_directories
    
    # Vérifier les images manquantes
    check_missing_images
    
    # Générer les placeholders
    generate_placeholders || {
        error "Échec de la génération des placeholders"
        exit 1
    }
    
    # Optimiser les images
    optimize_images || {
        error "Échec de l'optimisation des images"
        exit 1
    }
    
    success "Gestion des assets terminée avec succès !"
}

# Exécuter le script
main 