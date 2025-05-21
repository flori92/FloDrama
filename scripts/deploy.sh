#!/bin/bash

# Script de déploiement pour FloDrama API
# Auteur: Support FloDrama
# Dernière mise à jour: $(date +"%Y-%m-%d")

set -e  # Arrête le script en cas d'erreur

echo "🚀 Démarrage du déploiement de FloDrama API..."

# Vérification des dépendances
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js et npm."
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "ℹ️  Installation de Wrangler..."
    npm install -g wrangler@4
fi

# Variables d'environnement
ENV=${1:-production}
WORKER_NAME="flodrama-api"
WORKER_URL="https://flodrama-api.florifavi.workers.dev"

# Vérification de l'environnement
if [ "$ENV" != "production" ] && [ "$ENV" != "staging" ]; then
    echo "❌ Environnement invalide. Utilisation: $0 [production|staging]"
    exit 1
fi

echo "🔍 Vérification de l'environnement: $ENV"

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --only=production

# Vérification des variables d'environnement requises
echo "🔒 Vérification des variables d'environnement..."

# Liste des variables requises
REQUIRED_VARS=(
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "JWT_SECRET"
)

# Vérification des variables d'environnement
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ La variable d'environnement $var n'est pas définie"
        exit 1
    fi
done

# Configuration de Wrangler
echo "⚙️  Configuration de Wrangler..."
wrangler whoami >/dev/null 2>&1 || {
    echo "🔑 Veuillez vous connecter à Cloudflare..."
    wrangler login
}

# Construction du projet
echo "🔨 Construction du projet..."
npm run build

# Déploiement
echo "🚀 Déploiement de l'API..."
wrangler deploy --env $ENV

# Vérification du déploiement
echo "✅ Déploiement terminé avec succès!"
echo "🌐 URL de l'API: $WORKER_URL"

# Vérification de la santé de l'API
echo "🩺 Vérification de la santé de l'API..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/health" || true)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ L'API est opérationnelle!"
else
    echo "⚠️  L'API ne semble pas répondre correctement (HTTP $RESPONSE)"
    echo "Veuillez vérifier les logs pour plus d'informations:"
    echo "wrangler tail"
    exit 1
fi

echo "✨ Déploiement terminé avec succès!"
