#!/bin/bash

# Script de déploiement simplifié pour la fonction Lambda FloDrama
# Ce script met à jour uniquement le code de la fonction Lambda

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher les messages de succès
success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Nom de la fonction Lambda
LAMBDA_FUNCTION_NAME="flodrama-stream-proxy"

# Créer un répertoire temporaire pour le package
TEMP_DIR=$(mktemp -d)
info "Création du package dans $TEMP_DIR"

# Copier le fichier index.js dans le répertoire temporaire
cp lambda/index.js "$TEMP_DIR/"
info "Fichier index.js copié dans $TEMP_DIR"

# Créer le package ZIP
ZIP_FILE="$TEMP_DIR/lambda-package.zip"
info "Création du package ZIP..."
cd "$TEMP_DIR" && zip -j "$ZIP_FILE" index.js
info "Package ZIP créé avec succès"

# Mettre à jour le code de la fonction Lambda
info "Mise à jour du code de la fonction Lambda..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE"

if [ $? -eq 0 ]; then
    success "Code de la fonction Lambda mis à jour avec succès"
else
    error "Échec de la mise à jour du code de la fonction Lambda"
    exit 1
fi

# Mettre à jour la configuration du gestionnaire
info "Mise à jour de la configuration du gestionnaire..."
aws lambda update-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --handler "index.handler" \
    --environment "Variables={S3_BUCKET=flodrama-video-cache,DYNAMO_TABLE=flodrama-streaming-metadata,TOKEN_EXPIRATION=7200}"

if [ $? -eq 0 ]; then
    success "Configuration du gestionnaire mise à jour avec succès"
else
    error "Échec de la mise à jour de la configuration du gestionnaire"
    exit 1
fi

# Nettoyer le répertoire temporaire
rm -rf "$TEMP_DIR"
info "Nettoyage du répertoire temporaire terminé"

# Tester la fonction Lambda
info "Test de la fonction Lambda..."

# Créer un fichier de test temporaire
TEST_FILE=$(mktemp)
cat > "$TEST_FILE" << EOF
{
  "httpMethod": "GET",
  "queryStringParameters": {
    "contentId": "test",
    "quality": "720p"
  },
  "headers": {
    "User-Agent": "Lambda-Test-Script"
  },
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
EOF

# Invoquer la fonction Lambda avec le fichier de test
info "Invocation de la fonction Lambda avec des paramètres de test..."
aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --payload "fileb://$TEST_FILE" \
    --cli-binary-format raw-in-base64-out \
    "$TEST_FILE.response"

if [ $? -eq 0 ]; then
    success "Fonction Lambda invoquée avec succès"
    
    # Vérifier la réponse
    cat "$TEST_FILE.response"
else
    error "Échec de l'invocation de la fonction Lambda"
fi

# Nettoyer les fichiers temporaires
rm -f "$TEST_FILE" "$TEST_FILE.response"

success "Déploiement terminé avec succès!"
