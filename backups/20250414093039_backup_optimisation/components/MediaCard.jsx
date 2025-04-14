import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import LazyImage from './LazyImage';
import { Link } from 'react-router-dom';
import localImageFallback from '../utils/localImageFallback';

/**
 * Composant MediaCard optimisé pour FloDrama
 * Affiche une carte de média (film, série, anime) avec lazy loading des images
 * et gestion des erreurs de chargement
 */
const MediaCard = ({ 
  id, 
  title, 
  posterPath, 
  backdropPath, 
  type = 'movie', 
  year, 
  rating, 
  genres = [],
  onClick
}) => {
  // Générer une clé de cache unique pour cette image
  const cacheKey = useMemo(() => {
    return localImageFallback.generateCacheKey(posterPath);
  }, [posterPath]);
  
  // Déterminer l'URL du fallback selon le type de média
  const fallbackImage = useMemo(() => {
    return `/assets/static/placeholders/${type}-placeholder.svg`;
  }, [type]);
  
  // Formater les genres pour l'affichage (max 2)
  const formattedGenres = useMemo(() => {
    return genres.slice(0, 2).join(' • ');
  }, [genres]);
  
  // Construire l'URL de détail
  const detailUrl = useMemo(() => {
    return `/${type}s/${id}`;
  }, [type, id]);
  
  return (
    <div className="media-card" data-testid="media-card">
      <Link to={detailUrl} onClick={onClick} className="media-card-link">
        <div className="media-card-poster">
          <LazyImage
            src={posterPath}
            alt={title}
            fallbackSrc={fallbackImage}
            cacheKey={cacheKey}
            cacheType="images"
            style={{ height: '100%', borderRadius: '8px' }}
          />
          
          {rating > 0 && (
            <div className="media-card-rating">
              <span className="rating-value">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="media-card-content">
          <h3 className="media-card-title">{title}</h3>
          <div className="media-card-info">
            {year && <span className="media-card-year">{year}</span>}
            {formattedGenres && (
              <>
                {year && <span className="separator">•</span>}
                <span className="media-card-genres">{formattedGenres}</span>
              </>
            )}
          </div>
        </div>
      </Link>
      
      <style jsx="true">{`
        .media-card {
          width: 100%;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-radius: 8px;
          overflow: hidden;
          background-color: #1A1926;
        }
        
        .media-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .media-card-link {
          text-decoration: none;
          color: white;
          display: block;
        }
        
        .media-card-poster {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 150%; /* Ratio d'affiche 2:3 */
          overflow: hidden;
          border-radius: 8px;
        }
        
        .media-card-rating {
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          color: white;
          border-radius: 16px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          z-index: 2;
        }
        
        .media-card-content {
          padding: 12px;
        }
        
        .media-card-title {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .media-card-info {
          display: flex;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .separator {
          margin: 0 5px;
        }
        
        .media-card-genres {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};

MediaCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  posterPath: PropTypes.string,
  backdropPath: PropTypes.string,
  type: PropTypes.oneOf(['movie', 'drama', 'anime']),
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rating: PropTypes.number,
  genres: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func
};

export default MediaCard;
