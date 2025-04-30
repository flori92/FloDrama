// Proxy CORS simple pour FloDrama
// Ce script permet de contourner les restrictions CORS en faisant office d'intermédiaire
// entre le frontend et l'API AWS

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS pour autoriser toutes les origines en développement
app.use(cors({
  origin: '*', // En production, remplacer par ['https://flodrama.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de logging pour débugger les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuration du proxy vers l'API AWS
const apiProxy = createProxyMiddleware({
  target: 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Supprime le préfixe /api avant de transmettre à l'API
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ajout des headers CORS à la réponse
    proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // En production: 'https://flodrama.com'
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('Erreur proxy:', err);
    res.status(500).json({ error: 'Erreur de connexion au serveur API' });
  }
});

// Route pour toutes les requêtes API
app.use('/api', apiProxy);

// Route de test pour vérifier que le proxy fonctionne
app.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy CORS FloDrama opérationnel' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Proxy CORS FloDrama démarré sur le port ${PORT}`);
  console.log(`Accès: http://localhost:${PORT}`);
  console.log(`Redirection des requêtes /api vers ${apiProxy.options.target}`);
});
