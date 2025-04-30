#!/bin/bash
# Script de déploiement Vercel pour FloDrama
# Créé le 30-04-2025

set -e

echo "🚀 Déploiement de FloDrama sur Vercel"
echo "===================================="

# Vérification des prérequis
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Configuration
FRONTEND_DIR="$(pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_${TIMESTAMP}.log"

# Création du répertoire de logs
mkdir -p "logs"

echo "📋 Vérification des dépendances..."
npm install

echo "🧪 Exécution des tests..."
npm test -- --passWithNoTests

# Vérification si l'utilisateur est connecté à Vercel
VERCEL_TOKEN=$(vercel whoami 2>/dev/null || echo "")
if [ -z "$VERCEL_TOKEN" ]; then
    echo "📝 Connexion à Vercel requise..."
    vercel login
fi

# Déploiement sur Vercel
echo "🚀 Déploiement sur Vercel..."
if [ "$1" == "production" ]; then
    echo "🌐 Déploiement en PRODUCTION"
    vercel --prod | tee -a "$LOG_FILE"
else
    echo "🔍 Déploiement en PRÉVISUALISATION"
    vercel | tee -a "$LOG_FILE"
fi

# Récupération de l'URL de déploiement
DEPLOY_URL=$(grep -o 'https://.*vercel.app' "$LOG_FILE" | tail -1)

echo "===================================="
echo "✅ Déploiement terminé avec succès !"
if [ -n "$DEPLOY_URL" ]; then
    echo "🌐 Le site est accessible à l'adresse : $DEPLOY_URL"
else
    echo "🌐 Vérifiez votre tableau de bord Vercel pour l'URL de déploiement."
fi
echo "===================================="

# Instructions pour la configuration des variables d'environnement
echo "📝 N'oubliez pas de configurer les variables d'environnement dans le tableau de bord Vercel :"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "===================================="
