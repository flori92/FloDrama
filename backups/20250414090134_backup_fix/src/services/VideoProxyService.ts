/**
 * VideoProxyService.ts
 * Service pour la gestion du proxy vidéo et l'accès aux streams sécurisés
 * Créé le 8 avril 2025
 * Mis à jour le 8 avril 2025 pour utiliser l'API Gateway AWS et les URL pré-signées
 */

import axios from 'axios';

// Configuration du service
const API_URL = process.env.REACT_APP_VIDEO_PROXY_API || 'https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod/stream';
const AUTH_TOKEN_KEY = 'flodrama_auth_token';

// Types pour les métadonnées de streaming
export interface StreamSource {
  url: string;
  quality: string;
  provider: string;
  format: string;
  subtitle_url?: string;
  is_dubbed: boolean;
  valid_until: string;
}

export interface StreamingMetadata {
  sources: StreamSource[];
  last_checked: string;
  next_check: string;
}

export interface VideoMetadata {
  contentId: string;
  title: string;
  description: string;
  poster_url: string;
  streaming_sources: StreamingMetadata;
  duration?: number;
  episode_number?: number;
  season_number?: number;
}

export interface StreamResponse {
  url: string;
  sessionId: string;
  quality: string;
  expiresAt: string;
  availableQualities?: string[];
  metadata?: {
    title: string;
    duration: number;
    contentType: string;
  };
}

class VideoProxyService {
  private authToken: string | null = null;
  private cachedStreams: Map<string, { response: StreamResponse; expiresAt: number }> = new Map();

  constructor() {
    // Récupération du token d'authentification depuis le localStorage
    this.authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Obtient une URL de streaming sécurisée pour un contenu spécifique
   * @param contentId Identifiant du contenu
   * @param quality Qualité vidéo souhaitée (1080p, 720p, etc.)
   * @param sessionId Identifiant de session optionnel pour le suivi
   * @returns Réponse contenant l'URL de streaming sécurisée et les métadonnées
   */
  async getSecureStreamUrl(contentId: string, quality: string = '720p', sessionId?: string): Promise<StreamResponse> {
    try {
      // Vérifier si nous avons déjà une URL en cache qui n'a pas expiré
      const cacheKey = `${contentId}_${quality}`;
      const cachedStream = this.cachedStreams.get(cacheKey);
      
      if (cachedStream && cachedStream.expiresAt > Date.now()) {
        console.log('Utilisation d\'une URL de streaming en cache');
        return cachedStream.response;
      }

      // Préparer les paramètres de la requête
      const params = new URLSearchParams({
        contentId,
        quality
      });

      // Ajouter le token d'authentification s'il existe
      if (this.authToken) {
        params.append('token', this.authToken);
      }

      // Ajouter l'identifiant de session s'il existe
      if (sessionId) {
        params.append('sessionId', sessionId);
      }

      // Appeler l'API de proxy vidéo
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      
      if (response.status !== 200) {
        throw new Error(`Erreur lors de la récupération du stream: ${response.statusText}`);
      }

      const streamResponse: StreamResponse = response.data;
      
      // Calculer la date d'expiration à partir de la chaîne ISO
      const expiresAt = new Date(streamResponse.expiresAt).getTime();
      
      // Mettre en cache la réponse
      this.cachedStreams.set(cacheKey, {
        response: streamResponse,
        expiresAt
      });

      return streamResponse;
    } catch (error) {
      console.error('Erreur dans getSecureStreamUrl:', error);
      throw new Error('Impossible de récupérer l\'URL de streaming sécurisée');
    }
  }

  /**
   * Récupère les métadonnées complètes d'une vidéo
   * @param contentId Identifiant du contenu
   * @returns Métadonnées de la vidéo
   */
  async getVideoMetadata(contentId: string): Promise<VideoMetadata> {
    try {
      // Récupérer d'abord les informations de streaming
      const streamResponse = await this.getSecureStreamUrl(contentId);
      
      // Construire les métadonnées à partir de la réponse
      const videoMetadata: VideoMetadata = {
        contentId,
        title: streamResponse.metadata?.title || 'Vidéo sans titre',
        description: 'Contenu vidéo de FloDrama',
        poster_url: `https://flodrama-images.s3.amazonaws.com/posters/${contentId}.jpg`,
        streaming_sources: {
          sources: [
            {
              url: streamResponse.url,
              quality: streamResponse.quality,
              provider: 'flodrama',
              format: streamResponse.metadata?.contentType || 'video/mp4',
              is_dubbed: false,
              valid_until: streamResponse.expiresAt
            }
          ],
          last_checked: new Date().toISOString(),
          next_check: streamResponse.expiresAt
        },
        duration: streamResponse.metadata?.duration
      };

      return videoMetadata;
    } catch (error) {
      console.error('Erreur dans getVideoMetadata:', error);
      throw new Error('Impossible de récupérer les métadonnées de la vidéo');
    }
  }

  /**
   * Enregistre une session de visionnage
   * @param contentId Identifiant du contenu
   * @param quality Qualité vidéo
   * @param position Position de lecture en secondes
   * @param sessionId Identifiant de session pour le suivi
   */
  async recordViewingSession(
    contentId: string, 
    quality: string, 
    position: number,
    sessionId?: string
  ): Promise<void> {
    try {
      // Préparer les données pour l'API de statistiques
      const data = {
        contentId,
        quality,
        position,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Appeler l'API de statistiques (à implémenter)
      console.log('Enregistrement de la session de visionnage:', data);
      
      // Dans une implémentation réelle, vous enverriez ces données à votre backend
      // await axios.post('https://api.flodrama.com/stats', data);
    } catch (error) {
      console.error('Erreur dans recordViewingSession:', error);
    }
  }

  /**
   * Définit le token d'authentification
   * @param token Token d'authentification
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Vider le cache lorsque le token change
    this.cachedStreams.clear();
  }

  /**
   * Efface le token d'authentification
   */
  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    
    // Vider le cache lorsque le token est effacé
    this.cachedStreams.clear();
  }
}

// Exporter une instance singleton du service
export const videoProxyService = new VideoProxyService();
export default videoProxyService;
