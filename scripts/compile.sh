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

# Vérifier Node.js et npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    error "Node.js et npm sont requis. Veuillez les installer."
    exit 1
fi

# Fonction de nettoyage
cleanup() {
    log "Nettoyage des fichiers temporaires..."
    if [ -d "Frontend" ]; then
        cd Frontend
        rm -rf .next
        rm -rf out
        rm -rf dist
        rm -rf node_modules/.cache
        cd ..
    fi
}

# Installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    if [ -d "Frontend" ]; then
        cd Frontend
        npm install || {
            error "Erreur lors de l'installation des dépendances"
            return 1
        }
        cd ..
        success "Dépendances installées avec succès"
        return 0
    else
        error "Le répertoire Frontend n'existe pas"
        return 1
    fi
}

# Compiler le frontend
build_frontend() {
    log "Compilation du frontend..."
    if [ -d "Frontend" ]; then
        cd Frontend
        
        # Vérifier l'environnement de production
        if [ ! -f ".env.production" ]; then
            warning "Fichier .env.production manquant, utilisation des valeurs par défaut"
        fi
        
        # Build avec Next.js
        log "Build Next.js..."
        npm run build || {
            error "Erreur lors de la compilation Next.js"
            return 1
        }
        
        # Export statique si nécessaire
        if [ -f "next.config.js" ]; then
            log "Export statique Next.js..."
            npm run export || {
                error "Erreur lors de l'export statique"
                return 1
            }
        fi
        
        cd ..
        success "Compilation terminée avec succès"
        return 0
    else
        error "Le répertoire Frontend n'existe pas"
        return 1
    fi
}

# Vérifier la compilation
verify_build() {
    if [ -d "Frontend" ]; then
        cd Frontend
        
        # Vérifier la sortie Next.js
        if [ ! -d "out" ] && [ ! -d ".next" ]; then
            error "Aucun répertoire de build trouvé (out ou .next)"
            return 1
        fi
        
        # Vérifier le fichier index.html
        if [ -d "out" ] && [ ! -f "out/index.html" ]; then
            error "Le fichier index.html n'a pas été généré dans out/"
            return 1
        fi
        
        cd ..
        success "Vérification de la compilation réussie"
        return 0
    else
        error "Le répertoire Frontend n'existe pas"
        return 1
    fi
}

# Exécution principale
main() {
    log "Début de la compilation de FloDrama..."
    
    # Nettoyage initial
    cleanup
    
    # Installation des dépendances
    install_dependencies || {
        error "Échec de l'installation des dépendances"
        cleanup
        exit 1
    }
    
    # Compilation
    build_frontend || {
        error "Échec de la compilation"
        cleanup
        exit 1
    }
    
    # Vérification
    verify_build || {
        error "Échec de la vérification"
        cleanup
        exit 1
    }
    
    success "Compilation terminée avec succès !"
}

# Exécuter le script
main 