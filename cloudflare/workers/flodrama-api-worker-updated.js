/**
 * Worker Cloudflare pour servir les données FloDrama depuis KV
 * 
 * Ce Worker expose une API REST pour accéder aux données stockées dans Cloudflare KV
 * et les servir au frontend FloDrama dans le format attendu.
 * 
 * @author FloDrama Team
 * @version 1.1.0
 */

// Configuration des CORS pour permettre l'accès depuis le frontend avec credentials
const getCorsHeaders = (request) => {
  try {
    // Récupérer l'origine de la requête
    let origin = request.headers.get('Origin');
    
    // Vérifier si l'origine est définie
    if (!origin) {
      // Valeur par défaut si l'origine n'est pas définie
      origin = 'https://flodrama.com';
    }
    
    // Liste des origines autorisées - Inclure tous les domaines de déploiement Cloudflare Pages
    const allowedOrigins = [
      'https://flodrama.com',
      'https://www.flodrama.com',
      'https://b4fdba17.flodrama-frontend.pages.dev',
      'https://c726800a.flodrama-frontend.pages.dev',
      'https://2861ea6a.flodrama-frontend.pages.dev',
      'https://59e590a4.flodrama-frontend.pages.dev',
      'https://8ffe561f.flodrama-frontend.pages.dev',
      'https://87fd4d23.flodrama-frontend.pages.dev',
      'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev',
      'http://localhost:5173'
    ];
    
    // Vérifier si l'origine est dans la liste des origines autorisées
    // IMPORTANT: Accepter TOUTES les origines qui contiennent flodrama-frontend.pages.dev
    const isCloudflarePages = origin.includes('flodrama-frontend.pages.dev');
    const isAllowed = allowedOrigins.includes(origin) || isCloudflarePages;
    
    // Si l'origine est autorisée, la renvoyer telle quelle, sinon utiliser une valeur par défaut
    const finalOrigin = isAllowed ? origin : 'https://flodrama.com';
    
    console.log(`Requête de l'origine: ${origin}, Origine renvoyée: ${finalOrigin}`);
    
    return {
      'Access-Control-Allow-Origin': finalOrigin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Google-Client-ID',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Erreur lors de la génération des en-têtes CORS:', error);
    // En cas d'erreur, renvoyer des en-têtes par défaut
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Google-Client-ID',
      'Content-Type': 'application/json'
    };
  }
};

// Configuration Google OAuth
const GOOGLE_OAUTH_CONFIG = {
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  redirect_uris: [
    'https://flodrama.com/auth/google/callback',
    'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev/auth/google/callback',
    'https://c726800a.flodrama-frontend.pages.dev/auth/google/callback',
    'https://2861ea6a.flodrama-frontend.pages.dev/auth/google/callback',
    'http://localhost:5173/auth/google/callback'
  ],
  javascript_origins: [
    'https://flodrama.com',
    'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev',
    'https://c726800a.flodrama-frontend.pages.dev',
    'https://2861ea6a.flodrama-frontend.pages.dev',
    'http://localhost:5173'
  ]
};

// Gestion des requêtes OPTIONS (pre-flight CORS)
function handleOptions(request) {
  return new Response(null, {
    headers: getCorsHeaders(request)
  });
}

// Gestion des erreurs avec format JSON
function handleError(error, request, status = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || 'Une erreur inconnue est survenue',
      status
    }),
    {
      status,
      headers: getCorsHeaders(request)
    }
  );
}

// Extraction de l'ID YouTube à partir d'une URL
function extractYoutubeId(url) {
  if (!url) {
    return null;
  }
  
  // Patterns possibles pour les URLs YouTube
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /^([^"&?\/\s]{11})$/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Génération d'une URL de streaming si elle n'existe pas
function generateStreamingUrl(item) {
  // Si l'URL de streaming existe déjà, la retourner
  if (item.streaming_url) {
    return item.streaming_url;
  }
  
  // Simuler une URL de streaming basée sur l'ID et le type
  const type = item.type || 'film';
  const id = item.id || `unknown-${Date.now()}`;
  
  return `https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/${type}/${id}.mp4`;
}

// Génération d'une URL de trailer si elle n'existe pas
function generateTrailerUrl(item) {
  // Si l'URL de trailer existe déjà, la retourner
  if (item.trailer_url) {
    return item.trailer_url;
  }
  
  // Liste de trailers populaires par type
  const defaultTrailers = {
    drama: 'https://www.youtube.com/watch?v=ApXoWvfEYVU', // Trailer de K-drama populaire
    anime: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ', // Trailer d'anime populaire
    film: 'https://www.youtube.com/watch?v=TcMBFSGVi1c', // Trailer de film populaire
    bollywood: 'https://www.youtube.com/watch?v=lhlIWjJA4v0' // Trailer de Bollywood populaire
  };
  
  // Retourner un trailer par défaut basé sur le type
  return defaultTrailers[item.type] || defaultTrailers.film;
}

// Transformation des données pour correspondre au format attendu par le frontend
function transformData(data, type) {
  try {
    // Analyser les données JSON si elles sont sous forme de chaîne
    let jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Vérifier si les données sont un tableau ou un objet avec une propriété "items"
    let items = Array.isArray(jsonData) ? jsonData : (jsonData.items || []);
    
    // Transformer chaque élément pour correspondre au format attendu par le frontend
    const transformedItems = items.map(item => {
      // Extraire l'année à partir de la date si elle existe
      const year = item.year || (item.release_date ? new Date(item.release_date).getFullYear() : null);
      
      // Convertir la note sur 5 si elle est sur 10
      const rating = item.rating ? 
        (parseFloat(item.rating) > 5 ? (parseFloat(item.rating) / 2).toFixed(1) : item.rating) : 
        null;
      
      // Générer ou utiliser l'URL du trailer
      const trailerUrl = item.trailer_url || generateTrailerUrl(item);
      
      // Extraire l'ID YouTube du trailer
      const youtubeId = extractYoutubeId(trailerUrl);
      
      // Générer ou utiliser l'URL de streaming
      const streamingUrl = item.streaming_url || generateStreamingUrl(item);
      
      // Construire l'objet transformé
      return {
        id: item.id,
        title: item.title,
        originalTitle: item.originalTitle || item.original_title || item.title,
        year: year,
        rating: rating,
        type: item.type || type,
        source: item.source,
        url: item.url,
        image: item.image || item.poster_path,
        description: item.description || item.overview || '',
        genres: item.genres || [],
        trailer_url: trailerUrl,
        youtube_id: youtubeId,
        streaming_url: streamingUrl,
        timestamp: item.timestamp || new Date().toISOString(),
        // Propriétés supplémentaires pour les cartes et banners
        is_banner: item.is_banner || false,
        is_featured: item.is_featured || false,
        is_new: item.is_new || (new Date(item.timestamp || Date.now()) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        category: item.category || type
      };
    });
    
    // Retourner les données transformées
    return transformedItems;
  } catch (error) {
    console.error('Erreur lors de la transformation des données:', error);
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
}

// Récupération et préparation des données pour les banners
async function getBannerData() {
  try {
    // Récupérer les données globales
    const globalData = await FLODRAMA_DATA.get('global');
    
    if (!globalData) {
      return [];
    }
    
    // Transformer les données
    const transformedData = transformData(globalData, 'film');
    
    // Sélectionner 5 éléments aléatoires pour les banners
    const shuffled = [...transformedData].sort(() => 0.5 - Math.random());
    const banners = shuffled.slice(0, 5).map(item => ({
      ...item,
      is_banner: true
    }));
    
    return banners;
  } catch (error) {
    console.error('Erreur lors de la récupération des banners:', error);
    return [];
  }
}

// Récupération des données depuis KV avec transformation
async function getDataFromKV(key, request) {
  try {
    // Récupérer les données depuis KV
    const data = await FLODRAMA_DATA.get(key);
    
    // Si les données n'existent pas
    if (data === null) {
      return new Response(
        JSON.stringify([]),
        {
          headers: getCorsHeaders(request)
        }
      );
    }
    
    // Déterminer le type de contenu en fonction de la clé
    let contentType = 'film';
    if (key === 'drama') {
      contentType = 'drama';
    }
    if (key === 'anime') {
      contentType = 'anime';
    }
    if (key === 'bollywood') {
      contentType = 'bollywood';
    }
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedData = transformData(data, contentType);
    
    // Retourner directement les données transformées
    return new Response(
      JSON.stringify(transformedData),
      {
        headers: getCorsHeaders(request)
      }
    );
  } catch (error) {
    console.error(`Erreur lors de la récupération des données pour ${key}:`, error);
    return handleError(error, request);
  }
}

// Récupération des banners pour la page d'accueil
async function getBanners(request) {
  try {
    const banners = await getBannerData();
    
    return new Response(
      JSON.stringify(banners),
      {
        headers: getCorsHeaders(request)
      }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des banners:', error);
    return handleError(error, request);
  }
}

// Gestion de l'authentification Google
async function handleGoogleAuth(request) {
  try {
    // Récupérer les paramètres de la requête
    const url = new URL(request.url);
    const clientId = request.headers.get('X-Google-Client-ID') || url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    
    if (!clientId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID client Google manquant"
        }),
        {
          status: 400,
          headers: getCorsHeaders(request)
        }
      );
    }
    
    // Générer l'URL d'authentification Google
    const scope = 'email profile';
    const responseType = 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}`;
    
    // Retourner l'URL d'authentification Google
    return new Response(
      JSON.stringify({
        success: true,
        authUrl: authUrl
      }),
      {
        headers: getCorsHeaders(request)
      }
    );
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'authentification Google:', error);
    return handleError(error, request);
  }
}

// Récupération de toutes les clés disponibles
async function listKeys() {
  try {
    const keys = await FLODRAMA_DATA.list();
    
    return new Response(
      JSON.stringify({
        success: true,
        keys: keys.keys.map(k => k.name)
      }),
      {
        headers: getCorsHeaders(request)
      }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des clés:', error);
    return handleError(error, request);
  }
}

// Récupération des contenus en tendance (top 10 dramas)
async function getTrending(request) {
  try {
    // Récupérer les données de drama
    const data = await FLODRAMA_DATA.get('drama');
    
    if (data === null) {
      return new Response(
        JSON.stringify([]),
        { headers: getCorsHeaders(request) }
      );
    }
    
    // Transformer les données
    const transformedData = transformData(data, 'drama');
    
    // Trier par rating et prendre les 10 premiers
    const trending = transformedData
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      })
      .slice(0, 10);
    
    return new Response(
      JSON.stringify(trending),
      { headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus en tendance:', error);
    return handleError(error, request);
  }
}

// Récupération des contenus récents (ajoutés récemment)
async function getRecent(request) {
  try {
    // Récupérer les données de tous les types
    const dramaData = await FLODRAMA_DATA.get('drama') || '[]';
    const animeData = await FLODRAMA_DATA.get('anime') || '[]';
    const filmData = await FLODRAMA_DATA.get('film') || '[]';
    
    // Transformer les données
    const dramas = transformData(dramaData, 'drama');
    const animes = transformData(animeData, 'anime');
    const films = transformData(filmData, 'film');
    
    // Combiner tous les contenus
    const allContent = [...dramas, ...animes, ...films];
    
    // Trier par timestamp (du plus récent au plus ancien)
    const recent = allContent
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      })
      .slice(0, 20);
    
    return new Response(
      JSON.stringify(recent),
      { headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus récents:', error);
    return handleError(error, request);
  }
}

// Fonction principale qui gère toutes les requêtes
async function handleRequest(request) {
  // Récupérer l'URL de la requête
  const url = new URL(request.url);
  const path = url.pathname.split('/');
  
  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  // Route pour la santé de l'API
  if (path[1] === 'health' || path[1] === 'api') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.1.0'
      }),
      {
        headers: getCorsHeaders(request)
      }
    );
  }
  
  // Route pour lister toutes les clés
  if (path[1] === 'keys') {
    return listKeys();
  }
  
  // Route pour les banners
  if (path[1] === 'banners') {
    return getBanners(request);
  }
  
  // Route pour les contenus en tendance
  if (path[1] === 'trending') {
    return getTrending(request);
  }
  
  // Route pour les contenus récents
  if (path[1] === 'recent') {
    return getRecent(request);
  }
  
  // Route pour récupérer des données spécifiques
  if ((path[1] === 'data' || path[1] === 'api') && path.length > 2) {
    const key = path[2];
    return getDataFromKV(key, request);
  }
  
  // Route pour l'authentification Google
  if (path[1] === 'google-auth') {
    return handleGoogleAuth(request);
  }

  // Routes pour les différentes catégories de contenu
  // Ces routes correspondent à celles attendues par le frontend
  if (path[1] === 'all' || path[1] === 'global') {
    return getDataFromKV('global', request);
  }
  
  if (path[1] === 'dramas' || path[1] === 'drama') {
    return getDataFromKV('drama', request);
  }
  
  if (path[1] === 'animes' || path[1] === 'anime') {
    return getDataFromKV('anime', request);
  }
  
  if (path[1] === 'films' || path[1] === 'film') {
    return getDataFromKV('film', request);
  }
  
  if (path[1] === 'bollywood') {
    return getDataFromKV('bollywood', request);
  }
  
  // Route par défaut
  return new Response(
    JSON.stringify([]),
    {
      headers: getCorsHeaders(request)
    }
  );
}

// Écouter les requêtes
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
