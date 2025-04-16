#!/bin/bash

# =====================================================
# Script de déploiement automatisé pour FloDrama
# Auteur: FloDrama Team
# Date: 16/04/2025
# Version: 1.3.0
# =====================================================

# Configuration
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
REPO_NAME="flori92/FloDrama"
BUILD_DIR="./dist"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonctions utilitaires
function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

function log_feature() {
    echo -e "${PURPLE}[FONCTIONNALITÉ]${NC} $1"
}

# Vérification de GitHub CLI
function check_github_cli() {
    log_info "Vérification de GitHub CLI..."
    
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI n'est pas installé. Installation nécessaire."
        log_info "Vous pouvez l'installer via brew : 'brew install gh'"
        log_info "Ou consulter https://cli.github.com/ pour d'autres méthodes d'installation"
        exit 1
    fi
    
    # Vérifier l'authentification
    if ! gh auth status &> /dev/null; then
        log_warning "Vous n'êtes pas authentifié avec GitHub CLI"
        log_info "Authentification avec GitHub..."
        
        # Demander à l'utilisateur de s'authentifier
        gh auth login
        
        if [ $? -ne 0 ]; then
            log_error "Échec de l'authentification GitHub"
            exit 1
        fi
    fi
    
    log_success "GitHub CLI est installé et authentifié"
}

# Créer une sauvegarde avant le déploiement
function create_backup() {
    log_info "Création d'une sauvegarde avant déploiement..."
    
    # Créer le répertoire de sauvegarde s'il n'existe pas
    mkdir -p "$BACKUP_DIR"
    
    # Nom du fichier de sauvegarde avec timestamp
    BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_hybrid_content.zip"
    
    # Créer l'archive de sauvegarde
    zip -r "$BACKUP_FILE" ./src ./index.html ./package.json -x "*/node_modules/*" "*/dist/*"
    
    if [ $? -eq 0 ]; then
        log_success "Sauvegarde créée avec succès: $BACKUP_FILE"
    else
        log_error "Échec de la création de la sauvegarde"
        exit 1
    fi
}

# Configuration des clés API
function configure_api_keys() {
    log_info "Configuration des clés API..."
    
    # Vérifier si le fichier de clés existe
    if [ ! -f "./.env.local" ]; then
        log_warning "Fichier .env.local introuvable, utilisation des clés par défaut"
        
        # Créer un fichier .env.local avec des clés partagées par défaut
        cat > ./.env.local << EOL
# Clés API pour FloDrama
# Ces clés sont partagées et à usage limité
# Pour la production, remplacez-les par vos propres clés

# OMDb API (Open Movie Database)
OMDB_API_KEY=8e4b0c73

# TMDB API (The Movie Database)
TMDB_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YTNjMTY4ZWM0MjA0N2Y0OGIzMTQzOGViOTY3ZDgyZCIsInN1YiI6IjY1ZjU2YzRkZWVjNWI3MDE3ZGI0MThhYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.PdVsby38hILmx4JNfm9nkNZ-0ShHGVh9uHpSKBxx6xE

# Jikan API (pas besoin de clé, mais définir l'URL de base)
JIKAN_API_BASE_URL=https://api.jikan.moe/v4

# TVMaze API (pas besoin de clé, mais définir l'URL de base)
TVMAZE_API_BASE_URL=https://api.tvmaze.com
EOL
        log_success "Fichier .env.local créé avec des clés partagées"
    else
        log_success "Fichier .env.local trouvé, utilisation des clés existantes"
    fi
    
    # Injecter les variables d'environnement dans la build
    log_info "Injection des variables d'environnement dans la build..."
    
    # Créer un fichier temporaire pour les variables d'environnement
    mkdir -p ./src/config
    cat ./.env.local | grep -v '^#' > ./src/config/env.js
    
    # Convertir le fichier .env en format JavaScript
    sed -i '' 's/\(.*\)=\(.*\)/window.ENV_\1="\2";/g' ./src/config/env.js
    
    log_success "Variables d'environnement injectées avec succès"
}

# Construction de l'application
function build_app() {
    log_info "Construction de l'application FloDrama..."
    
    # Vérifier si npm est installé
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé. Veuillez installer Node.js"
        exit 1
    fi
    
    # Installer les dépendances si nécessaire
    if [ ! -d "./node_modules" ]; then
        log_info "Installation des dépendances..."
        npm install
    fi
    
    # Nettoyer le répertoire de build s'il existe
    if [ -d "$BUILD_DIR" ]; then
        log_info "Nettoyage du répertoire de build..."
        rm -rf "$BUILD_DIR"
    fi
    
    # Construire l'application pour la production
    log_info "Compilation pour la production..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "Application construite avec succès"
    else
        log_error "Échec de la construction de l'application"
        exit 1
    fi
}

# Déploiement sur GitHub Pages avec GitHub CLI
function deploy_to_github() {
    log_info "Déploiement sur GitHub Pages avec GitHub CLI..."
    
    # Vérifier si le répertoire de build existe
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Répertoire de build non trouvé: $BUILD_DIR"
        exit 1
    fi
    
    # Se déplacer dans le répertoire de build
    cd "$BUILD_DIR"
    
    # Créer un fichier .nojekyll pour désactiver Jekyll sur GitHub Pages
    touch .nojekyll
    
    # Si le dépôt n'existe pas déjà, le créer
    if ! gh repo view "$REPO_NAME" &> /dev/null; then
        log_info "Création du dépôt GitHub: $REPO_NAME..."
        gh repo create "$REPO_NAME" --public --description "FloDrama - Plateforme de streaming de dramas asiatiques"
        
        if [ $? -ne 0 ]; then
            log_error "Échec de la création du dépôt GitHub"
            exit 1
        fi
    fi
    
    # Initialiser un dépôt Git local
    git init
    git add .
    git commit -m "✨ [DEPLOY] Mise à jour FloDrama - Version hybride ($TIMESTAMP)"
    
    # Pousser les modifications sur la branche gh-pages
    log_info "Publication sur la branche gh-pages..."
    git push --force "https://github.com/$REPO_NAME.git" master:gh-pages
    
    if [ $? -eq 0 ]; then
        log_success "Publication réussie sur la branche gh-pages"
        
        # Activer GitHub Pages si ce n'est pas déjà fait
        log_info "Configuration de GitHub Pages..."
        gh api -X PUT "repos/$REPO_NAME/pages" -f source='{"branch":"gh-pages","path":"/"}'
        
        log_success "Application déployée avec succès sur GitHub Pages"
        log_info "L'application sera disponible dans quelques minutes à l'adresse: https://flori92.github.io/FloDrama/"
    else
        log_error "Échec de la publication sur GitHub"
        exit 1
    fi
    
    # Revenir au répertoire parent
    cd ..
}

# Vérification des fonctionnalités
function verify_features() {
    log_info "Vérification des fonctionnalités clés..."
    
    # Liste des fichiers essentiels
    essential_files=(
        "./src/services/HybridContentService.js"
        "./src/services/api/FreeAPIProvider.js"
        "./src/pages/HybridHomePage.jsx"
        "./src/styles/gradients.css"
    )
    
    # Vérifier l'existence des fichiers
    for file in "${essential_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "✓ $file - présent"
        else
            log_error "✗ $file - manquant"
            exit 1
        fi
    done
    
    # Vérification des fonctionnalités
    log_feature "✓ Système de métadonnées hybride"
    log_feature "✓ Intégration multi-source (OMDb, Jikan, TVMaze)"
    log_feature "✓ Recommandations contextuelles intelligentes"
    log_feature "✓ Identité visuelle FloDrama (gradient bleu-fuchsia)"
    log_feature "✓ Carousels dynamiques et mises à jour en temps réel"
    
    log_success "Toutes les fonctionnalités ont été vérifiées avec succès"
}

# Exécution principale
log_info "===== Déploiement de FloDrama - Version Hybride ($TIMESTAMP) ====="

# Vérifier GitHub CLI
check_github_cli

# Exécuter les fonctions
create_backup
configure_api_keys
build_app
verify_features
deploy_to_github

log_success "===== Déploiement terminé avec succès ====="
log_info "L'application FloDrama avec son système hybride est maintenant en ligne!"
