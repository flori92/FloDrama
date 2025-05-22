#!/bin/bash
# Script de déploiement du système de recommandation FloDrama sur Cloudflare

echo "🚀 Déploiement du système de recommandation FloDrama"
echo "======================================================"

# Vérifier que wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler n'est pas installé. Installation en cours..."
    npm install -g wrangler
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Définir la clé API si elle n'existe pas déjà
echo "🔑 Configuration de la clé API..."
API_KEY=$(openssl rand -hex 16)
npx wrangler secret put API_KEY --env prod << EOF
$API_KEY
EOF

# Déployer le worker
echo "🚀 Déploiement du worker..."
npx wrangler deploy --env prod

echo "✅ Déploiement terminé avec succès!"
echo "======================================================"
echo "Informations importantes:"
echo "- API Key: $API_KEY"
echo "- Utilisez cette clé pour les appels à l'API de scraping"
echo "- Endpoint de santé: https://flodrama-recommendations-prod.florifavi.workers.dev/health"
echo "- Endpoint de recommandations: https://flodrama-recommendations-prod.florifavi.workers.dev/api/recommendations"
echo "- Endpoint de scraping: https://flodrama-recommendations-prod.florifavi.workers.dev/api/scrape"
echo "- Endpoint de sources: https://flodrama-recommendations-prod.florifavi.workers.dev/api/sources"
echo "======================================================"
echo "Pour initialiser la base de données D1, exécutez:"
echo "npx wrangler d1 execute flodrama-db --file=src/utils/schema.sql"
echo "======================================================"
