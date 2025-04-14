#!/bin/bash

# Script pour déployer la fonction Lambda mise à jour
# Créé le 8 avril 2025

set -e

echo "🚀 Déploiement de la fonction Lambda FloDrama Stream Proxy"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

# Récupération du nom de la fonction Lambda
LAMBDA_FUNCTION=$(jq -r '.lambdaFunction' "$CONFIG_FILE")
REGION=$(jq -r '.region' "$CONFIG_FILE")

echo "📋 Fonction Lambda: $LAMBDA_FUNCTION"
echo "📋 Région AWS: $REGION"

# Création d'un répertoire temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo "📋 Répertoire temporaire: $TEMP_DIR"

# Copie du code Lambda dans le répertoire temporaire
cp ./lambda/index.js "$TEMP_DIR/"

# Création du package ZIP
cd "$TEMP_DIR"
zip -r lambda_package.zip index.js
cd -

echo "📋 Package Lambda créé: $TEMP_DIR/lambda_package.zip"

# Déploiement de la fonction Lambda
echo "📋 Déploiement de la fonction Lambda..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION" \
    --zip-file "fileb://$TEMP_DIR/lambda_package.zip" \
    --region "$REGION"

echo "✅ Fonction Lambda déployée avec succès!"

# Nettoyage
rm -rf "$TEMP_DIR"
echo "📋 Nettoyage des fichiers temporaires terminé."

echo "📋 Test de la fonction Lambda..."
aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION" \
    --payload '{"queryStringParameters":{"contentId":"test","quality":"720p"},"httpMethod":"GET"}' \
    --region "$REGION" \
    "$TEMP_DIR/output.json"

echo "📋 Réponse de la fonction Lambda:"
cat "$TEMP_DIR/output.json" | jq .

echo "✅ Déploiement et test terminés avec succès!"
