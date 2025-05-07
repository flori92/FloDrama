#!/bin/bash

# Script d'installation des dépendances pour les outils d'optimisation FloDrama
# 
# Ce script installe toutes les dépendances nécessaires pour les outils
# d'analyse de performance, d'accessibilité et de résilience.

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message d'information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher un avertissement
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Fonction pour afficher une erreur
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  error "npm n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Créer les répertoires nécessaires
info "Création des répertoires pour les rapports..."
mkdir -p ../performance-reports
mkdir -p ../accessibility-reports
mkdir -p ../resilience-reports
success "Répertoires créés avec succès."

# Installer les dépendances pour l'analyse de code
info "Installation des dépendances pour l'analyse de code..."
npm install --save-dev @babel/parser@^7.27.2 @babel/traverse@^7.27.1 @babel/generator@^7.27.1 @babel/types@^7.27.1

# Installer les dépendances pour les tests de résilience
info "Installation des dépendances pour les tests de résilience..."
npm install --save-dev playwright@^1.52.0 jsdom@^26.1.0

# Vérifier si les dépendances ont été installées correctement
if [ $? -ne 0 ]; then
  error "Erreur lors de l'installation des dépendances."
  exit 1
fi

success "Dépendances installées avec succès."

# Installer les navigateurs pour Playwright
info "Installation des navigateurs pour Playwright..."
npx playwright install chromium
success "Navigateurs installés avec succès."

# Mettre à jour package.json si nécessaire
info "Vérification des scripts dans package.json..."
if ! grep -q "analyze:performance" ../package.json; then
  warning "Les scripts d'analyse ne sont pas configurés dans package.json."
  warning "Veuillez exécuter la commande suivante pour mettre à jour package.json :"
  echo "npm set-script analyze:performance \"node scripts/analyze_performance.js\""
  echo "npm set-script analyze:accessibility \"node scripts/improve_accessibility.js\""
  echo "npm set-script enhance:accessibility \"node scripts/enhance_accessibility.js\""
  echo "npm set-script enhance:resilience \"node scripts/improve_resilience.js\""
  echo "npm set-script analyze:all \"npm run analyze:accessibility && npm run analyze:performance\""
  echo "npm set-script enhance:all \"npm run enhance:accessibility && npm run enhance:resilience\""
else
  success "Scripts déjà configurés dans package.json."
fi

# Rendre les scripts exécutables
info "Configuration des permissions des scripts..."
chmod +x ../scripts/deploy_to_cloudflare.sh
chmod +x ../scripts/setup_optimization_tools.sh
success "Permissions configurées avec succès."

echo ""
success "Installation terminée avec succès!"
echo ""
info "Vous pouvez maintenant utiliser les commandes suivantes :"
echo "  - npm run analyze:performance    : Analyser les performances"
echo "  - npm run analyze:accessibility  : Analyser l'accessibilité"
echo "  - npm run enhance:accessibility  : Améliorer l'accessibilité"
echo "  - npm run enhance:resilience     : Améliorer la résilience"
echo "  - npm run analyze:all            : Analyser tout"
echo "  - npm run enhance:all            : Améliorer tout"
echo "  - npm run deploy:cloudflare      : Déployer sur Cloudflare Pages"
echo ""
info "Pour plus d'informations, consultez le fichier README_OPTIMISATION.md."
