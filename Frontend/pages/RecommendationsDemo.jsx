/**
 * Page de démonstration du système de recommandations pour FloDrama
 * 
 * Cette page permet de visualiser et tester les différents types de recommandations
 * disponibles dans l'application, ainsi que d'afficher les statistiques du système.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';
import RecommendationDetail from '../components/recommendations/RecommendationDetail';
import RecommendationStats from '../components/recommendations/RecommendationStats';
import useRecommendations from '../hooks/useRecommendations';
import './RecommendationsDemo.css';

/**
 * Page de démonstration des recommandations
 * @returns {JSX.Element} - Composant de page
 */
const RecommendationsDemo = () => {
  // Récupérer les paramètres d'URL
  const { type = 'all' } = useParams();
  const navigate = useNavigate();
  
  // États
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [contextData, setContextData] = useState(null);
  
  // Récupérer les données de contexte
  const { contextData: fetchedContextData } = useRecommendations({
    type: 'contextual',
    limit: 1
  });
  
  // Mettre à jour les données de contexte
  useEffect(() => {
    if (fetchedContextData) {
      setContextData(fetchedContextData);
    }
  }, [fetchedContextData]);
  
  // Gérer le changement de type
  const handleTypeChange = (newType) => {
    navigate(`/recommendations/${newType}`);
  };
  
  // Gérer la sélection d'un élément
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden';
  };
  
  // Gérer la fermeture du détail
  const handleDetailClose = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'auto';
  };
  
  // Gérer le changement de plage de temps
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Titre de la page
  const getPageTitle = () => {
    switch (type) {
      case 'trending':
        return 'Tendances';
      case 'personalized':
        return 'Recommandations personnalisées';
      case 'contextual':
        return 'Recommandations contextuelles';
      case 'similar':
        return 'Contenus similaires';
      case 'continue_watching':
        return 'Continuer à regarder';
      case 'stats':
        return 'Statistiques des recommandations';
      default:
        return 'Toutes les recommandations';
    }
  };
  
  // Rendu du composant
  return (
    <div className="recommendations-demo-container">
      <div className="recommendations-demo-header">
        <h1 className="recommendations-demo-title">{getPageTitle()}</h1>
        
        <div className="recommendations-demo-tabs">
          <button 
            className={`recommendations-demo-tab ${type === 'all' ? 'active' : ''}`}
            onClick={() => handleTypeChange('all')}
          >
            Toutes
          </button>
          <button 
            className={`recommendations-demo-tab ${type === 'trending' ? 'active' : ''}`}
            onClick={() => handleTypeChange('trending')}
          >
            Tendances
          </button>
          <button 
            className={`recommendations-demo-tab ${type === 'personalized' ? 'active' : ''}`}
            onClick={() => handleTypeChange('personalized')}
          >
            Personnalisées
          </button>
          <button 
            className={`recommendations-demo-tab ${type === 'contextual' ? 'active' : ''}`}
            onClick={() => handleTypeChange('contextual')}
          >
            Contextuelles
          </button>
          <button 
            className={`recommendations-demo-tab ${type === 'continue_watching' ? 'active' : ''}`}
            onClick={() => handleTypeChange('continue_watching')}
          >
            Continuer
          </button>
          <button 
            className={`recommendations-demo-tab ${type === 'stats' ? 'active' : ''}`}
            onClick={() => handleTypeChange('stats')}
          >
            Statistiques
          </button>
        </div>
      </div>
      
      {contextData && type === 'contextual' && (
        <div className="recommendations-demo-context">
          <h2 className="recommendations-demo-context-title">Contexte actuel</h2>
          <div className="recommendations-demo-context-info">
            <div className="recommendations-demo-context-item">
              <span className="recommendations-demo-context-label">Moment de la journée:</span>
              <span className="recommendations-demo-context-value">
                {contextData.timeOfDay === 'morning' && 'Matin'}
                {contextData.timeOfDay === 'afternoon' && 'Après-midi'}
                {contextData.timeOfDay === 'evening' && 'Soirée'}
                {contextData.timeOfDay === 'night' && 'Nuit'}
              </span>
            </div>
            
            <div className="recommendations-demo-context-item">
              <span className="recommendations-demo-context-label">Saison:</span>
              <span className="recommendations-demo-context-value">
                {contextData.season === 'spring' && 'Printemps'}
                {contextData.season === 'summer' && 'Été'}
                {contextData.season === 'autumn' && 'Automne'}
                {contextData.season === 'winter' && 'Hiver'}
              </span>
            </div>
            
            <div className="recommendations-demo-context-item">
              <span className="recommendations-demo-context-label">Appareil:</span>
              <span className="recommendations-demo-context-value">
                {contextData.device === 'mobile' && 'Mobile'}
                {contextData.device === 'tablet' && 'Tablette'}
                {contextData.device === 'desktop' && 'Ordinateur'}
              </span>
            </div>
            
            <div className="recommendations-demo-context-item">
              <span className="recommendations-demo-context-label">Heure:</span>
              <span className="recommendations-demo-context-value">
                {contextData.hour}:00
              </span>
            </div>
          </div>
        </div>
      )}
      
      {type === 'stats' ? (
        <div className="recommendations-demo-stats-section">
          <div className="recommendations-demo-stats-controls">
            <div className="recommendations-demo-stats-time-selector">
              <label htmlFor="timeRange">Période:</label>
              <select 
                id="timeRange" 
                value={timeRange} 
                onChange={handleTimeRangeChange}
              >
                <option value="day">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
          
          <RecommendationStats 
            timeRange={timeRange} 
            showDetails={true} 
          />
        </div>
      ) : type === 'all' ? (
        <div className="recommendations-demo-all-section">
          <RecommendationCarousel 
            title="Tendances" 
            type="trending" 
            limit={6} 
            showReasons={true} 
          />
          
          <RecommendationCarousel 
            title="Recommandations personnalisées" 
            type="personalized" 
            limit={6} 
            showReasons={true} 
          />
          
          <RecommendationCarousel 
            title="Recommandations contextuelles" 
            type="contextual" 
            limit={6} 
            showReasons={true} 
          />
          
          <RecommendationCarousel 
            title="Continuer à regarder" 
            type="continue_watching" 
            limit={6} 
            showReasons={true} 
          />
        </div>
      ) : (
        <div className="recommendations-demo-type-section">
          <RecommendationCarousel 
            title={getPageTitle()} 
            type={type} 
            limit={12} 
            showReasons={true} 
            autoScroll={false} 
          />
        </div>
      )}
      
      {selectedItem && (
        <div className="recommendations-demo-detail-overlay">
          <div className="recommendations-demo-detail-container">
            <RecommendationDetail 
              item={selectedItem} 
              type={type} 
              contextData={contextData}
              onClose={handleDetailClose} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsDemo;
