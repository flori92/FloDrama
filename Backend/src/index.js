require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS : autorise Vercel + local
app.use(cors({
  origin: [
    'https://flodrama-np8jmkaop-flodrama-projects.vercel.app',
    'http://localhost:3000'
  ]
}));

app.use(express.json());

// Routes pour les différentes catégories
app.get('/api/dramas', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    let query = 'SELECT * FROM dramas';
    const params = [];
    
    // Filtre sur l'année si spécifié
    if (year) {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      if (year === 'recent') {
        query += ' WHERE year = $1 OR year = $2';
        params.push(currentYear, previousYear);
      } else {
        query += ' WHERE year = $1';
        params.push(parseInt(year));
      }
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des dramas:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les films
app.get('/api/films', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    let query = 'SELECT * FROM films';
    const params = [];
    
    // Filtre sur l'année si spécifié
    if (year) {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      if (year === 'recent') {
        query += ' WHERE year = $1 OR year = $2';
        params.push(currentYear, previousYear);
      } else {
        query += ' WHERE year = $1';
        params.push(parseInt(year));
      }
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les animes
app.get('/api/animes', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    let query = 'SELECT * FROM animes';
    const params = [];
    
    // Filtre sur l'année si spécifié
    if (year) {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      if (year === 'recent') {
        query += ' WHERE year = $1 OR year = $2';
        params.push(currentYear, previousYear);
      } else {
        query += ' WHERE year = $1';
        params.push(parseInt(year));
      }
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des animes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les contenus bollywood
app.get('/api/bollywood', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    let query = 'SELECT * FROM bollywood';
    const params = [];
    
    // Filtre sur l'année si spécifié
    if (year) {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      if (year === 'recent') {
        query += ' WHERE year = $1 OR year = $2';
        params.push(currentYear, previousYear);
      } else {
        query += ' WHERE year = $1';
        params.push(parseInt(year));
      }
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus bollywood:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer un contenu spécifique
app.get('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contentType = id.split('_')[0];
    
    let tableName;
    switch (contentType) {
      case 'drama':
        tableName = 'dramas';
        break;
      case 'film':
        tableName = 'films';
        break;
      case 'anime':
        tableName = 'animes';
        break;
      case 'bollywood':
        tableName = 'bollywood';
        break;
      default:
        tableName = 'dramas';
    }
    
    const query = `SELECT * FROM ${tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contenu non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour le hero banner (contenus mis en avant)
app.get('/api/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // Récupération des dramas récents et bien notés pour le hero banner
    const query = `
      SELECT * FROM dramas 
      WHERE (year = $1 OR year = $2) 
      ORDER BY rating DESC 
      LIMIT $3
    `;
    
    const result = await db.query(query, [currentYear, previousYear, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus mis en avant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les URLs de streaming
app.get('/api/streams/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const contentType = contentId.split('_')[0];
    
    let tableName;
    switch (contentType) {
      case 'drama':
        tableName = 'dramas_streams';
        break;
      case 'film':
        tableName = 'films_streams';
        break;
      case 'anime':
        tableName = 'animes_streams';
        break;
      case 'bollywood':
        tableName = 'bollywood_streams';
        break;
      default:
        tableName = 'dramas_streams';
    }
    
    const query = `SELECT * FROM ${tableName} WHERE content_id = $1`;
    const result = await db.query(query, [contentId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des URLs de streaming:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint de santé
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Gestion des routes non trouvées
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`API FloDrama running on port ${PORT}`);
});
