// URLs pour l'API FloDrama
// Ces URLs font référence à l'API Cloudflare Workers

// URL de base pour l'API Cloudflare
// En production: https://api.flodrama.com
// Pour les tests: https://flodrama-api.florifavi.workers.dev
import { API_BASE_URL } from "../Cloudflare/CloudflareConfig";

// IMPORTANT : Seuls les endpoints anime semblent fonctionnels dans l'API actuelle
// Pour éviter les 404, tous les endpoints sont temporairement redirigés vers /api/anime ou /api/anime/trending

// URLs pour les catégories principales de contenu
export const animes = `${API_BASE_URL}/api/anime`; // Seul endpoint fonctionnel confirmé
export const dramas = `${API_BASE_URL}/api/anime`; // Redirigé vers anime pour éviter 404
export const films = `${API_BASE_URL}/api/anime`; // Redirigé vers anime pour éviter 404
export const bollywood = `${API_BASE_URL}/api/anime`; // Redirigé vers anime pour éviter 404

// Pour le banner, utiliser anime/trending qui fonctionne
export const featured = `${API_BASE_URL}/api/anime/trending`; // Pour le banner

// URLs pour les vues spéciales
// Utilisation d'URLs absolues pour éviter les problèmes de domaine
// Ces endpoints n'existent pas côté API FloDrama :
// - featured (banners)
// - trending (global)
// - recent (global)
// Pour une vue globale, agréger côté frontend les endpoints spécialisés ci-dessous.

// Endpoints spécialisés pour l'agrégation frontend :
export const TRENDING_ENDPOINTS = [
  `${API_BASE_URL}/api/film/trending`,
  `${API_BASE_URL}/api/drama/trending`,
  `${API_BASE_URL}/api/anime/trending`,
  `${API_BASE_URL}/api/bollywood/trending`
];
export const RECENT_ENDPOINTS = [
  `${API_BASE_URL}/api/film/recent`,
  `${API_BASE_URL}/api/drama/recent`,
  `${API_BASE_URL}/api/anime/recent`,
  `${API_BASE_URL}/api/bollywood/recent`
];

// URLs pour les vues spéciales par catégorie
export const dramaTrending = `${API_BASE_URL}/api/drama/trending`;
export const dramaRecent = `${API_BASE_URL}/api/drama/recent`;
export const dramaPopular = `${API_BASE_URL}/api/drama/popular`;

export const animeTrending = `${API_BASE_URL}/api/anime/trending`;
export const animeRecent = `${API_BASE_URL}/api/anime/recent`;
export const animePopular = `${API_BASE_URL}/api/anime/popular`;

export const filmTrending = `${API_BASE_URL}/api/film/trending`;
export const filmRecent = `${API_BASE_URL}/api/film/recent`;
export const filmPopular = `${API_BASE_URL}/api/film/popular`;

export const bollywoodTrending = `${API_BASE_URL}/api/bollywood/trending`;
export const bollywoodRecent = `${API_BASE_URL}/api/bollywood/recent`;
export const bollywoodPopular = `${API_BASE_URL}/api/bollywood/popular`;

// Fonction pour obtenir l'URL complète
export const getFullUrl = (path) => {
  // Vérifier si le chemin est valide
  if (!path) {
    console.error('FloDramaURLs - getFullUrl: Chemin invalide', { path });
    return API_BASE_URL;
  }

  // Vérifier si le chemin contient déjà le domaine
  if (path.includes('http')) {
    console.log('FloDramaURLs - getFullUrl: URL déjà complète', { path });
    return path;
  }
  
  // S'assurer que le chemin commence par un slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Construire l'URL complète
  const fullUrl = `${API_BASE_URL}${normalizedPath}`;
  console.log('FloDramaURLs - getFullUrl: URL construite', { 
    baseUrl: API_BASE_URL, 
    path, 
    normalizedPath, 
    fullUrl 
  });
  
  return fullUrl;
}

// URLs pour les détails d'un contenu spécifique
export const dramaDetail = (id) => `${API_BASE_URL}/api/drama/${id}`;
export const animeDetail = (id) => `${API_BASE_URL}/api/anime/${id}`;
export const filmDetail = (id) => `${API_BASE_URL}/api/film/${id}`;
export const bollywoodDetail = (id) => `${API_BASE_URL}/api/bollywood/${id}`;

// URLs pour le streaming de contenu
export const animeStreaming = (id, episode) => `${API_BASE_URL}/api/anime/${id}/streaming/${episode}`;
export const dramaStreaming = (id, episode) => `${API_BASE_URL}/api/drama/${id}/streaming/${episode}`;
export const bollywoodStreaming = (id) => `${API_BASE_URL}/api/bollywood/${id}/streaming`;

// URL pour le proxy de streaming
export const streamProxy = (url, referer) => `${API_BASE_URL}/api/stream/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer || '')}`;

// Fonction helper pour récupérer le contenu par catégorie
export function getContentByCategory(category) {
  switch(category.toLowerCase()) {
    case 'drama':
    case 'k-drama':
    case 'c-drama':
    case 'j-drama':
      return dramas;
    case 'anime':
      return animes;
    case 'film':
    case 'films':
    case 'movie':
    case 'movies':
      return films;
    case 'bollywood':
      return bollywood;
    default:
      return dramas; // Par défaut, retourne les dramas
  }
}

// Fonction helper pour construire une URL de détail par catégorie et ID
export function getDetailUrlByCategory(category, id) {
  switch(category.toLowerCase()) {
    case 'drama':
    case 'k-drama':
    case 'c-drama':
    case 'j-drama':
      return dramaDetail(id);
    case 'anime':
      return animeDetail(id);
    case 'film':
    case 'films':
    case 'movie':
    case 'movies':
      return filmDetail(id);
    case 'bollywood':
      return bollywoodDetail(id);
    default:
      return dramaDetail(id); // Par défaut, retourne le détail d'un drama
  }
}

// Fonction helper pour construire une URL de streaming par catégorie, ID et épisode
export function getStreamingUrlByCategory(category, id, episode = 1) {
  switch(category.toLowerCase()) {
    case 'drama':
    case 'k-drama':
    case 'c-drama':
    case 'j-drama':
      return dramaStreaming(id, episode);
    case 'anime':
      return animeStreaming(id, episode);
    case 'bollywood':
      return bollywoodStreaming(id);
    default:
      return dramaStreaming(id, episode); // Par défaut, retourne le streaming d'un drama
  }
}

// Fonction helper pour construire une URL de recherche
export function buildSearchUrl(query) {
  return `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
}

// Fonction helper pour gérer la réponse API et extraire les données
export async function handleApiResponse(response) {
  // Vérifie si la réponse est ok (statut 200-299)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur: ${response.status} ${response.statusText}`);
  }
  
  // Parse la réponse JSON
  const data = await response.json();
  
  // Vérifie si la réponse a le format attendu (avec success et data)
  if (data && data.success === true && data.data) {
    return data.data; // Retourne directement les données
  }
  
  // Si le format est différent, retourne les données brutes
  return data;
}
