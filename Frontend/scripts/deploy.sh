#!/bin/bash
# Script de déploiement pour le front-end FloDrama
# Créé le 26-03-2025

set -e

echo "🚀 Déploiement du front-end FloDrama"
echo "===================================="

# Vérification des prérequis
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Configuration
BUCKET_NAME="flodrama-app-bucket"
DISTRIBUTION_ID="E5XC74WR62W9Z"
BUILD_DIR="dist"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}_backup_frontend"

# Création du répertoire de sauvegarde
mkdir -p "backups"

echo "📦 Construction de l'application en mode production..."
npm run build

# Sauvegarde de la build
echo "💾 Sauvegarde de la build dans ${BACKUP_DIR}..."
mkdir -p "${BACKUP_DIR}"
cp -r "${BUILD_DIR}"/* "${BACKUP_DIR}/"

# Synchronisation avec S3
echo "🔄 Synchronisation avec le bucket S3 ${BUCKET_NAME}..."
aws s3 sync "${BUILD_DIR}" "s3://${BUCKET_NAME}" --delete

# Invalidation du cache CloudFront
echo "🔄 Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"

echo "===================================="
echo "✅ Déploiement terminé avec succès !"
echo "🌐 Le site est accessible à l'adresse : https://www.flodrama.com"
echo "===================================="

# Commit et push des changements
echo "📝 Commit et push des changements..."
cd ..
git add Frontend/.env.production Frontend/scripts/deploy.sh
git commit -m "✨ [FEAT] Correction de la région AWS et déploiement du front-end"
git push origin main

echo "✅ Changements sauvegardés dans le dépôt Git"
