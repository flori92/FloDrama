/**
 * Service vidéo pour FloDrama
 * 
 * Ce fichier contient les fonctions pour interagir avec Cloudflare Stream
 * et gérer les vidéos de FloDrama.
 */

// Configuration de Cloudflare Stream
const STREAM_BASE_URL = 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com';
const STREAM_TOKEN = 'mGa7n-h-E9RJi3q9IGfpwF1JjPQx57hhRxQuGC0a';
const ACCOUNT_ID = '42fc982266a2c31b942593b18097e4b3';

// Interface pour les métadonnées vidéo
export interface VideoMetadata {
  title?: string;
  category?: string;
  contentId?: string;
  description?: string;
  year?: number;
}

/**
 * Récupère l'URL de streaming pour une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @returns URL de streaming HLS
 */
export function getStreamUrl(videoId: string): string {
  return `${STREAM_BASE_URL}/${videoId}/manifest/video.m3u8`;
}

/**
 * Récupère l'URL de la miniature pour une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @param time Temps de la miniature (par défaut: 0s)
 * @returns URL de la miniature
 */
export function getThumbnailUrl(videoId: string, time = '0s'): string {
  return `${STREAM_BASE_URL}/${videoId}/thumbnails/thumbnail.jpg?time=${time}`;
}

/**
 * Récupère les informations d'une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @returns Informations de la vidéo
 */
export async function getVideoInfo(videoId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STREAM_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des informations vidéo:', error);
    throw error;
  }
}

/**
 * Charge une vidéo sur Cloudflare Stream
 * @param file Fichier vidéo à charger
 * @param metadata Métadonnées de la vidéo
 * @returns Réponse de l'API Cloudflare Stream
 */
export async function uploadVideo(file: File, metadata: VideoMetadata = {}): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STREAM_TOKEN}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement de la vidéo:', error);
    throw error;
  }
}

/**
 * Supprime une vidéo de Cloudflare Stream
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @returns Réponse de l'API Cloudflare Stream
 */
export async function deleteVideo(videoId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${STREAM_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression de la vidéo:', error);
    throw error;
  }
}
