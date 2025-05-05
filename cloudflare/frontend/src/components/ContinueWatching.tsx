import React from 'react';
import { Link } from 'react-router-dom';
import VideoButton from './VideoButton';
import './ContinueWatching.css';

// Créer un hook local pour gérer les événements vidéo
const useVideo = () => {
  const openVideo = (videoId: string, startPosition?: number) => {
    const event = new CustomEvent('video:open', { 
      detail: { 
        videoId,
        startPosition: startPosition || 0
      } 
    });
    window.dispatchEvent(event);
  };

  return { openVideo };
};

export interface WatchHistoryItem {
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
}

interface ContinueWatchingProps {
  items: WatchHistoryItem[];
  title?: string;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ 
  items, 
  title = "Continuer la lecture" 
}) => {
  const { openVideo } = useVideo();

  if (!items || items.length === 0) {
    return null;
  }

  // Formatter le temps écoulé depuis le dernier visionnage
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  };

  // Formatter le temps restant
  const formatRemainingTime = (duration: number, progress: number): string => {
    const totalSeconds = duration * 60; // Durée en secondes
    const remainingSeconds = totalSeconds * (1 - progress);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    
    if (remainingMinutes < 60) {
      return `${remainingMinutes} min restantes`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      return `${hours}h${minutes > 0 ? minutes : ''} restantes`;
    }
  };

  return (
    <div className="continue-watching-section">
      <h2 className="section-title">{title}</h2>
      
      <div className="continue-watching-grid">
        {items.map((item) => (
          <div key={item.content.id} className="continue-watching-card">
            <div className="continue-watching-poster">
              <img 
                src={item.content.posterUrl} 
                alt={item.content.title} 
                className="poster-image"
              />
              
              <div className="overlay">
                <VideoButton 
                  videoId={item.content.videoId} 
                  onPlay={() => openVideo(item.content.videoId, item.progress)} 
                  size="medium"
                  variant="primary"
                />
              </div>
              
              {/* Barre de progression */}
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${item.progress * 100}%` }}
                />
              </div>
            </div>
            
            <div className="continue-watching-info">
              <Link to={`/content/${item.content.id}`} className="content-title">
                {item.content.title}
              </Link>
              
              <div className="watching-meta">
                <span className="time-ago">{formatTimeAgo(item.lastWatched)}</span>
                <span className="remaining-time">
                  {formatRemainingTime(item.content.duration, item.progress)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;
