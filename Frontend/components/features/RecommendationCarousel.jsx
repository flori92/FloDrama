import React from 'react';
import { useRecommendations } from '../../hooks/useRecommendations';
import '../../styles/RecommendationCarousel.css';

const RecommendationCarousel = ({ section = 'home', userId }) => {
  const { recommendations, loading, error } = useRecommendations({ section, userId });

  if (loading) return <div className="carousel-loading">Chargement des recommandations...</div>;
  if (error) return <div className="carousel-error">Erreur de chargement des recommandations.</div>;
  if (!recommendations || recommendations.length === 0) return <div className="carousel-empty">Aucune recommandation pour l'instant.</div>;

  return (
    <div className="recommendation-carousel">
      {recommendations.map((item) => (
        <div className="carousel-card" key={item.id}>
          <img src={item.posterUrl} alt={item.title} className="carousel-poster" />
          <div className="carousel-info">
            <h3 className="carousel-title">{item.title}</h3>
            <p className="carousel-meta">{item.genres?.join(', ')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendationCarousel;
