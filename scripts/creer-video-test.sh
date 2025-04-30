#!/bin/bash

# Script pour créer une vidéo de test et la téléverser vers S3
# Créé le 8 avril 2025

set -e

echo "🚀 Création et téléversement d'une vidéo de test pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

# Récupération du nom du bucket S3
S3_BUCKET=$(jq -r '.s3Bucket' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

echo "📋 Bucket S3: $S3_BUCKET"
echo "📋 Domaine CloudFront: $CLOUDFRONT_DOMAIN"

# Création du répertoire temporaire
TMP_DIR="/tmp/flodrama-video-test"
mkdir -p "$TMP_DIR"

# Téléchargement des vidéos de test pour différentes qualités
echo "📋 Téléchargement des vidéos de test..."

# Liste des qualités et URLs
QUALITIES=("240p" "360p" "480p" "720p" "1080p")
URLS=(
    "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4"
    "https://sample-videos.com/video123/mp4/360/big_buck_bunny_360p_1mb.mp4"
    "https://sample-videos.com/video123/mp4/480/big_buck_bunny_480p_1mb.mp4"
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
    "https://sample-videos.com/video123/mp4/1080/big_buck_bunny_1080p_1mb.mp4"
)

# Téléchargement et téléversement pour chaque qualité
for i in "${!QUALITIES[@]}"; do
    quality="${QUALITIES[$i]}"
    url="${URLS[$i]}"
    output_file="$TMP_DIR/test-video-$quality.mp4"
    s3_key="test/test-video-$quality.mp4"
    
    echo "📋 Téléchargement de la vidéo $quality depuis $url..."
    curl -s -o "$output_file" "$url"
    
    echo "📋 Téléversement vers S3: $s3_key"
    aws s3 cp "$output_file" "s3://$S3_BUCKET/$s3_key" --content-type "video/mp4"
    
    echo "✅ Vidéo $quality téléversée avec succès!"
    echo "📌 URL: https://$CLOUDFRONT_DOMAIN/$s3_key"
done

# Création d'une page HTML de test
echo "📋 Création d'une page HTML de test..."
cat > "$TMP_DIR/test-video.html" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de vidéo FloDrama</title>
    <style>
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #121118;
            color: white;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            background: linear-gradient(to right, #3b82f6, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
        }
        .video-container {
            margin-bottom: 20px;
        }
        video {
            width: 100%;
            border-radius: 8px;
        }
        h2 {
            margin-top: 30px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin-bottom: 10px;
        }
        a {
            color: #3b82f6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Test de vidéo FloDrama</h1>
    
    <div class="video-container">
        <h2>Vidéo 720p</h2>
        <video controls src="https://${CLOUDFRONT_DOMAIN}/test/test-video-720p.mp4"></video>
    </div>
    
    <h2>Toutes les qualités disponibles:</h2>
    <ul>
EOF

# Ajout des liens pour chaque qualité
for quality in "${QUALITIES[@]}"; do
    s3_key="test/test-video-$quality.mp4"
    echo "        <li><a href=\"https://$CLOUDFRONT_DOMAIN/$s3_key\">Vidéo $quality</a></li>" >> "$TMP_DIR/test-video.html"
done

# Fin du fichier HTML
cat >> "$TMP_DIR/test-video.html" << EOF
    </ul>
</body>
</html>
EOF

# Téléversement de la page HTML
echo "📋 Téléversement de la page HTML de test..."
aws s3 cp "$TMP_DIR/test-video.html" "s3://$S3_BUCKET/test/index.html" --content-type "text/html"

echo "✅ Page HTML téléversée avec succès!"
echo "📌 URL: https://$CLOUDFRONT_DOMAIN/test/index.html"

# Mise à jour de la fonction Lambda pour utiliser les nouvelles URLs
echo "📋 Mise à jour de la fonction Lambda..."
cat > "$TMP_DIR/index.js" << EOF
// Fonction Lambda pour le proxy de streaming vidéo FloDrama
// Mise à jour le 8 avril 2025

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const cloudFront = new AWS.CloudFront();

// Configuration
const CLOUDFRONT_DOMAIN = '${CLOUDFRONT_DOMAIN}';
const S3_BUCKET = '${S3_BUCKET}';
const DYNAMO_TABLE = 'flodrama-streaming-metadata';
const TOKEN_EXPIRATION = 7200; // 2 heures en secondes

exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    // Configuration des en-têtes CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept,Referer,User-Agent',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    };
    
    // Gestion des requêtes OPTIONS (pré-vol CORS)
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
        const token = queryParams.token;
        
        // Vérification des paramètres obligatoires
        if (!contentId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Le paramètre contentId est obligatoire' })
            };
        }
        
        // Pour les tests, retourner une URL de test
        if (contentId === 'test') {
            const testUrl = \`https://\${CLOUDFRONT_DOMAIN}/test/test-video-\${quality}.mp4\`;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    url: testUrl,
                    quality: quality,
                    expiresAt: new Date(Date.now() + TOKEN_EXPIRATION * 1000).toISOString(),
                    metadata: {
                        title: 'Vidéo de test',
                        duration: 120,
                        contentType: 'video/mp4'
                    }
                })
            };
        }
        
        // Vérification de l'existence du contenu dans DynamoDB
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
                sourceUrl: \`https://source.example.com/\${contentId}.mp4\`,
                qualities: ['240p', '360p', '480p', '720p', '1080p'],
                metadata: {
                    title: \`Contenu \${contentId}\`,
                    duration: 3600,
                    contentType: 'video/mp4'
                }
            };
        }
        
        if (!contentData) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Contenu non trouvé' })
            };
        }
        
        // Vérification que la qualité demandée est disponible
        if (contentData.qualities && !contentData.qualities.includes(quality)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Qualité non disponible',
                    availableQualities: contentData.qualities
                })
            };
        }
        
        // Génération de l'URL signée CloudFront
        const s3Key = \`\${contentId}/\${quality}.mp4\`;
        const cloudFrontUrl = \`https://\${CLOUDFRONT_DOMAIN}/\${s3Key}\`;
        
        // Vérification si la vidéo existe déjà dans S3
        let videoExists = false;
        try {
            await s3.headObject({
                Bucket: S3_BUCKET,
                Key: s3Key
            }).promise();
            videoExists = true;
        } catch (error) {
            // La vidéo n'existe pas dans S3, on utilisera l'URL source
            console.log('Vidéo non trouvée dans S3:', s3Key);
        }
        
        // URL à retourner (signée ou source)
        let streamUrl;
        
        if (videoExists) {
            // Génération d'une URL signée pour CloudFront
            const signer = new AWS.CloudFront.Signer(
                process.env.CLOUDFRONT_KEY_PAIR_ID,
                process.env.CLOUDFRONT_PRIVATE_KEY
            );
            
            const policy = JSON.stringify({
                Statement: [{
                    Resource: cloudFrontUrl,
                    Condition: {
                        DateLessThan: {
                            'AWS:EpochTime': Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION
                        }
                    }
                }]
            });
            
            const signedUrl = signer.getSignedUrl({
                url: cloudFrontUrl,
                policy: policy
            });
            
            streamUrl = signedUrl;
        } else {
            // Utilisation de l'URL source (pour les tests)
            streamUrl = contentData.sourceUrl || cloudFrontUrl;
        }
        
        // Enregistrement de la session de streaming dans DynamoDB
        const sessionId = generateSessionId();
        const sessionParams = {
            TableName: DYNAMO_TABLE,
            Item: {
                sessionId: sessionId,
                contentId: contentId,
                quality: quality,
                startTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + TOKEN_EXPIRATION * 1000).toISOString(),
                userAgent: event.headers['User-Agent'] || 'Unknown',
                ipAddress: event.requestContext?.identity?.sourceIp || 'Unknown'
            }
        };
        
        try {
            await dynamoDB.put(sessionParams).promise();
        } catch (error) {
            console.error('Erreur lors de l\\'enregistrement de la session:', error);
            // On continue même en cas d'erreur d'enregistrement
        }
        
        // Réponse avec l'URL de streaming
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: streamUrl,
                sessionId: sessionId,
                quality: quality,
                expiresAt: new Date(Date.now() + TOKEN_EXPIRATION * 1000).toISOString(),
                metadata: contentData.metadata || {}
            })
        };
        
    } catch (error) {
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur interne du serveur' })
        };
    }
};

// Fonction pour générer un ID de session unique
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
EOF

# Mise à jour de la fonction Lambda
echo "📋 Téléversement de la fonction Lambda..."
cd "$TMP_DIR" && zip -r function.zip index.js
aws lambda update-function-code --function-name flodrama-stream-proxy --zip-file fileb://"$TMP_DIR/function.zip"

echo "✅ Création et téléversement des vidéos de test terminés avec succès!"
echo "📌 Page de test: https://$CLOUDFRONT_DOMAIN/test/index.html"
echo "📌 Vidéo 720p: https://$CLOUDFRONT_DOMAIN/test/test-video-720p.mp4"

# Nettoyage
echo "📋 Nettoyage des fichiers temporaires..."
rm -rf "$TMP_DIR"

echo "✅ Terminé!"
