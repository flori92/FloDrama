#!/bin/bash

# Script de test de l'intégration AWS/Vercel pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Test de l'intégration AWS/Vercel pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "./config/video-proxy-config.json" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

API_URL=https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream
CLOUDFRONT_DOMAIN=dyba0cgavum1j.cloudfront.net

echo "📋 Test de l'API Gateway..."
curl -s "https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream?contentId=test&quality=720p" | jq .

echo "📋 Test de CloudFront..."
curl -s -I "https://dyba0cgavum1j.cloudfront.net" | head -n 1

echo "✅ Tests terminés!"
