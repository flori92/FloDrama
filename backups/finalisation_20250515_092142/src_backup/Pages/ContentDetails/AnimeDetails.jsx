import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ContentDetails.css';
import { API_BASE_URL } from '../../Cloudflare/CloudflareConfig';
import { getFullUrl } from '../../Constants/FloDramaURLs';

/**
 * Composant pour afficher les détails d'un anime
 * et permettre de lancer la lecture avec le lecteur vidéo amélioré
 */
const AnimeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory, setWatchHistory] = useState({});
  
  // API de base - Utilisation de l'API Cloudflare
  const apiBaseUrl = API_BASE_URL;
  
  // Récupération des informations de l'anime
  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les détails de l'anime
        const animeResponse = await fetch(`${apiBaseUrl}/api/anime/${id}`);
        
        if (!animeResponse.ok) {
          throw new Error(`Erreur ${animeResponse.status}: ${animeResponse.statusText}`);
        }
        
        const animeData = await animeResponse.json();
        // Vérifier si les données sont dans un format attendu
        const animeContent = animeData.data || animeData;
        setAnime(animeContent);
        
        // Récupérer les épisodes
        const episodesResponse = await fetch(`${apiBaseUrl}/api/anime/${id}/episodes`);
        
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          // Vérifier si les données sont dans un format attendu
          const episodesContent = episodesData.data || episodesData || [];
          setEpisodes(Array.isArray(episodesContent) ? episodesContent : []);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'anime:', error);
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
    
    fetchAnimeDetails();
    loadWatchHistory();
  }, [id, apiBaseUrl]);
  
  // Lancer la lecture d'un épisode
  const watchEpisode = (episodeNumber) => {
    navigate(`/watch/anime/${id}/${episodeNumber}`);
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
  
  // Affichage des détails de l'anime
  return (
    <div className="content-details-container">
      {anime && (
        <>
          <div className="content-header" style={{ backgroundImage: `url(${anime.backdrop_path || anime.cover_image})` }}>
            <div className="content-header-overlay">
              <div className="content-poster">
                <img src={anime.poster_path || anime.thumbnail} alt={anime.title} />
              </div>
              
              <div className="content-info">
                <h1>{anime.title}</h1>
                
                {anime.alternative_titles && (
                  <div className="alternative-titles">
                    {anime.alternative_titles.join(' • ')}
                  </div>
                )}
                
                <div className="content-metadata">
                  {anime.release_date && (
                    <span className="release-year">
                      {new Date(anime.release_date).getFullYear()}
                    </span>
                  )}
                  
                  {anime.rating && (
                    <span className="rating">
                      <i className="fas fa-star"></i> {anime.rating}/10
                    </span>
                  )}
                  
                  {anime.episodes_count && (
                    <span className="episodes-count">
                      {anime.episodes_count} épisodes
                    </span>
                  )}
                  
                  {anime.status && (
                    <span className="status">
                      {anime.status}
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
                
                {anime.genres && anime.genres.length > 0 && (
                  <div className="genres">
                    {anime.genres.map((genre, index) => (
                      <span key={index} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="synopsis">
                  <p>{anime.overview || anime.synopsis}</p>
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
                          src={episode.thumbnail || anime.thumbnail} 
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
            
            {anime.characters && anime.characters.length > 0 && (
              <div className="characters-section">
                <h2>Personnages</h2>
                
                <div className="characters-grid">
                  {anime.characters.slice(0, 8).map((character, index) => (
                    <div key={index} className="character-card">
                      <div className="character-image">
                        <img src={character.image} alt={character.name} />
                      </div>
                      
                      <div className="character-info">
                        <div className="character-name">
                          {character.name}
                        </div>
                        
                        {character.role && (
                          <div className="character-role">
                            {character.role}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {anime.recommendations && anime.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h2>Recommandations</h2>
                
                <div className="recommendations-grid">
                  {anime.recommendations.slice(0, 6).map((recommendation, index) => (
                    <div 
                      key={index} 
                      className="recommendation-card"
                      onClick={() => navigate(`/anime/${recommendation.id}`)}
                    >
                      <div className="recommendation-image">
                        <img src={recommendation.poster_path || recommendation.thumbnail} alt={recommendation.title} />
                      </div>
                      
                      <div className="recommendation-info">
                        <div className="recommendation-title">
                          {recommendation.title}
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

export default AnimeDetails;
