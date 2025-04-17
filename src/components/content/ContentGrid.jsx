import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import imageManager from '../../utils/imageManager';
import '../../styles/components/ContentGrid.css';

/**
 * Grille de contenu réutilisable pour afficher les films, dramas, animes, etc.
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.contents - Liste des contenus à afficher
 * @param {boolean} props.showRemoveButton - Afficher le bouton de suppression (pour Ma Liste)
 * @param {Function} props.onRemove - Fonction de suppression
 */
const ContentGrid = ({ contents, showRemoveButton = false, onRemove }) => {
  // Précharger les images au montage du composant
  useEffect(() => {
    // Précharger les images des contenus visibles
    if (contents && contents.length > 0 && window.FloDramaImages) {
      // Utiliser le système d'images global si disponible
      window.FloDramaImages.preloadPriorityImages();
    } else if (contents && contents.length > 0 && imageManager) {
      // Sinon, utiliser directement le gestionnaire d'images
      contents.forEach(content => {
        if (content.id) {
          try {
            imageManager.preloadImage(content.id, 'poster');
          } catch (error) {
            console.warn(`Erreur lors du préchargement de l'image pour ${content.id}:`, error);
          }
        }
      });
    }
  }, [contents]);

  // Gérer le clic sur le bouton de suppression
  const handleRemoveClick = (e, contentId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onRemove) {
      onRemove(contentId);
    }
  };

  // Gérer les erreurs d'image
  const handleImageError = (e) => {
    // Utiliser le système d'images global si disponible
    if (window.FloDramaImages && window.FloDramaImages.handleImageError) {
      window.FloDramaImages.handleImageError(e);
    } else if (imageManager && imageManager.handleImageError) {
      // Sinon, utiliser directement le gestionnaire d'images
      imageManager.handleImageError(e);
    }
  };

  // Obtenir l'URL optimisée pour une image
  const getOptimizedImageUrl = (content) => {
    if (!content) return '';
    
    // Utiliser l'URL d'image existante si disponible
    const imageUrl = content.image || content.poster;
    
    // Si un ID de contenu est disponible, essayer d'obtenir une URL optimisée
    if (content.id && imageManager && imageManager.getImageUrl) {
      try {
        return imageManager.getImageUrl(content.id, 'poster') || imageUrl;
      } catch (error) {
        console.warn(`Erreur lors de la récupération de l'URL optimisée pour ${content.id}:`, error);
        return imageUrl;
      }
    }
    
    return imageUrl;
  };

  return (
    <div className="content-grid">
      {contents.map((content) => (
        <div key={content.id} className="content-card">
          <Link to={`/contenu/${content.id}`} className="content-link">
            <div className="content-image-container">
              <img
                src={getOptimizedImageUrl(content)}
                alt={content.title}
                className="content-image"
                data-content-id={content.id}
                data-type="poster"
                loading="lazy"
                onError={handleImageError}
              />
              
              {content.rating && (
                <div className="content-rating">
                  <span className="rating-value">
                    {typeof content.rating === 'number' ? content.rating.toFixed(1) : content.rating}
                  </span>
                </div>
              )}
              
              {showRemoveButton && (
                <button
                  className="remove-button"
                  onClick={(e) => handleRemoveClick(e, content.id)}
                  title="Retirer de ma liste"
                >
                  <span className="remove-icon">×</span>
                </button>
              )}
            </div>
            
            <div className="content-info">
              <h3 className="content-title">{content.title}</h3>
              
              <div className="content-meta">
                {content.year && <span className="content-year">{content.year}</span>}
                
                {content.type && (
                  <span className="content-type">
                    {content.type === 'drama' ? 'Drama' : 
                     content.type === 'anime' ? 'Anime' : 
                     content.type === 'movie' ? 'Film' : 
                     content.type}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ContentGrid;
