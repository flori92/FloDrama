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
app.all('/api/*', async (req, res) => {
  try {
    // Extraire le chemin de l'API
    const path = req.url.replace(/^\/api/, '');
    const url = `${API_HOST}${path}`;
    
    console.log(`Proxying request to: ${url}`);
    
    // Préparer les en-têtes
    const headers = { ...req.headers };
    delete headers.host;
    
    // Effectuer la requête à l'API
    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req.method !== 'GET' ? req.body : undefined,
      validateStatus: () => true // Ne pas rejeter les réponses avec des codes d'erreur
    });
    
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
