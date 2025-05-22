import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ContentBanner.css';

/**
 * Composant de bannière pour les pages de détails de contenu
 * Affiche une image de fond, les informations principales et les boutons d'action
 */
const ContentBanner = ({
  type,
  id,
  title,
  backdrop,
  poster,
  overview,
  genres = [],
  rating,
  releaseDate,
  episodeCount,
  episodeNumber = 1,
  country,
  network,
  onPlayClick
}) => {
  const navigate = useNavigate();
  
  // Formater la date de sortie
  const formatReleaseDate = (date) => {
    if (!date) return '';
    
    try {
      return new Date(date).getFullYear();
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };
  
  // Gérer le clic sur le bouton de lecture
  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      // Navigation par défaut vers la page de lecture
      if (type === 'bollywood') {
        navigate(`/watch/${type}/${id}/1`);
      } else {
        navigate(`/watch/${type}/${id}/${episodeNumber}`);
      }
    }
  };
  
  // Gérer le clic sur le bouton "Ma liste"
  const handleAddToList = () => {
    // Logique pour ajouter à la liste de l'utilisateur
    console.log(`Ajout de ${title} à la liste`);
    // Ici, vous pourriez appeler une API ou mettre à jour un état global
  };
  
  return (
    <div className="content-banner" style={{ backgroundImage: `url(${backdrop})` }}>
      <div className="content-banner-overlay">
        <div className="content-banner-container">
          <div className="content-banner-poster">
            <img src={poster} alt={title} />
          </div>
          
          <div className="content-banner-info">
            <h1 className="content-banner-title">{title}</h1>
            
            <div className="content-banner-metadata">
              {rating && (
                <span className="content-banner-rating">
                  <i className="fas fa-star"></i> {rating}
                </span>
              )}
              
              {releaseDate && (
                <span className="content-banner-year">
                  {formatReleaseDate(releaseDate)}
                </span>
              )}
              
              {episodeCount > 0 && (
                <span className="content-banner-episodes">
                  {episodeCount} épisodes
                </span>
              )}
              
              {country && (
                <span className="content-banner-country">
                  {country}
                </span>
              )}
              
              {network && (
                <span className="content-banner-network">
                  {network}
                </span>
              )}
            </div>
            
            <div className="content-banner-actions">
              <button 
                className="content-banner-play-button"
                onClick={handlePlayClick}
              >
                <i className="fas fa-play"></i> Regarder
              </button>
              
              <button 
                className="content-banner-list-button"
                onClick={handleAddToList}
              >
                <i className="fas fa-plus"></i> Ma liste
              </button>
            </div>
            
            {genres.length > 0 && (
              <div className="content-banner-genres">
                {genres.map((genre, index) => (
                  <span key={index} className="content-banner-genre">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            {overview && (
              <div className="content-banner-overview">
                <p>{overview}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBanner;
