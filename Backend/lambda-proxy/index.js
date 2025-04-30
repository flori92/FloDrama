// Proxy CORS pour FloDrama - Version AWS Lambda
// Ce script permet de contourner les restrictions CORS en faisant office d'intermédiaire
// entre le frontend et l'API AWS

const https = require('https');
const url = require('url');

// Configuration de l'API cible
const API_HOST = '7la2pq33ej.execute-api.us-east-1.amazonaws.com';
const API_STAGE = 'production';
const ALLOWED_ORIGINS = ['https://flodrama.com', 'http://localhost:3000', 'http://localhost:5173'];

// Fonction principale Lambda
exports.handler = async (event) => {
    console.log('Événement reçu:', JSON.stringify(event));
    
    try {
        // Récupérer l'origine de la requête
        const origin = event.headers.origin || event.headers.Origin || ALLOWED_ORIGINS[0];
        
        // Vérifier si l'origine est autorisée
        const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
        const corsOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0];
        
        // Gestion des requêtes OPTIONS (preflight)
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Max-Age': '3600'
                },
                body: ''
            };
        }
        
        // Construire le chemin de l'API
        let path = event.path;
        if (path.startsWith('/api')) {
            path = path.replace(/^\/api/, '');
        }
        if (event.queryStringParameters) {
            const queryParams = new URLSearchParams(event.queryStringParameters).toString();
            path = `${path}?${queryParams}`;
        }
        
        // Configurer les options de la requête
        const options = {
            hostname: API_HOST,
            path: `/${API_STAGE}${path}`,
            method: event.httpMethod,
            headers: {
                ...event.headers,
                'Host': API_HOST
            }
        };
        
        // Supprimer les en-têtes problématiques
        delete options.headers.host;
        delete options.headers['Host'];
        delete options.headers['Content-Length'];
        
        console.log('Requête vers l\'API:', options);
        
        // Effectuer la requête à l'API
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: responseBody
                    });
                });
            });
            
            req.on('error', (error) => {
                console.error('Erreur lors de la requête:', error);
                reject(error);
            });
            
            // Envoyer le corps de la requête si présent
            if (event.body) {
                req.write(event.body);
            }
            
            req.end();
        });
        
        // Ajouter les en-têtes CORS à la réponse
        const responseHeaders = {
            ...response.headers,
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true'
        };
        
        return {
            statusCode: response.statusCode,
            headers: responseHeaders,
            body: response.body
        };
    } catch (error) {
        console.error('Erreur dans le proxy:', error);
        
        // Renvoyer une réponse d'erreur avec les en-têtes CORS
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Erreur interne du proxy',
                message: error.message
            })
        };
    }
};
