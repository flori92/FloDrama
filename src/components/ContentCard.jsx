import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import { generateContentCardStyle } from '../utils/visualStyleAnalysis';

/**
 * Composant ContentCard pour afficher les cartes de contenu dans FloDrama
 * Utilise le composant LazyImage pour le chargement optimisé des images
 * Applique le style visuel conforme à l'identité de FloDrama
 */
const ContentCard = ({
  id,
  title,
  posterPath,
  year,
  genres = [],
  origin,
  rating,
  to,
  className,
  style
}) => {
  // Générer le style de base pour les cartes de contenu
  const baseStyles = generateContentCardStyle();
  
  // Préparer les genres pour l'affichage (limiter à 2 maximum)
  const displayGenres = genres.slice(0, 2).join(', ');
  
  // Construire le chemin de l'image
  const imagePath = posterPath || `/assets/images/placeholders/poster-placeholder.jpg`;
  
  return (
    <Link 
      to={to || `/content/${id}`} 
      className={`content-card ${className || ''}`}
      style={{
        ...baseStyles.card,
        ...style,
        textDecoration: 'none',
        display: 'block'
      }}
    >
      <div className="content-card-image" style={{ aspectRatio: '2/3', width: '100%' }}>
        <LazyImage
          src={imagePath}
          alt={title}
          fallbackSrc="/assets/images/placeholders/poster-placeholder.jpg"
          cacheKey={`poster-${id}`}
        />
        
        {/* Badge de notation si disponible */}
        {rating && (
          <div className="content-card-rating" style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: rating >= 7 ? '#34d399' : rating >= 5 ? '#f59e0b' : '#ef4444',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 2
          }}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Informations du contenu */}
      <div className="content-card-info" style={{ padding: '8px 0' }}>
        <h3 style={baseStyles.title}>{title}</h3>
        <div style={baseStyles.metadata}>
          {year && <span>{year}</span>}
          {year && displayGenres && <span> • </span>}
          {displayGenres && <span>{displayGenres}</span>}
        </div>
      </div>
    </Link>
  );
};

ContentCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  posterPath: PropTypes.string,
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  genres: PropTypes.arrayOf(PropTypes.string),
  origin: PropTypes.string,
  rating: PropTypes.number,
  to: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

export default ContentCard;
