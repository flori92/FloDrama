#!/bin/bash

# Script de déploiement pour FloDrama sur Cloudflare
# Ce script déploie l'ensemble de l'application FloDrama sur Cloudflare

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher un avertissement
warning() {
  echo -e "${YELLOW}⚠️ $1${NC}"
}

# Fonction pour afficher une erreur
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier si Wrangler est installé
if ! command -v wrangler &> /dev/null; then
  warning "Wrangler n'est pas installé. Installation en cours..."
  npm install -g wrangler
  if [ $? -ne 0 ]; then
    error "Échec de l'installation de Wrangler. Veuillez l'installer manuellement."
  fi
  success "Wrangler installé avec succès."
else
  success "Wrangler est déjà installé."
fi

# Vérifier si l'utilisateur est connecté à Cloudflare
echo "🔑 Vérification de la connexion à Cloudflare..."
WHOAMI_OUTPUT=$(wrangler whoami 2>&1)
if [[ $WHOAMI_OUTPUT == *"Error"* ]] || [[ $WHOAMI_OUTPUT == *"not logged in"* ]]; then
  warning "Vous n'êtes pas connecté à Cloudflare. Connexion en cours..."
  wrangler login
  if [ $? -ne 0 ]; then
    error "Échec de la connexion à Cloudflare. Veuillez vous connecter manuellement avec 'wrangler login'."
  fi
  success "Connecté à Cloudflare avec succès."
else
  success "Déjà connecté à Cloudflare."
fi

# Création des ressources Cloudflare
echo "🏗️ Création des ressources Cloudflare..."

# Vérifier/créer la base de données D1
echo "🗄️ Vérification de la base de données D1..."
D1_LIST=$(wrangler d1 list --json 2>&1)
if [[ $D1_LIST == *"flodrama-db"* ]]; then
  success "Base de données D1 'flodrama-db' existe déjà."
  # Extraire l'ID de la base de données
  D1_ID=$(echo $D1_LIST | grep -o '"uuid":"[^"]*"' | grep -o '[^"]*$' | head -1)
  echo "   ID de la base de données: $D1_ID"
else
  warning "Création de la base de données D1 'flodrama-db'..."
  D1_CREATE=$(wrangler d1 create flodrama-db --json 2>&1)
  if [ $? -ne 0 ]; then
    error "Échec de la création de la base de données D1. Erreur: $D1_CREATE"
  fi
  D1_ID=$(echo $D1_CREATE | grep -o '"uuid":"[^"]*"' | grep -o '[^"]*$')
  success "Base de données D1 'flodrama-db' créée avec succès. ID: $D1_ID"
fi

# Vérifier/créer le bucket R2
echo "📦 Vérification du bucket R2..."
R2_LIST=$(wrangler r2 bucket list --json 2>&1)
if [[ $R2_LIST == *"flodrama-storage"* ]]; then
  success "Bucket R2 'flodrama-storage' existe déjà."
else
  warning "Création du bucket R2 'flodrama-storage'..."
  R2_CREATE=$(wrangler r2 bucket create flodrama-storage 2>&1)
  if [ $? -ne 0 ]; then
    error "Échec de la création du bucket R2. Erreur: $R2_CREATE"
  fi
  success "Bucket R2 'flodrama-storage' créé avec succès."
fi

# Vérifier/créer le namespace KV
echo "🔑 Vérification du namespace KV..."
KV_LIST=$(wrangler kv:namespace list --json 2>&1)
if [[ $KV_LIST == *"FLODRAMA_METADATA"* ]]; then
  success "Namespace KV 'FLODRAMA_METADATA' existe déjà."
  # Extraire l'ID du namespace KV
  KV_ID=$(echo $KV_LIST | grep -o '"id":"[^"]*"' | grep -o '[^"]*$' | head -1)
  echo "   ID du namespace KV: $KV_ID"
else
  warning "Création du namespace KV 'FLODRAMA_METADATA'..."
  KV_CREATE=$(wrangler kv:namespace create FLODRAMA_METADATA --json 2>&1)
  if [ $? -ne 0 ]; then
    error "Échec de la création du namespace KV. Erreur: $KV_CREATE"
  fi
  KV_ID=$(echo $KV_CREATE | grep -o '"id":"[^"]*"' | grep -o '[^"]*$')
  success "Namespace KV 'FLODRAMA_METADATA' créé avec succès. ID: $KV_ID"
fi

# Mettre à jour les fichiers de configuration
echo "📝 Mise à jour des fichiers de configuration..."

# Mettre à jour wrangler.toml du backend
echo "   Mise à jour de backend/wrangler.toml..."
sed -i '' "s/# database_id = \"\"/database_id = \"$D1_ID\"/" backend/wrangler.toml
sed -i '' "s/# \[\[d1_databases\]\]/[[d1_databases]]/" backend/wrangler.toml
sed -i '' "s/# binding = \"DB\"/binding = \"DB\"/" backend/wrangler.toml
sed -i '' "s/# database_name = \"flodrama-db\"/database_name = \"flodrama-db\"/" backend/wrangler.toml

# Mettre à jour wrangler.toml du scraper
echo "   Mise à jour de scraping/wrangler.toml..."
sed -i '' "s/# database_id = \"\"/database_id = \"$D1_ID\"/" scraping/wrangler.toml
sed -i '' "s/# \[\[d1_databases\]\]/[[d1_databases]]/" scraping/wrangler.toml
sed -i '' "s/# binding = \"DB\"/binding = \"DB\"/" scraping/wrangler.toml
sed -i '' "s/# database_name = \"flodrama-db\"/database_name = \"flodrama-db\"/" scraping/wrangler.toml

success "Fichiers de configuration mis à jour avec succès."

# Initialisation du schéma de la base de données
echo "🗃️ Initialisation du schéma de la base de données..."
wrangler d1 execute flodrama-db --file=backend/schema.sql
if [ $? -ne 0 ]; then
  error "Échec de l'initialisation du schéma de la base de données."
fi
success "Schéma de la base de données initialisé avec succès."

# Déploiement du backend
echo "🚀 Déploiement du backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
  error "Échec de l'installation des dépendances du backend."
fi

wrangler deploy
if [ $? -ne 0 ]; then
  error "Échec du déploiement du backend."
fi
success "Backend déployé avec succès."
BACKEND_URL=$(wrangler deploy --json | grep -o '"url":"[^"]*"' | grep -o 'https://[^"]*')
echo "   URL du backend: $BACKEND_URL"
cd ..

# Déploiement du scraper
echo "🚀 Déploiement du scraper..."
cd scraping
npm install
if [ $? -ne 0 ]; then
  error "Échec de l'installation des dépendances du scraper."
fi

wrangler deploy
if [ $? -ne 0 ]; then
  error "Échec du déploiement du scraper."
fi
success "Scraper déployé avec succès."
SCRAPER_URL=$(wrangler deploy --json | grep -o '"url":"[^"]*"' | grep -o 'https://[^"]*')
echo "   URL du scraper: $SCRAPER_URL"
cd ..

# Mise à jour de l'URL de l'API dans le frontend
echo "📝 Mise à jour de l'URL de l'API dans le frontend..."
echo "VITE_API_URL=$BACKEND_URL" > frontend/.env.production
success "URL de l'API mise à jour dans le frontend."

# Déploiement du frontend
echo "🚀 Déploiement du frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
  error "Échec de l'installation des dépendances du frontend."
fi

npm run build
if [ $? -ne 0 ]; then
  error "Échec de la construction du frontend."
fi

# Déploiement sur Cloudflare Pages
echo "   Déploiement sur Cloudflare Pages..."
wrangler pages publish dist --project-name=flodrama-frontend
if [ $? -ne 0 ]; then
  error "Échec du déploiement du frontend sur Cloudflare Pages."
fi
success "Frontend déployé avec succès."
cd ..

echo ""
echo "🎉 Déploiement de FloDrama sur Cloudflare terminé avec succès!"
echo "   Backend: $BACKEND_URL"
echo "   Scraper: $SCRAPER_URL"
echo "   Frontend: https://flodrama-frontend.pages.dev"
echo ""
echo "Pour configurer un domaine personnalisé, utilisez le tableau de bord Cloudflare."
