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

// Route pour les dramas
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
