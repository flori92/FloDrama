/**
 * API Backend FloDrama sur Cloudflare Workers
 * 
 * Ce fichier contient l'implémentation de l'API backend de FloDrama
 * utilisant Cloudflare Workers et itty-router.
 */

// Importation des dépendances
import { Router } from 'itty-router';

// Création du router
const router = Router();

// Middleware CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Données mockées (à remplacer par D1 plus tard)
const mockData = {
  'film': [
    { 
      id: "film-1",
      title: "La légende du guerrier", 
      description: "Un guerrier légendaire doit faire face à son plus grand défi : protéger son village et retrouver sa famille disparue. Une épopée captivante mêlant arts martiaux et spiritualité.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-1.jpg",
      rating: 4.8, 
      year: 2023,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "film-2",
      title: "Sous les cerisiers en fleurs", 
      description: "Quand un jeune architecte retourne dans sa ville natale, il redécouvre son premier amour. Une histoire touchante de seconde chance dans un cadre magnifique du Japon rural.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-2.jpg",
      rating: 4.6, 
      year: 2022,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'drama': [
    { 
      id: "drama-1",
      title: "Les mystères de l'Empire", 
      description: "Dans la Chine ancienne, une jeune femme devient enquêtrice pour résoudre des mystères qui menacent l'empire. Entre complots politiques et aventures romantiques, suivez son parcours extraordinaire.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-1.jpg",
      rating: 4.9, 
      year: 2023,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "drama-2",
      title: "Destins croisés", 
      description: "Trois familles que tout oppose voient leurs vies bouleversées par un événement tragique. Une exploration profonde des relations humaines et du pardon.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-2.jpg",
      rating: 4.7, 
      year: 2022,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Route racine
router.get('/', () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    message: 'FloDrama API', 
    version: '1.0.0',
    environment: 'cloudflare'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// Route pour les dramas (avec et sans 's' pour compatibilité)
router.get('/dramas', async (request) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const year = url.searchParams.get('year');
  
  try {
    // À remplacer par une requête D1
    const offset = (page - 1) * limit;
    
    // Filtrage par année si nécessaire
    let filteredData = mockData['drama'];
    if (year) {
      if (year === 'recent') {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        filteredData = filteredData.filter(item => item.year === currentYear || item.year === previousYear);
      } else {
        filteredData = filteredData.filter(item => item.year === parseInt(year));
      }
    }
    
    // Pagination
    const paginatedData = filteredData.slice(offset, offset + limit);
    
    return new Response(JSON.stringify(paginatedData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route alternative pour les dramas (sans 's' pour compatibilité avec le frontend)
router.get('/drama', async (request) => {
  // Rediriger vers la route avec 's'
  return await router.handle({
    ...request,
    url: request.url.replace('/drama', '/dramas')
  });
});

// Route pour les films
router.get('/films', async (request) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const year = url.searchParams.get('year');
  
  try {
    // À remplacer par une requête D1
    const offset = (page - 1) * limit;
    
    // Filtrage par année si nécessaire
    let filteredData = mockData['film'];
    if (year) {
      if (year === 'recent') {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        filteredData = filteredData.filter(item => item.year === currentYear || item.year === previousYear);
      } else {
        filteredData = filteredData.filter(item => item.year === parseInt(year));
      }
    }
    
    // Pagination
    const paginatedData = filteredData.slice(offset, offset + limit);
    
    return new Response(JSON.stringify(paginatedData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour un contenu spécifique
router.get('/content/:id', async (request) => {
  const { id } = request.params;
  
  try {
    // Recherche dans toutes les catégories
    for (const [category, items] of Object.entries(mockData)) {
      const item = items.find(item => item.id === id);
      if (item) {
        return new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
    
    // Si non trouvé
    return new Response(JSON.stringify({ error: 'Contenu non trouvé' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les recommandations
router.get('/recommendations', async (request) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'anonymous';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const genres = url.searchParams.get('genres')?.split(',') || [];
  
  try {
    // Logique simplifiée pour les recommandations
    // À remplacer par une logique plus complexe plus tard
    
    // Récupérer un mélange de contenu de différentes catégories
    let recommendations = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      // Filtrer par genre si spécifié
      let categoryItems = items;
      if (genres.length > 0) {
        // Simulation de filtrage par genre (à implémenter réellement plus tard)
        categoryItems = items.slice(0, 3); // Simplification pour la démo
      }
      
      // Ajouter quelques éléments de chaque catégorie
      recommendations = recommendations.concat(categoryItems.slice(0, 3));
    }
    
    // Limiter le nombre de résultats
    recommendations = recommendations.slice(0, limit);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour le contenu mis en avant
router.get('/featured', async (request) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '5');
  
  try {
    // Sélectionner quelques éléments de chaque catégorie pour le contenu mis en avant
    let featuredContent = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      // Prendre les éléments avec les meilleures notes
      const sortedItems = [...items].sort((a, b) => b.rating - a.rating);
      featuredContent = featuredContent.concat(sortedItems.slice(0, 2));
    }
    
    // Limiter le nombre de résultats
    featuredContent = featuredContent.slice(0, limit);
    
    return new Response(JSON.stringify(featuredContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour le contenu récent
router.get('/recent', async (request) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    // Récupérer le contenu le plus récent de toutes les catégories
    let recentContent = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      // Trier par année (du plus récent au plus ancien)
      const sortedItems = [...items].sort((a, b) => b.year - a.year);
      recentContent = recentContent.concat(sortedItems.slice(0, 3));
    }
    
    // Limiter le nombre de résultats
    recentContent = recentContent.slice(0, limit);
    
    return new Response(JSON.stringify(recentContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour la liste "Continuer à regarder"
router.get('/continue-watching', async (request) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'anonymous';
  const limit = parseInt(url.searchParams.get('limit') || '5');
  
  try {
    // Simuler une liste de contenu en cours de visionnage
    // À remplacer par une vraie logique de récupération de l'historique utilisateur
    let continueWatchingContent = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      // Prendre quelques éléments aléatoires de chaque catégorie
      const randomItems = items.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      // Ajouter une propriété de progression aléatoire pour la démo
      const itemsWithProgress = randomItems.map(item => ({
        ...item,
        progress: Math.floor(Math.random() * 90) + 10, // Progression entre 10% et 99%
      }));
      
      continueWatchingContent = continueWatchingContent.concat(itemsWithProgress);
    }
    
    // Limiter le nombre de résultats
    continueWatchingContent = continueWatchingContent.slice(0, limit);
    
    return new Response(JSON.stringify(continueWatchingContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour la recherche
router.post('/search', async (request) => {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Requête de recherche manquante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Recherche dans toutes les catégories
    let searchResults = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      const matchingItems = items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      
      searchResults = searchResults.concat(matchingItems);
    }
    
    return new Response(JSON.stringify(searchResults), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus similaires
router.get('/similar', async (request) => {
  const url = new URL(request.url);
  const contentId = url.searchParams.get('contentId');
  const limit = parseInt(url.searchParams.get('limit') || '6');
  
  if (!contentId) {
    return new Response(JSON.stringify({ error: 'ID de contenu manquant' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  try {
    // Trouver le contenu de référence
    let referenceContent = null;
    let referenceCategory = '';
    
    for (const [category, items] of Object.entries(mockData)) {
      const item = items.find(item => item.id === contentId);
      if (item) {
        referenceContent = item;
        referenceCategory = category;
        break;
      }
    }
    
    if (!referenceContent) {
      return new Response(JSON.stringify({ error: 'Contenu non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Trouver des contenus similaires (même catégorie, pour simplifier)
    let similarContent = mockData[referenceCategory]
      .filter(item => item.id !== contentId) // Exclure le contenu de référence
      .sort(() => 0.5 - Math.random()) // Mélanger aléatoirement
      .slice(0, limit); // Limiter le nombre de résultats
    
    return new Response(JSON.stringify(similarContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les tendances
router.get('/trending', async (request) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    // Récupérer le contenu tendance (simulé par les meilleures notes)
    let trendingContent = [];
    
    for (const [category, items] of Object.entries(mockData)) {
      // Trier par note (du plus élevé au plus bas)
      const sortedItems = [...items].sort((a, b) => b.rating - a.rating);
      trendingContent = trendingContent.concat(sortedItems.slice(0, 2));
    }
    
    // Limiter le nombre de résultats
    trendingContent = trendingContent.slice(0, limit);
    
    return new Response(JSON.stringify(trendingContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route de diagnostic
router.get('/diagnostic', async (request, env) => {
  return new Response(JSON.stringify({
    status: 'ok',
    environment: 'cloudflare',
    timestamp: new Date().toISOString(),
    account_id: env.ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3',
    mock_categories: Object.keys(mockData),
    mock_items_count: Object.values(mockData).reduce((acc, items) => acc + items.length, 0)
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// Gestion des requêtes OPTIONS (CORS preflight)
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders,
  });
});

// Gestion des routes non trouvées
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Route non trouvée' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// Fonction principale du Worker
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};
