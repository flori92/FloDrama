const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Chargement des variables d'environnement
dotenv.config();

// Configuration de l'application Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuration AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialisation des clients AWS
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

// Configuration du bucket S3
const BUCKET_NAME = process.env.S3_BUCKET || 'flodrama-content-1745269660';
const FRONTEND_DATA_PATH = path.join(__dirname, '..', '..', 'Frontend', 'src', 'data');

// Fonction pour récupérer les données d'un fichier S3
async function getS3File(key) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (error) {
    console.error(`Erreur lors de la récupération du fichier S3 ${key}:`, error);
    throw error;
  }
}

// Fonction pour lister les fichiers dans un préfixe S3
async function listS3Files(prefix) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix
    };
    
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map(item => item.Key);
  } catch (error) {
    console.error(`Erreur lors du listage des fichiers S3 avec préfixe ${prefix}:`, error);
    throw error;
  }
}

// Fonction pour déclencher le scraping Lambda
async function triggerScraping(sources = [], minItemsPerSource = 200) {
  try {
    const params = {
      FunctionName: 'FloDramaContentScraper',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        sources,
        min_items_per_source: minItemsPerSource
      })
    };
    
    return await lambda.invoke(params).promise();
  } catch (error) {
    console.error('Erreur lors du déclenchement du scraping Lambda:', error);
    throw error;
  }
}

// Fonction pour mettre à jour les données frontend
async function updateFrontendData() {
  try {
    // Créer les dossiers nécessaires
    const contentTypes = ['drama', 'anime', 'bollywood', 'film'];
    contentTypes.forEach(type => {
      const typePath = path.join(FRONTEND_DATA_PATH, 'content', type);
      if (!fs.existsSync(typePath)) {
        fs.mkdirSync(typePath, { recursive: true });
      }
    });
    
    // Récupérer les métadonnées des sources
    const sourceFiles = await listS3Files('content/');
    const sources = [];
    let totalItems = 0;
    
    // Traiter chaque type de contenu
    for (const type of contentTypes) {
      const typeFiles = await listS3Files(`content/${type}/`);
      
      // Créer l'index pour ce type
      const indexData = {
        type,
        items: []
      };
      
      // Traiter chaque source pour ce type
      for (const file of typeFiles) {
        if (file.endsWith('items.json')) {
          const source = file.split('/')[2]; // Format: content/type/source/items.json
          sources.push({ name: source, type });
          
          // Récupérer les données de cette source
          const sourceData = await getS3File(file);
          totalItems += sourceData.length;
          
          // Extraire les données essentielles pour l'index
          const indexItems = sourceData.map(item => ({
            id: item.id,
            title: item.title,
            poster: item.poster,
            year: item.year,
            rating: item.rating,
            language: item.language
          }));
          
          indexData.items.push(...indexItems);
          
          // Enregistrer les données complètes de la source
          fs.writeFileSync(
            path.join(FRONTEND_DATA_PATH, 'content', type, `${source}.json`),
            JSON.stringify(sourceData, null, 2)
          );
        }
      }
      
      // Enregistrer l'index de ce type
      fs.writeFileSync(
        path.join(FRONTEND_DATA_PATH, 'content', type, 'index.json'),
        JSON.stringify(indexData, null, 2)
      );
    }
    
    // Créer le fichier de métadonnées
    const metadata = {
      lastUpdated: new Date().toISOString(),
      totalItems,
      sources
    };
    
    fs.writeFileSync(
      path.join(FRONTEND_DATA_PATH, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Générer les carrousels et bannières
    await generateDynamicComponents();
    
    return {
      success: true,
      message: 'Données frontend mises à jour avec succès',
      metadata
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données frontend:', error);
    throw error;
  }
}

// Fonction pour générer les composants dynamiques (carrousels, bannières)
async function generateDynamicComponents() {
  try {
    const contentTypes = ['drama', 'anime', 'bollywood', 'film'];
    const carousels = {};
    const banners = { banners: [] };
    
    // Charger les données de chaque type
    for (const type of contentTypes) {
      const indexPath = path.join(FRONTEND_DATA_PATH, 'content', type, 'index.json');
      
      if (fs.existsSync(indexPath)) {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        
        // Sélectionner les éléments pour les carrousels selon différents critères
        switch (type) {
          case 'drama':
            carousels.featured = {
              title: 'À l\'affiche',
              type: 'featured',
              items: indexData.items
                .filter(item => item.rating >= 8.5)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10)
            };
            
            // Ajouter un élément aux bannières
            if (indexData.items.length > 0) {
              const topDrama = indexData.items
                .filter(item => item.rating >= 9.0)
                .sort((a, b) => b.rating - a.rating)[0];
              
              if (topDrama) {
                banners.banners.push({
                  id: topDrama.id,
                  title: topDrama.title,
                  image: topDrama.poster
                });
              }
            }
            break;
            
          case 'film':
            carousels.trending = {
              title: 'Tendances',
              type: 'trending',
              items: indexData.items
                .filter(item => item.rating >= 7.5)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10)
            };
            
            // Ajouter un élément aux bannières
            if (indexData.items.length > 0) {
              const topFilm = indexData.items
                .filter(item => item.rating >= 8.8)
                .sort((a, b) => b.rating - a.rating)[0];
              
              if (topFilm) {
                banners.banners.push({
                  id: topFilm.id,
                  title: topFilm.title,
                  image: topFilm.poster
                });
              }
            }
            break;
            
          case 'anime':
            carousels.new_releases = {
              title: 'Nouveautés',
              type: 'new_releases',
              items: indexData.items
                .filter(item => item.year >= 2024)
                .sort((a, b) => b.year - a.year)
                .slice(0, 10)
            };
            
            // Ajouter un élément aux bannières
            if (indexData.items.length > 0) {
              const topAnime = indexData.items
                .filter(item => item.rating >= 8.5)
                .sort((a, b) => b.rating - a.rating)[0];
              
              if (topAnime) {
                banners.banners.push({
                  id: topAnime.id,
                  title: topAnime.title,
                  image: topAnime.poster
                });
              }
            }
            break;
            
          case 'bollywood':
            carousels.popular = {
              title: 'Populaires',
              type: 'popular',
              items: indexData.items
                .filter(item => item.rating >= 7.0)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10)
            };
            break;
        }
      }
    }
    
    // Enregistrer les carrousels et bannières
    fs.writeFileSync(
      path.join(FRONTEND_DATA_PATH, 'carousels.json'),
      JSON.stringify(carousels, null, 2)
    );
    
    fs.writeFileSync(
      path.join(FRONTEND_DATA_PATH, 'hero_banners.json'),
      JSON.stringify(banners, null, 2)
    );
    
    return { carousels, banners };
  } catch (error) {
    console.error('Erreur lors de la génération des composants dynamiques:', error);
    throw error;
  }
}

// Routes API

// Récupérer les contenus d'une catégorie
app.get('/api/content', async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: 'Catégorie requise' });
    }
    
    const indexPath = path.join(FRONTEND_DATA_PATH, 'content', category, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      // Si le fichier n'existe pas localement, essayer de le récupérer depuis S3
      try {
        const files = await listS3Files(`content/${category}/`);
        const items = [];
        
        for (const file of files) {
          if (file.endsWith('items.json')) {
            const sourceData = await getS3File(file);
            const indexItems = sourceData.map(item => ({
              id: item.id,
              title: item.title,
              poster: item.poster,
              year: item.year,
              rating: item.rating,
              language: item.language
            }));
            
            items.push(...indexItems);
          }
        }
        
        return res.json(items);
      } catch (s3Error) {
        console.error(`Erreur lors de la récupération depuis S3 pour ${category}:`, s3Error);
        return res.status(404).json({ error: `Catégorie ${category} non trouvée` });
      }
    }
    
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(indexData.items);
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les détails d'un contenu
app.get('/api/content/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    
    if (!contentId) {
      return res.status(400).json({ error: 'ID de contenu requis' });
    }
    
    // Extraire la source et déterminer le type
    const [source] = contentId.split('-');
    
    // Chercher le type dans les métadonnées
    const metadataPath = path.join(FRONTEND_DATA_PATH, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Métadonnées non trouvées' });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const sourceInfo = metadata.sources.find(s => s.name === source);
    
    if (!sourceInfo) {
      return res.status(404).json({ error: `Source ${source} non trouvée` });
    }
    
    const { type } = sourceInfo;
    const sourcePath = path.join(FRONTEND_DATA_PATH, 'content', type, `${source}.json`);
    
    if (!fs.existsSync(sourcePath)) {
      // Si le fichier n'existe pas localement, essayer de le récupérer depuis S3
      try {
        const sourceData = await getS3File(`content/${type}/${source}/items.json`);
        const item = sourceData.find(item => item.id === contentId);
        
        if (!item) {
          return res.status(404).json({ error: `Contenu ${contentId} non trouvé` });
        }
        
        return res.json(item);
      } catch (s3Error) {
        console.error(`Erreur lors de la récupération depuis S3 pour ${contentId}:`, s3Error);
        return res.status(404).json({ error: `Contenu ${contentId} non trouvé` });
      }
    }
    
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const item = sourceData.find(item => item.id === contentId);
    
    if (!item) {
      return res.status(404).json({ error: `Contenu ${contentId} non trouvé` });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du contenu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recherche de contenus
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Terme de recherche requis' });
    }
    
    const query = q.toLowerCase();
    const contentTypes = ['drama', 'anime', 'bollywood', 'film'];
    const results = [];
    
    // Rechercher dans chaque type de contenu
    for (const type of contentTypes) {
      const indexPath = path.join(FRONTEND_DATA_PATH, 'content', type, 'index.json');
      
      if (fs.existsSync(indexPath)) {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const typeResults = indexData.items.filter(item => 
          item.title.toLowerCase().includes(query)
        );
        
        results.push(...typeResults);
      }
    }
    
    // Si aucun résultat n'est trouvé, déclencher un scraping ciblé
    if (results.length === 0) {
      // Récupérer l'ID utilisateur s'il est fourni
      const userId = req.query.userId || 'anonymous';
      
      // Créer une entrée dans la table des demandes de contenu
      await createContentRequest(userId, query);
      
      // Déclencher un scraping ciblé en arrière-plan
      triggerTargetedScraping(query)
        .then(result => {
          console.log(`Scraping ciblé déclenché pour "${query}":`, result);
        })
        .catch(error => {
          console.error(`Erreur lors du scraping ciblé pour "${query}":`, error);
        });
      
      // Renvoyer une réponse indiquant que la recherche a été enregistrée
      return res.json({
        results: [],
        message: "Aucun résultat trouvé. Nous avons enregistré votre recherche et allons scraper ce contenu pour vous. Vous serez notifié lorsqu'il sera disponible.",
        requestId: generateRequestId(userId, query)
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche de contenus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Nouvelle route pour vérifier le statut d'une demande de contenu
app.get('/api/content-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'ID de demande requis' });
    }
    
    // Vérifier le statut de la demande
    const status = await checkContentRequestStatus(requestId);
    
    res.json(status);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Nouvelle route pour récupérer les notifications d'un utilisateur
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Récupérer les notifications de l'utilisateur
    const notifications = await getUserNotifications(userId);
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Nouvelle route pour marquer une notification comme lue
app.post('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      return res.status(400).json({ error: 'ID de notification requis' });
    }
    
    // Marquer la notification comme lue
    await markNotificationAsRead(notificationId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les carrousels
app.get('/api/carousels', (req, res) => {
  try {
    const carouselsPath = path.join(FRONTEND_DATA_PATH, 'carousels.json');
    
    if (!fs.existsSync(carouselsPath)) {
      return res.status(404).json({ error: 'Carrousels non trouvés' });
    }
    
    const carousels = JSON.parse(fs.readFileSync(carouselsPath, 'utf8'));
    res.json(carousels);
  } catch (error) {
    console.error('Erreur lors de la récupération des carrousels:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les bannières
app.get('/api/banners', (req, res) => {
  try {
    const bannersPath = path.join(FRONTEND_DATA_PATH, 'hero_banners.json');
    
    if (!fs.existsSync(bannersPath)) {
      return res.status(404).json({ error: 'Bannières non trouvées' });
    }
    
    const banners = JSON.parse(fs.readFileSync(bannersPath, 'utf8'));
    res.json(banners);
  } catch (error) {
    console.error('Erreur lors de la récupération des bannières:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Déclencher une mise à jour des données
app.post('/api/update', async (req, res) => {
  try {
    const { sources, minItemsPerSource, updateFrontend } = req.body;
    
    // Vérifier l'authentification (à implémenter selon vos besoins)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token (à adapter selon votre système d'authentification)
    if (token !== process.env.API_SECRET_KEY) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Déclencher le scraping Lambda si demandé
    if (sources && sources.length > 0) {
      await triggerScraping(sources, minItemsPerSource || 200);
    }
    
    // Mettre à jour les données frontend si demandé
    if (updateFrontend) {
      const updateResult = await updateFrontendData();
      return res.json(updateResult);
    }
    
    res.json({
      success: true,
      message: 'Mise à jour déclenchée avec succès',
      sources: sources || 'all'
    });
  } catch (error) {
    console.error('Erreur lors du déclenchement de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques de scraping
app.get('/api/stats', async (req, res) => {
  try {
    // Vérifier l'authentification (à implémenter selon vos besoins)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token (à adapter selon votre système d'authentification)
    if (token !== process.env.API_SECRET_KEY) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer les statistiques depuis S3
    const statsData = await getS3File('content/statistics.json');
    res.json(statsData);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour générer un ID de demande unique
function generateRequestId(userId, query) {
  const timestamp = Date.now();
  const queryHash = Buffer.from(query).toString('base64').substring(0, 10);
  return `req_${userId.substring(0, 8)}_${queryHash}_${timestamp}`;
}

// Fonction pour créer une demande de contenu dans DynamoDB
async function createContentRequest(userId, query) {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const requestId = generateRequestId(userId, query);
    
    const params = {
      TableName: 'FloDramaContentRequests',
      Item: {
        requestId,
        userId,
        query,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    await dynamodb.put(params).promise();
    
    return requestId;
  } catch (error) {
    console.error('Erreur lors de la création de la demande de contenu:', error);
    throw error;
  }
}

// Fonction pour vérifier le statut d'une demande de contenu
async function checkContentRequestStatus(requestId) {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName: 'FloDramaContentRequests',
      Key: {
        requestId
      }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      throw new Error(`Demande ${requestId} non trouvée`);
    }
    
    return result.Item;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de la demande:', error);
    throw error;
  }
}

// Fonction pour récupérer les notifications d'un utilisateur
async function getUserNotifications(userId) {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName: 'FloDramaNotifications',
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Pour obtenir les plus récentes d'abord
    };
    
    const result = await dynamodb.query(params).promise();
    
    return result.Items || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
}

// Fonction pour marquer une notification comme lue
async function markNotificationAsRead(notificationId) {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName: 'FloDramaNotifications',
      Key: {
        notificationId
      },
      UpdateExpression: 'set isRead = :isRead, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':updatedAt': new Date().toISOString()
      }
    };
    
    await dynamodb.update(params).promise();
    
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw error;
  }
}

// Fonction pour déclencher un scraping ciblé
async function triggerTargetedScraping(query) {
  try {
    // Déterminer les sources les plus pertinentes pour cette requête
    const relevantSources = determineRelevantSources(query);
    
    // Préparer les paramètres pour le Lambda
    const params = {
      FunctionName: 'FloDramaContentScraper',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        sources: relevantSources,
        min_items_per_source: 50,
        search_query: query,
        is_targeted_search: true
      })
    };
    
    // Invoquer la fonction Lambda
    return await lambda.invoke(params).promise();
  } catch (error) {
    console.error('Erreur lors du déclenchement du scraping ciblé:', error);
    throw error;
  }
}

// Fonction pour déterminer les sources les plus pertinentes pour une requête
function determineRelevantSources(query) {
  query = query.toLowerCase();
  
  // Mots-clés pour identifier le type de contenu
  const keywordMap = {
    drama: ['drama', 'kdrama', 'korean', 'séoul', 'seoul', 'corée', 'coree', 'k-drama'],
    anime: ['anime', 'manga', 'japon', 'japonais', 'otaku', 'shonen', 'shojo', 'seinen'],
    bollywood: ['bollywood', 'inde', 'indien', 'mumbai', 'hindi'],
    film: ['film', 'movie', 'cinéma', 'cinema']
  };
  
  // Vérifier les correspondances avec les mots-clés
  const matchedTypes = [];
  
  for (const [type, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      matchedTypes.push(type);
    }
  }
  
  // Si aucun type spécifique n'est identifié, utiliser toutes les sources
  if (matchedTypes.length === 0) {
    return Object.keys(VALIDATED_SOURCES);
  }
  
  // Sinon, sélectionner les sources correspondant aux types identifiés
  const relevantSources = [];
  
  for (const [source, info] of Object.entries(VALIDATED_SOURCES)) {
    if (matchedTypes.includes(info.type)) {
      relevantSources.push(source);
    }
  }
  
  return relevantSources;
}

// Définition des sources validées (copie de lambda_handler.py)
const VALIDATED_SOURCES = {
  // Drama sources
  "vostfree": { url: "https://vostfree.cx", type: "drama", language: "ko" },
  "dramacool": { url: "https://dramacool.cr", type: "drama", language: "ko" },
  "myasiantv": { url: "https://myasiantv.cc", type: "drama", language: "ko" },
  "voirdrama": { url: "https://voirdrama.org", type: "drama", language: "ko" },
  "viki": { url: "https://www.viki.com", type: "drama", language: "ko" },
  "wetv": { url: "https://wetv.vip", type: "drama", language: "zh" },
  "iqiyi": { url: "https://www.iq.com", type: "drama", language: "zh" },
  "kocowa": { url: "https://www.kocowa.com", type: "drama", language: "ko" },
  
  // Anime sources
  "gogoanime": { url: "https://gogoanime.cl", type: "anime", language: "ja" },
  "voiranime": { url: "https://voiranime.com", type: "anime", language: "ja" },
  "neko-sama": { url: "https://neko-sama.fr", type: "anime", language: "ja" },
  
  // Bollywood sources
  "zee5": { url: "https://www.zee5.com", type: "bollywood", language: "hi" },
  "hotstar": { url: "https://www.hotstar.com", type: "bollywood", language: "hi" },
  
  // Film sources
  "allocine": { url: "https://www.allocine.fr", type: "film", language: "fr" },
  "imdb": { url: "https://www.imdb.com", type: "film", language: "en" },
  "themoviedb": { url: "https://www.themoviedb.org", type: "film", language: "en" },
  "dpstream": { url: "https://dpstream.fyi", type: "film", language: "fr" },
  "cinepulse": { url: "https://cinepulse.fr", type: "film", language: "fr" },
  
  // Metadata source
  "mydramalist": { url: "https://mydramalist.com", type: "metadata", language: "en" }
};

// Démarrage du serveur
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API de distribution de contenu FloDrama démarrée sur le port ${PORT}`);
});
