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

# Vérification des variables d'environnement
verifier_env() {
    log_info "Vérification des variables d'environnement..."
    
    if [ -z "$LYNX_NPM_TOKEN" ]; then
        log_warning "LYNX_NPM_TOKEN n'est pas défini"
        echo "Pour configurer, exécutez: export LYNX_NPM_TOKEN=votre_token"
    else
        log_info "LYNX_NPM_TOKEN est configuré"
    fi
}

# Vérification de Node.js
verifier_node() {
    log_info "Vérification de Node.js..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
    fi
    
    VERSION_NODE=$(node -v)
    VERSION_MIN="16.0.0"
    
    if [ "$(printf '%s\n' "$VERSION_MIN" "$VERSION_NODE" | sort -V | head -n1)" = "$VERSION_MIN" ]; then
        log_info "Version Node.js: $VERSION_NODE"
    else
        log_warning "Version Node.js ($VERSION_NODE) est inférieure à la version minimale recommandée ($VERSION_MIN)"
    fi
}

# Vérification de npm
verifier_npm() {
    log_info "Vérification de npm..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
    fi
    
    VERSION_NPM=$(npm -v)
    log_info "Version npm: $VERSION_NPM"
}

# Vérification des dépendances globales
verifier_deps_globales() {
    log_info "Vérification des dépendances globales..."
    
    DEPS=("jest" "lynx-cli")
    for dep in "${DEPS[@]}"; do
        if ! command -v $dep &> /dev/null; then
            log_warning "$dep n'est pas installé globalement"
            echo "Pour installer: npm install -g $dep"
        else
            log_info "$dep est installé"
        fi
    done
}

# Vérification de la configuration git
verifier_git() {
    log_info "Vérification de la configuration git..."
    
    if ! command -v git &> /dev/null; then
        log_error "git n'est pas installé"
    fi
    
    if [ ! -d .git ]; then
        log_warning "Ce n'est pas un dépôt git"
    else
        REMOTE_ORIGIN=$(git remote get-url origin 2>/dev/null)
        if [ $? -eq 0 ]; then
            log_info "Remote origin: $REMOTE_ORIGIN"
        else
            log_warning "Pas de remote origin configuré"
        fi
    fi
}

# Vérification de l'accès au registre Lynx
verifier_acces_lynx() {
    log_info "Vérification de l'accès au registre Lynx..."
    
    if [ ! -f .npmrc ]; then
        log_warning ".npmrc n'existe pas"
        return
    fi
    
    if ! grep -q "registry.lynx.dev" .npmrc; then
        log_warning "Configuration du registre Lynx manquante dans .npmrc"
    else
        log_info "Configuration du registre Lynx trouvée"
    fi
}

# Vérification des fichiers de configuration
verifier_config() {
    log_info "Vérification des fichiers de configuration..."
    
    FICHIERS=("package.json" "lynx.config.js" "jest.config.js")
    for fichier in "${FICHIERS[@]}"; do
        if [ -f "$fichier" ]; then
            log_info "$fichier existe"
        else
            log_warning "$fichier est manquant"
        fi
    done
}

# Vérification de l'espace disque
verifier_espace() {
    log_info "Vérification de l'espace disque..."
    
    ESPACE_LIBRE=$(df -h . | awk 'NR==2 {print $4}')
    log_info "Espace libre: $ESPACE_LIBRE"
    
    # Convertir en Go pour la comparaison
    ESPACE_LIBRE_GO=$(df . | awk 'NR==2 {print $4}' | awk '{print $1/1024/1024}')
    if (( $(echo "$ESPACE_LIBRE_GO < 5" | bc -l) )); then
        log_warning "Moins de 5 Go d'espace libre disponible"
    fi
}

# Exécution des vérifications
echo "🔍 Démarrage des vérifications de l'environnement..."
echo "=================================================="

verifier_env
verifier_node
verifier_npm
verifier_deps_globales
verifier_git
verifier_acces_lynx
verifier_config
verifier_espace

echo "=================================================="
echo "✨ Vérifications terminées"
