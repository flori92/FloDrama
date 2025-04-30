const AWS = require('aws-sdk');
const sharp = require('sharp');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    // Récupération des informations du bucket et de la clé
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    // Vérification que c'est une image
    if (!key.match(/\.(jpg|jpeg|png|webp)$/i)) {
        console.log('Fichier ignoré car ce n\'est pas une image:', key);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Fichier ignoré car ce n\'est pas une image' })
        };
    }
    
    try {
        // Récupération de l'image depuis S3
        const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
        
        // Traitement de l'image avec Sharp
        const originalImage = s3Object.Body;
        
        // Création des versions redimensionnées
        const sizes = [
            { width: 200, suffix: 'thumb' },
            { width: 400, suffix: 'small' },
            { width: 800, suffix: 'medium' }
        ];
        
        // Traitement pour chaque taille
        for (const size of sizes) {
            const resizedImage = await sharp(originalImage)
                .resize(size.width)
                .toBuffer();
            
            // Génération du nouveau nom de fichier
            const newKey = key.replace(/(\.[^.]+)$/, `-${size.suffix}$1`);
            
            // Upload de l'image redimensionnée vers S3
            await s3.putObject({
                Bucket: bucket,
                Key: newKey,
                Body: resizedImage,
                ContentType: s3Object.ContentType
            }).promise();
            
            console.log(`Image redimensionnée créée: ${newKey}`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Images redimensionnées avec succès' })
        };
    } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur lors du traitement de l\'image', error })
        };
    }
};
