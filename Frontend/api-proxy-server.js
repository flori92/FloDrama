// api-proxy-server.js
// Proxy robuste pour l'API FloDrama - Version de production
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3100;
const API_BASE = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';

// Activer CORS avec options maximales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Données de fallback (version minimale pour la production)
const FALLBACK_DATA = {
  drama: [ /* Les données seront chargées depuis les fichiers locaux */ ],
  anime: [ /* Les données seront chargées depuis les fichiers locaux */ ],
  film: [ /* Les données seront chargées depuis les fichiers locaux */ ],
  bollywood: [ /* Les données seront chargées depuis les fichiers locaux */ ]
};

// Chargement des données locales au démarrage
function loadLocalData() {
  try {
    // Charger les données depuis les fichiers JSON générés par le build
    const dataDir = path.join(__dirname, 'dist/data/content');
    
    // Catégories à charger
    const categories = ['drama', 'anime', 'film', 'bollywood'];
    
    for (const category of categories) {
      const filePath = path.join(dataDir, category, 'index.json');
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        FALLBACK_DATA[category] = jsonData.items || [];
        console.log(`✅ Données chargées pour ${category}: ${FALLBACK_DATA[category].length} éléments`);
      } else {
        console.log(`⚠️ Fichier non trouvé pour ${category}: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données locales:', error.message);
  }
}

// Cache local des réponses
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 heure en ms

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint de statut
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API FloDrama opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok', 
    message: 'Service en ligne',
    timestamp: new Date().toISOString()
  });
});

// Endpoint pour tous les types de contenu
app.get('/content/:type', async (req, res) => {
  const contentType = req.params.type;
  const cacheKey = `/content/${contentType}`;
  
  // Vérifier le cache
  if (responseCache.has(cacheKey)) {
    const cachedData = responseCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`✅ Données trouvées en cache pour ${contentType}`);
      return res.json(cachedData.data);
    } else {
      // Cache expiré
      responseCache.delete(cacheKey);
    }
  }
  
  try {
    // Tenter d'appeler l'API AWS
    console.log(`🔄 Tentative d'appel API AWS: ${contentType}`);
    const response = await axios.get(`${API_BASE}/content/${contentType}`, { 
      timeout: 3000,
      headers: { 'Accept': 'application/json' } 
    });
    
    // Si succès, mettre en cache et retourner
    console.log(`✅ Données obtenues depuis l'API pour ${contentType}`);
    const data = response.data;
    responseCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    return res.json(data);
    
  } catch (error) {
    console.log(`❌ Erreur API pour ${contentType}: ${error.message}`);
    
    // Utiliser le fallback
    if (FALLBACK_DATA[contentType] && FALLBACK_DATA[contentType].length > 0) {
      console.log(`⚠️ Utilisation du fallback pour ${contentType}: ${FALLBACK_DATA[contentType].length} éléments`);
      res.json(FALLBACK_DATA[contentType]);
      return;
    }
    
    // Si pas de fallback disponible
    res.status(404).json({
      error: `Contenu non disponible pour: ${contentType}`,
      message: 'Données temporairement indisponibles'
    });
  }
});

// Route pour les détails de contenu
app.get('/content/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const cacheKey = `/content/${type}/${id}`;
  
  // Vérifier le cache
  if (responseCache.has(cacheKey)) {
    const cachedData = responseCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`✅ Détails trouvés en cache pour ${id}`);
      return res.json(cachedData.data);
    } else {
      responseCache.delete(cacheKey);
    }
  }
  
  try {
    // Tenter d'appeler l'API AWS
    const response = await axios.get(`${API_BASE}/content/${id}`, { 
      timeout: 3000,
      headers: { 'Accept': 'application/json' } 
    });
    
    // Si succès, mettre en cache et retourner
    const data = response.data;
    responseCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    return res.json(data);
    
  } catch (error) {
    console.log(`❌ Erreur API pour détails ${id}: ${error.message}`);
    
    // Recherche dans les données locales par type et id
    if (FALLBACK_DATA[type]) {
      const item = FALLBACK_DATA[type].find(item => item.id === id);
      if (item) {
        // Construire une réponse détaillée à partir de l'élément basique
        const detailItem = {
          ...item,
          synopsis: `Synopsis de ${item.title} (données de secours)`,
          description: `Description de ${item.title} (données de secours)`,
          genres: ["Drame", "Comédie"],
          year: item.year || 2025,
          streaming_urls: [],
          images: [],
          trailers: []
        };
        return res.json(detailItem);
      }
    }
    
    // Si aucun élément trouvé
    res.status(404).json({
      error: `Détails non disponibles pour: ${id}`,
      message: 'Contenus détaillés temporairement indisponibles'
    });
  }
});

// Fallback pour toutes les autres routes API
app.get('*', (req, res) => {
  // Pour les routes inconnues, renvoyer vers l'index.html (SPA)
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  // Charger les données locales au démarrage
  loadLocalData();
  
  console.log(`
🚀 Proxy API FloDrama démarré sur le port ${PORT}
➡️ URL API pour le frontend: http://localhost:${PORT}
➡️ URL API AWS source: ${API_BASE}
  
Services disponibles:
- Proxy d'API avec CORS
- Données de secours
- Frontend statique
- Mise en cache des réponses
  `);
});
