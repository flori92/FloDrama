#!/bin/bash

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[1;33m'
NC='\033[0m'

# Fonction de log
log_info() {
    echo -e "${VERT}✓ INFO:${NC} $1"
}

log_warning() {
    echo -e "${JAUNE}⚠ ATTENTION:${NC} $1"
}

log_error() {
    echo -e "${ROUGE}✗ ERREUR:${NC} $1"
    exit 1
}

# Vérification des prérequis
verifier_prerequis() {
    log_info "Vérification des prérequis..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org"
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
    fi
}

# Configuration de Git
configurer_git() {
    log_info "Configuration de Git..."
    
    if [ ! -d .git ]; then
        git init
        git add .
        git commit -m "✨ [INIT] Configuration initiale de la migration"
        log_info "Dépôt Git initialisé"
    else
        log_info "Dépôt Git déjà initialisé"
    fi
    
    # Configuration de Git pour utiliser main comme branche par défaut
    git branch -M main
}

# Configuration du token
configurer_token() {
    log_info "Configuration du token..."
    
    if [ -z "$NPM_TOKEN" ]; then
        read -p "Veuillez entrer votre token : " token
        echo "export NPM_TOKEN=$token" >> ~/.zshrc
        export NPM_TOKEN=$token
        log_info "Token configuré"
    else
        log_info "Token déjà configuré"
    fi
}

# Installation des dépendances du projet
installer_deps_projet() {
    log_info "Installation des dépendances du projet..."
    
    npm install
    
    if [ $? -eq 0 ]; then
        log_info "Dépendances du projet installées avec succès"
    else
        log_error "Erreur lors de l'installation des dépendances du projet"
    fi
}

# Création des dossiers nécessaires
creer_structure() {
    log_info "Création de la structure de dossiers..."
    
    mkdir -p src/{composants,services,hooks,themes,i18n,tests}/{,__tests__}
    mkdir -p public/{assets,data}
    
    log_info "Structure de dossiers créée"
}

# Sauvegarde de la configuration actuelle
sauvegarder_config() {
    log_info "Sauvegarde de la configuration..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/${TIMESTAMP}_config_backup"
    
    mkdir -p "$BACKUP_DIR"
    cp package.json .npmrc "$BACKUP_DIR"
    
    log_info "Configuration sauvegardée dans $BACKUP_DIR"
}

# Exécution des étapes de configuration
echo "🚀 Démarrage de la configuration de l'environnement..."
echo "=================================================="

verifier_prerequis
configurer_git
configurer_token
installer_deps_projet
creer_structure
sauvegarder_config

echo "=================================================="
echo "✨ Configuration terminée"
echo ""
echo "Pour commencer le développement :"
echo "1. npm run dev         # Lancer le serveur de développement"
echo "2. npm test           # Lancer les tests"
echo "3. npm run build      # Construire l'application"
echo ""
echo "Documentation disponible dans docs/MIGRATION.md"
