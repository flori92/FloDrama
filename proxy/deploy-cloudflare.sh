#!/bin/bash
# Script de déploiement du proxy CORS FloDrama sur Cloudflare Workers

echo "🚀 Déploiement du proxy CORS FloDrama sur Cloudflare Workers"

# Vérifier si Wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "Installation de Wrangler..."
    npm install -g wrangler
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Authentification à Cloudflare (si nécessaire)
echo "🔑 Vérification de l'authentification Cloudflare..."
wrangler whoami || wrangler login

# Déploiement du worker
echo "🚀 Déploiement du worker..."
wrangler publish

# Récupérer l'URL du worker
echo "📝 Votre proxy CORS est maintenant déployé!"
echo "⚠️ Notez l'URL du worker ci-dessus et mettez à jour le fichier .env.production avec:"
echo "VITE_API_URL=https://votre-worker.workers.dev/api"

echo "✨ Déploiement terminé!"
echo "📝 Pour mettre à jour le frontend, exécutez:"
echo "cd ../Frontend && git add .env.production && git commit -m \"✨ [CONFIG] Mise à jour de l'URL de l'API pour utiliser le proxy CORS\" && git push"
