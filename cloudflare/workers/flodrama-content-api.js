/**
 * FloDrama Content API Worker
 * 
 * Ce worker fournit les endpoints API nécessaires pour le frontend FloDrama :
 * - /banners : Contenu mis en avant pour la bannière principale
 * - /trending : Contenu en tendance
 * - /recent : Contenu récemment ajouté
 * - /dramas, /animes, /films, /bollywood : Listes par catégorie
 */

// Configuration KV
const KV_NAMESPACE = 'FLODRAMA_DATA';

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://flodrama.com',
  'https://www.flodrama.com',
  'https://flodrama-frontend.pages.dev',
  'https://*.flodrama-frontend.pages.dev',
  'https://flodrama.pages.dev',
  'https://new-flodrama.pages.dev',
  'http://localhost:5173'
];

/**
 * Vérifie si l'origine est autorisée
 */
function isOriginAllowed(origin) {
  if (!origin) {
    return false;
  }
  
  return ALLOWED_ORIGINS.some((allowedOrigin) => {
    if (allowedOrigin === origin) {
      return true;
    }
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace('*', '.*');
      const regex = new RegExp(pattern);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Génère des en-têtes CORS appropriés
 */
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  
  if (!isOriginAllowed(origin)) {
    return {};
  }
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-google-client-id, x-google-oauth-token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Gère les requêtes OPTIONS (CORS preflight)
 */
function handleOptions(request) {
  const corsHeaders = getCorsHeaders(request);
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Génère une réponse JSON avec les en-têtes CORS appropriés
 */
function jsonResponse(data, request, status = 200) {
  const corsHeaders = getCorsHeaders(request);
  
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Génère des données de contenu aléatoires pour les tests
 */
function generateMockContent(count = 10, category = 'drama') {
  const content = [];
  
  for (let i = 0; i < count; i++) {
    const id = `${category}-${Date.now()}-${i}`;
    const rating = (Math.random() * 5).toFixed(1);
    
    content.push({
      id: id,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
      description: `Ceci est une description générée pour le ${category} ${i + 1}.`,
      poster_path: `/posters/${category}/${id}.jpg`,
      backdrop_path: `/backdrops/${category}/${id}.jpg`,
      rating: parseFloat(rating),
      vote_average: parseFloat(rating) * 2,
      category: category,
      release_date: `202${Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      original_language: ['ko', 'en', 'ja', 'hi'][Math.floor(Math.random() * 4)],
      genre_ids: [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 11]
    });
  }
  
  return content;
}

/**
 * Récupère les données de contenu depuis KV ou génère des données de test
 */
async function getContent(category, env, count = 10) {
  try {
    // Essayer de récupérer les données depuis KV
    if (env[KV_NAMESPACE]) {
      const key = `content:${category}`;
      const storedContent = await env[KV_NAMESPACE].get(key, { type: 'json' });
      
      if (storedContent && Array.isArray(storedContent) && storedContent.length > 0) {
        return storedContent;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des données ${category} depuis KV:`, error);
  }
  
  // Générer des données de test si aucune donnée n'est disponible
  return generateMockContent(count, category);
}

/**
 * Gère les requêtes API
 */
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Endpoint /api pour vérifier que l'API est en ligne
  if (path === '/api') {
    return jsonResponse({
      status: 'success',
      message: 'FloDrama Content API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }, request);
  }
  
  // Endpoint /banners pour la bannière principale
  if (path === '/banners') {
    const banners = await getContent('featured', env, 5);
    return jsonResponse({
      success: true,
      data: banners
    }, request);
  }
  
  // Endpoint /trending pour le contenu en tendance
  if (path === '/trending') {
    const trending = await getContent('trending', env, 15);
    return jsonResponse({
      success: true,
      data: trending
    }, request);
  }
  
  // Endpoint /recent pour le contenu récent
  if (path === '/recent') {
    const recent = await getContent('recent', env, 15);
    return jsonResponse({
      success: true,
      data: recent
    }, request);
  }
  
  // Endpoints pour les catégories
  if (path === '/dramas') {
    const dramas = await getContent('drama', env, 20);
    return jsonResponse({
      success: true,
      data: dramas
    }, request);
  }
  
  if (path === '/animes') {
    const animes = await getContent('anime', env, 20);
    return jsonResponse({
      success: true,
      data: animes
    }, request);
  }
  
  if (path === '/films') {
    const films = await getContent('film', env, 20);
    return jsonResponse({
      success: true,
      data: films
    }, request);
  }
  
  if (path === '/bollywood') {
    const bollywood = await getContent('bollywood', env, 20);
    return jsonResponse({
      success: true,
      data: bollywood
    }, request);
  }
  
  // Endpoint pour l'authentification Google
  if (path.startsWith('/google-auth')) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    
    // Vérifier que les paramètres nécessaires sont présents
    if (!clientId || !redirectUri) {
      return jsonResponse({
        success: false,
        message: 'Paramètres manquants pour l\'authentification Google'
      }, request, 400);
    }
    
    // Construire l'URL d'authentification Google
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
    
    // Rediriger vers l'URL d'authentification Google
    return new Response(null, {
      status: 302,
      headers: {
        'Location': googleAuthUrl,
        ...getCorsHeaders(request)
      }
    });
  }
  
  // Endpoint pour le callback d'authentification Google
  if (path.includes('/auth/google/callback')) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Gérer les erreurs d'authentification
    if (error) {
      return jsonResponse({
        success: false,
        message: `Erreur d'authentification Google: ${error}`
      }, request, 400);
    }
    
    // Vérifier que le code est présent
    if (!code) {
      return jsonResponse({
        success: false,
        message: 'Code d\'autorisation manquant'
      }, request, 400);
    }
    
    // Dans un environnement de production, nous échangerions ce code contre un token
    // Pour l'instant, nous simulons une authentification réussie
    
    // Générer un token JWT simulé
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
      sub: 'google-user-123',
      name: 'Utilisateur FloDrama',
      email: 'user@example.com',
      picture: 'https://ui-avatars.com/api/?name=Utilisateur+FloDrama&background=random',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 // 24 heures
    }))}.MOCK_SIGNATURE`;
    
    // Rediriger vers la page d'accueil avec le token
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/?token=' + mockToken,
        'Set-Cookie': `auth_token=${mockToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${3600 * 24}`,
        ...getCorsHeaders(request)
      }
    });
  }
  
  // Endpoint pour l'historique utilisateur (stub)
  if (path.includes('/users/') && path.includes('/history')) {
    return jsonResponse({
      success: true,
      data: generateMockContent(5, 'history')
    }, request);
  }
  
  // Endpoint non trouvé
  return jsonResponse({
    status: 'error',
    message: `Endpoint not found: ${path}`
  }, request, 404);
}

/**
 * Fonction principale du Worker
 */
export default {
  async fetch(request, env, ctx) {
    // Gérer les requêtes OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Gérer les requêtes API
    return handleApiRequest(request, env);
  }
};
