/**
 * Composant de lecteur vidéo pour FloDrama
 * 
 * Ce composant utilise Hls.js pour lire les flux HLS de Cloudflare Stream.
 */

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { getStreamUrl } from '../services/videoService';

interface VideoPlayerProps {
  videoId: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  autoplay = false, 
  controls = true,
  className = '',
  poster,
  onTimeUpdate,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const streamUrl = getStreamUrl(videoId);
    
    // Nettoyage des gestionnaires d'événements précédents
    const cleanupEvents = () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
    
    // Gestionnaire pour les mises à jour de temps
    const handleTimeUpdate = () => {
      if (onTimeUpdate && video.currentTime > 0) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };
    
    // Gestionnaire pour la fin de la vidéo
    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };
    
    // Ajout des gestionnaires d'événements
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    let hls: Hls | null = null;
    
    // Configuration du lecteur HLS
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          video.play().catch(e => console.error('Erreur lors de la lecture automatique:', e));
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Erreur HLS fatale:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Tentative de récupération après erreur réseau...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Tentative de récupération après erreur média...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('Erreur irrécupérable');
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback pour Safari
      video.src = streamUrl;
      
      if (autoplay) {
        video.play().catch(e => console.error('Erreur lors de la lecture automatique:', e));
      }
    } else {
      console.error('HLS n\'est pas supporté sur ce navigateur');
    }
    
    // Nettoyage lors du démontage du composant
    return () => {
      cleanupEvents();
      
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoId, autoplay, onTimeUpdate, onEnded]);
  
  return (
    <video
      ref={videoRef}
      className={`w-full ${className}`}
      controls={controls}
      poster={poster}
      playsInline
    />
  );
};

export default VideoPlayer;
