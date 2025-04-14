#!/bin/bash

# Script de déploiement hybride AWS/Vercel pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Déploiement hybride AWS/Vercel pour FloDrama"

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

echo "📋 Vérification des fichiers de configuration..."

# Vérification du fichier .env.production
if [ ! -f "./.env.production" ]; then
    echo "❌ Fichier .env.production introuvable. Veuillez exécuter le script configurer-integration-aws-vercel.sh."
    exit 1
fi

# Vérification du fichier vercel.json
if [ ! -f "./vercel.json" ]; then
    echo "❌ Fichier vercel.json introuvable. Veuillez exécuter le script configurer-integration-aws-vercel.sh."
    exit 1
fi

echo "📋 Sauvegarde des fichiers importants..."

# Création d'un répertoire pour les sauvegardes
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}_backup_deployment"
mkdir -p "$BACKUP_DIR"

# Sauvegarde des fichiers importants
cp ./.env.production "$BACKUP_DIR/"
cp ./vercel.json "$BACKUP_DIR/"
cp "$CONFIG_FILE" "$BACKUP_DIR/"

echo "📋 Installation des dépendances..."
npm install

echo "📋 Construction du projet..."
npm run build

echo "📋 Déploiement sur Vercel..."
vercel --prod

echo "✅ Déploiement terminé avec succès!"
echo "📌 URL de l'application: https://flodrama.vercel.app"
echo "📌 API Gateway: $API_URL"
echo "📌 CloudFront: https://$CLOUDFRONT_DOMAIN"

# Création d'un rapport de déploiement
REPORT_FILE="./docs/rapport-deploiement-${TIMESTAMP}.md"
cat > "$REPORT_FILE" << EOF
# Rapport de déploiement FloDrama

## Date et heure
$(date)

## Configuration
- **URL de l'application**: https://flodrama.vercel.app
- **API Gateway**: $API_URL
- **CloudFront**: https://$CLOUDFRONT_DOMAIN

## Architecture
FloDrama utilise une architecture hybride AWS/Vercel pour offrir une expérience de streaming vidéo sécurisée et performante.

### Composants AWS
- **API Gateway**: Gestion des requêtes de streaming
- **Lambda**: Logique métier et génération d'URLs signées
- **CloudFront**: Distribution de contenu (CDN)
- **S3**: Stockage et mise en cache des vidéos
- **DynamoDB**: Métadonnées et statistiques de visionnage

### Composants Vercel
- **Frontend React**: Interface utilisateur
- **VideoPlayer**: Composant de lecture vidéo
- **VideoProxyService**: Service de proxy pour les vidéos

## Prochaines étapes
1. Surveiller les performances de l'application
2. Optimiser les coûts AWS
3. Ajouter des fonctionnalités de recommandation

## Sauvegarde
Une sauvegarde des fichiers de configuration a été créée dans le répertoire:
\`$BACKUP_DIR\`
EOF

echo "📋 Rapport de déploiement créé: $REPORT_FILE"

# Commit des changements
echo "📋 Commit des changements..."
git add .
git commit -m "✨ [FEAT] Ajout du service de streaming vidéo sécurisé"
git push origin main || echo "⚠️ Impossible de pousser les changements. Veuillez le faire manuellement."
