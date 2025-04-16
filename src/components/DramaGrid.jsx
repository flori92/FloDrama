import React, { useState, useEffect } from 'react';
import { getCatalog } from '../services/metadataService';
import { useOptimizedImage } from '../utils/assetManager';
import DramaCard from './DramaCard';
import LoadingSpinner from './LoadingSpinner';

const DramaGrid = ({ category, filters = {} }) => {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDramas = async () => {
      try {
        setLoading(true);
        
        // Récupérer les métadonnées depuis le service
        const data = await getCatalog({
          category,
          ...filters
        });
        
        setDramas(data.items || []);
        setError(null);
      } catch (err) {
        console.error('Erreur de chargement des dramas:', err);
        setError('Impossible de charger les dramas. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDramas();
  }, [category, JSON.stringify(filters)]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (dramas.length === 0) return <div className="empty-message">Aucun drama trouvé</div>;

  return (
    <div className="card-grid">
      {dramas.map(drama => (
        <DramaCard key={drama.id} drama={drama} />
      ))}
    </div>
  );
};

// Exemple de composant de carte optimisé
const DramaCard = ({ drama }) => {
  // Utiliser notre hook optimisé pour les images
  const { src, loading, error } = useOptimizedImage(drama.posterPath, 'poster');
  
  return (
    <div className="card">
      <div className="card-image-container">
        {loading && <div className="lazy-image-placeholder"></div>}
        <img 
          className={`card-image ${!loading ? 'loaded' : ''}`}
          src={src || 'images/placeholder.jpg'}
          alt={drama.title}
          data-id={drama.id}
        />
        {error && <div className="image-error-overlay">!</div>}
      </div>
      
      <div className="card-overlay"></div>
      <div className="card-content">
        <div className="card-title">{drama.title}</div>
        <div className="card-info">
          <span className="card-year">{drama.year}</span>
          <span className="card-country">{drama.country}</span>
        </div>
        {drama.genres && (
          <div className="card-genres">
            {drama.genres.join(' • ')}
          </div>
        )}
      </div>
      
      {drama.isNew && <div className="card-badge">Nouveau</div>}
      <div className="card-play-button">
        <div className="play-icon"></div>
      </div>
    </div>
  );
};

export default DramaGrid; 