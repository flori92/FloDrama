// Proxy CORS AWS Lambda pour FloDrama
const axios = require('axios');

// Configuration de l'API Gateway AWS
const API_GATEWAY_URL = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';

// Fonction handler Lambda
exports.handler = async (event) => {
  console.log('Requête reçue:', JSON.stringify(event));
  
  try {
    // Extraire le chemin de la requête
    const path = event.path || '';
    const method = event.httpMethod || 'GET';
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : null;
    
    // Construire l'URL de l'API Gateway
    const targetUrl = `${API_GATEWAY_URL}${path}`;
    console.log(`🔄 Proxying request to: ${targetUrl}`);
    
    // Configurer les options de la requête
    const options = {
      method: method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: () => true // Accepter tous les codes de statut pour le diagnostic
    };
    
    // Ajouter le corps de la requête pour les méthodes POST, PUT, etc.
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      options.data = body;
    }
    
    // Ajouter les paramètres de requête
    if (Object.keys(queryParams).length > 0) {
      options.params = queryParams;
    }
    
    // Effectuer la requête à l'API Gateway
    const response = await axios(options);
    
    // Logger la réponse pour le débogage
    console.log(`📊 Response status: ${response.status}`);
    
    // Préparer les en-têtes CORS pour la réponse
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    };
    
    // Renvoyer la réponse au client
    return {
      statusCode: response.status,
      headers: headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    // Renvoyer une erreur au client
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message
      })
    };
  }
};

// Gérer les requêtes OPTIONS pour CORS
exports.corsHandler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'CORS enabled' })
  };
};
