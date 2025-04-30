#!/bin/bash

# Script de configuration de l'infrastructure AWS pour le proxy vidéo de FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Configuration de l'infrastructure AWS pour le proxy vidéo FloDrama"

# Vérification des prérequis
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérification de l'authentification AWS
aws sts get-caller-identity &> /dev/null || {
    echo "❌ Vous n'êtes pas authentifié à AWS. Veuillez exécuter 'aws configure' avant de continuer."
    exit 1
}

# Configuration des variables
REGION="us-east-1"
STACK_NAME="flodrama-video-proxy"
LAMBDA_FUNCTION_NAME="flodrama-stream-proxy"
API_NAME="flodrama-api"
CLOUDFRONT_COMMENT="FloDrama Video Proxy"
S3_BUCKET_NAME="flodrama-video-cache"
DYNAMO_TABLE_NAME="flodrama-stream-sessions"

echo "📋 Création du bucket S3 pour le cache vidéo..."
aws s3api create-bucket --bucket $S3_BUCKET_NAME --region $REGION || echo "⚠️ Le bucket existe déjà ou n'a pas pu être créé"

# Configuration CORS pour le bucket S3
echo "📋 Configuration CORS pour le bucket S3..."
cat > /tmp/cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["https://flodrama.vercel.app"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $S3_BUCKET_NAME --cors-configuration file:///tmp/cors-config.json

# Création de la table DynamoDB
echo "📋 Création de la table DynamoDB pour les sessions de streaming..."
aws dynamodb create-table \
    --table-name $DYNAMO_TABLE_NAME \
    --attribute-definitions AttributeName=sessionId,AttributeType=S \
    --key-schema AttributeName=sessionId,KeyType=HASH \
    --billing-mode PAY-PER-REQUEST \
    --region $REGION || echo "⚠️ La table existe déjà ou n'a pas pu être créée"

# Création du rôle IAM pour Lambda
echo "📋 Création du rôle IAM pour Lambda..."
ROLE_NAME="flodrama-lambda-stream-role"
POLICY_NAME="flodrama-lambda-stream-policy"

# Création du rôle
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' || echo "⚠️ Le rôle existe déjà ou n'a pas pu être créé"

# Création de la politique
aws iam create-policy \
    --policy-name $POLICY_NAME \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::'$S3_BUCKET_NAME'",
                    "arn:aws:s3:::'$S3_BUCKET_NAME'/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query"
                ],
                "Resource": "arn:aws:dynamodb:'$REGION':*:table/'$DYNAMO_TABLE_NAME'"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "cloudfront:CreateInvalidation",
                    "cloudfront:GetDistribution",
                    "cloudfront:GetStreamingDistribution",
                    "cloudfront:GetDistributionConfig",
                    "cloudfront:GetInvalidation",
                    "cloudfront:ListInvalidations"
                ],
                "Resource": "*"
            }
        ]
    }' || echo "⚠️ La politique existe déjà ou n'a pas pu être créée"

# Récupération de l'ARN de la politique
POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)

# Attachement de la politique au rôle
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn $POLICY_ARN || echo "⚠️ La politique n'a pas pu être attachée au rôle"

# Création d'une paire de clés CloudFront pour la signature d'URL
echo "📋 Création d'une paire de clés CloudFront pour la signature d'URL..."
CURRENT_DATE=$(date +%Y%m%d)
KEY_PAIR_ID="flodrama-key-$CURRENT_DATE"

# Génération de la clé privée
openssl genrsa -out /tmp/private_key.pem 2048

# Création de la distribution CloudFront
echo "📋 Création de la distribution CloudFront..."
cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "flodrama-video-proxy-$CURRENT_DATE",
    "Comment": "$CLOUDFRONT_COMMENT",
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$S3_BUCKET_NAME",
                "DomainName": "$S3_BUCKET_NAME.s3.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$S3_BUCKET_NAME",
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 3,
                "Items": ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
            },
            "QueryStringCacheKeys": {
                "Quantity": 0
            }
        },
        "TrustedSigners": {
            "Enabled": true,
            "Quantity": 1,
            "Items": ["self"]
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "CacheBehaviors": {
        "Quantity": 1,
        "Items": [
            {
                "PathPattern": "/stream/*",
                "TargetOriginId": "S3-$S3_BUCKET_NAME",
                "ForwardedValues": {
                    "QueryString": true,
                    "Cookies": {
                        "Forward": "none"
                    },
                    "Headers": {
                        "Quantity": 3,
                        "Items": ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
                    }
                },
                "TrustedSigners": {
                    "Enabled": true,
                    "Quantity": 1,
                    "Items": ["self"]
                },
                "ViewerProtocolPolicy": "redirect-to-https",
                "MinTTL": 0,
                "DefaultTTL": 3600,
                "MaxTTL": 86400,
                "Compress": true
            }
        ]
    },
    "CustomErrorResponses": {
        "Quantity": 0
    },
    "PriceClass": "PriceClass_100",
    "Enabled": true,
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "CertificateSource": "cloudfront"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF

# Création de la distribution CloudFront
DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-config.json --query "Distribution.Id" --output text || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "⚠️ La distribution CloudFront n'a pas pu être créée ou existe déjà"
else
    echo "✅ Distribution CloudFront créée avec l'ID: $DISTRIBUTION_ID"
fi

# Récupération du domaine CloudFront
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.DomainName" --output text)

echo "📋 Création de la fonction Lambda pour le proxy de streaming..."
# Création du répertoire pour la fonction Lambda
mkdir -p /tmp/lambda-stream-proxy
cat > /tmp/lambda-stream-proxy/index.js << EOF
const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');
const crypto = require('crypto');

// Initialisation des clients AWS
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudfront = new AWS.CloudFront();

// Configuration
const CLOUDFRONT_DOMAIN = '$CLOUDFRONT_DOMAIN';
const S3_BUCKET = '$S3_BUCKET_NAME';
const DYNAMO_TABLE = '$DYNAMO_TABLE_NAME';
const ALLOWED_ORIGINS = ['https://flodrama.vercel.app'];

// Fonction principale
exports.handler = async (event) => {
    try {
        // Vérification CORS
        const origin = event.headers.origin || event.headers.Origin;
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return corsResponse(origin, 403, { error: 'Origine non autorisée' });
        }

        // Extraction des paramètres
        const params = event.queryStringParameters || {};
        const { contentId, quality, token } = params;

        if (!contentId || !quality) {
            return corsResponse(origin, 400, { error: 'Paramètres manquants' });
        }

        // Vérification du token (à implémenter selon votre système d'authentification)
        // if (!verifyToken(token)) {
        //     return corsResponse(origin, 401, { error: 'Non autorisé' });
        // }

        // Récupération des métadonnées de streaming
        const streamingSource = await getStreamingSource(contentId, quality);
        if (!streamingSource) {
            return corsResponse(origin, 404, { error: 'Source vidéo non trouvée' });
        }

        // Génération de l'URL signée CloudFront
        const signedUrl = await generateSignedUrl(streamingSource.url, contentId, quality);

        // Enregistrement de la session de streaming
        await recordStreamingSession(contentId, quality, event.requestContext.identity.sourceIp);

        return corsResponse(origin, 200, { url: signedUrl });
    } catch (error) {
        console.error('Erreur:', error);
        return corsResponse(null, 500, { error: 'Erreur interne du serveur' });
    }
};

// Fonction pour récupérer la source de streaming
async function getStreamingSource(contentId, quality) {
    // Cette fonction devrait être adaptée pour récupérer les données depuis votre base MongoDB
    // Pour l'exemple, nous simulons une réponse
    
    // Vérifier d'abord dans DynamoDB pour un cache
    try {
        const cacheResult = await dynamodb.get({
            TableName: DYNAMO_TABLE,
            Key: { sessionId: \`cache_\${contentId}_\${quality}\` }
        }).promise();
        
        if (cacheResult.Item && cacheResult.Item.expiresAt > Date.now()) {
            return cacheResult.Item.streamingSource;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du cache:', error);
    }
    
    // Simuler une requête à votre API de métadonnées
    // Dans une implémentation réelle, vous feriez une requête à votre API MongoDB
    return {
        url: 'https://example-source.com/video.mp4',
        quality: quality,
        provider: 'example-provider',
        format: 'video/mp4'
    };
}

// Fonction pour générer une URL signée CloudFront
async function generateSignedUrl(sourceUrl, contentId, quality) {
    // Vérifier si la vidéo est déjà en cache dans S3
    const s3Key = \`stream/\${contentId}/\${quality}.mp4\`;
    
    try {
        await s3.headObject({
            Bucket: S3_BUCKET,
            Key: s3Key
        }).promise();
        
        // La vidéo existe dans S3, générer une URL signée pour CloudFront
        const cloudfrontUrl = \`https://\${CLOUDFRONT_DOMAIN}/\${s3Key}\`;
        
        // Dans une implémentation réelle, vous utiliseriez la SDK AWS pour signer l'URL
        // Pour cet exemple, nous retournons simplement l'URL CloudFront
        return cloudfrontUrl;
    } catch (error) {
        // La vidéo n'existe pas dans S3, nous devons la récupérer et la mettre en cache
        // Pour cet exemple, nous retournons l'URL source directement
        // Dans une implémentation réelle, vous téléchargeriez la vidéo, la stockeriez dans S3,
        // puis retourneriez une URL CloudFront signée
        return sourceUrl;
    }
}

// Fonction pour enregistrer une session de streaming
async function recordStreamingSession(contentId, quality, ip) {
    const sessionId = \`session_\${contentId}_\${Date.now()}\`;
    
    await dynamodb.put({
        TableName: DYNAMO_TABLE,
        Item: {
            sessionId: sessionId,
            contentId: contentId,
            quality: quality,
            ip: ip,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 heures
        }
    }).promise();
    
    return sessionId;
}

// Fonction pour générer une réponse CORS
function corsResponse(origin, statusCode, body) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };
    
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    
    return {
        statusCode: statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };
}
EOF

# Création du package Lambda
cd /tmp/lambda-stream-proxy
zip -r ../lambda-function.zip .

# Création de la fonction Lambda
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text)

aws lambda create-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime nodejs16.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb:///tmp/lambda-function.zip \
    --region $REGION \
    --timeout 30 \
    --memory-size 256 || echo "⚠️ La fonction Lambda existe déjà ou n'a pas pu être créée"

# Création de l'API Gateway
echo "📋 Création de l'API Gateway..."
API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --region $REGION \
    --query "id" \
    --output text || echo "")

if [ -z "$API_ID" ]; then
    echo "⚠️ L'API Gateway n'a pas pu être créée ou existe déjà"
    # Récupération de l'ID de l'API existante
    API_ID=$(aws apigateway get-rest-apis \
        --query "items[?name=='$API_NAME'].id" \
        --output text)
else
    echo "✅ API Gateway créée avec l'ID: $API_ID"
fi

# Récupération de l'ID de la ressource racine
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query "items[?path=='/'].id" \
    --output text)

# Création de la ressource /stream
STREAM_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "stream" \
    --query "id" \
    --output text || echo "")

if [ -z "$STREAM_RESOURCE_ID" ]; then
    echo "⚠️ La ressource /stream existe déjà ou n'a pas pu être créée"
    # Récupération de l'ID de la ressource existante
    STREAM_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --query "items[?path=='/stream'].id" \
        --output text)
else
    echo "✅ Ressource /stream créée avec l'ID: $STREAM_RESOURCE_ID"
fi

# Configuration de la méthode GET
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --no-api-key-required || echo "⚠️ La méthode GET existe déjà ou n'a pas pu être créée"

# Configuration de l'intégration avec Lambda
LAMBDA_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$LAMBDA_FUNCTION_NAME"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" || echo "⚠️ L'intégration existe déjà ou n'a pas pu être créée"

# Configuration des réponses CORS
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method GET \
    --status-code 200 \
    --response-models '{"application/json": "Empty"}' \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin": true}' || echo "⚠️ La réponse de méthode existe déjà ou n'a pas pu être créée"

# Configuration de la méthode OPTIONS pour CORS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --no-api-key-required || echo "⚠️ La méthode OPTIONS existe déjà ou n'a pas pu être créée"

# Configuration de l'intégration MOCK pour OPTIONS
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' || echo "⚠️ L'intégration MOCK existe déjà ou n'a pas pu être créée"

# Configuration des réponses CORS pour OPTIONS
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-models '{"application/json": "Empty"}' \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Headers": true
    }' || echo "⚠️ La réponse de méthode OPTIONS existe déjà ou n'a pas pu être créée"

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $STREAM_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
        "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,OPTIONS'"'"'",
        "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
    }' \
    --response-templates '{"application/json": ""}' || echo "⚠️ La réponse d'intégration OPTIONS existe déjà ou n'a pas pu être créée"

# Déploiement de l'API
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --query "id" \
    --output text || echo "")

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "⚠️ Le déploiement de l'API n'a pas pu être créé"
else
    echo "✅ API déployée avec l'ID de déploiement: $DEPLOYMENT_ID"
fi

# Récupération de l'URL de l'API
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod/stream"

# Autorisation de Lambda à être invoqué par API Gateway
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --statement-id apigateway-prod \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/GET/stream" || echo "⚠️ La permission existe déjà ou n'a pas pu être ajoutée"

echo "✅ Configuration terminée avec succès!"
echo "📌 URL de l'API: $API_URL"
echo "📌 Domaine CloudFront: https://$CLOUDFRONT_DOMAIN"

# Sauvegarde des informations de configuration
cat > ../config/video-proxy-config.json << EOF
{
    "apiUrl": "$API_URL",
    "cloudfrontDomain": "$CLOUDFRONT_DOMAIN",
    "s3Bucket": "$S3_BUCKET_NAME",
    "dynamoTable": "$DYNAMO_TABLE_NAME",
    "lambdaFunction": "$LAMBDA_FUNCTION_NAME",
    "region": "$REGION",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "📋 Configuration sauvegardée dans config/video-proxy-config.json"
