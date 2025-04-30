#!/bin/bash
# Script simplifié de configuration de l'API Gateway pour FloDrama
# Créé le 9 avril 2025

# Configuration
LAMBDA_FUNCTION="flodrama-stream-proxy"
API_NAME="flodrama-video-api"
STAGE_NAME="prod"
REGION="us-east-1"
CONFIG_FILE="./config/video-proxy-config.json"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration simplifiée de l'API Gateway pour FloDrama...${NC}"

# Vérifier si la fonction Lambda existe
echo -e "${YELLOW}Vérification de la fonction Lambda...${NC}"
LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" --query 'Configuration.FunctionArn' --output text 2>/dev/null)

if [ -z "$LAMBDA_ARN" ]; then
    echo -e "${RED}La fonction Lambda $LAMBDA_FUNCTION n'existe pas. Veuillez d'abord créer la fonction Lambda.${NC}"
    exit 1
else
    echo -e "${GREEN}La fonction Lambda existe: $LAMBDA_ARN${NC}"
fi

# Créer l'API Gateway
echo -e "${YELLOW}Création de l'API Gateway...${NC}"
API_ID=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "API pour le streaming vidéo FloDrama" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo -e "${GREEN}API Gateway créée avec succès: $API_ID${NC}"

# Obtenir l'ID de la ressource racine
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/`].id' \
    --output text)

echo -e "${YELLOW}ID de la ressource racine: $ROOT_RESOURCE_ID${NC}"

# Créer la ressource /stream
echo -e "${YELLOW}Création de la ressource /stream...${NC}"
STREAM_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_RESOURCE_ID" \
    --path-part "stream" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo -e "${GREEN}Ressource /stream créée avec succès: $STREAM_RESOURCE_ID${NC}"

# Créer la méthode GET pour /stream
echo -e "${YELLOW}Création de la méthode GET pour /stream...${NC}"
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "GET" \
    --authorization-type "NONE" \
    --region "$REGION"

# Créer la méthode OPTIONS pour /stream (CORS)
echo -e "${YELLOW}Création de la méthode OPTIONS pour /stream (CORS)...${NC}"
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "OPTIONS" \
    --authorization-type "NONE" \
    --region "$REGION"

# Créer l'intégration Lambda pour la méthode GET
echo -e "${YELLOW}Création de l'intégration Lambda pour la méthode GET...${NC}"
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "GET" \
    --type "AWS_PROXY" \
    --integration-http-method "POST" \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region "$REGION"

# Créer l'intégration MOCK pour la méthode OPTIONS (CORS)
echo -e "${YELLOW}Création de l'intégration MOCK pour la méthode OPTIONS (CORS)...${NC}"
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "OPTIONS" \
    --type "MOCK" \
    --integration-http-method "OPTIONS" \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

# Créer la réponse de méthode pour GET
echo -e "${YELLOW}Création de la réponse de méthode pour GET...${NC}"
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "GET" \
    --status-code "200" \
    --response-models '{"application/json":"Empty"}' \
    --region "$REGION"

# Créer la réponse de méthode pour OPTIONS
echo -e "${YELLOW}Création de la réponse de méthode pour OPTIONS...${NC}"
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-models '{"application/json":"Empty"}' \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Headers": true
    }' \
    --region "$REGION"

# Créer la réponse d'intégration pour GET
echo -e "${YELLOW}Création de la réponse d'intégration pour GET...${NC}"
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "GET" \
    --status-code "200" \
    --selection-pattern "" \
    --region "$REGION"

# Créer la réponse d'intégration pour OPTIONS
echo -e "${YELLOW}Création de la réponse d'intégration pour OPTIONS...${NC}"
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$STREAM_RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --selection-pattern "" \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": "'"'*'"'",
        "method.response.header.Access-Control-Allow-Methods": "'"'GET,OPTIONS'"'",
        "method.response.header.Access-Control-Allow-Headers": "'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin'"'"
    }' \
    --response-templates '{"application/json":"{\"message\":\"CORS configuré avec succès\"}"}' \
    --region "$REGION"

# Donner l'autorisation à l'API Gateway d'invoquer la fonction Lambda
echo -e "${YELLOW}Attribution des permissions pour invoquer la fonction Lambda...${NC}"
aws lambda add-permission \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id "apigateway-permission-$API_ID" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*/*" \
    --region "$REGION"

# Déployer l'API
echo -e "${YELLOW}Déploiement de l'API Gateway...${NC}"
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --region "$REGION"

# Obtenir l'URL de l'API
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME"

# Mettre à jour le fichier de configuration
echo -e "${YELLOW}Mise à jour du fichier de configuration...${NC}"
if [ -f "$CONFIG_FILE" ]; then
    # Vérifier si jq est installé
    if command -v jq &> /dev/null; then
        jq --arg api "$API_URL" --arg id "$API_ID" --arg stage "$STAGE_NAME" '.apiGateway = {"url": $api, "id": $id, "stage": $stage}' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    else
        echo "jq n'est pas installé, mise à jour manuelle du fichier de configuration"
        # Mise à jour simple sans jq
        sed -i '' 's|"apiGateway": ".*"|"apiGateway": {"url": "'"$API_URL"'", "id": "'"$API_ID"'", "stage": "'"$STAGE_NAME"'"}|g' "$CONFIG_FILE"
    fi
else
    echo -e "${RED}Le fichier de configuration n'existe pas. Création...${NC}"
    mkdir -p $(dirname "$CONFIG_FILE")
    echo '{
        "s3": {
            "bucket": "flodrama-video-cache"
        },
        "lambda": {
            "function": "flodrama-stream-proxy"
        },
        "dynamodb": {
            "table": "flodrama-streaming-metadata"
        },
        "tokenExpiration": 7200,
        "apiGateway": {
            "url": "'"$API_URL"'",
            "id": "'"$API_ID"'",
            "stage": "'"$STAGE_NAME"'"
        }
    }' > "$CONFIG_FILE"
fi

# Mettre à jour le fichier .env.development
ENV_FILE="./.env.development"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Mise à jour du fichier .env.development...${NC}"
    if grep -q "REACT_APP_VIDEO_PROXY_API" "$ENV_FILE"; then
        sed -i '' "s|REACT_APP_VIDEO_PROXY_API=.*|REACT_APP_VIDEO_PROXY_API=$API_URL|g" "$ENV_FILE"
    else
        echo "REACT_APP_VIDEO_PROXY_API=$API_URL" >> "$ENV_FILE"
    fi
else
    echo -e "${YELLOW}Création du fichier .env.development...${NC}"
    echo "REACT_APP_VIDEO_PROXY_API=$API_URL" > "$ENV_FILE"
fi

echo -e "${GREEN}Configuration de l'API Gateway terminée avec succès.${NC}"
echo -e "${YELLOW}URL de l'API: ${NC}$API_URL"
echo -e "${YELLOW}Testez l'API avec: ${NC}curl $API_URL/stream?contentId=test&quality=720p"
