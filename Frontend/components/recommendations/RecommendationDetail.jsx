/**
 * Composant d'affichage détaillé d'une recommandation pour FloDrama
 * 
 * Ce composant affiche les détails d'une recommandation avec une explication
 * sur les raisons pour lesquelles ce contenu est recommandé à l'utilisateur.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userDataService from '../../services/UserDataService';
import './RecommendationDetail.css';

/**
 * Composant de détail d'une recommandation
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Élément recommandé
 * @param {string} props.type - Type de recommandation
 * @param {Object} props.contextData - Données contextuelles
 * @param {Function} props.onClose - Fonction appelée à la fermeture
 * @returns {JSX.Element} - Composant de détail
 */
const RecommendationDetail = ({
  item,
  type = 'personalized',
  contextData = null,
  onClose
}) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchProgress, setWatchProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Vérifier si l'élément est dans la liste personnelle
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!item || !item.id) return;
      
      try {
        const isInList = await userDataService.isInWatchlist(item.id);
        setInWatchlist(isInList);
      } catch (error) {
        console.error('Erreur lors de la vérification de la liste personnelle:', error);
      }
    };
    
    const getProgress = async () => {
      if (!item || !item.id) return;
      
      try {
        const progress = await userDataService.getWatchProgress(item.id, item.episodeId);
        setWatchProgress(progress);
      } catch (error) {
        console.error('Erreur lors de la récupération de la progression:', error);
      }
    };
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([checkWatchlist(), getProgress()]);
      setLoading(false);
    };
    
    loadData();
  }, [item]);
  
  // Gérer l'ajout/suppression de la liste personnelle
  const handleWatchlistToggle = async () => {
    if (!item || !item.id) return;
    
    try {
      if (inWatchlist) {
        await userDataService.removeFromWatchlist(item.id);
        setInWatchlist(false);
      } else {
        await userDataService.addToWatchlist(item);
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la liste personnelle:', error);
    }
  };
  
  // Générer l'explication de la recommandation
  const generateExplanation = () => {
    if (!item) return null;
    
    let explanation = '';
    
    // Explication basée sur le type de recommandation
    switch (type) {
      case 'trending':
        explanation = `<strong>${item.title}</strong> est actuellement populaire sur FloDrama. `;
        if (item.trendingScore) {
          explanation += `Ce contenu a un score de popularité de ${item.trendingScore}%, `;
          explanation += `ce qui en fait l'un des contenus les plus regardés du moment.`;
        }
        break;
        
      case 'personalized':
        explanation = `<strong>${item.title}</strong> correspond à vos préférences de visionnage. `;
        if (item.personalScore) {
          explanation += `Notre algorithme lui a attribué un score de compatibilité de ${item.personalScore}% avec vos goûts. `;
        }
        if (item.reason) {
          explanation += item.reason;
        } else {
          explanation += `Cette recommandation est basée sur votre historique de visionnage et vos interactions précédentes.`;
        }
        break;
        
      case 'contextual':
        explanation = `<strong>${item.title}</strong> est recommandé en fonction du contexte actuel. `;
        
        if (contextData) {
          if (contextData.timeOfDay) {
            const timeMapping = {
              morning: 'le matin',
              afternoon: 'l\'après-midi',
              evening: 'la soirée',
              night: 'la nuit'
            };
            
            explanation += `Nous avons remarqué que ${timeMapping[contextData.timeOfDay]} est un moment idéal `;
            explanation += `pour ce type de contenu. `;
          }
          
          if (contextData.season) {
            const seasonMapping = {
              spring: 'au printemps',
              summer: 'en été',
              autumn: 'en automne',
              winter: 'en hiver'
            };
            
            explanation += `De plus, ce contenu est particulièrement apprécié ${seasonMapping[contextData.season]}. `;
          }
          
          if (contextData.device) {
            const deviceMapping = {
              mobile: 'sur mobile',
              tablet: 'sur tablette',
              desktop: 'sur ordinateur'
            };
            
            explanation += `Le format est également optimisé pour un visionnage ${deviceMapping[contextData.device]}.`;
          }
        }
        
        if (item.contextScore) {
          explanation += ` Score de pertinence contextuelle : ${item.contextScore}%.`;
        }
        break;
        
      case 'similar':
        explanation = `<strong>${item.title}</strong> est similaire à d'autres contenus que vous avez regardés. `;
        
        if (item.similarityScore) {
          explanation += `Score de similarité : ${item.similarityScore}%. `;
        }
        
        if (item.reason) {
          explanation += item.reason;
        } else {
          explanation += `Cette recommandation est basée sur des caractéristiques communes comme le genre, les acteurs ou le thème.`;
        }
        break;
        
      case 'continue_watching':
        explanation = `Vous avez commencé à regarder <strong>${item.title}</strong>. `;
        
        if (watchProgress) {
          explanation += `Vous avez déjà visionné ${watchProgress.percent}% de ce contenu. `;
          
          const lastWatchedDate = new Date(watchProgress.timestamp);
          explanation += `Dernière session de visionnage : ${lastWatchedDate.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}.`;
        }
        break;
        
      default:
        explanation = `<strong>${item.title}</strong> est recommandé pour vous en fonction de plusieurs facteurs, `;
        explanation += `notamment vos préférences et les tendances actuelles.`;
    }
    
    return explanation;
  };
  
  // Si aucun élément n'est fourni, ne rien afficher
  if (!item) return null;
  
  // Rendu du composant
  return (
    <div className="recommendation-detail">
      <div className="recommendation-detail-header">
        <h2 className="recommendation-detail-title">{item.title}</h2>
        <button 
          className="recommendation-detail-close-button"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="recommendation-detail-content">
        <div className="recommendation-detail-image-container">
          <img 
            src={item.image} 
            alt={item.title} 
            className="recommendation-detail-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/media/fallback-poster.svg';
            }}
          />
          
          {watchProgress && (
            <div className="recommendation-detail-progress-container">
              <div 
                className="recommendation-detail-progress-bar"
                style={{ width: `${watchProgress.percent}%` }}
              ></div>
              <div className="recommendation-detail-progress-text">
                {watchProgress.percent}% terminé
              </div>
            </div>
          )}
        </div>
        
        <div className="recommendation-detail-info">
          <div className="recommendation-detail-metadata">
            {item.year && <span className="recommendation-detail-year">{item.year}</span>}
            {item.type && (
              <span className={`recommendation-detail-type recommendation-detail-type-${item.type}`}>
                {item.type === 'drama' ? 'Drama' : item.type === 'anime' ? 'Anime' : 'Film'}
              </span>
            )}
            {item.rating && <span className="recommendation-detail-rating">★ {item.rating}</span>}
            
            {(item.trendingScore || item.personalScore || item.contextScore || item.similarityScore) && (
              <span className="recommendation-detail-score">
                Score: {item.trendingScore || item.personalScore || item.contextScore || item.similarityScore}%
              </span>
            )}
          </div>
          
          <div className="recommendation-detail-explanation">
            <h3>Pourquoi cette recommandation ?</h3>
            <p dangerouslySetInnerHTML={{ __html: generateExplanation() }}></p>
          </div>
          
          <div className="recommendation-detail-actions">
            <Link 
              to={item.episodeId 
                ? `/player/${item.id}/${item.episodeId}` 
                : `/content/${item.id}`
              }
              className="recommendation-detail-watch-button"
            >
              {watchProgress ? 'Continuer' : 'Regarder'}
            </Link>
            
            <button 
              className={`recommendation-detail-watchlist-button ${inWatchlist ? 'active' : ''}`}
              onClick={handleWatchlistToggle}
              disabled={loading}
            >
              {inWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationDetail;
