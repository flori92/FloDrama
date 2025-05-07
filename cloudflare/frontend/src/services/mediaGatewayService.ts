/**
 * @file mediaGatewayService.ts
 * @description Service d'accès aux médias via l'API Gateway FloDrama
 * 
 * Ce service centralise les appels à l'API Gateway pour l'accès aux ressources médias
 * avec gestion automatique des fallbacks et cache des réponses.
 */

/**
 * URL de base de l'API Gateway FloDrama
 */
const API_GATEWAY_URL = 'https://flodrama-api.florifavi.workers.dev';

/**
 * Types de médias supportés
 */
export enum MediaType {
  TRAILER = 'trailer',
  MOVIE = 'movie',
  EPISODE = 'episode',
  BACKDROP = 'backdrop',
  POSTER = 'poster',
  DEFAULT = 'default',
}

/**
 * Options pour une requête média
 */
export interface MediaOptions {
  /**
   * Type de média demandé
   */
  type?: MediaType;
  
  /**
   * Accès direct à la ressource (true) ou via proxy API (false)
   */
  direct?: boolean;
}

/**
 * Réponse du serveur pour une ressource média
 */
export interface MediaResponse {
  /**
   * Statut de la réponse : "success" ou "error"
   */
  status: 'success' | 'error';
  
  /**
   * Message (en cas d'erreur)
   */
  message?: string;
  
  /**
   * URL de fallback en cas d'erreur
   */
  fallbackUrl?: string;
}

/**
 * Cache des réponses d'erreurs média
 * Permet d'éviter de refaire des requêtes pour des médias déjà identifiés comme manquants
 */
const mediaErrorCache: Record<string, { timestamp: number, fallbackUrl: string }> = {};

/**
 * Durée de validité du cache d'erreurs (15 minutes)
 */
const ERROR_CACHE_TTL = 15 * 60 * 1000;

/**
 * Vérifie si un média est dans le cache d'erreurs
 * @param mediaId Identifiant du média
 * @returns URL de fallback si dans le cache, null sinon
 */
function checkErrorCache(mediaId: string): string | null {
  const cached = mediaErrorCache[mediaId];
  
  if (!cached) {
    return null;
  }
  
  // Vérifier si le cache est expiré
  const now = Date.now();
  if (now - cached.timestamp > ERROR_CACHE_TTL) {
    delete mediaErrorCache[mediaId];
    return null;
  }
  
  return cached.fallbackUrl;
}

/**
 * Ajoute un média au cache d'erreurs
 * @param mediaId Identifiant du média
 * @param fallbackUrl URL de fallback
 */
function addToErrorCache(mediaId: string, fallbackUrl: string): void {
  mediaErrorCache[mediaId] = {
    timestamp: Date.now(),
    fallbackUrl
  };
}

/**
 * Génère une URL d'accès à un média via l'API Gateway
 * @param mediaId Identifiant du média sur Cloudflare Stream
 * @param options Options de la requête
 * @returns URL de la ressource
 */
export function getMediaUrl(mediaId: string, options: MediaOptions = {}): string {
  // Vérifier d'abord si le média est déjà connu comme en erreur
  const cachedFallback = checkErrorCache(mediaId);
  if (cachedFallback) {
    console.log(`Média ${mediaId} dans le cache d'erreurs, utilisation du fallback: ${cachedFallback}`);
    return cachedFallback;
  }
  
  // Type par défaut
  const mediaType = options.type || MediaType.DEFAULT;
  
  // Construire les paramètres d'URL
  const params = new URLSearchParams();
  params.append('type', mediaType);
  
  if (options.direct) {
    params.append('direct', 'true');
  }
  
  // Générer l'URL complète
  return `${API_GATEWAY_URL}/media/${mediaId}?${params.toString()}`;
}

/**
 * Charge un média via l'API Gateway, avec gestion automatique des fallbacks
 * @param mediaId Identifiant du média
 * @param options Options de la requête
 * @returns Promise avec l'URL de la ressource (originale ou fallback)
 */
export async function loadMedia(mediaId: string, options: MediaOptions = {}): Promise<string> {
  try {
    // Vérifier le cache d'erreurs
    const cachedFallback = checkErrorCache(mediaId);
    if (cachedFallback) {
      return cachedFallback;
    }
    
    // Construire l'URL de l'API
    const apiUrl = getMediaUrl(mediaId, { ...options, direct: false });
    
    // Requête à l'API Gateway
    const response = await fetch(apiUrl);
    
    // Traiter la réponse
    if (!response.ok) {
      // Extraire le type MIME
      const contentType = response.headers.get('Content-Type');
      
      // Si c'est du JSON, c'est probablement une réponse d'erreur avec fallback
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json() as MediaResponse;
        
        if (data.fallbackUrl) {
          // Ajouter au cache d'erreurs
          addToErrorCache(mediaId, data.fallbackUrl);
          return data.fallbackUrl;
        }
      }
      
      // Fallback par défaut selon le type
      const defaultFallback = getDefaultFallback(options.type || MediaType.DEFAULT);
      addToErrorCache(mediaId, defaultFallback);
      return defaultFallback;
    }
    
    // Si tout va bien, on retourne l'URL directe pour affichage
    return options.direct ? 
      // URL directe vers Cloudflare Stream
      getMediaUrl(mediaId, { ...options, direct: true }) : 
      // URL proxifiée via l'API Gateway
      apiUrl;
  } catch (error) {
    console.error(`Erreur lors du chargement du média ${mediaId}:`, error);
    
    // Fallback par défaut en cas d'erreur
    const fallbackUrl = getDefaultFallback(options.type || MediaType.DEFAULT);
    addToErrorCache(mediaId, fallbackUrl);
    return fallbackUrl;
  }
}

/**
 * Retourne l'URL de fallback par défaut selon le type de média
 * @param type Type de média
 * @returns URL du placeholder approprié
 */
function getDefaultFallback(type: MediaType): string {
  const fallbacks = {
    [MediaType.TRAILER]: '/images/placeholder-trailer.jpg',
    [MediaType.MOVIE]: '/images/placeholder-movie.jpg',
    [MediaType.EPISODE]: '/images/placeholder-episode.jpg',
    [MediaType.BACKDROP]: '/images/placeholder-backdrop.jpg',
    [MediaType.POSTER]: '/images/placeholder.jpg',
    [MediaType.DEFAULT]: '/images/placeholder.jpg',
  };
  
  return fallbacks[type] || fallbacks[MediaType.DEFAULT];
}

/**
 * Vérifie l'accessibilité d'une URL de média (image, vidéo)
 * et retourne l'URL appropriée (originale ou fallback)
 * @param url URL à vérifier
 * @param fallbackUrl URL de fallback en cas d'erreur
 * @returns Promise avec l'URL validée
 */
export async function verifyMediaUrl(url: string, fallbackUrl: string): Promise<string> {
  // Si l'URL est vide ou invalide, retourner directement le fallback
  if (!url || url === '#' || url === 'undefined') {
    return fallbackUrl;
  }
  
  // Si c'est déjà une URL de fallback locale, la retourner directement
  if (url.startsWith('/images/placeholder')) {
    return url;
  }
  
  try {
    // Si c'est une URL Cloudflare Stream, utiliser notre API Gateway
    if (url.includes('cloudflarestream.com')) {
      // Extraire l'ID du stream
      const matches = url.match(/\/([a-z0-9]+)\/watch/i);
      if (matches && matches[1]) {
        const mediaId = matches[1];
        // Déterminer le type en fonction du contexte
        const type = url.includes('trailer') ? MediaType.TRAILER : 
                    url.includes('movie') ? MediaType.MOVIE : 
                    url.includes('episode') ? MediaType.EPISODE :
                    MediaType.DEFAULT;
        
        return await loadMedia(mediaId, { type });
      }
    }
    
    // Pour les autres URLs (externes), vérifier l'accessibilité
    await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      // Court timeout pour ne pas bloquer l'interface
      signal: AbortSignal.timeout(3000)
    });
    
    // Si la requête ne génère pas d'erreur, l'URL est considérée comme valide
    return url;
  } catch (error) {
    console.warn(`Erreur lors de la vérification de l'URL ${url}:`, error);
    return fallbackUrl;
  }
}
