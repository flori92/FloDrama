#!/bin/bash

# Script de configuration de l'intégration AWS/Vercel pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Configuration de l'intégration AWS/Vercel pour FloDrama"

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

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

echo "📋 Configuration des variables d'environnement Vercel..."

# Création du fichier .env.production
cat > ./.env.production << EOF
REACT_APP_VIDEO_PROXY_API=$API_URL
REACT_APP_CLOUDFRONT_DOMAIN=https://$CLOUDFRONT_DOMAIN
REACT_APP_ENV=production
EOF

# Création du fichier .env.development
cat > ./.env.development << EOF
REACT_APP_VIDEO_PROXY_API=$API_URL
REACT_APP_CLOUDFRONT_DOMAIN=https://$CLOUDFRONT_DOMAIN
REACT_APP_ENV=development
EOF

echo "📋 Mise à jour du fichier vercel.json..."

# Sauvegarde du fichier vercel.json existant
cp ./vercel.json ./vercel.json.bak

# Mise à jour du fichier vercel.json
cat > ./vercel.json << EOF
{
  "version": 2,
  "public": true,
  "cleanUrls": true,
  "trailingSlash": false,
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "REACT_APP_VIDEO_PROXY_API": "$API_URL",
    "REACT_APP_CLOUDFRONT_DOMAIN": "https://$CLOUDFRONT_DOMAIN"
  },
  "build": {
    "env": {
      "REACT_APP_VIDEO_PROXY_API": "$API_URL",
      "REACT_APP_CLOUDFRONT_DOMAIN": "https://$CLOUDFRONT_DOMAIN"
    }
  }
}
EOF

echo "📋 Création du script de déploiement Vercel..."

# Création du script de déploiement Vercel
cat > ./scripts/deployer-flodrama-vercel.sh << EOF
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
EOF

# Rendre le script exécutable
chmod +x ./scripts/deployer-flodrama-vercel.sh

echo "📋 Création du script de test de l'intégration..."

# Création du script de test de l'intégration
cat > ./scripts/tester-integration-aws-vercel.sh << EOF
#!/bin/bash

# Script de test de l'intégration AWS/Vercel pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Test de l'intégration AWS/Vercel pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

echo "📋 Test de l'API Gateway..."
curl -s "$API_URL?contentId=test&quality=720p" | jq .

echo "📋 Test de CloudFront..."
curl -s -I "https://$CLOUDFRONT_DOMAIN" | head -n 1

echo "✅ Tests terminés!"
EOF

# Rendre le script exécutable
chmod +x ./scripts/tester-integration-aws-vercel.sh

echo "✅ Configuration terminée avec succès!"
echo "📌 Variables d'environnement configurées pour Vercel"
echo "📌 Fichier vercel.json mis à jour"
echo "📌 Scripts de déploiement et de test créés"

echo "🔍 Prochaines étapes:"
echo "1. Exécutez './scripts/configurer-proxy-video-aws.sh' pour configurer l'infrastructure AWS"
echo "2. Exécutez './scripts/tester-integration-aws-vercel.sh' pour tester l'intégration"
echo "3. Exécutez './scripts/deployer-flodrama-vercel.sh' pour déployer sur Vercel"
