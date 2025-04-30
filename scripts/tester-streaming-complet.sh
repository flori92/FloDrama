#!/bin/bash

# Script de test complet du streaming vidéo pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Test complet du streaming vidéo pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

echo "📋 Test de l'API Gateway..."
curl -s "$API_URL?contentId=test&quality=720p" | jq .

echo "📋 Test de CloudFront..."
curl -s -I "https://$CLOUDFRONT_DOMAIN" | head -n 1

echo "📋 Test du composant VideoPlayer..."
echo "Ouvrez https://flodrama.vercel.app et testez la lecture d'une vidéo"

echo "✅ Tests terminés!"
