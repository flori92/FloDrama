import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ContentDetails.css';

/**
 * Composant pour afficher les détails d'un film Bollywood
 * et permettre de lancer la lecture avec le lecteur vidéo amélioré
 */
const BollywoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory, setWatchHistory] = useState({});
  
  // API de base
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.flodrama.com/api';
  
  // Récupération des informations du film
  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les détails du film
        const movieResponse = await fetch(`${apiBaseUrl}/bollywood/${id}`);
        
        if (!movieResponse.ok) {
          throw new Error(`Erreur ${movieResponse.status}: ${movieResponse.statusText}`);
        }
        
        const movieData = await movieResponse.json();
        setMovie(movieData);
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du film:', error);
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
    
    fetchMovieDetails();
    loadWatchHistory();
  }, [id, apiBaseUrl]);
  
  // Lancer la lecture du film
  const watchMovie = () => {
    navigate(`/watch/bollywood/${id}/1`); // Utiliser 1 comme numéro d'épisode par défaut pour les films
  };
  
  // Obtenir la progression du film
  const getMovieProgress = () => {
    return watchHistory[id]?.episodes?.[1]?.progress || 0;
  };
  
  // Vérifier si le film a été terminé
  const isMovieCompleted = () => {
    return watchHistory[id]?.episodes?.[1]?.completed || false;
  };
  
  // Continuer la lecture
  const continueWatching = () => {
    watchMovie();
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
  
  // Affichage des détails du film
  return (
    <div className="content-details-container">
      {movie && (
        <>
          <div className="content-header" style={{ backgroundImage: `url(${movie.backdrop_path || movie.cover_image})` }}>
            <div className="content-header-overlay">
              <div className="content-poster">
                <img src={movie.poster_path || movie.thumbnail} alt={movie.title} />
              </div>
              
              <div className="content-info">
                <h1>{movie.title}</h1>
                
                {movie.alternative_titles && (
                  <div className="alternative-titles">
                    {movie.alternative_titles.join(' • ')}
                  </div>
                )}
                
                <div className="content-metadata">
                  {movie.release_date && (
                    <span className="release-year">
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  )}
                  
                  {movie.rating && (
                    <span className="rating">
                      <i className="fas fa-star"></i> {movie.rating}/10
                    </span>
                  )}
                  
                  {movie.duration && (
                    <span className="duration">
                      {movie.duration} min
                    </span>
                  )}
                  
                  {movie.language && (
                    <span className="language">
                      {movie.language}
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
                
                {movie.genres && movie.genres.length > 0 && (
                  <div className="genres">
                    {movie.genres.map((genre, index) => (
                      <span key={index} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="synopsis">
                  <p>{movie.overview || movie.description || movie.synopsis}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="content-body">
            {/* Informations supplémentaires sur le film */}
            <div className="movie-details-section">
              <h2>Informations</h2>
              
              <div className="movie-details-grid">
                {movie.director && (
                  <div className="detail-item">
                    <span className="detail-label">Réalisateur:</span>
                    <span className="detail-value">{movie.director}</span>
                  </div>
                )}
                
                {movie.writers && movie.writers.length > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Scénaristes:</span>
                    <span className="detail-value">{movie.writers.join(', ')}</span>
                  </div>
                )}
                
                {movie.production && (
                  <div className="detail-item">
                    <span className="detail-label">Production:</span>
                    <span className="detail-value">{movie.production}</span>
                  </div>
                )}
                
                {movie.box_office && (
                  <div className="detail-item">
                    <span className="detail-label">Box Office:</span>
                    <span className="detail-value">{movie.box_office}</span>
                  </div>
                )}
                
                {movie.awards && (
                  <div className="detail-item">
                    <span className="detail-label">Récompenses:</span>
                    <span className="detail-value">{movie.awards}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Casting du film */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="characters-section">
                <h2>Distribution</h2>
                
                <div className="characters-grid">
                  {movie.cast.slice(0, 12).map((actor, index) => (
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
            
            {/* Films similaires */}
            {movie.similar && movie.similar.length > 0 && (
              <div className="recommendations-section">
                <h2>Films similaires</h2>
                
                <div className="recommendations-grid">
                  {movie.similar.slice(0, 6).map((similar, index) => (
                    <div 
                      key={index} 
                      className="recommendation-card"
                      onClick={() => navigate(`/bollywood/${similar.id}`)}
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
            
            {/* Musique du film */}
            {movie.soundtrack && movie.soundtrack.length > 0 && (
              <div className="soundtrack-section">
                <h2>Bande originale</h2>
                
                <div className="soundtrack-list">
                  {movie.soundtrack.map((track, index) => (
                    <div key={index} className="soundtrack-item">
                      <div className="track-number">{index + 1}</div>
                      <div className="track-info">
                        <div className="track-title">{track.title}</div>
                        {track.artists && (
                          <div className="track-artists">{track.artists.join(', ')}</div>
                        )}
                      </div>
                      <div className="track-duration">{track.duration}</div>
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

export default BollywoodDetails;
