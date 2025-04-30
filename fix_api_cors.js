// fix_api_cors.js
// Proxy temporaire pour résoudre les problèmes CORS et 500 de l'API AWS
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3100;
const API_BASE = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';

// Activer CORS avec options maximales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Données de fallback
const FALLBACK_DATA = {
  drama: [
    { id: 'drama-1', title: 'The King\'s Affection', type: 'drama', 
      imageUrl: 'https://d2iltjk184xms5.cloudfront.net/uploads/photo/file/424937/medium_aa3d7cfd9e4b6e3fe82f78e38f1f8276-kings-affection.jpg' },
    { id: 'drama-2', title: 'Business Proposal', type: 'drama',
      imageUrl: 'https://d2iltjk184xms5.cloudfront.net/uploads/photo/file/405801/medium_9a72299e73d5d0b3eb1c4114ccb2312a-business-proposal-poster.jpg' }
  ],
  anime: [
    { id: 'anime-1', title: 'Attack on Titan', type: 'anime',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
    { id: 'anime-2', title: 'Demon Slayer', type: 'anime',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' }
  ],
  film: [
    { id: 'film-1', title: 'The Godfather', type: 'film',
      imageUrl: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg' },
    { id: 'film-2', title: 'Inception', type: 'film',
      imageUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg' }
  ],
  bollywood: [
    { id: 'bollywood-1', title: 'Kabhi Khushi Kabhie Gham', type: 'bollywood',
      imageUrl: 'https://m.media-amazon.com/images/M/MV5BOTQ5Nzc3NzEtMjE5NS00YTFmLWI0MTgtYzI0MGQ1MzBhYmI3XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_.jpg' },
    { id: 'bollywood-2', title: 'Devdas', type: 'bollywood',
      imageUrl: 'https://m.media-amazon.com/images/M/MV5BY2QxMGM4Y2QtMGFmMy00ZjZkLWExMWQtNTMxYTBkOGU2NWRlXkEyXkFqcGdeQXVyNTE0MDc0NTM@._V1_.jpg' }
  ]
};

// Cache local des réponses
const responseCache = new Map();

// Endpoint de statut
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy FloDrama opérationnel',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Service en ligne',
    timestamp: new Date().toISOString()
  });
});

// Endpoint générique pour tout le contenu
app.get('/content/:type', async (req, res) => {
  const contentType = req.params.type;
  const cacheKey = `/content/${contentType}`;
  
  // Vérifier le cache
  if (responseCache.has(cacheKey)) {
    console.log(`✅ Données trouvées en cache pour ${contentType}`);
    return res.json(responseCache.get(cacheKey));
  }
  
  try {
    // Tenter d'appeler l'API AWS
    console.log(`🔄 Tentative d'appel API AWS: ${contentType}`);
    const response = await axios.get(`${API_BASE}/content/${contentType}`, { 
      timeout: 8000,
      headers: { 'Accept': 'application/json' } 
    });
    
    // Si succès, mettre en cache et retourner
    console.log(`✅ Données obtenues depuis l'API pour ${contentType}`);
    responseCache.set(cacheKey, response.data);
    return res.json(response.data);
    
  } catch (error) {
    console.log(`❌ Erreur API pour ${contentType}: ${error.message}`);
    
    // Utiliser le fallback
    if (FALLBACK_DATA[contentType]) {
      console.log(`⚠️ Utilisation du fallback pour ${contentType}`);
      res.json(FALLBACK_DATA[contentType]);
      return;
    }
    
    // Si pas de fallback disponible
    res.status(500).json({
      error: `Contenu non disponible pour: ${contentType}`,
      message: 'Données temporairement indisponibles'
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
🚀 Proxy de secours FloDrama démarré sur http://localhost:${PORT}
➡️ URL API pour le frontend: http://localhost:${PORT}
➡️ URL API AWS source: ${API_BASE}
  
Routes disponibles:
- /status - Statut du proxy
- /health - État de santé 
- /content/drama - Dramas coréens
- /content/anime - Animes 
- /content/film - Films
- /content/bollywood - Films Bollywood
  
Ctrl+C pour arrêter le serveur
  `);
});
