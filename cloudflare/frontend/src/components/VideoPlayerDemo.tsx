/**
 * Composant de démonstration du lecteur vidéo FloDrama
 * 
 * Ce composant montre comment utiliser le lecteur vidéo avec sous-titres
 * et traduction automatique.
 */

import React, { useState, useEffect } from 'react';
import VideoPlayer, { SubtitleTrack } from './VideoPlayer';
import { getSubtitles, createWebVTTFromText } from '../services/videoService';

interface VideoPlayerDemoProps {
  videoId: string;
  poster?: string;
}

const VideoPlayerDemo: React.FC<VideoPlayerDemoProps> = ({ videoId, poster }) => {
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les sous-titres au montage du composant
  useEffect(() => {
    const loadSubtitles = async () => {
      try {
        setLoading(true);
        
        // Récupérer les sous-titres depuis l'API
        const apiSubtitles = await getSubtitles(videoId);
        
        // Si aucun sous-titre n'est disponible, créer un sous-titre de démonstration
        if (apiSubtitles.length === 0) {
          // Créer un fichier WebVTT à partir d'un texte de démonstration
          const demoText = `
          Bienvenue sur FloDrama !
          
          Notre plateforme vous propose les meilleurs contenus
          de dramas, d'animes et de films asiatiques.
          
          Profitez de notre système de sous-titres intelligent
          qui vous permet de traduire automatiquement les sous-titres
          dans plusieurs langues.
          `;
          
          const blob = createWebVTTFromText(demoText, 60);
          const blobUrl = URL.createObjectURL(blob);
          
          // Ajouter le sous-titre de démonstration
          const demoSubtitle: SubtitleTrack = {
            id: 'demo-fr',
            label: 'Français (Démo)',
            language: 'fr',
            src: blobUrl,
            default: true
          };
          
          setSubtitles([demoSubtitle]);
        } else {
          setSubtitles(apiSubtitles);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des sous-titres:', err);
        setError('Impossible de charger les sous-titres');
        setLoading(false);
      }
    };
    
    loadSubtitles();
    
    // Nettoyer les URL blob à la destruction du composant
    return () => {
      subtitles.forEach(track => {
        if (track.src.startsWith('blob:')) {
          URL.revokeObjectURL(track.src);
        }
      });
    };
  }, [videoId]);
  
  // Gérer la mise à jour du temps de lecture
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    console.log(`Temps actuel: ${currentTime}s / ${duration}s`);
  };
  
  // Gérer la fin de la vidéo
  const handleEnded = () => {
    console.log('La vidéo est terminée');
  };
  
  if (loading) {
    return <div className="loading">Chargement du lecteur...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="video-player-demo">
      <h2>Lecteur FloDrama avec sous-titres intelligents</h2>
      <p>Ce lecteur prend en charge la traduction automatique des sous-titres sans API externe.</p>
      
      <div className="player-container">
        <VideoPlayer
          videoId={videoId}
          poster={poster}
          subtitles={subtitles}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </div>
      
      <div className="instructions">
        <h3>Instructions</h3>
        <ul>
          <li>Cliquez sur le bouton <strong>CC</strong> pour afficher les options de sous-titres</li>
          <li>Sélectionnez une langue de sous-titres dans le menu</li>
          <li>Pour traduire les sous-titres, cliquez sur un des boutons de langue (FR, ES, DE)</li>
          <li>Utilisez les contrôles de lecture pour naviguer dans la vidéo</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoPlayerDemo;
