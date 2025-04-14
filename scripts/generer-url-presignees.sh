#!/bin/bash

# Script pour générer des URL pré-signées pour les vidéos de test
# Créé le 8 avril 2025

set -e

echo "🚀 Génération d'URL pré-signées pour les vidéos de test FloDrama"

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

# Durée de validité des URL pré-signées (en secondes)
EXPIRATION=86400 # 24 heures

# Génération des URL pré-signées pour chaque qualité
echo "📋 Génération des URL pré-signées..."

QUALITIES=("240p" "360p" "480p" "720p" "1080p")
URLS=()

for quality in "${QUALITIES[@]}"; do
    s3_key="test/test-video-$quality.mp4"
    
    echo "📋 Génération d'URL pré-signée pour la vidéo $quality..."
    PRESIGNED_URL=$(aws s3 presign "s3://$S3_BUCKET/$s3_key" --expires-in $EXPIRATION)
    
    echo "✅ URL pré-signée générée pour $quality"
    echo "📌 URL: $PRESIGNED_URL"
    
    URLS+=("$PRESIGNED_URL")
done

# Création d'une page HTML de test avec les URL pré-signées
echo "📋 Création d'une page HTML de test avec les URL pré-signées..."
cat > ./test-presigned.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Vidéo FloDrama - URL Pré-signées</title>
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
            background-color: #000;
        }
        h2 {
            margin-top: 30px;
        }
        .quality-selector {
            margin-bottom: 20px;
        }
        select {
            background-color: #1A1926;
            color: white;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #3b82f6;
        }
        button {
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }
        .note {
            margin-top: 30px;
            padding: 15px;
            background-color: #1A1926;
            border-radius: 8px;
            border-left: 4px solid #d946ef;
        }
    </style>
</head>
<body>
    <h1>Test Vidéo FloDrama - URL Pré-signées</h1>
    
    <div class="quality-selector">
        <select id="qualitySelect">
            <option value="0">240p</option>
            <option value="1">360p</option>
            <option value="2">480p</option>
            <option value="3" selected>720p</option>
            <option value="4">1080p</option>
        </select>
        <button id="loadButton">Charger la vidéo</button>
    </div>
    
    <div class="video-container">
        <h2 id="videoTitle">Vidéo 720p</h2>
        <video id="videoPlayer" controls></video>
    </div>
    
    <div class="note">
        <p><strong>Note:</strong> Les URL pré-signées sont valides pendant 24 heures à partir de la génération (${EXPIRATION} secondes).</p>
        <p>Date de génération: <span id="generationDate"></span></p>
        <p>Date d'expiration: <span id="expirationDate"></span></p>
    </div>
    
    <script>
        // URLs pré-signées générées par le script
        const presignedUrls = [
            "${URLS[0]}",
            "${URLS[1]}",
            "${URLS[2]}",
            "${URLS[3]}",
            "${URLS[4]}"
        ];
        
        // Qualités correspondantes
        const qualities = ["240p", "360p", "480p", "720p", "1080p"];
        
        // Éléments DOM
        const qualitySelect = document.getElementById('qualitySelect');
        const loadButton = document.getElementById('loadButton');
        const videoTitle = document.getElementById('videoTitle');
        const videoPlayer = document.getElementById('videoPlayer');
        const generationDate = document.getElementById('generationDate');
        const expirationDate = document.getElementById('expirationDate');
        
        // Dates de génération et d'expiration
        const now = new Date();
        const expiration = new Date(now.getTime() + ${EXPIRATION} * 1000);
        generationDate.textContent = now.toLocaleString();
        expirationDate.textContent = expiration.toLocaleString();
        
        // Fonction pour charger la vidéo sélectionnée
        function loadVideo() {
            const selectedIndex = parseInt(qualitySelect.value);
            const selectedQuality = qualities[selectedIndex];
            const selectedUrl = presignedUrls[selectedIndex];
            
            videoTitle.textContent = \`Vidéo \${selectedQuality}\`;
            videoPlayer.src = selectedUrl;
            videoPlayer.load();
        }
        
        // Événements
        loadButton.addEventListener('click', loadVideo);
        
        // Charger la vidéo 720p par défaut
        qualitySelect.value = "3"; // 720p
        loadVideo();
    </script>
</body>
</html>
EOF

echo "✅ Page HTML de test avec URL pré-signées créée: ./test-presigned.html"
echo "📌 Ouvrez ce fichier dans votre navigateur pour tester les vidéos avec les URL pré-signées."
echo "⚠️ Note: Les URL pré-signées sont valides pendant 24 heures."

# Mise à jour de la fonction Lambda pour utiliser les URL pré-signées
echo "📋 Mise à jour de la fonction Lambda pour utiliser les URL pré-signées..."
cat > /tmp/lambda-presigned.js << EOF
// Fonction Lambda pour le proxy de streaming vidéo FloDrama avec URL pré-signées
// Mise à jour le 8 avril 2025

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Configuration
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
        
        // Vérification des paramètres obligatoires
        if (!contentId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Le paramètre contentId est obligatoire' })
            };
        }
        
        // Pour les tests, générer une URL pré-signée pour la vidéo de test
        if (contentId === 'test') {
            const s3Key = \`test/test-video-\${quality}.mp4\`;
            
            // Génération de l'URL pré-signée
            const presignedUrl = s3.getSignedUrl('getObject', {
                Bucket: S3_BUCKET,
                Key: s3Key,
                Expires: TOKEN_EXPIRATION
            });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    url: presignedUrl,
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
        
        // Génération de l'URL pré-signée
        const s3Key = \`\${contentId}/\${quality}.mp4\`;
        
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
        
        // URL à retourner (pré-signée ou source)
        let streamUrl;
        
        if (videoExists) {
            // Génération d'une URL pré-signée pour S3
            streamUrl = s3.getSignedUrl('getObject', {
                Bucket: S3_BUCKET,
                Key: s3Key,
                Expires: TOKEN_EXPIRATION
            });
        } else {
            // Utilisation de l'URL source
            streamUrl = contentData.sourceUrl || '';
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
cd /tmp && zip -r lambda-presigned.zip lambda-presigned.js
aws lambda update-function-code --function-name flodrama-stream-proxy --zip-file fileb:///tmp/lambda-presigned.zip

echo "✅ Fonction Lambda mise à jour avec succès!"
echo "📌 La fonction Lambda utilise maintenant des URL pré-signées pour accéder aux vidéos."

# Mise à jour du fichier de test d'intégration
echo "📋 Mise à jour du fichier de test d'intégration..."
cp ./test-integration-ameliore.html ./test-integration-ameliore-backup.html
cat > ./test-integration-ameliore.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test d'intégration FloDrama - Amélioré</title>
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
        .card {
            background-color: #1A1926;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        button {
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 10px;
        }
        pre {
            background-color: #2a293a;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            color: #e2e8f0;
        }
        .error {
            color: #f87171;
        }
        .success {
            color: #34d399;
        }
        .video-container {
            width: 100%;
            margin-top: 20px;
        }
        video {
            width: 100%;
            border-radius: 8px;
            background-color: #000;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #a0aec0;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border-radius: 4px;
            background-color: #2a293a;
            border: 1px solid #4a5568;
            color: white;
        }
        .actions {
            display: flex;
            gap: 10px;
        }
        .note {
            margin-top: 20px;
            padding: 15px;
            background-color: #2a293a;
            border-radius: 4px;
            border-left: 4px solid #d946ef;
        }
    </style>
</head>
<body>
    <h1>Test d'intégration FloDrama - Amélioré</h1>
    
    <div class="card">
        <h2>Configuration</h2>
        <div class="form-group">
            <label for="apiUrl">URL de l'API Gateway</label>
            <input type="text" id="apiUrl" value="https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream">
        </div>
        <div class="form-group">
            <label for="contentId">ID du contenu</label>
            <input type="text" id="contentId" value="test">
        </div>
        <div class="form-group">
            <label for="quality">Qualité</label>
            <select id="quality">
                <option value="240p">240p</option>
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p" selected>720p</option>
                <option value="1080p">1080p</option>
            </select>
        </div>
    </div>
    
    <div class="card">
        <h2>Test de l'API Gateway</h2>
        <div class="actions">
            <button id="testApi">Tester l'API</button>
            <button id="clearApiResult">Effacer</button>
        </div>
        <pre id="apiResult">Résultat apparaîtra ici...</pre>
        <div class="note">
            <p><strong>Note:</strong> L'API retourne maintenant une URL pré-signée valide pour 2 heures.</p>
        </div>
    </div>
    
    <div class="card">
        <h2>Test du lecteur vidéo</h2>
        <button id="loadVideo">Charger la vidéo</button>
        <div class="video-container">
            <video id="videoPlayer" controls></video>
        </div>
    </div>
    
    <div class="card">
        <h2>Informations de débogage</h2>
        <pre id="debugInfo">Informations de débogage apparaîtront ici...</pre>
    </div>

    <script>
        // Éléments DOM
        const apiUrlInput = document.getElementById('apiUrl');
        const contentIdInput = document.getElementById('contentId');
        const qualitySelect = document.getElementById('quality');
        const testApiButton = document.getElementById('testApi');
        const clearApiResultButton = document.getElementById('clearApiResult');
        const apiResultElement = document.getElementById('apiResult');
        const loadVideoButton = document.getElementById('loadVideo');
        const videoPlayer = document.getElementById('videoPlayer');
        const debugInfoElement = document.getElementById('debugInfo');
        
        // Variables globales
        let streamUrl = null;
        
        // Fonctions
        function logDebug(message) {
            const timestamp = new Date().toISOString();
            debugInfoElement.textContent += \`[\${timestamp}] \${message}\n\`;
            debugInfoElement.scrollTop = debugInfoElement.scrollHeight;
        }
        
        async function testApi() {
            const apiUrl = apiUrlInput.value;
            const contentId = contentIdInput.value;
            const quality = qualitySelect.value;
            
            apiResultElement.textContent = 'Test en cours...';
            logDebug(\`Appel API: \${apiUrl}?contentId=\${contentId}&quality=\${quality}\`);
            
            try {
                const response = await fetch(\`\${apiUrl}?contentId=\${contentId}&quality=\${quality}\`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                apiResultElement.innerHTML = '<span class="success">✅ Succès!</span>\\n\\n' + JSON.stringify(data, null, 2);
                logDebug('Réponse API reçue avec succès');
                
                // Stocker l'URL de streaming
                if (data.url) {
                    streamUrl = data.url;
                    logDebug(\`URL de streaming récupérée: \${streamUrl}\`);
                }
            } catch (error) {
                apiResultElement.innerHTML = '<span class="error">❌ Erreur!</span>\\n\\n' + error.message;
                logDebug(\`Erreur lors de l'appel API: \${error.message}\`);
            }
        }
        
        function loadVideo() {
            if (!streamUrl) {
                logDebug('Aucune URL de streaming disponible. Veuillez d\\'abord tester l\\'API.');
                return;
            }
            
            logDebug(\`Chargement de la vidéo depuis: \${streamUrl}\`);
            videoPlayer.src = streamUrl;
            videoPlayer.load();
            
            // Écouter les événements du lecteur vidéo
            videoPlayer.onloadstart = () => logDebug('Événement: loadstart');
            videoPlayer.onloadedmetadata = () => logDebug('Événement: loadedmetadata');
            videoPlayer.oncanplay = () => logDebug('Événement: canplay');
            videoPlayer.onplay = () => logDebug('Événement: play');
            videoPlayer.onpause = () => logDebug('Événement: pause');
            videoPlayer.onerror = (e) => logDebug(\`Événement: error - \${videoPlayer.error?.message || 'Erreur inconnue'}\`);
        }
        
        // Événements
        testApiButton.addEventListener('click', testApi);
        clearApiResultButton.addEventListener('click', () => {
            apiResultElement.textContent = 'Résultat apparaîtra ici...';
        });
        loadVideoButton.addEventListener('click', loadVideo);
        
        // Initialisation
        logDebug('Page de test initialisée');
    </script>
</body>
</html>
EOF

echo "✅ Fichier de test d'intégration mis à jour avec succès!"
echo "📌 Une sauvegarde de l'ancien fichier a été créée: ./test-integration-ameliore-backup.html"

echo "✅ Configuration terminée avec succès!"
echo "📌 Vous pouvez maintenant tester l'intégration avec les URL pré-signées."
echo "📌 Ouvrez ./test-presigned.html pour tester directement les vidéos."
echo "📌 Ouvrez ./test-integration-ameliore.html pour tester l'intégration complète."
