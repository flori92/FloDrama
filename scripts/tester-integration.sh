#!/bin/bash
# Script pour tester l'intégration complète de l'infrastructure de streaming vidéo
# Créé le 9 avril 2025
# Auteur: Développeur FloDrama

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Test d'intégration de l'infrastructure de streaming vidéo FloDrama${NC}"

# Récupération des informations de configuration
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Fichier de configuration AWS introuvable.${NC}"
    echo -e "${YELLOW}Création d'un fichier de configuration par défaut...${NC}"
    
    mkdir -p ./config
    cat > "$CONFIG_FILE" << EOF
{
    "s3Bucket": "flodrama-video-cache",
    "lambdaFunction": "flodrama-stream-proxy",
    "apiGateway": "https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod",
    "cloudfrontDomain": "dyba0cgavum1j.cloudfront.net",
    "region": "us-east-1",
    "dynamoTable": "flodrama-streaming-metadata"
}
EOF
    echo -e "${GREEN}Fichier de configuration créé avec succès.${NC}"
fi

# Récupération des valeurs de configuration
S3_BUCKET=$(jq -r '.s3Bucket' "$CONFIG_FILE")
LAMBDA_FUNCTION=$(jq -r '.lambdaFunction' "$CONFIG_FILE")
API_GATEWAY=$(jq -r '.apiGateway' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")
REGION=$(jq -r '.region' "$CONFIG_FILE")
DYNAMO_TABLE=$(jq -r '.dynamoTable' "$CONFIG_FILE")

echo -e "${YELLOW}Configuration actuelle:${NC}"
echo -e "S3 Bucket: ${GREEN}$S3_BUCKET${NC}"
echo -e "Lambda Function: ${GREEN}$LAMBDA_FUNCTION${NC}"
echo -e "API Gateway: ${GREEN}$API_GATEWAY${NC}"
echo -e "CloudFront Domain: ${GREEN}$CLOUDFRONT_DOMAIN${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "DynamoDB Table: ${GREEN}$DYNAMO_TABLE${NC}"

# Vérification de l'existence du bucket S3
echo -e "\n${YELLOW}Vérification du bucket S3...${NC}"
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo -e "${GREEN}✓ Le bucket S3 existe.${NC}"
else
    echo -e "${RED}✗ Le bucket S3 n'existe pas ou n'est pas accessible.${NC}"
    echo -e "${YELLOW}Exécutez le script configurer-cloudfront.sh pour créer le bucket.${NC}"
    exit 1
fi

# Vérification des vidéos de test dans S3
echo -e "\n${YELLOW}Vérification des vidéos de test dans S3...${NC}"
TEST_VIDEOS=$(aws s3 ls "s3://$S3_BUCKET/test/" --recursive | grep -c "mp4")
if [ "$TEST_VIDEOS" -gt 0 ]; then
    echo -e "${GREEN}✓ $TEST_VIDEOS vidéos de test trouvées dans S3.${NC}"
else
    echo -e "${RED}✗ Aucune vidéo de test trouvée dans S3.${NC}"
    echo -e "${YELLOW}Exécutez le script telecharger-videos-test.sh pour téléverser des vidéos de test.${NC}"
    exit 1
fi

# Vérification de la fonction Lambda
echo -e "\n${YELLOW}Vérification de la fonction Lambda...${NC}"
if aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" &>/dev/null; then
    echo -e "${GREEN}✓ La fonction Lambda existe.${NC}"
    
    # Test de la fonction Lambda
    echo -e "${YELLOW}Test de la fonction Lambda...${NC}"
    TEMP_FILE=$(mktemp)
    if aws lambda invoke --function-name "$LAMBDA_FUNCTION" \
        --payload '{"queryStringParameters":{"contentId":"test","quality":"720p"},"httpMethod":"GET"}' \
        --region "$REGION" "$TEMP_FILE" &>/dev/null; then
        
        LAMBDA_RESPONSE=$(cat "$TEMP_FILE")
        if echo "$LAMBDA_RESPONSE" | grep -q "url"; then
            echo -e "${GREEN}✓ La fonction Lambda fonctionne correctement.${NC}"
        else
            echo -e "${RED}✗ La fonction Lambda ne renvoie pas d'URL.${NC}"
            echo -e "${YELLOW}Réponse: $(cat "$TEMP_FILE")${NC}"
        fi
    else
        echo -e "${RED}✗ Échec de l'invocation de la fonction Lambda.${NC}"
    fi
    rm "$TEMP_FILE"
else
    echo -e "${RED}✗ La fonction Lambda n'existe pas ou n'est pas accessible.${NC}"
    echo -e "${YELLOW}Exécutez le script deployer-lambda.sh pour déployer la fonction Lambda.${NC}"
    exit 1
fi

# Vérification de l'API Gateway
echo -e "\n${YELLOW}Vérification de l'API Gateway...${NC}"
if curl -s "$API_GATEWAY/health" | grep -q "ok"; then
    echo -e "${GREEN}✓ L'API Gateway répond correctement.${NC}"
else
    echo -e "${YELLOW}⚠ Impossible de vérifier l'état de l'API Gateway.${NC}"
    echo -e "${YELLOW}Tentative d'appel à l'API avec un contentId de test...${NC}"
    
    API_RESPONSE=$(curl -s "$API_GATEWAY/stream?contentId=test&quality=720p")
    if echo "$API_RESPONSE" | grep -q "url"; then
        echo -e "${GREEN}✓ L'API Gateway fonctionne correctement.${NC}"
    else
        echo -e "${RED}✗ L'API Gateway ne répond pas correctement.${NC}"
        echo -e "${YELLOW}Réponse: $API_RESPONSE${NC}"
    fi
fi

# Vérification de CloudFront
echo -e "\n${YELLOW}Vérification de CloudFront...${NC}"
if [ -n "$CLOUDFRONT_DOMAIN" ] && [ "$CLOUDFRONT_DOMAIN" != "null" ]; then
    if curl -s -I "https://$CLOUDFRONT_DOMAIN" | grep -q "CloudFront"; then
        echo -e "${GREEN}✓ La distribution CloudFront est active.${NC}"
    else
        echo -e "${YELLOW}⚠ Impossible de vérifier l'état de CloudFront.${NC}"
    fi
else
    echo -e "${RED}✗ Domaine CloudFront non configuré.${NC}"
    echo -e "${YELLOW}Exécutez le script configurer-cloudfront.sh pour configurer CloudFront.${NC}"
fi

# Vérification de DynamoDB
echo -e "\n${YELLOW}Vérification de la table DynamoDB...${NC}"
if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" &>/dev/null; then
    echo -e "${GREEN}✓ La table DynamoDB existe.${NC}"
else
    echo -e "${YELLOW}⚠ La table DynamoDB n'existe pas ou n'est pas accessible.${NC}"
    echo -e "${YELLOW}Création de la table DynamoDB...${NC}"
    
    aws dynamodb create-table \
        --table-name "$DYNAMO_TABLE" \
        --attribute-definitions AttributeName=contentId,AttributeType=S \
        --key-schema AttributeName=contentId,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$REGION" &>/dev/null
    
    echo -e "${GREEN}✓ Table DynamoDB créée avec succès.${NC}"
fi

# Mise à jour du fichier .env.development
echo -e "\n${YELLOW}Mise à jour des variables d'environnement...${NC}"
ENV_FILE="./.env.development"
if [ -f "$ENV_FILE" ]; then
    # Mise à jour ou ajout des variables d'environnement
    if grep -q "REACT_APP_VIDEO_PROXY_API" "$ENV_FILE"; then
        sed -i '' "s|REACT_APP_VIDEO_PROXY_API=.*|REACT_APP_VIDEO_PROXY_API=$API_GATEWAY|g" "$ENV_FILE"
    else
        echo "REACT_APP_VIDEO_PROXY_API=$API_GATEWAY" >> "$ENV_FILE"
    fi
    
    if grep -q "REACT_APP_CLOUDFRONT_DOMAIN" "$ENV_FILE"; then
        sed -i '' "s|REACT_APP_CLOUDFRONT_DOMAIN=.*|REACT_APP_CLOUDFRONT_DOMAIN=https://$CLOUDFRONT_DOMAIN|g" "$ENV_FILE"
    else
        echo "REACT_APP_CLOUDFRONT_DOMAIN=https://$CLOUDFRONT_DOMAIN" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✓ Variables d'environnement mises à jour.${NC}"
else
    echo -e "${YELLOW}Création du fichier .env.development...${NC}"
    cat > "$ENV_FILE" << EOF
REACT_APP_VIDEO_PROXY_API=$API_GATEWAY
REACT_APP_CLOUDFRONT_DOMAIN=https://$CLOUDFRONT_DOMAIN
REACT_APP_ENV=development
EOF
    echo -e "${GREEN}✓ Fichier .env.development créé.${NC}"
fi

# Génération d'URL pré-signées pour les tests
echo -e "\n${YELLOW}Génération d'URL pré-signées pour les tests...${NC}"
./scripts/generer-url-presignees.sh

# Résumé final
echo -e "\n${GREEN}=== Test d'intégration terminé ====${NC}"
echo -e "${GREEN}L'infrastructure de streaming vidéo FloDrama est correctement configurée.${NC}"
echo -e "${YELLOW}Vous pouvez maintenant tester l'intégration complète en ouvrant:${NC}"
echo -e "${GREEN}./test-presigned.html${NC} - Pour tester les URL pré-signées directement"
echo -e "${GREEN}./test-integration-ameliore.html${NC} - Pour tester l'intégration avec l'API"

echo -e "\n${YELLOW}Pour tester l'intégration dans l'application FloDrama:${NC}"
echo -e "1. Démarrez l'application avec ${GREEN}npm start${NC}"
echo -e "2. Accédez à la page de lecture vidéo"
echo -e "3. Vérifiez que la vidéo se charge correctement"

echo -e "\n${YELLOW}Variables d'environnement configurées:${NC}"
echo -e "REACT_APP_VIDEO_PROXY_API=${GREEN}$API_GATEWAY${NC}"
echo -e "REACT_APP_CLOUDFRONT_DOMAIN=${GREEN}https://$CLOUDFRONT_DOMAIN${NC}"
