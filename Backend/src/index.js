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

// Route pour les animes
app.get('/api/animes', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    // Vérifier la connectivité à la base de données
    const isConnected = await db.checkDatabaseConnectivity();
    
    if (!isConnected) {
      console.warn('Problème de connectivité à la base de données. Utilisation des données mockées pour les animes.');
      return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'anime'));
    }
    
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
      console.log(`Récupération réussie de ${result.rowCount} animes`);
      return res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour animes:', dbError);
      
      // Tentative alternative avec la table 'content' si elle existe
      try {
        const contentQuery = `
          SELECT * FROM content 
          WHERE type = 'anime'
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `;
        const contentResult = await db.query(contentQuery, [parseInt(limit), parseInt(offset)]);
        console.log(`Récupération réussie de ${contentResult.rowCount} animes depuis la table 'content'`);
        return res.json(contentResult.rows);
      } catch (contentError) {
        console.error('Erreur avec la table content pour les animes:', contentError);
        
        // Renvoyer des données mockées en cas d'erreur de base de données
        console.warn('Toutes les tentatives de récupération ont échoué, renvoi de données mockées pour les animes');
        return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'anime'));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des animes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les dramas
app.get('/api/dramas', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    // Vérifier la connectivité à la base de données
    const isConnected = await db.checkDatabaseConnectivity();
    
    if (!isConnected) {
      console.warn('Problème de connectivité à la base de données. Utilisation des données mockées pour les dramas.');
      return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'drama'));
    }
    
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
      console.log(`Récupération réussie de ${result.rowCount} dramas`);
      return res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour dramas:', dbError);
      
      // Tentative alternative avec la table 'content' si elle existe
      try {
        const contentQuery = `
          SELECT * FROM content 
          WHERE type = 'drama'
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `;
        const contentResult = await db.query(contentQuery, [parseInt(limit), parseInt(offset)]);
        console.log(`Récupération réussie de ${contentResult.rowCount} dramas depuis la table 'content'`);
        return res.json(contentResult.rows);
      } catch (contentError) {
        console.error('Erreur avec la table content pour les dramas:', contentError);
        
        // Renvoyer des données mockées en cas d'erreur de base de données
        console.warn('Toutes les tentatives de récupération ont échoué, renvoi de données mockées pour les dramas');
        return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'drama'));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des dramas:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les contenus bollywood
app.get('/api/bollywood', async (req, res) => {
  try {
    const { limit = 20, offset = 0, year } = req.query;
    
    // Vérifier la connectivité à la base de données
    const isConnected = await db.checkDatabaseConnectivity();
    
    if (!isConnected) {
      console.warn('Problème de connectivité à la base de données. Utilisation des données mockées pour bollywood.');
      return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'bollywood'));
    }
    
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
      console.log(`Récupération réussie de ${result.rowCount} contenus bollywood`);
      return res.json(result.rows);
    } catch (dbError) {
      console.error('Erreur de base de données pour bollywood:', dbError);
      
      // Tentative alternative avec la table 'content' si elle existe
      try {
        const contentQuery = `
          SELECT * FROM content 
          WHERE type = 'bollywood'
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `;
        const contentResult = await db.query(contentQuery, [parseInt(limit), parseInt(offset)]);
        console.log(`Récupération réussie de ${contentResult.rowCount} contenus bollywood depuis la table 'content'`);
        return res.json(contentResult.rows);
      } catch (contentError) {
        console.error('Erreur avec la table content pour bollywood:', contentError);
        
        // Renvoyer des données mockées en cas d'erreur de base de données
        console.warn('Toutes les tentatives de récupération ont échoué, renvoi de données mockées pour bollywood');
        return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'bollywood'));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus bollywood:', error);
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
    
    // Vérifier la connectivité à la base de données
    const isConnected = await db.checkDatabaseConnectivity();
    
    if (!isConnected) {
      console.warn('Problème de connectivité à la base de données. Utilisation des données mockées pour les films.');
      return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'film'));
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
        return res.json(generateMockContent(parseInt(limit), parseInt(offset), 'film'));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour générer des données mockées pour différents types de contenu
function generateMockContent(limit, offset, type) {
  const typeLabels = {
    'film': 'Film',
    'drama': 'Drama',
    'anime': 'Anime',
    'bollywood': 'Bollywood'
  };
  
  const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  
  // Données mockées plus réalistes
  const mockData = {
    'film': [
      { title: "La légende du guerrier", description: "Un guerrier légendaire doit faire face à son plus grand défi : protéger son village et retrouver sa famille disparue. Une épopée captivante mêlant arts martiaux et spiritualité.", rating: 4.8, year: 2023 },
      { title: "Sous les cerisiers en fleurs", description: "Quand un jeune architecte retourne dans sa ville natale, il redécouvre son premier amour. Une histoire touchante de seconde chance dans un cadre magnifique du Japon rural.", rating: 4.6, year: 2022 },
      { title: "L'énigme du temps", description: "Un physicien découvre accidentellement comment voyager dans le temps et tente de corriger les erreurs du passé. Un thriller scientifique qui questionne notre rapport au destin.", rating: 4.7, year: 2024 },
      { title: "Les mystères de Paris", description: "Dans le Paris des années 1920, un détective privé enquête sur une série de disparitions mystérieuses. Une plongée dans les secrets de la haute société parisienne.", rating: 4.5, year: 2023 },
      { title: "Au-delà des étoiles", description: "L'équipage d'un vaisseau spatial découvre une forme de vie extraterrestre qui remet en question tout ce que nous savons sur l'univers. Un voyage interstellaire fascinant.", rating: 4.9, year: 2024 }
    ],
    'drama': [
      { title: "Les mystères de l'Empire", description: "Dans la Chine ancienne, une jeune femme devient enquêtrice pour résoudre des mystères qui menacent l'empire. Entre complots politiques et aventures romantiques, suivez son parcours extraordinaire.", rating: 4.9, year: 2023 },
      { title: "Destins croisés", description: "Trois familles que tout oppose voient leurs vies bouleversées par un événement tragique. Une exploration profonde des relations humaines et du pardon.", rating: 4.7, year: 2022 },
      { title: "Le prix du pouvoir", description: "L'ascension et la chute d'un homme politique prêt à tout pour atteindre les sommets. Un regard sans concession sur la corruption et l'ambition.", rating: 4.8, year: 2024 },
      { title: "Médecin de campagne", description: "Un jeune médecin idéaliste s'installe dans un village reculé et doit faire face aux défis de la médecine rurale. Une série touchante sur le dévouement et la compassion.", rating: 4.6, year: 2023 },
      { title: "Secrets de famille", description: "Après la mort de leur père, trois sœurs découvrent des secrets familiaux qui remettent en question toute leur existence. Un drame psychologique intense.", rating: 4.5, year: 2022 }
    ],
    'anime': [
      { title: "Le royaume des esprits", description: "Une jeune fille se retrouve piégée dans un monde peuplé d'esprits et doit trouver un moyen de rentrer chez elle. Une aventure magique et émouvante.", rating: 4.9, year: 2023 },
      { title: "Chasseurs de démons", description: "Après le massacre de sa famille, un jeune homme devient chasseur de démons pour venger les siens et protéger l'humanité. Une quête épique remplie d'action.", rating: 4.8, year: 2022 },
      { title: "L'académie des héros", description: "Dans un monde où 80% de la population possède des super-pouvoirs, un jeune garçon sans don rêve de devenir un héros. Une histoire inspirante de persévérance.", rating: 4.7, year: 2024 },
      { title: "Pirates des cieux", description: "À bord de leur vaisseau volant, un équipage de pirates parcourt les cieux à la recherche d'un trésor légendaire. Une aventure steampunk pleine de rebondissements.", rating: 4.6, year: 2023 },
      { title: "Le pacte des alchimistes", description: "Deux frères utilisent l'alchimie interdite pour ressusciter leur mère et en paient le prix fort. Leur quête pour retrouver leurs corps les mènera aux confins de la science et de la magie.", rating: 4.9, year: 2022 }
    ],
    'bollywood': [
      { title: "Amour éternel", description: "Une histoire d'amour qui transcende les barrières sociales et culturelles dans l'Inde contemporaine. Un conte romantique vibrant et coloré.", rating: 4.7, year: 2023 },
      { title: "Le destin de Raj", description: "Un jeune homme issu d'un bidonville devient une star de Bollywood et doit faire face aux défis de la célébrité. Une ascension fulgurante semée d'embûches.", rating: 4.6, year: 2022 },
      { title: "Danses et traditions", description: "Une danseuse classique indienne lutte pour préserver les traditions face à la modernisation. Un hommage vibrant à la culture indienne.", rating: 4.8, year: 2024 },
      { title: "Le mariage arrangé", description: "Une jeune femme moderne doit composer avec un mariage arrangé par sa famille traditionnelle. Une comédie romantique qui explore le choc des générations.", rating: 4.5, year: 2023 },
      { title: "L'honneur de la famille", description: "Deux familles rivales s'affrontent dans une lutte de pouvoir qui s'étend sur plusieurs générations. Un drame épique sur l'honneur et la vengeance.", rating: 4.7, year: 2022 }
    ]
  };
  
  // Sélection des données en fonction du type
  const contentData = mockData[type] || [];
  
  // Génération des données avec pagination
  return Array(limit).fill(0).map((_, i) => {
    const index = (i + offset) % contentData.length;
    const content = contentData[index] || { 
      title: `${label} ${i + offset + 1}`, 
      description: `Contenu temporaire ${type} pendant la maintenance de l'API`,
      rating: 4.5,
      year: new Date().getFullYear()
    };
    
    return {
      id: `mock-${type}-${i + offset}`,
      title: content.title,
      description: content.description,
      poster: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/${type}-${(i + offset) % 5 + 1}.jpg`,
      backdrop: `https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/${type}-${(i + offset) % 5 + 1}.jpg`,
      rating: content.rating,
      year: content.year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

// Route pour un contenu spécifique
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
