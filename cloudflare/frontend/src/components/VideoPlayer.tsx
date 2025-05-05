/**
 * Composant de lecteur vidéo pour FloDrama
 * 
 * Ce composant utilise Hls.js pour lire les flux HLS de Cloudflare Stream
 * et prend en charge les sous-titres avec traduction automatique.
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getStreamUrl } from '../services/videoService';
import './VideoPlayer.css';

// Interface pour les pistes de sous-titres
export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  default?: boolean;
}

interface VideoPlayerProps {
  videoId: string;
  autoplay?: boolean;
  className?: string;
  poster?: string;
  subtitles?: SubtitleTrack[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  autoplay = false, 
  className = '',
  poster,
  subtitles = [],
  onTimeUpdate,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Initialiser les sous-titres actifs
  useEffect(() => {
    const defaultSubtitle = subtitles.find(track => track.default);
    if (defaultSubtitle) {
      setActiveSubtitle(defaultSubtitle.id);
    }
  }, [subtitles]);
  
  // Fonction pour traduire les sous-titres
  const translateSubtitles = async (trackId: string, targetLanguage: string) => {
    const originalTrack = subtitles.find(track => track.id === trackId);
    if (!originalTrack) {
      return;
    }
    
    try {
      // Vérifier si nous avons déjà traduit ces sous-titres
      const existingTranslation = translatedSubtitles.find(
        track => track.id === `${trackId}-${targetLanguage}`
      );
      
      if (existingTranslation) {
        setActiveSubtitle(existingTranslation.id);
        return;
      }
      
      // Récupérer le contenu des sous-titres originaux
      const response = await fetch(originalTrack.src);
      const vttContent = await response.text();
      
      // Traduire le contenu des sous-titres (version locale sans API)
      const translatedContent = await translateVttContent(vttContent, targetLanguage);
      
      // Créer un blob URL pour les sous-titres traduits
      const blob = new Blob([translatedContent], { type: 'text/vtt' });
      const translatedSrc = URL.createObjectURL(blob);
      
      // Ajouter les sous-titres traduits
      const translatedTrack: SubtitleTrack = {
        id: `${trackId}-${targetLanguage}`,
        label: `${originalTrack.label} (${targetLanguage.toUpperCase()})`,
        language: targetLanguage,
        src: translatedSrc
      };
      
      setTranslatedSubtitles(prev => [...prev, translatedTrack]);
      setActiveSubtitle(translatedTrack.id);
    } catch (error) {
      console.error('Erreur lors de la traduction des sous-titres:', error);
    }
  };
  
  // Fonction simple de traduction locale (dictionnaire basique)
  const translateVttContent = async (vttContent: string, targetLanguage: string): Promise<string> => {
    // Cette fonction simule une traduction sans API externe
    // Dans un environnement de production, vous pourriez utiliser une bibliothèque de traduction locale
    
    // Extraire les lignes de sous-titres
    const lines = vttContent.split('\n');
    const translatedLines = lines.map(line => {
      // Ne pas traduire les métadonnées ou les timestamps
      if (line.includes('-->') || line.trim() === '' || line.startsWith('WEBVTT')) {
        return line;
      }
      
      // Dictionnaires de traduction basiques pour les langues courantes
      // Ceci est une simulation - dans un vrai système, utilisez une bibliothèque de traduction
      const translations: Record<string, Record<string, string>> = {
        fr: {
          'Hello': 'Bonjour',
          'Goodbye': 'Au revoir',
          'Thank you': 'Merci',
          // Ajouter d'autres traductions selon les besoins
        },
        es: {
          'Hello': 'Hola',
          'Goodbye': 'Adiós',
          'Thank you': 'Gracias',
        },
        de: {
          'Hello': 'Hallo',
          'Goodbye': 'Auf Wiedersehen',
          'Thank you': 'Danke',
        }
      };
      
      // Si nous avons un dictionnaire pour cette langue
      if (translations[targetLanguage]) {
        // Remplacer les mots connus
        let translatedLine = line;
        Object.entries(translations[targetLanguage]).forEach(([original, translated]) => {
          translatedLine = translatedLine.replace(new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), translated);
        });
        return translatedLine;
      }
      
      return line;
    });
    
    return translatedLines.join('\n');
  };
  
  // Changer de sous-titre
  const handleSubtitleChange = (trackId: string | null) => {
    setActiveSubtitle(trackId);
    
    if (videoRef.current) {
      // Désactiver tous les sous-titres actuels
      Array.from(videoRef.current.textTracks).forEach(track => {
        track.mode = 'disabled';
      });
      
      // Activer le sous-titre sélectionné
      if (trackId) {
        const trackIndex = [...subtitles, ...translatedSubtitles].findIndex(track => track.id === trackId);
        if (trackIndex !== -1 && videoRef.current.textTracks[trackIndex]) {
          videoRef.current.textTracks[trackIndex].mode = 'showing';
        }
      }
    }
  };
  
  // Gérer la lecture/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error('Erreur lors de la lecture:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Gérer le volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };
  
  // Gérer la progression de la vidéo
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const streamUrl = getStreamUrl(videoId);
    
    // Nettoyage des gestionnaires d'événements précédents
    const cleanupEvents = () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
    
    // Gestionnaire pour les mises à jour de temps
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate && video.currentTime > 0) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };
    
    // Gestionnaire pour la fin de la vidéo
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };
    
    // Gestionnaires pour la lecture/pause
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // Gestionnaire pour les métadonnées chargées
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    // Ajout des gestionnaires d'événements
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
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
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('Erreur HLS fatale:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: {
              console.log('Tentative de récupération après erreur réseau...');
              hls?.startLoad();
              break;
            }
            case Hls.ErrorTypes.MEDIA_ERROR: {
              console.log('Tentative de récupération après erreur média...');
              hls?.recoverMediaError();
              break;
            }
            default: {
              console.error('Erreur irrécupérable');
              hls?.destroy();
              break;
            }
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
      
      // Libérer les URL des sous-titres traduits
      translatedSubtitles.forEach(track => {
        if (track.src.startsWith('blob:')) {
          URL.revokeObjectURL(track.src);
        }
      });
    };
  }, [videoId, autoplay, onTimeUpdate, onEnded, translatedSubtitles]);
  
  return (
    <div className="flodrama-video-player">
      <video
        ref={videoRef}
        className={`video-element ${className}`}
        poster={poster}
        playsInline
        controls={false} // Nous utilisons nos propres contrôles
      >
        {/* Ajouter les pistes de sous-titres */}
        {[...subtitles, ...translatedSubtitles].map((track) => (
          <track
            key={track.id}
            kind="subtitles"
            src={track.src}
            srcLang={track.language}
            label={track.label}
            default={track.id === activeSubtitle}
          />
        ))}
      </video>
      
      {/* Contrôles personnalisés */}
      <div className="video-controls">
        <button className="control-button" onClick={togglePlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>
        
        <div className="volume-container">
          <span className="volume-icon">{volume > 0 ? '🔊' : '🔇'}</span>
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
        
        {/* Menu des sous-titres */}
        <div className="subtitle-container">
          <button
            className="subtitle-button"
            onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
          >
            CC
          </button>
          
          {showSubtitleMenu && (
            <div className="subtitle-menu">
              <div
                className={`subtitle-option ${activeSubtitle === null ? 'active' : ''}`}
                onClick={() => handleSubtitleChange(null)}
              >
                Désactivés
              </div>
              
              {subtitles.map((track) => (
                <div key={track.id} className="subtitle-track-container">
                  <div
                    className={`subtitle-option ${activeSubtitle === track.id ? 'active' : ''}`}
                    onClick={() => handleSubtitleChange(track.id)}
                  >
                    {track.label}
                  </div>
                  
                  {/* Options de traduction */}
                  <div className="translation-options">
                    {['fr', 'es', 'de'].map((lang) => (
                      <button
                        key={lang}
                        className="translation-button"
                        onClick={() => translateSubtitles(track.id, lang)}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Sous-titres traduits */}
              {translatedSubtitles.map((track) => (
                <div
                  key={track.id}
                  className={`subtitle-option ${activeSubtitle === track.id ? 'active' : ''}`}
                  onClick={() => handleSubtitleChange(track.id)}
                >
                  {track.label}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Bouton plein écran */}
        <button
          className="fullscreen-button"
          onClick={() => {
            if (videoRef.current) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                videoRef.current.requestFullscreen();
              }
            }
          }}
        >
          ⛶
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
