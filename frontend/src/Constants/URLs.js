import { API_KEY } from "../../Constants/Constance";
import { API_BASE_URL } from "../../Cloudflare/CloudflareConfig";

// Adaptation des URLs pour utiliser les endpoints disponibles dans l'API de production
// Basé sur la documentation de l'API : https://flodrama-api-prod.florifavi.workers.dev/api

// Films populaires et tendances
export const TopRated = `${API_BASE_URL}/api/film/popular`;
export const originals = `${API_BASE_URL}/api/drama/trending`;
export const action = `${API_BASE_URL}/api/film/genre/action`;
export const comedy = `${API_BASE_URL}/api/film/genre/comedy`;
export const horror = `${API_BASE_URL}/api/film/genre/horror`;
export const Adventure = `${API_BASE_URL}/api/film/genre/adventure`;
export const SciFi = `${API_BASE_URL}/api/film/genre/sci-fi`;
export const Animated = `${API_BASE_URL}/api/anime/trending`;
export const War = `${API_BASE_URL}/api/film/genre/war`;
export const trending = `${API_BASE_URL}/api/film/trending`;
export const trendingSeries = `${API_BASE_URL}/api/drama/trending`;
export const UpcomingMovies = `${API_BASE_URL}/api/film/recent`;
