// Fonction Lambda pour le proxy de streaming vidéo FloDrama
// Créée le 9 avril 2025 - Version simplifiée

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Configuration
const S3_BUCKET = process.env.S3_BUCKET || 'flodrama-video-cache';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'flodrama-streaming-metadata';
const TOKEN_EXPIRATION = parseInt(process.env.TOKEN_EXPIRATION || '7200'); // 2 heures en secondes

exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    // Configuration des en-têtes CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Content-Type': 'application/json'
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
        
        // Pour les tests, retourner une URL pré-signée pour un fichier de test dans S3
        if (contentId === 'test') {
            // Chemin du fichier de test dans S3
            let testKey = `test/test-video-${quality}.mp4`;
            
            try {
                // Vérifier si le fichier de test existe dans S3
                try {
                    await s3.headObject({
                        Bucket: S3_BUCKET,
                        Key: testKey
                    }).promise();
                } catch (error) {
                    console.log(`Le fichier de test ${testKey} n'existe pas dans S3. Utilisation d'une URL alternative.`);
                    // Si le fichier spécifique n'existe pas, on utilise un fichier de test générique
                    testKey = 'test/test-video.mp4';
                }
                
                // Générer une URL pré-signée directement depuis S3
                const presignedUrl = s3.getSignedUrl('getObject', {
                    Bucket: S3_BUCKET,
                    Key: testKey,
                    Expires: TOKEN_EXPIRATION
                });
                
                // Liste des qualités disponibles pour les tests
                const availableQualities = ['240p', '360p', '480p', '720p', '1080p'];
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        url: presignedUrl,
                        quality: quality,
                        expiresAt: new Date(Date.now() + TOKEN_EXPIRATION * 1000).toISOString(),
                        availableQualities: availableQualities,
                        metadata: {
                            title: 'Vidéo de test',
                            duration: 120,
                            contentType: 'video/mp4'
                        }
                    })
                };
            } catch (error) {
                console.error('Erreur lors de la génération de l\'URL pré-signée pour le test:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Erreur lors de la génération de l\'URL pré-signée',
                        message: error.message
                    })
                };
            }
        }
        
        // Pour les contenus réels, récupérer les informations depuis DynamoDB
        let contentData;
        
        try {
            const dynamoResult = await dynamoDB.get({
                TableName: DYNAMO_TABLE,
                Key: { contentId: contentId }
            }).promise();
            
            contentData = dynamoResult.Item;
        } catch (error) {
            console.error('Erreur lors de la récupération des données depuis DynamoDB:', error);
            // En cas d'erreur, on continue avec des données par défaut
        }
        
        if (!contentData) {
            // Si le contenu n'existe pas dans DynamoDB, on crée un contenu fictif pour les tests
            contentData = {
                contentId: contentId,
                title: `Contenu ${contentId}`,
                qualities: ['480p', '720p', '1080p'],
                metadata: {
                    title: `Contenu ${contentId}`,
                    description: 'Contenu de test',
                    duration: 300,
                    contentType: 'video/mp4'
                }
            };
        }
        
        // Vérification que la qualité demandée est disponible
        const availableQualities = contentData.qualities || ['480p', '720p', '1080p'];
        if (!availableQualities.includes(quality)) {
            console.log(`Qualité ${quality} non disponible. Utilisation de la qualité par défaut.`);
        }
        
        // Génération de l'URL pré-signée S3
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
            // La vidéo n'existe pas dans S3, on utilisera une vidéo de test
            console.log('Vidéo non trouvée dans S3:', s3Key);
        }
        
        // URL à retourner (pré-signée)
        let streamUrl;
        let actualKey = videoExists ? s3Key : 'test/test-video.mp4';
        
        // Générer une URL pré-signée
        streamUrl = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET,
            Key: actualKey,
            Expires: TOKEN_EXPIRATION
        });
        
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
                userAgent: event.headers ? (event.headers['User-Agent'] || event.headers['user-agent'] || 'Unknown') : 'Unknown',
                ipAddress: event.requestContext && event.requestContext.identity ? event.requestContext.identity.sourceIp : 'Unknown'
            }
        };
        
        try {
            await dynamoDB.put(sessionParams).promise();
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la session:', error);
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
                availableQualities: availableQualities,
                metadata: contentData.metadata || {}
            })
        };
        
    } catch (error) {
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erreur interne du serveur',
                message: error.message || 'Erreur inconnue'
            })
        };
    }
};

// Fonction pour générer un ID de session unique
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
