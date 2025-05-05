/**
 * Bouton de lecture vidéo pour FloDrama
 * 
 * Ce composant affiche un bouton de lecture qui peut être placé n'importe où
 * dans l'interface pour déclencher la lecture d'une vidéo.
 */

import React from 'react';
import { openVideoPlayer } from '../services/videoService';
import './VideoButton.css';

interface VideoButtonProps {
  videoId: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'overlay' | 'minimal';
  label?: string;
  poster?: string;
  onPlay?: () => void;
}

const VideoButton: React.FC<VideoButtonProps> = ({
  videoId,
  className = '',
  size = 'medium',
  variant = 'primary',
  label,
  poster,
  onPlay
}) => {
  const handleClick = () => {
    if (onPlay) {
      onPlay();
    }
    openVideoPlayer(videoId, { poster });
  };

  return (
    <button 
      className={`video-button ${size} ${variant} ${className}`}
      onClick={handleClick}
      aria-label={label || 'Lire la vidéo'}
    >
      {variant === 'overlay' && poster && (
        <div className="poster-container">
          <img src={poster} alt="" className="poster-image" />
          <div className="overlay-gradient"></div>
        </div>
      )}
      
      <div className="play-icon-container">
        <svg className="play-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
        </svg>
      </div>
      
      {label && <span className="button-label">{label}</span>}
    </button>
  );
};

export default VideoButton;
