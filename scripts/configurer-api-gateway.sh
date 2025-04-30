#!/bin/bash
# Script de configuration de l'API Gateway pour FloDrama
# Créé le 9 avril 2025
# Auteur: Développeur FloDrama

set -e

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

echo -e "${YELLOW}Configuration de l'API Gateway pour FloDrama...${NC}"

# Vérifier si le fichier de configuration existe
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Le fichier de configuration n'existe pas. Création...${NC}"
    mkdir -p $(dirname "$CONFIG_FILE")
    echo '{
        "s3Bucket": "flodrama-video-cache",
        "lambdaFunction": "flodrama-stream-proxy",
        "region": "us-east-1",
        "dynamoTable": "flodrama-streaming-metadata"
    }' > "$CONFIG_FILE"
fi

# Vérifier si la fonction Lambda existe
echo -e "${YELLOW}Vérification de la fonction Lambda...${NC}"
if ! aws lambda get-function --function-name "$LAMBDA_FUNCTION" --region "$REGION" &> /dev/null; then
    echo -e "${RED}La fonction Lambda $LAMBDA_FUNCTION n'existe pas. Création...${NC}"
    
    # Créer un répertoire temporaire
    TEMP_DIR=$(mktemp -d)
    
    # Créer le code de la fonction Lambda
    cat > "$TEMP_DIR/index.js" << 'EOF'
const AWS = require('aws-sdk');

// Configuration
const S3_BUCKET = process.env.S3_BUCKET || 'flodrama-video-cache';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'flodrama-streaming-metadata';
const TOKEN_EXPIRATION = parseInt(process.env.TOKEN_EXPIRATION || '7200'); // 2 heures en secondes

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    // Configuration des en-têtes CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Répondre aux requêtes OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS configuré avec succès' })
        };
    }
    
    try {
        // Récupération des paramètres de la requête
        const queryParams = event.queryStringParameters || {};
        const contentId = queryParams.contentId;
        const quality = queryParams.quality || '720p';
        
        if (!contentId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Le paramètre contentId est obligatoire' })
            };
        }
        
        // Pour les tests, générer une URL pré-signée pour la vidéo de test
        if (contentId === 'test') {
            const s3Key = `test/test-video-${quality}.mp4`;
            
            // Vérifier si le fichier existe dans S3
            try {
                await s3.headObject({
                    Bucket: S3_BUCKET,
                    Key: s3Key
                }).promise();
            } catch (error) {
                // Si le fichier n'existe pas, utiliser une qualité par défaut
                if (error.code === 'NotFound') {
                    console.log(`Fichier ${s3Key} non trouvé, utilisation de la vidéo par défaut`);
                    s3Key = 'test/test-video.mp4';
                } else {
                    throw error;
                }
            }
            
            // Génération de l'URL pré-signée
            const presignedUrl = s3.getSignedUrl('getObject', {
                Bucket: S3_BUCKET,
                Key: s3Key,
                Expires: TOKEN_EXPIRATION
            });
            
            // Calcul de la date d'expiration
            const expirationDate = new Date();
            expirationDate.setSeconds(expirationDate.getSeconds() + TOKEN_EXPIRATION);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    url: presignedUrl,
                    quality: quality,
                    expires: expirationDate.toISOString(),
                    availableQualities: ['240p', '360p', '480p', '720p', '1080p']
                })
            };
        }
        
        // Pour les contenus réels, récupérer les informations depuis DynamoDB
        const dynamoParams = {
            TableName: DYNAMO_TABLE,
            Key: {
                contentId: contentId
            }
        };
        
        let contentData;
        try {
            const dynamoResult = await dynamoDB.get(dynamoParams).promise();
            contentData = dynamoResult.Item;
        } catch (error) {
            console.error('Erreur lors de la récupération des données DynamoDB:', error);
            // En cas d'erreur, on continue avec des données par défaut
            contentData = {
                contentId: contentId,
                title: 'Contenu non trouvé',
                s3Key: `${contentId}/${quality}.mp4`,
                availableQualities: ['480p', '720p']
            };
        }
        
        if (!contentData) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Contenu non trouvé',
                    message: `Aucun contenu trouvé pour l'ID: ${contentId}`
                })
            };
        }
        
        // Génération de l'URL pré-signée
        const s3Key = `${contentId}/${quality}.mp4`;
        
        // Vérification si la vidéo existe déjà dans S3
        let videoExists = false;
        try {
            await s3.headObject({
                Bucket: S3_BUCKET,
                Key: s3Key
            }).promise();
            videoExists = true;
        } catch (error) {
            if (error.code !== 'NotFound') {
                throw error;
            }
        }
        
        // Si la vidéo n'existe pas, utiliser l'URL source pour la récupérer
        if (!videoExists && contentData.sourceUrl) {
            // Ici, on pourrait implémenter une logique pour télécharger la vidéo depuis l'URL source
            // et la stocker dans S3, mais pour l'instant on renvoie simplement l'URL source
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    url: contentData.sourceUrl,
                    quality: quality,
                    isSourceUrl: true,
                    availableQualities: contentData.availableQualities || ['480p', '720p']
                })
            };
        }
        
        // Génération de l'URL pré-signée
        const presignedUrl = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET,
            Key: s3Key,
            Expires: TOKEN_EXPIRATION
        });
        
        // Calcul de la date d'expiration
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + TOKEN_EXPIRATION);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: presignedUrl,
                quality: quality,
                title: contentData.title,
                expires: expirationDate.toISOString(),
                availableQualities: contentData.availableQualities || ['480p', '720p']
            })
        };
    } catch (error) {
        console.error('Erreur:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erreur interne du serveur',
                message: error.message
            })
        };
    }
};
EOF
    
    # Créer un fichier ZIP pour la fonction Lambda
    cd "$TEMP_DIR"
    zip -r function.zip index.js
    
    # Créer un rôle IAM pour la fonction Lambda
    ROLE_NAME="flodrama-lambda-role"
    POLICY_ARN="arn:aws:iam::aws:policy/AmazonS3FullAccess"
    POLICY_ARN2="arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
    
    # Vérifier si le rôle existe déjà
    if ! aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        echo -e "${YELLOW}Création du rôle IAM pour Lambda...${NC}"
        
        # Créer le document de politique d'approbation
        cat > "$TEMP_DIR/trust-policy.json" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Créer le rôle
        ROLE_ARN=$(aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://"$TEMP_DIR/trust-policy.json" --query "Role.Arn" --output text)
        
        # Attacher les politiques
        aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN"
        aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN2"
        
        # Attendre que le rôle soit disponible
        echo -e "${YELLOW}Attente de la propagation du rôle IAM...${NC}"
        sleep 10
    else
        ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text)
    fi
    
    # Créer la fonction Lambda
    echo -e "${YELLOW}Création de la fonction Lambda...${NC}"
    aws lambda create-function \
        --function-name "$LAMBDA_FUNCTION" \
        --runtime nodejs16.x \
        --handler index.handler \
        --role "$ROLE_ARN" \
        --zip-file fileb://"$TEMP_DIR/function.zip" \
        --environment "Variables={S3_BUCKET=$S3_BUCKET,DYNAMO_TABLE=$DYNAMO_TABLE,TOKEN_EXPIRATION=7200}" \
        --region "$REGION"
    
    # Nettoyer le répertoire temporaire
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}Fonction Lambda créée avec succès.${NC}"
else
    echo -e "${GREEN}La fonction Lambda existe déjà.${NC}"
fi

# Vérifier si l'API Gateway existe déjà
echo -e "${YELLOW}Vérification de l'API Gateway...${NC}"
API_ID=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo -e "${YELLOW}Création de l'API Gateway...${NC}"
    
    # Créer l'API
    API_RESULT=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "API pour le streaming vidéo FloDrama" \
        --endpoint-configuration "types=REGIONAL" \
        --region "$REGION")
    
    API_ID=$(echo "$API_RESULT" | jq -r '.id')
    
    # Obtenir l'ID de la ressource racine
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$REGION" \
        --query "items[?path=='/'].id" \
        --output text)
    
    # Créer la ressource /stream
    STREAM_RESOURCE_RESULT=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "stream" \
        --region "$REGION")
    
    STREAM_RESOURCE_ID=$(echo "$STREAM_RESOURCE_RESULT" | jq -r '.id')
    
    # Créer la méthode GET pour /stream
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "GET" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    # Créer la méthode OPTIONS pour /stream (CORS)
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    # Obtenir l'ARN de la fonction Lambda
    LAMBDA_ARN=$(aws lambda get-function \
        --function-name "$LAMBDA_FUNCTION" \
        --region "$REGION" \
        --query "Configuration.FunctionArn" \
        --output text)
    
    # Créer l'intégration pour la méthode GET
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "GET" \
        --type "AWS_PROXY" \
        --integration-http-method "POST" \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
        --region "$REGION"
    
    # Créer l'intégration pour la méthode OPTIONS (CORS)
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --integration-http-method "OPTIONS" \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    # Configurer la réponse d'intégration pour OPTIONS
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": "'\''*'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''GET,OPTIONS'\''",
            "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''"
        }' \
        --region "$REGION"
    
    # Configurer la réponse de méthode pour OPTIONS
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Headers": true
        }' \
        --region "$REGION"
    
    # Créer la ressource /health
    HEALTH_RESOURCE_RESULT=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "health" \
        --region "$REGION")
    
    HEALTH_RESOURCE_ID=$(echo "$HEALTH_RESOURCE_RESULT" | jq -r '.id')
    
    # Créer la méthode GET pour /health
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    # Créer l'intégration pour la méthode GET /health
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --type "MOCK" \
        --integration-http-method "GET" \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    # Configurer la réponse d'intégration pour GET /health
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --status-code "200" \
        --response-templates '{"application/json":"{\"status\":\"ok\"}"}' \
        --region "$REGION"
    
    # Configurer la réponse de méthode pour GET /health
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$HEALTH_RESOURCE_ID" \
        --http-method "GET" \
        --status-code "200" \
        --region "$REGION"
    
    # Donner l'autorisation à l'API Gateway d'invoquer la fonction Lambda
    aws lambda add-permission \
        --function-name "$LAMBDA_FUNCTION" \
        --statement-id "apigateway-permission" \
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
    
    echo -e "${GREEN}API Gateway créée et déployée avec succès.${NC}"
else
    echo -e "${GREEN}L'API Gateway existe déjà.${NC}"
    
    # Obtenir l'URL de l'API
    API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME"
    
    # Redéployer l'API pour appliquer les modifications
    echo -e "${YELLOW}Redéploiement de l'API Gateway...${NC}"
    aws apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "$STAGE_NAME" \
        --region "$REGION"
fi

# Mettre à jour le fichier de configuration
echo -e "${YELLOW}Mise à jour du fichier de configuration...${NC}"
jq --arg api "$API_URL" '.apiGateway = $api' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

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
