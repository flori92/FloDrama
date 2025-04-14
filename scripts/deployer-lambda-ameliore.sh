#!/bin/bash

# Script de déploiement amélioré pour la fonction Lambda FloDrama
# Ce script déploie la fonction Lambda, configure les variables d'environnement
# et teste son bon fonctionnement

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

# Fonction pour afficher les messages d'avertissement
warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Charger les variables d'environnement
source .env.development 2>/dev/null || warning "Fichier .env.development non trouvé, utilisation des valeurs par défaut"

# Nom de la fonction Lambda
LAMBDA_FUNCTION_NAME=${LAMBDA_FUNCTION_NAME:-"flodrama-stream-proxy"}

# Charger la configuration depuis le fichier JSON
CONFIG_FILE="config/video-proxy-config.json"
if [ -f "$CONFIG_FILE" ]; then
    info "Chargement de la configuration depuis $CONFIG_FILE"
    S3_BUCKET=$(jq -r '.s3.bucket // "flodrama-video-cache"' "$CONFIG_FILE")
    DYNAMO_TABLE=$(jq -r '.dynamodb.table // "flodrama-streaming-metadata"' "$CONFIG_FILE")
    TOKEN_EXPIRATION=$(jq -r '.tokenExpiration // "7200"' "$CONFIG_FILE")
    API_GATEWAY_ID=$(jq -r '.apiGateway.id // ""' "$CONFIG_FILE")
    API_GATEWAY_STAGE=$(jq -r '.apiGateway.stage // "prod"' "$CONFIG_FILE")
else
    warning "Fichier de configuration $CONFIG_FILE non trouvé, utilisation des valeurs par défaut"
    S3_BUCKET="flodrama-video-cache"
    DYNAMO_TABLE="flodrama-streaming-metadata"
    TOKEN_EXPIRATION="7200"
    API_GATEWAY_ID=""
    API_GATEWAY_STAGE="prod"
fi

# Vérifier si le répertoire lambda existe
if [ ! -d "lambda" ]; then
    error "Le répertoire lambda n'existe pas"
    exit 1
fi

# Créer un répertoire temporaire pour le package
TEMP_DIR=$(mktemp -d)
info "Création du package dans $TEMP_DIR"

# Copier les fichiers dans le répertoire temporaire
cp lambda/index.js "$TEMP_DIR/"
cp package.json "$TEMP_DIR/" 2>/dev/null || echo '{"dependencies":{"aws-sdk":"^2.1359.0"}}' > "$TEMP_DIR/package.json"

# Se déplacer dans le répertoire temporaire et installer les dépendances
cd "$TEMP_DIR" || exit 1
info "Installation des dépendances..."
npm install --production --silent

# Vérifier que index.js existe bien dans le répertoire
if [ ! -f "index.js" ]; then
    error "Le fichier index.js n'existe pas dans le package"
    exit 1
fi

# Afficher le contenu du répertoire pour le débogage
info "Contenu du répertoire de package:"
ls -la

# Créer le package ZIP
ZIP_FILE="$TEMP_DIR/lambda-package.zip"
info "Création du package ZIP..."
zip -r "$ZIP_FILE" . -q

# Vérifier le contenu du ZIP pour le débogage
info "Contenu du package ZIP:"
unzip -l "$ZIP_FILE"

# Vérifier si la fonction Lambda existe déjà
info "Vérification de l'existence de la fonction Lambda $LAMBDA_FUNCTION_NAME..."
LAMBDA_EXISTS=$(aws lambda list-functions --query "Functions[?FunctionName=='$LAMBDA_FUNCTION_NAME'].FunctionName" --output text)

if [ -z "$LAMBDA_EXISTS" ]; then
    info "La fonction Lambda n'existe pas, création..."
    
    # Créer le rôle IAM si nécessaire
    ROLE_NAME="flodrama-lambda-role"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        info "Création du rôle IAM $ROLE_NAME..."
        
        # Politique de confiance pour Lambda
        TRUST_POLICY='{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }'
        
        # Créer le rôle
        ROLE_ARN=$(aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document "$TRUST_POLICY" \
            --query 'Role.Arn' \
            --output text)
        
        # Attacher les politiques nécessaires
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
        
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        # Attendre que le rôle soit disponible
        info "Attente de la propagation du rôle IAM..."
        sleep 10
    fi
    
    # Créer la fonction Lambda
    info "Création de la fonction Lambda..."
    aws lambda create-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --runtime "nodejs16.x" \
        --handler "index.handler" \
        --role "$ROLE_ARN" \
        --zip-file "fileb://$ZIP_FILE" \
        --timeout 30 \
        --environment "Variables={S3_BUCKET=$S3_BUCKET,DYNAMO_TABLE=$DYNAMO_TABLE,TOKEN_EXPIRATION=$TOKEN_EXPIRATION}" \
        --memory-size 256
    
    if [ $? -eq 0 ]; then
        success "Fonction Lambda créée avec succès"
    else
        error "Échec de la création de la fonction Lambda"
        exit 1
    fi
else
    info "Mise à jour de la fonction Lambda existante..."
    
    # Mettre à jour le code de la fonction
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE"
    
    # Mettre à jour la configuration de la fonction
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --environment "Variables={S3_BUCKET=$S3_BUCKET,DYNAMO_TABLE=$DYNAMO_TABLE,TOKEN_EXPIRATION=$TOKEN_EXPIRATION}"
    
    if [ $? -eq 0 ]; then
        success "Fonction Lambda mise à jour avec succès"
    else
        error "Échec de la mise à jour de la fonction Lambda"
        exit 1
    fi
fi

# Nettoyer le répertoire temporaire
cd - > /dev/null
rm -rf "$TEMP_DIR"
info "Nettoyage du répertoire temporaire terminé"

# Configurer les autorisations API Gateway si nécessaire
if [ -n "$API_GATEWAY_ID" ]; then
    info "Configuration des autorisations API Gateway..."
    
    # Obtenir l'ARN de la fonction Lambda
    LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --query 'Configuration.FunctionArn' --output text)
    
    # Vérifier si l'autorisation existe déjà
    STATEMENT_ID="apigateway-$API_GATEWAY_ID"
    PERMISSION_EXISTS=$(aws lambda get-policy --function-name "$LAMBDA_FUNCTION_NAME" 2>/dev/null | grep -c "$STATEMENT_ID" || echo "0")
    
    if [ "$PERMISSION_EXISTS" -eq "0" ]; then
        info "Ajout de l'autorisation pour API Gateway..."
        aws lambda add-permission \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --statement-id "$STATEMENT_ID" \
            --action "lambda:InvokeFunction" \
            --principal "apigateway.amazonaws.com" \
            --source-arn "arn:aws:execute-api:us-east-1:*:$API_GATEWAY_ID/*/*/*"
        
        if [ $? -eq 0 ]; then
            success "Autorisation API Gateway ajoutée avec succès"
        else
            warning "Échec de l'ajout de l'autorisation API Gateway"
        fi
    else
        info "L'autorisation API Gateway existe déjà"
    fi
fi

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
    RESPONSE_CODE=$(jq -r '.statusCode' "$TEST_FILE.response" 2>/dev/null || echo "")
    
    if [ "$RESPONSE_CODE" = "200" ]; then
        success "La fonction Lambda a retourné un code 200 OK"
        
        # Extraire l'URL pré-signée
        URL=$(jq -r '.body' "$TEST_FILE.response" | jq -r '.url // ""' 2>/dev/null || echo "")
        
        if [ -n "$URL" ]; then
            success "URL pré-signée générée avec succès: ${URL:0:50}..."
        else
            warning "Aucune URL pré-signée trouvée dans la réponse"
        fi
    else
        error "La fonction Lambda a retourné un code d'erreur: $RESPONSE_CODE"
        cat "$TEST_FILE.response"
    fi
else
    error "Échec de l'invocation de la fonction Lambda"
fi

# Nettoyer les fichiers temporaires
rm -f "$TEST_FILE" "$TEST_FILE.response"

# Afficher les informations de l'API Gateway si disponible
if [ -n "$API_GATEWAY_ID" ]; then
    API_URL="https://$API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/$API_GATEWAY_STAGE"
    success "API Gateway URL: $API_URL"
    echo ""
    echo "Pour tester l'API, utilisez la commande suivante:"
    echo "curl \"$API_URL?contentId=test&quality=720p\""
    echo ""
    echo "Ou ouvrez le fichier test-integration-ameliore.html dans votre navigateur"
fi

success "Déploiement terminé avec succès!"
