#!/bin/bash

# Script de déploiement de FloDrama sur Vercel
# Créé le 8 avril 2025

set -e

echo "🚀 Déploiement de FloDrama sur Vercel"

# Vérification des prérequis
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
fi

# Vérification de l'authentification Vercel
vercel whoami &> /dev/null || {
    echo "❌ Vous n'êtes pas authentifié à Vercel. Veuillez exécuter 'vercel login' avant de continuer."
    exit 1
}

# Construction du projet
echo "📋 Construction du projet..."
npm run build

# Déploiement sur Vercel
echo "📋 Déploiement sur Vercel..."
vercel --prod

echo "✅ Déploiement terminé avec succès!"
