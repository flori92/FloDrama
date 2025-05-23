// URLs pour l'API FloDrama
// Ces URLs font référence à l'API Cloudflare Workers

// URL de base pour l'API Cloudflare
// En production: https://api.flodrama.com
// Pour les tests: https://flodrama-api.florifavi.workers.dev
const API_BASE_URL = 'https://flodrama-api.florifavi.workers.dev';

// URLs pour les catégories principales de contenu (récupère toutes les entrées)
export const dramas = `${API_BASE_URL}/api/dramas`;
export const animes = `${API_BASE_URL}/api/animes`;
export const films = `${API_BASE_URL}/api/films`;
export const bollywood = `${API_BASE_URL}/api/bollywood`;

// URLs pour les vues spéciales
export const featured = `${API_BASE_URL}/api/dramas/featured`;
export const trending = `${API_BASE_URL}/api/dramas/trending`;
export const recent = `${API_BASE_URL}/api/animes/featured`; // Utilise les animes en vedette comme contenu récent

// URLs pour les détails d'un contenu spécifique
export const dramaDetail = (id) => `${API_BASE_URL}/api/dramas/${id}`;
export const animeDetail = (id) => `${API_BASE_URL}/api/animes/${id}`;
export const filmDetail = (id) => `${API_BASE_URL}/api/films/${id}`;
export const bollywoodDetail = (id) => `${API_BASE_URL}/api/bollywood/${id}`;

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
