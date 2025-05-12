import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EnhancedStreamingPlayer from '../../componets/VideoPlayer/EnhancedStreamingPlayer';
import './VideoPlayerContainer.css';

/**
 * Conteneur pour le lecteur vidéo amélioré
 * Gère la récupération des métadonnées et l'intégration avec le reste de l'application
 */
const VideoPlayerContainer = () => {
  const { type, id, episode } = useParams();
  const navigate = useNavigate();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory, setWatchHistory] = useState({});
  
  // API de base
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.flodrama.com/api';
  
  // Récupération des informations du contenu
  useEffect(() => {
    const fetchContentInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url;
        
        // Construire l'URL en fonction du type de contenu
        switch (type) {
          case 'anime':
            url = `${apiBaseUrl}/anime/${id}`;
            break;
          case 'drama':
            url = `${apiBaseUrl}/drama/${id}`;
            break;
          case 'bollywood':
            url = `${apiBaseUrl}/bollywood/${id}`;
            break;
          default:
            throw new Error('Type de contenu non pris en charge');
        }
        
        // Effectuer la requête
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Traiter la réponse
        const data = await response.json();
        
        // Récupérer les informations de l'épisode si nécessaire
        if (type === 'anime' || type === 'drama') {
          const episodesUrl = `${url}/episodes`;
          const episodesResponse = await fetch(episodesUrl);
          
          if (episodesResponse.ok) {
            const episodesData = await episodesResponse.json();
            data.episodes = episodesData.data || [];
          }
        }
        
        setContent(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du contenu:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Charger l'historique de visionnage depuis le stockage local
    const loadWatchHistory = () => {
      const savedHistory = localStorage.getItem('flodrama_watch_history');
      if (savedHistory) {
        try {
          setWatchHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Erreur lors du chargement de l\'historique de visionnage:', e);
          setWatchHistory({});
        }
      }
    };
    
    fetchContentInfo();
    loadWatchHistory();
  }, [type, id, apiBaseUrl]);
  
  // Mise à jour de l'historique de visionnage
  const updateWatchHistory = (contentId, episodeNumber, currentTime, duration) => {
    const newHistory = {
      ...watchHistory,
      [contentId]: {
        ...watchHistory[contentId],
        lastWatched: new Date().toISOString(),
        episodes: {
          ...(watchHistory[contentId]?.episodes || {}),
          [episodeNumber]: {
            currentTime,
            duration,
            progress: Math.round((currentTime / duration) * 100),
            completed: (currentTime / duration) > 0.9
          }
        }
      }
    };
    
    setWatchHistory(newHistory);
    localStorage.setItem('flodrama_watch_history', JSON.stringify(newHistory));
  };
  
  // Gestion des erreurs de lecture
  const handlePlaybackError = (error) => {
    console.error('Erreur de lecture:', error);
    setError(`Erreur lors de la lecture: ${error.message}`);
  };
  
  // Navigation vers l'épisode suivant
  const navigateToNextEpisode = () => {
    if (!content || !content.episodes) return;
    
    const currentEpisodeNumber = parseInt(episode);
    const nextEpisodeNumber = currentEpisodeNumber + 1;
    
    // Vérifier si l'épisode suivant existe
    const hasNextEpisode = content.episodes.some(ep => 
      parseInt(ep.episode_number) === nextEpisodeNumber
    );
    
    if (hasNextEpisode) {
      navigate(`/watch/${type}/${id}/${nextEpisodeNumber}`);
    } else {
      // Rediriger vers la page de détails si c'est le dernier épisode
      navigate(`/${type}/${id}`);
    }
  };
  
  // Obtenir le titre de l'épisode
  const getEpisodeTitle = () => {
    if (!content || !content.episodes) return '';
    
    const currentEpisodeNumber = parseInt(episode);
    const currentEpisode = content.episodes.find(ep => 
      parseInt(ep.episode_number) === currentEpisodeNumber
    );
    
    return currentEpisode?.title || `Épisode ${currentEpisodeNumber}`;
  };
  
  // Obtenir les métadonnées de l'épisode
  const getEpisodeMetadata = () => {
    if (!content) return {};
    
    return {
      episodeNumber: parseInt(episode),
      seasonNumber: content.season_number || 1,
      totalEpisodes: content.episodes?.length || 0,
      releaseDate: content.release_date,
      genre: content.genres?.[0]
    };
  };
  
  // Obtenir l'URL de l'image poster
  const getPosterUrl = () => {
    if (!content) return '';
    
    return content.poster_path || content.cover_image || content.thumbnail;
  };
  
  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="video-player-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement du contenu...</p>
      </div>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="video-player-container error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Retour</button>
        </div>
      </div>
    );
  }
  
  // Affichage du lecteur vidéo
  return (
    <div className="video-player-container">
      <div className="player-wrapper">
        <EnhancedStreamingPlayer
          contentType={type}
          contentId={id}
          episodeNumber={parseInt(episode)}
          title={content?.title || ''}
          episodeTitle={getEpisodeTitle()}
          metadata={getEpisodeMetadata()}
          poster={getPosterUrl()}
          apiBaseUrl={apiBaseUrl}
          onError={handlePlaybackError}
          onPlay={() => console.log('Lecture démarrée')}
          onEnd={navigateToNextEpisode}
          onTimeUpdate={(currentTime, duration) => {
            updateWatchHistory(id, episode, currentTime, duration);
          }}
        />
      </div>
      
      {content && (
        <div className="content-info">
          <h1>{content.title}</h1>
          {type !== 'bollywood' && (
            <div className="episode-navigation">
              <h3>
                {type === 'anime' ? 'Épisode' : 'Épisode'} {episode}
                {content.episodes?.length > 0 && ` / ${content.episodes.length}`}
              </h3>
              
              <div className="episode-controls">
                <button 
                  className="prev-episode"
                  disabled={parseInt(episode) <= 1}
                  onClick={() => navigate(`/watch/${type}/${id}/${parseInt(episode) - 1}`)}
                >
                  Épisode précédent
                </button>
                
                <button 
                  className="next-episode"
                  disabled={parseInt(episode) >= content.episodes?.length}
                  onClick={navigateToNextEpisode}
                >
                  Épisode suivant
                </button>
              </div>
            </div>
          )}
          
          <div className="content-details">
            <div className="content-description">
              <p>{content.overview || content.description || content.synopsis}</p>
            </div>
            
            <div className="content-metadata">
              {content.genres && content.genres.length > 0 && (
                <div className="genres">
                  <span className="metadata-label">Genres:</span>
                  <span className="metadata-value">{content.genres.join(', ')}</span>
                </div>
              )}
              
              {content.release_date && (
                <div className="release-date">
                  <span className="metadata-label">Date de sortie:</span>
                  <span className="metadata-value">
                    {new Date(content.release_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              
              {content.rating && (
                <div className="rating">
                  <span className="metadata-label">Note:</span>
                  <span className="metadata-value">{content.rating} / 10</span>
                </div>
              )}
              
              {type === 'drama' && content.country && (
                <div className="country">
                  <span className="metadata-label">Pays:</span>
                  <span className="metadata-value">{content.country}</span>
                </div>
              )}
              
              {type === 'bollywood' && content.director && (
                <div className="director">
                  <span className="metadata-label">Réalisateur:</span>
                  <span className="metadata-value">{content.director}</span>
                </div>
              )}
            </div>
          </div>
          
          {type !== 'bollywood' && content.episodes && content.episodes.length > 0 && (
            <div className="episodes-list">
              <h3>Tous les épisodes</h3>
              <div className="episodes-grid">
                {content.episodes.map(ep => (
                  <div 
                    key={ep.episode_number} 
                    className={`episode-item ${parseInt(episode) === parseInt(ep.episode_number) ? 'active' : ''}`}
                    onClick={() => navigate(`/watch/${type}/${id}/${ep.episode_number}`)}
                  >
                    <div className="episode-number">Épisode {ep.episode_number}</div>
                    {ep.title && <div className="episode-title">{ep.title}</div>}
                    
                    {watchHistory[id]?.episodes?.[ep.episode_number] && (
                      <div className="progress-indicator">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${watchHistory[id].episodes[ep.episode_number].progress}%` }}
                        ></div>
                        {watchHistory[id].episodes[ep.episode_number].completed && (
                          <div className="completed-indicator">✓</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayerContainer;
