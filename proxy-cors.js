// Proxy CORS local pour FloDrama
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

// Configuration de l'API Gateway AWS
const API_GATEWAY_URL = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';

// Activer CORS pour toutes les requêtes
app.use(cors({
  origin: '*', // Autoriser toutes les origines en développement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Données locales de secours pour les cas où l'API ne répond pas
const localData = {
  drama: require('./Frontend/src/data/content/drama/index.json').items || [],
  anime: require('./Frontend/src/data/content/anime/index.json').items || [],
  film: require('./Frontend/src/data/content/film/index.json').items || [],
  bollywood: require('./Frontend/src/data/content/bollywood/index.json').items || [],
  carousels: require('./Frontend/src/data/carousels.json') || { carousels: [] },
  hero_banners: require('./Frontend/src/data/hero_banners.json') || { banners: [] }
};

// Créer une catégorie "trending" à partir des autres catégories
localData.trending = [];
// Prendre quelques éléments de chaque catégorie pour créer la catégorie trending
['drama', 'anime', 'film', 'bollywood'].forEach(category => {
  if (localData[category] && Array.isArray(localData[category]) && localData[category].length > 0) {
    // Prendre les 2 premiers éléments de chaque catégorie
    localData.trending.push(...localData[category].slice(0, 2));
  }
});
// Mélanger les éléments pour plus de réalisme
localData.trending.sort(() => Math.random() - 0.5);

// Fonction pour normaliser les catégories
function normalizeCategory(category) {
  const mapping = {
    'movies': 'film',
    'dramas': 'drama',
    'films': 'film',
    'movie': 'film'
  };
  
  return mapping[category] || category;
}

// Route de santé pour tester le proxy
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy CORS FloDrama opérationnel' });
});

// Route pour les contenus par catégorie
app.get('/content/:category', (req, res) => {
  const category = normalizeCategory(req.params.category);
  
  if (localData[category]) {
    console.log(`📊 Retour des données locales pour la catégorie: ${category}`);
    return res.json(localData[category]);
  } else {
    console.log(`⚠️ Pas de données locales pour la catégorie: ${category}`);
    return res.json([]);
  }
});

// Route pour les contenus directs (sans le préfixe /content/)
app.get('/:category', (req, res) => {
  const category = normalizeCategory(req.params.category);
  
  // Vérifier si la catégorie existe dans nos données locales
  if (localData[category] && Array.isArray(localData[category])) {
    console.log(`📊 Retour des données locales pour la catégorie directe: ${category}`);
    return res.json(localData[category]);
  } else {
    console.log(`⚠️ Pas de données locales pour la catégorie directe: ${category}`);
    return res.json([]);
  }
});

// Route pour les carrousels
app.get('/carousels', (req, res) => {
  console.log(`📊 Retour des données locales pour les carrousels`);
  return res.json(localData.carousels);
});

// Route pour les bannières
app.get('/hero_banners', (req, res) => {
  console.log(`📊 Retour des données locales pour les bannières`);
  return res.json(localData.hero_banners);
});

// Route générique pour toutes les autres requêtes API
app.all('*', async (req, res) => {
  try {
    // Construire l'URL de l'API Gateway
    const targetUrl = `${API_GATEWAY_URL}${req.path}`;
    console.log(`🔄 Proxying request to: ${targetUrl}`);

    // Configurer les options de la requête
    const options = {
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: () => true // Accepter tous les codes de statut pour le diagnostic
    };

    // Ajouter le corps de la requête pour les méthodes POST, PUT, etc.
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.data = req.body;
    }

    // Ajouter les paramètres de requête
    if (Object.keys(req.query).length > 0) {
      options.params = req.query;
    }

    // Effectuer la requête à l'API Gateway
    const response = await axios(options);
    
    // Logger la réponse pour le débogage
    console.log(`📊 Response status: ${response.status}`);
    
    // Si la réponse est un succès, renvoyer les données
    if (response.status >= 200 && response.status < 300 && response.data) {
      return res.status(response.status).json(response.data);
    }
    
    // Si la requête concerne une catégorie de contenu, essayer de renvoyer des données locales
    const contentRegex = /\/content\/([a-zA-Z]+)$/;
    const match = req.path.match(contentRegex);
    
    if (match) {
      const category = normalizeCategory(match[1]);
      if (localData[category]) {
        console.log(`⚠️ Échec de l'API, retour des données locales pour: ${category}`);
        return res.json(localData[category]);
      }
    }
    
    // Pour les carrousels
    if (req.path === '/carousels') {
      console.log(`⚠️ Échec de l'API, retour des données locales pour les carrousels`);
      return res.json(localData.carousels);
    }
    
    // Pour les bannières
    if (req.path === '/hero_banners') {
      console.log(`⚠️ Échec de l'API, retour des données locales pour les bannières`);
      return res.json(localData.hero_banners);
    }
    
    // Si aucune donnée locale n'est disponible, renvoyer la réponse de l'API
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    // Essayer de renvoyer des données locales en cas d'erreur
    const contentRegex = /\/content\/([a-zA-Z]+)$/;
    const match = req.path.match(contentRegex);
    
    if (match) {
      const category = normalizeCategory(match[1]);
      if (localData[category]) {
        console.log(`⚠️ Erreur de proxy, retour des données locales pour: ${category}`);
        return res.json(localData[category]);
      }
    }
    
    // Pour les carrousels
    if (req.path === '/carousels') {
      console.log(`⚠️ Erreur de proxy, retour des données locales pour les carrousels`);
      return res.json(localData.carousels);
    }
    
    // Pour les bannières
    if (req.path === '/hero_banners') {
      console.log(`⚠️ Erreur de proxy, retour des données locales pour les bannières`);
      return res.json(localData.hero_banners);
    }
    
    // Renvoyer une erreur au client
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Proxy CORS FloDrama en écoute sur le port ${PORT}`);
  console.log(`📌 URL du proxy: http://localhost:${PORT}`);
  console.log(`📌 Test de santé: http://localhost:${PORT}/health`);
});
