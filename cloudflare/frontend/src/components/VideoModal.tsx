/**
 * Modal de lecteur vidéo pour FloDrama
 * 
 * Ce composant affiche un lecteur vidéo dans une modal qui peut être
 * déclenchée depuis n'importe quel endroit de l'application.
 */

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from './VideoPlayer';
import { useVideoPlayerState, closeVideoPlayer } from '../services/videoService';
import './VideoModal.css';

const VideoModal: React.FC = () => {
  const { isOpen, videoId, options } = useVideoPlayerState();
  const modalRef = useRef<HTMLDivElement>(null);

  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeVideoPlayer();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Désactiver le défilement du body quand la modal est ouverte
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Réactiver le défilement quand la modal est fermée
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gérer le clic en dehors du lecteur pour fermer
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      closeVideoPlayer();
    }
  };

  // Ne rien rendre si la modal n'est pas ouverte
  if (!isOpen || !videoId) {
    return null;
  }

  // Utiliser un portail pour rendre la modal à la racine du DOM
  return ReactDOM.createPortal(
    <div 
      className="video-modal-backdrop" 
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="video-modal-content">
        <button 
          className="video-modal-close" 
          onClick={closeVideoPlayer}
          aria-label="Fermer le lecteur vidéo"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        <div className="video-modal-player-container">
          <VideoPlayer 
            videoId={videoId}
            autoplay={true}
            subtitles={options?.subtitles}
            poster={options?.poster}
            onEnded={closeVideoPlayer}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoModal;
