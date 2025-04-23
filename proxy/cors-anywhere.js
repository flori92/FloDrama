// Serveur proxy CORS simple pour FloDrama
// À déployer sur un service comme Heroku, Render, etc.

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Configuration de l'API cible
const API_HOST = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';
const ALLOWED_ORIGINS = ['https://flori92.github.io', 'https://flodrama.com', 'http://localhost:3000', 'http://localhost:5173'];

// Configuration CORS
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme les appels API)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route principale pour le proxy
app.all('/proxy/*', async (req, res) => {
  try {
    // Extraire le chemin de l'API
    const path = req.url.replace(/^\/proxy/, '');
    const url = `${API_HOST}${path}`;
    
    console.log(`Proxying request to: ${url}`);
    // Log des headers envoyés à AWS (en masquant Authorization)
    const headers = { ...req.headers };
    if (headers.Authorization) {
      headers.Authorization = '[PROTECTED]';
    }
    console.log('Headers envoyés à AWS:', headers);
    delete headers.host;
    
    // Effectuer la requête à l'API
    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req.method !== 'GET' ? req.body : undefined,
      validateStatus: () => true // Permet de capturer les codes d'erreur
    });
    // Log de la réponse AWS
    console.log(`Réponse AWS: ${response.status} ${response.statusText}`);
    console.log('Headers réponse AWS:', response.headers);
    if (typeof response.data === 'object') {
      console.log('Body réponse AWS (JSON, tronqué):', JSON.stringify(response.data).substring(0, 500));
    } else {
      console.log('Body réponse AWS (texte, tronqué):', String(response.data).substring(0, 500));
    }
    
    // Renvoyer la réponse
    res.status(response.status);
    
    // Ajouter les en-têtes de la réponse
    Object.entries(response.headers).forEach(([key, value]) => {
      // Éviter les en-têtes problématiques
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    res.send(response.data);
  } catch (error) {
    console.error('Erreur proxy:', error.message);
    // Log détaillé en cas d'erreur HTTP
    if (error.response) {
      console.error('Erreur HTTP AWS:', error.response.status, error.response.statusText);
      console.error('Headers erreur AWS:', error.response.headers);
      const errBody = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data);
      console.error('Body erreur AWS (tronqué):', errBody.substring(0, 500));
    }
    res.status(500).json({
      error: 'Erreur de proxy',
      message: error.message
    });
  }
});

// Route de test pour vérifier que le proxy fonctionne
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy CORS FloDrama opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Proxy CORS FloDrama démarré sur le port ${PORT}`);
  console.log(`Accès: http://localhost:${PORT}`);
});
