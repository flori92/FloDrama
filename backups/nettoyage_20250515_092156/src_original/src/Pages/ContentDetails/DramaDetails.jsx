import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ContentDetails.css';

/**
 * Composant pour afficher les détails d'un drama
 * et permettre de lancer la lecture avec le lecteur vidéo amélioré
 */
const DramaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [drama, setDrama] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory, setWatchHistory] = useState({});
  
  // API de base
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.flodrama.com/api';
  
  // Récupération des informations du drama
  useEffect(() => {
    const fetchDramaDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les détails du drama
        const dramaResponse = await fetch(`${apiBaseUrl}/drama/${id}`);
        
        if (!dramaResponse.ok) {
          throw new Error(`Erreur ${dramaResponse.status}: ${dramaResponse.statusText}`);
        }
        
        const dramaData = await dramaResponse.json();
        setDrama(dramaData);
        
        // Récupérer les épisodes
        const episodesResponse = await fetch(`${apiBaseUrl}/drama/${id}/episodes`);
        
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          setEpisodes(episodesData.data || []);
        }
        
        // Récupérer le casting
        const castResponse = await fetch(`${apiBaseUrl}/drama/${id}/cast`);
        
        if (castResponse.ok) {
          const castData = await castResponse.json();
          setCast(castData.data || []);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du drama:', error);
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
    
    fetchDramaDetails();
    loadWatchHistory();
  }, [id, apiBaseUrl]);
  
  // Lancer la lecture d'un épisode
  const watchEpisode = (episodeNumber) => {
    navigate(`/watch/drama/${id}/${episodeNumber}`);
  };
  
  // Obtenir la progression d'un épisode
  const getEpisodeProgress = (episodeNumber) => {
    return watchHistory[id]?.episodes?.[episodeNumber]?.progress || 0;
  };
  
  // Vérifier si un épisode a été terminé
  const isEpisodeCompleted = (episodeNumber) => {
    return watchHistory[id]?.episodes?.[episodeNumber]?.completed || false;
  };
  
  // Trouver le prochain épisode à regarder
  const findNextEpisodeToWatch = () => {
    if (!episodes || episodes.length === 0) {
      return 1;
    }
    
    // Parcourir les épisodes pour trouver le premier non terminé
    for (const episode of episodes) {
      const episodeNumber = parseInt(episode.episode_number);
      if (!isEpisodeCompleted(episodeNumber)) {
        return episodeNumber;
      }
    }
    
    // Si tous les épisodes sont terminés, retourner le premier
    return 1;
  };
  
  // Continuer la lecture
  const continueWatching = () => {
    const nextEpisode = findNextEpisodeToWatch();
    watchEpisode(nextEpisode);
  };
  
  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="content-details-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement des informations...</p>
      </div>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="content-details-container error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Retour</button>
        </div>
      </div>
    );
  }
  
  // Affichage des détails du drama
  return (
    <div className="content-details-container">
      {drama && (
        <>
          <div className="content-header" style={{ backgroundImage: `url(${drama.backdrop_path || drama.cover_image})` }}>
            <div className="content-header-overlay">
              <div className="content-poster">
                <img src={drama.poster_path || drama.thumbnail} alt={drama.title} />
              </div>
              
              <div className="content-info">
                <h1>{drama.title}</h1>
                
                {drama.alternative_titles && (
                  <div className="alternative-titles">
                    {drama.alternative_titles.join(' • ')}
                  </div>
                )}
                
                <div className="content-metadata">
                  {drama.release_date && (
                    <span className="release-year">
                      {new Date(drama.release_date).getFullYear()}
                    </span>
                  )}
                  
                  {drama.rating && (
                    <span className="rating">
                      <i className="fas fa-star"></i> {drama.rating}/10
                    </span>
                  )}
                  
                  {drama.episodes_count && (
                    <span className="episodes-count">
                      {drama.episodes_count} épisodes
                    </span>
                  )}
                  
                  {drama.country && (
                    <span className="country">
                      {drama.country}
                    </span>
                  )}
                  
                  {drama.network && (
                    <span className="network">
                      {drama.network}
                    </span>
                  )}
                </div>
                
                <div className="content-actions">
                  <button className="primary-button" onClick={continueWatching}>
                    <i className="fas fa-play"></i> Regarder
                  </button>
                  
                  <button className="secondary-button">
                    <i className="fas fa-plus"></i> Ma liste
                  </button>
                </div>
                
                {drama.genres && drama.genres.length > 0 && (
                  <div className="genres">
                    {drama.genres.map((genre, index) => (
                      <span key={index} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="synopsis">
                  <p>{drama.overview || drama.description || drama.synopsis}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="content-body">
            {episodes && episodes.length > 0 ? (
              <div className="episodes-section">
                <h2>Épisodes</h2>
                
                <div className="episodes-grid">
                  {episodes.map((episode) => (
                    <div 
                      key={episode.episode_number} 
                      className={`episode-card ${isEpisodeCompleted(episode.episode_number) ? 'completed' : ''}`}
                      onClick={() => watchEpisode(episode.episode_number)}
                    >
                      <div className="episode-thumbnail">
                        <img 
                          src={episode.thumbnail || drama.thumbnail} 
                          alt={`Épisode ${episode.episode_number}`} 
                        />
                        <div className="play-overlay">
                          <i className="fas fa-play"></i>
                        </div>
                        
                        {getEpisodeProgress(episode.episode_number) > 0 && (
                          <div className="progress-bar">
                            <div 
                              className="progress" 
                              style={{ width: `${getEpisodeProgress(episode.episode_number)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="episode-info">
                        <div className="episode-number">
                          Épisode {episode.episode_number}
                        </div>
                        
                        {episode.title && (
                          <div className="episode-title">
                            {episode.title}
                          </div>
                        )}
                        
                        {episode.air_date && (
                          <div className="episode-air-date">
                            {new Date(episode.air_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        
                        {episode.duration && (
                          <div className="episode-duration">
                            {episode.duration} min
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-episodes">
                <p>Aucun épisode disponible pour le moment.</p>
              </div>
            )}
            
            {cast && cast.length > 0 && (
              <div className="characters-section">
                <h2>Distribution</h2>
                
                <div className="characters-grid">
                  {cast.slice(0, 12).map((actor, index) => (
                    <div key={index} className="character-card">
                      <div className="character-image">
                        <img src={actor.photo || 'https://via.placeholder.com/150'} alt={actor.name} />
                      </div>
                      
                      <div className="character-info">
                        <div className="character-name">
                          {actor.name}
                        </div>
                        
                        {actor.role && (
                          <div className="character-role">
                            {actor.role}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {drama.similar && drama.similar.length > 0 && (
              <div className="recommendations-section">
                <h2>Dramas similaires</h2>
                
                <div className="recommendations-grid">
                  {drama.similar.slice(0, 6).map((similar, index) => (
                    <div 
                      key={index} 
                      className="recommendation-card"
                      onClick={() => navigate(`/drama/${similar.id}`)}
                    >
                      <div className="recommendation-image">
                        <img src={similar.poster_path || similar.thumbnail} alt={similar.title} />
                      </div>
                      
                      <div className="recommendation-info">
                        <div className="recommendation-title">
                          {similar.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DramaDetails;
