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
    try {
      const response = await axios({
        method: req.method,
        url: url,
        headers: headers,
        data: req.method !== 'GET' ? req.body : undefined,
        validateStatus: () => true, // Permet de capturer les codes d'erreur
        timeout: 8000 // Timeout plus court pour éviter les attentes trop longues
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
        
        // Intercepter les erreurs 500 pour l'endpoint /content
        // Note: path est déjà sans le préfixe /proxy, donc on vérifie directement /content
        if (error.response.status === 500 && path.startsWith('/content')) {
          console.log('⚠️ Interception erreur 500 pour endpoint content - Fourniture de données de test');
          
          // Extraire la catégorie depuis l'URL
          const urlParams = new URL(`http://dummy${path}`).searchParams;
          const category = urlParams.get('category') || 'all';
          console.log(`📦 Catégorie demandée: ${category}`);
          
          // Données de test pour chaque catégorie
          const mockData = {
            drama: [
              { id: "drama-1", title: "The King's Affection", type: "drama", imageUrl: "https://example.com/image1.jpg" },
              { id: "drama-2", title: "Business Proposal", type: "drama", imageUrl: "https://example.com/image2.jpg" }
            ],
            anime: [
              { id: "anime-1", title: "Attack on Titan", type: "anime", imageUrl: "https://example.com/image3.jpg" },
              { id: "anime-2", title: "Demon Slayer", type: "anime", imageUrl: "https://example.com/image4.jpg" }
            ],
            bollywood: [
              { id: "bollywood-1", title: "Pathaan", type: "bollywood", imageUrl: "https://example.com/image5.jpg" },
              { id: "bollywood-2", title: "RRR", type: "bollywood", imageUrl: "https://example.com/image6.jpg" }
            ],
            film: [
              { id: "film-1", title: "The Godfather", type: "film", imageUrl: "https://example.com/image7.jpg" },
              { id: "film-2", title: "Inception", type: "film", imageUrl: "https://example.com/image8.jpg" }
            ]
          };
          
          // Renvoyer les données correspondant à la catégorie demandée ou toutes les données
          const responseData = category === 'all' ? 
            Object.values(mockData).flat() : 
            mockData[category] || [];
          
          // Ajouter les en-têtes CORS et renvoyer les données de test
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
          res.setHeader('X-Proxy-Fallback', 'true');
          
          // Renvoyer un statut 200 avec les données de test
          return res.status(200).send(responseData);
        }
        
        // Transmettre l'erreur avec le même code de statut que l'API
        res.status(error.response.status).json({
          error: `Erreur API (${error.response.status})`,
          message: errBody.substring(0, 200),
          timestamp: new Date().toISOString()
        });
      } else if (error.request) {
        // La requête a été effectuée mais aucune réponse n'a été reçue
        console.error('Erreur de connexion à l\'API AWS:', error.message);
        res.status(502).json({
          error: 'Erreur de connexion à l\'API',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        // Erreur lors de la configuration de la requête
        console.error('Erreur de configuration de la requête:', error.message);
        res.status(500).json({
          error: 'Erreur de proxy',
          message: error.message,
          timestamp: new Date().toISOString(),
          url: url
        });
      }
    }
  } catch (error) {
    console.error('Erreur proxy générale:', error.message);
    res.status(500).json({
      error: 'Erreur de proxy générale',
      message: error.message,
      timestamp: new Date().toISOString()
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
