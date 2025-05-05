/**
 * Service vidéo pour FloDrama
 * 
 * Ce fichier contient les fonctions pour interagir avec Cloudflare Stream
 * et gérer les vidéos de FloDrama, y compris les sous-titres.
 */

import { useState, useEffect } from 'react';

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
  language?: string;
}

// Interface pour les sous-titres
export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  default?: boolean;
}

// Types pour les options du lecteur vidéo
export interface VideoPlayerOptions {
  poster?: string;
  subtitles?: SubtitleTrack[];
  autoplay?: boolean;
  startTime?: number;
}

// État global du lecteur vidéo
interface VideoPlayerState {
  isOpen: boolean;
  videoId: string | null;
  options: VideoPlayerOptions | null;
}

// Gestionnaire d'événements pour les changements d'état du lecteur
type VideoPlayerStateListener = (state: VideoPlayerState) => void;

// État initial du lecteur
const initialState: VideoPlayerState = {
  isOpen: false,
  videoId: null,
  options: null
};

// État actuel du lecteur
let currentState: VideoPlayerState = { ...initialState };

// Liste des écouteurs d'événements
const listeners: VideoPlayerStateListener[] = [];

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

/**
 * Récupère les sous-titres disponibles pour une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @returns Liste des pistes de sous-titres
 */
export async function getSubtitles(videoId: string): Promise<SubtitleTrack[]> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}/subtitles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STREAM_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      return [];
    }
    
    // Transformer les données de l'API en format SubtitleTrack
    return data.result.map((subtitle: any) => ({
      id: subtitle.language,
      label: getLanguageName(subtitle.language),
      language: subtitle.language,
      src: `${STREAM_BASE_URL}/${videoId}/subtitles/${subtitle.language}.vtt`,
      default: subtitle.default || false
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-titres:', error);
    return [];
  }
}

/**
 * Charge un fichier de sous-titres pour une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @param file Fichier de sous-titres (WebVTT ou SRT)
 * @param language Code de langue (ex: fr, en, es)
 * @param isDefault Définir comme sous-titres par défaut
 * @returns Réponse de l'API Cloudflare Stream
 */
export async function uploadSubtitles(
  videoId: string,
  file: File,
  language: string,
  isDefault: boolean = false
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}/subtitles/${language}?default=${isDefault}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${STREAM_TOKEN}`
        },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des sous-titres:', error);
    throw error;
  }
}

/**
 * Supprime une piste de sous-titres d'une vidéo
 * @param videoId Identifiant de la vidéo sur Cloudflare Stream
 * @param language Code de langue des sous-titres à supprimer
 * @returns Réponse de l'API Cloudflare Stream
 */
export async function deleteSubtitles(videoId: string, language: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}/subtitles/${language}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${STREAM_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression des sous-titres:', error);
    throw error;
  }
}

/**
 * Convertit un code de langue en nom complet
 * @param languageCode Code de langue (ex: fr, en, es)
 * @returns Nom complet de la langue
 */
export function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    fr: 'Français',
    en: 'Anglais',
    es: 'Espagnol',
    de: 'Allemand',
    it: 'Italien',
    pt: 'Portugais',
    ru: 'Russe',
    ja: 'Japonais',
    ko: 'Coréen',
    zh: 'Chinois',
    ar: 'Arabe',
    hi: 'Hindi',
    th: 'Thaï',
    vi: 'Vietnamien'
  };
  
  return languageNames[languageCode] || languageCode.toUpperCase();
}

/**
 * Crée un fichier WebVTT à partir d'un texte simple
 * @param text Le texte à convertir en sous-titres
 * @param duration La durée totale en secondes (par défaut 60 secondes)
 * @returns Un Blob contenant le fichier WebVTT
 */
export function createWebVTTFromText(text: string, duration: number = 60): Blob {
  // Nettoyer le texte et diviser en lignes
  const lines = text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Calculer la durée par ligne
  const lineCount = lines.length;
  const secondsPerLine = duration / lineCount;
  
  // Créer l'en-tête WebVTT
  let vttContent = 'WEBVTT\n\n';
  
  // Créer les cues (segments de sous-titres)
  lines.forEach((line, index) => {
    const startTime = index * secondsPerLine;
    const endTime = (index + 1) * secondsPerLine;
    
    // Formater les timestamps (HH:MM:SS.mmm)
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.floor((seconds % 1) * 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };
    
    // Ajouter le segment au contenu WebVTT
    vttContent += `${index + 1}\n`;
    vttContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    vttContent += `${line}\n\n`;
  });
  
  // Créer un Blob avec le contenu WebVTT
  return new Blob([vttContent], { type: 'text/vtt' });
}

/**
 * Ouvre le lecteur vidéo avec l'ID de vidéo spécifié
 * @param videoId ID de la vidéo à lire
 * @param options Options du lecteur vidéo
 */
export function openVideoPlayer(videoId: string, options: VideoPlayerOptions = {}): void {
  currentState = {
    isOpen: true,
    videoId,
    options
  };
  
  // Notifier tous les écouteurs du changement d'état
  listeners.forEach(listener => listener(currentState));
}

/**
 * Ferme le lecteur vidéo
 */
export function closeVideoPlayer(): void {
  currentState = { ...initialState };
  
  // Notifier tous les écouteurs du changement d'état
  listeners.forEach(listener => listener(currentState));
}

/**
 * Hook pour accéder à l'état du lecteur vidéo
 * @returns État actuel du lecteur vidéo
 */
export function useVideoPlayerState(): VideoPlayerState {
  const [state, setState] = useState<VideoPlayerState>(currentState);
  
  useEffect(() => {
    // Fonction pour mettre à jour l'état local
    const handleStateChange = (newState: VideoPlayerState) => {
      setState(newState);
    };
    
    // Ajouter l'écouteur à la liste
    listeners.push(handleStateChange);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      const index = listeners.indexOf(handleStateChange);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);
  
  return state;
}

/**
 * Hook pour utiliser les fonctions vidéo dans les composants React
 * @returns Fonctions pour ouvrir et fermer la vidéo
 */
export function useVideo() {
  const openVideo = (videoId: string, startPosition?: number) => {
    const event = new CustomEvent('video:open', { 
      detail: { 
        videoId,
        startPosition: startPosition || 0
      } 
    });
    window.dispatchEvent(event);
  };

  const closeVideo = () => {
    const event = new CustomEvent('video:close');
    window.dispatchEvent(event);
  };

  return {
    openVideo,
    closeVideo
  };
}

/**
 * Récupère l'historique de visionnage de l'utilisateur
 * @param _userId ID de l'utilisateur
 * @returns Liste des contenus en cours de visionnage avec leur progression
 */
export async function fetchWatchHistory(_userId: string): Promise<{
  content: {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    releaseDate: string;
    rating: number;
    duration: number;
    genres: string[];
    videoId: string;
    category: string;
  };
  progress: number;
  lastWatched: string;
}[]> {
  try {
    // Dans un environnement de production, vous feriez une requête API
    // Pour l'instant, nous simulons une réponse avec des données de démonstration
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Données de démonstration pour l'historique de visionnage
    return [
      {
        content: {
          id: 'moving-ep3',
          title: 'Moving - Épisode 3',
          description: 'Des lycéens dotés de superpouvoirs tentent de mener une vie normale tout en cachant leurs capacités au monde.',
          posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjRkMDEwYTQtNTcwMC00YzFiLWJiYmQtODM0MjE5YjBlNjYyXkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_.jpg',
          releaseDate: '2023-08-09',
          rating: 8.5,
          duration: 60,
          genres: ['Action', 'Drame', 'Fantastique'],
          videoId: 'moving-ep3',
          category: 'drama'
        },
        progress: 0.65, // 65% de progression
        lastWatched: '2025-05-04T18:30:00Z'
      },
      {
        content: {
          id: 'jujutsu-kaisen-ep5',
          title: 'Jujutsu Kaisen - Épisode 5',
          description: 'Yuji Itadori, un lycéen ordinaire, se retrouve plongé dans un monde d\'exorcistes et de malédictions.',
          posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
          releaseDate: '2020-10-03',
          rating: 8.8,
          duration: 24,
          genres: ['Action', 'Surnaturel', 'École'],
          videoId: 'jujutsu-kaisen-ep5',
          category: 'anime'
        },
        progress: 0.32, // 32% de progression
        lastWatched: '2025-05-03T21:15:00Z'
      },
      {
        content: {
          id: 'queen-of-tears-ep7',
          title: 'Queen of Tears - Épisode 7',
          description: 'L\'histoire d\'amour entre Baek Hyun-woo et Hong Hae-in, héritière du conglomérat Queens.',
          posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTQxOGExZTQtMDcyOC00MmE1LWIyZGQtYzRhMjBiYjRmNDI2XkEyXkFqcGdeQXVyMTMxMTgyMzU4._V1_.jpg',
          releaseDate: '2024-03-09',
          rating: 8.9,
          duration: 70,
          genres: ['Romance', 'Drame', 'Comédie'],
          videoId: 'queen-of-tears-ep7',
          category: 'drama'
        },
        progress: 0.78, // 78% de progression
        lastWatched: '2025-05-05T12:45:00Z'
      }
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique de visionnage:', error);
    return [];
  }
}
