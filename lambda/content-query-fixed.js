// Fonction Lambda corrigée pour la requête de contenu FloDrama
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    try {
        // Extraction des paramètres de requête
        const queryParams = event.queryStringParameters || {};
        const category = queryParams.category || 'all';
        
        console.log(`Recherche de contenu pour la catégorie: ${category}`);
        
        // Configuration de la requête DynamoDB
        // Comme nous n'avons pas d'index secondaire sur category,
        // nous devons utiliser scan avec un FilterExpression
        const params = {
            TableName: 'FloDramaContent',
            FilterExpression: 'contains(#categories, :categoryValue)',
            ExpressionAttributeNames: {
                '#categories': 'categories'
            },
            ExpressionAttributeValues: {
                ':categoryValue': category
            }
        };
        
        // Si category est 'all', ne pas filtrer
        if (category === 'all') {
            delete params.FilterExpression;
            delete params.ExpressionAttributeNames;
            delete params.ExpressionAttributeValues;
        }
        
        console.log('Paramètres DynamoDB:', JSON.stringify(params));
        
        // Exécution de la requête
        const result = await dynamoDB.scan(params).promise();
        
        console.log(`${result.Items.length} éléments trouvés`);
        
        // Retour de la réponse formatée
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(result.Items)
        };
    } catch (error) {
        console.error('Erreur lors de la requête:', error);
        
        // Retour d'une réponse d'erreur formatée
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Erreur lors de la récupération des contenus',
                error: error.message,
                errorType: error.name
            })
        };
    }
};
