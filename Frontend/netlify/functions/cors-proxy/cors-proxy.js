// Proxy CORS pour FloDrama - Version Netlify Functions
const axios = require('axios');

// Configuration de l'API cible
const API_HOST = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';
const ALLOWED_ORIGINS = ['https://flodrama.com', 'http://localhost:3000', 'http://localhost:5173'];

exports.handler = async function(event, context) {
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
      }
    };
  }
  
  try {
    // Extraire le chemin de l'API à partir du chemin de la fonction
    let path = event.path.replace('/.netlify/functions/cors-proxy', '');
    if (!path) path = '/';
    
    // Construire l'URL complète
    const url = `${API_HOST}${path}`;
    
    // Préparer les en-têtes pour la requête à l'API
    const headers = { ...event.headers };
    delete headers.host;
    delete headers['Host'];
    delete headers['content-length'];
    
    console.log(`Proxy request to: ${url}`);
    
    // Effectuer la requête à l'API
    const response = await axios({
      method: event.httpMethod,
      url: url,
      headers: headers,
      data: event.body,
      params: event.queryStringParameters,
      validateStatus: () => true // Ne pas rejeter les réponses avec des codes d'erreur
    });
    
    // Renvoyer la réponse avec les en-têtes CORS
    return {
      statusCode: response.status,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.log('Proxy error:', error);
    
    // Renvoyer une réponse d'erreur avec les en-têtes CORS
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
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
