#!/bin/bash

# Script de déploiement de FloDrama sur GitHub Pages avec la Navbar avancée
# Ce script remplace le Header par la Navbar dans l'application et déploie sur GitHub Pages

set -e

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages avec timestamp
log() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")]${NC} $1"
}

# Fonction pour afficher les messages de succès
success() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
error() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
  exit 1
}

# Fonction pour afficher les messages d'avertissement
warning() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Vérifier que nous sommes dans le répertoire FloDrama
if [[ ! -d "Frontend" || ! -f "package.json" ]]; then
  error "Ce script doit être exécuté depuis le répertoire racine de FloDrama"
fi

# Créer une sauvegarde de l'App.jsx actuel
log "Création d'une sauvegarde de l'App.jsx actuel..."
cp Frontend/App.jsx Frontend/App.jsx.bak
success "Sauvegarde créée : Frontend/App.jsx.bak"

# Vérifier que le composant Navbar existe
if [[ ! -f "Frontend/components/layout/Navbar.jsx" ]]; then
  error "Le composant Navbar n'existe pas dans Frontend/components/layout/Navbar.jsx"
fi

# Vérifier que le composant App.jsx a bien été modifié pour utiliser Navbar
log "Vérification de l'utilisation de Navbar dans App.jsx..."
if ! grep -q "import Navbar from './components/layout/Navbar'" Frontend/App.jsx; then
  warning "Le composant Navbar n'est pas importé dans App.jsx"
  log "Modification de App.jsx pour utiliser Navbar au lieu de Header..."
  
  # Remplacer l'import de Header par Navbar
  sed -i '' 's/import Header from .\/components\/layout\/Header.*/import Navbar from .\/components\/layout\/Navbar.;/' Frontend/App.jsx
  
  # Remplacer l'utilisation de Header par Navbar
  sed -i '' 's/<Header \/>/<Navbar \/>/' Frontend/App.jsx
  
  success "App.jsx modifié pour utiliser Navbar"
else
  success "App.jsx utilise déjà Navbar"
fi

# Installation des dépendances
log "Installation des dépendances..."
npm ci || error "Erreur lors de l'installation des dépendances"
success "Dépendances installées"

# Construction du projet
log "Construction du projet..."
npm run build || error "Erreur lors de la construction du projet"
success "Projet construit avec succès"

# Vérification de la présence du dossier .github/workflows
if [[ ! -d ".github/workflows" ]]; then
  log "Création du dossier .github/workflows..."
  mkdir -p .github/workflows
  success "Dossier .github/workflows créé"
fi

# Vérification de la présence du fichier de workflow GitHub Actions
if [[ ! -f ".github/workflows/deploy.yml" ]]; then
  log "Création du fichier de workflow GitHub Actions..."
  cat > .github/workflows/deploy.yml << 'EOF'
name: Déploiement FloDrama sur GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3

      - name: Configuration de Node.js 📦
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Installation des dépendances 🔧
        run: |
          npm ci
          
      - name: Build du projet 🏗️
        run: |
          echo "Création du build de production avec Navbar..."
          # Vérifier que le composant Navbar est bien utilisé dans App.jsx
          grep -q "import Navbar from './components/layout/Navbar'" Frontend/App.jsx
          grep -q "<Navbar />" Frontend/App.jsx
          # Construction du projet
          npm run build
        
      - name: Déploiement sur GitHub Pages 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
          clean: true
          
      - name: Notification de déploiement réussi 📢
        run: |
          echo "🎉 FloDrama a été déployé avec succès sur GitHub Pages avec la Navbar avancée!"
          echo "L'application est maintenant accessible via https://flori92.github.io/FloDrama/"
EOF
  success "Fichier de workflow GitHub Actions créé"
fi

# Commit des modifications
log "Commit des modifications..."
git add Frontend/App.jsx .github/workflows/deploy.yml
git commit -m "✨ [FEAT] Remplacement du Header par la Navbar avancée" || warning "Erreur lors du commit, peut-être aucune modification à committer"

# Push vers GitHub
log "Push vers GitHub..."
git push origin main || warning "Erreur lors du push, vérifiez vos identifiants et votre connexion"

success "✅ Déploiement préparé avec succès!"
log "Pour finaliser le déploiement, GitHub Actions va automatiquement construire et déployer l'application."
log "L'application sera accessible via https://flori92.github.io/FloDrama/ une fois le déploiement terminé."
log "Vous pouvez suivre l'avancement du déploiement dans l'onglet Actions de votre repository GitHub."
