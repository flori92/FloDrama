require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS simplifiée - autorise toutes les origines pour le déploiement
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 heures
}));

// Middleware pour les en-têtes CORS manuels (fallback)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Répondre immédiatement aux requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
    
    try {
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour dramas:', dbError);
      // Renvoyer des données mockées en cas d'erreur de base de données
      res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
        id: `mock-drama-${i}`,
        title: `Drama ${i+1}`,
        description: "Contenu temporaire pendant la maintenance de l'API",
        poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-${i % 5 + 1}.jpg`,
        backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-${i % 5 + 1}.jpg`,
        rating: 4.5,
        year: new Date().getFullYear(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des dramas:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les films
app.get('/api/films', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    // Vérification des tables disponibles
    try {
      const tablesResult = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', []);
      console.log('Tables disponibles pour la route /api/films:', tablesResult.rows.map(row => row.table_name));
      
      // Vérifier si la table films existe
      const filmTableExists = tablesResult.rows.some(row => row.table_name === 'films');
      if (!filmTableExists) {
        console.warn('La table "films" n\'existe pas dans la base de données');
        
        // Essayer de trouver une table alternative
        const possibleTables = tablesResult.rows.map(row => row.table_name)
          .filter(name => name.includes('film') || name.includes('movie') || name.includes('content'));
        
        if (possibleTables.length > 0) {
          console.log('Tables alternatives possibles:', possibleTables);
        }
      }
    } catch (tableError) {
      console.error('Erreur lors de la vérification des tables:', tableError);
    }
    
    // Essayer d'abord la requête sur la table 'films'
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
    
    try {
      const result = await db.query(query, params);
      console.log(`Récupération réussie de ${result.rowCount} films depuis la table 'films'`);
      return res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur avec la table films, tentative avec la table content:', dbError);
      
      // Tentative alternative avec la table 'content' si elle existe
      try {
        const contentQuery = `
          SELECT * FROM content 
          WHERE type = 'film' OR type = 'movie'
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `;
        const contentResult = await db.query(contentQuery, [parseInt(limit), parseInt(offset)]);
        console.log(`Récupération réussie de ${contentResult.rowCount} films depuis la table 'content'`);
        return res.json(contentResult.rows);
      } catch (contentError) {
        console.error('Erreur avec la table content:', contentError);
        
        // Si toutes les tentatives échouent, renvoyer des données mockées
        console.warn('Toutes les tentatives de récupération ont échoué, renvoi de données mockées');
        return res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
          id: `mock-film-${i}`,
          title: `Film ${i+1}`,
          description: "Contenu temporaire pendant la maintenance de l'API",
          poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/movie-${i % 5 + 1}.jpg`,
          backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/movie-${i % 5 + 1}.jpg`,
          rating: 4.5,
          year: new Date().getFullYear(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      }
    }
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
    
    try {
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour animes:', dbError);
      // Renvoyer des données mockées en cas d'erreur de base de données
      res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
        id: `mock-anime-${i}`,
        title: `Anime ${i+1}`,
        description: "Contenu temporaire pendant la maintenance de l'API",
        poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-${i % 5 + 1}.jpg`,
        backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-${i % 5 + 1}.jpg`,
        rating: 4.5,
        year: new Date().getFullYear(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }
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
    
    try {
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour bollywood:', dbError);
      // Renvoyer des données mockées en cas d'erreur de base de données
      res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
        id: `mock-bollywood-${i}`,
        title: `Bollywood ${i+1}`,
        description: "Contenu temporaire pendant la maintenance de l'API",
        poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-${i % 5 + 1}.jpg`,
        backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-${i % 5 + 1}.jpg`,
        rating: 4.5,
        year: new Date().getFullYear(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }
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
    
    try {
      const result = await db.query(query, [currentYear, previousYear, parseInt(limit)]);
      res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour featured:', dbError);
      // Renvoyer des données mockées en cas d'erreur de base de données
      res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
        id: `mock-featured-${i}`,
        title: `Contenu à découvrir ${i+1}`,
        description: "Contenu temporaire pendant la maintenance de l'API",
        poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/featured-${i % 5 + 1}.jpg`,
        backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/featured-${i % 5 + 1}.jpg`,
        rating: 4.8,
        year: currentYear,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }
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

// Route pour trending (contenus tendance)
app.get('/api/trending', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // Récupération des dramas récents pour la tendance
    const query = `
      SELECT * FROM dramas 
      WHERE (year = $1 OR year = $2) 
      ORDER BY created_at DESC 
      LIMIT $3 OFFSET $4
    `;
    
    try {
      const result = await db.query(query, [currentYear, previousYear, parseInt(limit), parseInt(offset)]);
      res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données:', dbError);
      // Renvoyer des données mockées en cas d'erreur de base de données
      res.json(Array(parseInt(limit)).fill(0).map((_, i) => ({
        id: `mock-trending-${i}`,
        title: `Contenu tendance ${i+1}`,
        description: "Contenu temporaire pendant la maintenance de l'API",
        poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/trending-${i % 5 + 1}.jpg`,
        backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/trending-${i % 5 + 1}.jpg`,
        rating: 4.5,
        year: currentYear,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus tendance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint de santé
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Route racine pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API FloDrama fonctionnelle',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/dramas',
      '/api/films',
      '/api/animes',
      '/api/bollywood',
      '/api/trending',
      '/api/featured',
      '/api/content/:id',
      '/api/streams/:contentId'
    ]
  });
});

// Route de diagnostic pour vérifier la structure de la base de données
app.get('/api/diagnostic', async (req, res) => {
  try {
    // Récupérer la liste des tables
    const tablesResult = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', []);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // Récupérer la structure de chaque table
    const tableStructures = {};
    for (const table of tables) {
      try {
        const columnsResult = await db.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        // Récupérer un échantillon de données pour chaque table
        const sampleResult = await db.query(`SELECT * FROM "${table}" LIMIT 1`, []);
        
        tableStructures[table] = {
          columns: columnsResult.rows,
          sample: sampleResult.rows.length > 0 ? sampleResult.rows[0] : null,
          count: 0
        };
        
        // Compter le nombre d'enregistrements dans la table
        const countResult = await db.query(`SELECT COUNT(*) FROM "${table}"`, []);
        tableStructures[table].count = parseInt(countResult.rows[0].count);
      } catch (error) {
        console.error(`Erreur lors de l'analyse de la table ${table}:`, error);
        tableStructures[table] = { error: error.message };
      }
    }
    
    // Renvoyer les résultats
    res.json({
      tables,
      tableStructures,
      connectionInfo: {
        database: process.env.DATABASE_URL ? 'Configurée' : 'Non configurée',
        ssl: false
      }
    });
  } catch (error) {
    console.error('Erreur lors du diagnostic de la base de données:', error);
    res.status(500).json({ 
      error: 'Erreur lors du diagnostic de la base de données',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Gestion des routes non trouvées
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`API FloDrama running on port ${PORT}`);
});
