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

# Clonage du dépôt Lynx
cloner_lynx() {
    log_info "Clonage du dépôt Lynx..."
    
    if [ ! -d "lynx" ]; then
        git clone https://github.com/lynx-family/lynx.git
        cd lynx
        git checkout develop
        cd ..
    else
        log_warning "Le dépôt Lynx existe déjà"
        cd lynx
        git pull origin develop
        cd ..
    fi
}

# Installation des dépendances Lynx
installer_lynx() {
    log_info "Installation des dépendances Lynx..."
    
    # Sauvegarde du package.json actuel
    cp package.json package.json.backup
    
    # Configuration de pnpm pour le workspace
    echo "packages:
  - 'lynx/packages/*'
  - '.'
" > pnpm-workspace.yaml
    
    # Installation de pnpm si nécessaire
    if ! command -v pnpm &> /dev/null; then
        log_info "Installation de pnpm..."
        npm install -g pnpm
    fi
    
    # Installation des dépendances
    pnpm install
    
    if [ $? -ne 0 ]; then
        log_error "Erreur lors de l'installation des dépendances"
        mv package.json.backup package.json
        return 1
    fi
    
    rm package.json.backup
    log_info "Installation des dépendances réussie"
}

# Configuration de l'environnement Lynx
configurer_lynx() {
    log_info "Configuration de l'environnement Lynx..."
    
    # Création des dossiers nécessaires
    mkdir -p src/{composants,services,hooks,themes,i18n,tests}/{,__tests__}
    
    # Configuration du préprocesseur
    echo '{
        "presets": ["@babel/preset-react"]
    }' > .babelrc
    
    # Configuration ESLint
    echo '{
        "extends": ["eslint:recommended", "plugin:react/recommended"]
    }' > .eslintrc
    
    log_info "Configuration de base terminée"
}

# Vérification de la configuration
verifier_configuration() {
    log_info "Vérification de la configuration..."
    
    # Vérification des fichiers de configuration
    FICHIERS_CONFIG=("lynx.config.js" ".babelrc" ".eslintrc" "jest.config.js")
    for fichier in "${FICHIERS_CONFIG[@]}"; do
        if [ ! -f "$fichier" ]; then
            log_warning "Fichier de configuration manquant: $fichier"
        fi
    done
    
    # Test de compilation
    npm run build
    
    if [ $? -ne 0 ]; then
        log_error "Erreur lors de la compilation"
        return 1
    fi
    
    log_info "Configuration vérifiée avec succès"
}

# Sauvegarde de sécurité
faire_backup() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/${TIMESTAMP}_pre_lynx_install"
    
    log_info "Création d'une sauvegarde dans $BACKUP_DIR..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Liste des fichiers à sauvegarder avec vérification
    FICHIERS=(
        "src"
        "package.json"
        "package-lock.json"
        "lynx.config.js"
        ".babelrc"
        ".eslintrc"
        "jest.config.js"
    )
    
    for fichier in "${FICHIERS[@]}"; do
        if [ -e "$fichier" ]; then
            cp -r "$fichier" "$BACKUP_DIR/"
            log_info "✓ Sauvegarde de $fichier"
        else
            log_warning "Le fichier $fichier n'existe pas, ignoré"
        fi
    done
    
    log_info "Sauvegarde terminée dans $BACKUP_DIR"
}

# Exécution principale
echo "🚀 Installation de Lynx pour FloDrama"
echo "===================================="

# Création du backup
faire_backup

# Clonage du dépôt Lynx
cloner_lynx

# Installation des dépendances
installer_lynx

# Configuration de l'environnement
configurer_lynx

# Vérification finale
verifier_configuration

echo "===================================="
echo "✨ Installation terminée avec succès"
echo ""
echo "Documentation : https://github.com/lynx-family/lynx"
echo ""
echo "Pour démarrer le développement :"
echo "1. pnpm run dev       # Lancer le serveur de développement"
echo "2. pnpm test         # Lancer les tests"
echo "3. pnpm run build    # Construire l'application"
