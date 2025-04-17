/**
 * Composant d'affichage des statistiques du système de recommandations pour FloDrama
 * 
 * Ce composant visualise les statistiques du système de recommandations,
 * notamment les taux de clics, les taux de complétion et la satisfaction utilisateur.
 */

import React, { useState, useEffect } from 'react';
import './RecommendationStats.css';

/**
 * Composant de statistiques des recommandations
 * @param {Object} props - Propriétés du composant
 * @param {string} props.timeRange - Plage de temps (day, week, month, year)
 * @param {boolean} props.showDetails - Afficher les détails
 * @returns {JSX.Element} - Composant de statistiques
 */
const RecommendationStats = ({
  timeRange = 'week',
  showDetails = true
}) => {
  // États
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  
  // Charger les statistiques
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dans une vraie application, ces données viendraient d'une API
        // Pour l'exemple, on utilise des données statiques
        
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Générer des données de statistiques fictives
        const mockStats = generateMockStats(timeRange);
        
        setStats(mockStats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [timeRange]);
  
  /**
   * Génère des données de statistiques fictives
   * @param {string} range - Plage de temps
   * @returns {Object} - Statistiques fictives
   */
  const generateMockStats = (range) => {
    // Facteur de variation selon la plage de temps
    const variationFactor = {
      day: 1,
      week: 0.9,
      month: 0.8,
      year: 0.7
    }[range] || 1;
    
    // Fonction pour générer un nombre aléatoire dans une plage
    const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Générer des données pour chaque type de recommandation
    const generateTypeData = (baseCtr, baseCompletionRate, baseSatisfaction) => {
      const ctr = (baseCtr * variationFactor * (0.9 + Math.random() * 0.2)).toFixed(1);
      const completionRate = (baseCompletionRate * variationFactor * (0.9 + Math.random() * 0.2)).toFixed(1);
      const satisfaction = (baseSatisfaction * variationFactor * (0.95 + Math.random() * 0.1)).toFixed(1);
      
      return {
        impressions: randomInRange(1000, 5000) * (range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365),
        clicks: Math.floor((ctr / 100) * randomInRange(1000, 5000) * (range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365)),
        ctr: parseFloat(ctr),
        completionRate: parseFloat(completionRate),
        satisfaction: parseFloat(satisfaction),
        avgWatchTime: randomInRange(15, 45) * (range === 'day' ? 1 : range === 'week' ? 1.1 : range === 'month' ? 1.2 : 1.3)
      };
    };
    
    // Données pour chaque type de recommandation
    const typesData = {
      trending: generateTypeData(12.5, 65, 8.2),
      personalized: generateTypeData(18.7, 78, 8.8),
      contextual: generateTypeData(15.2, 72, 8.5),
      similar: generateTypeData(20.1, 82, 9.0),
      continue_watching: generateTypeData(35.4, 92, 9.5)
    };
    
    // Calculer les totaux
    const totalImpressions = Object.values(typesData).reduce((sum, data) => sum + data.impressions, 0);
    const totalClicks = Object.values(typesData).reduce((sum, data) => sum + data.clicks, 0);
    const avgCtr = (totalClicks / totalImpressions * 100).toFixed(1);
    const avgCompletionRate = (Object.values(typesData).reduce((sum, data) => sum + data.completionRate, 0) / 5).toFixed(1);
    const avgSatisfaction = (Object.values(typesData).reduce((sum, data) => sum + data.satisfaction, 0) / 5).toFixed(1);
    const avgWatchTime = Math.floor(Object.values(typesData).reduce((sum, data) => sum + data.avgWatchTime, 0) / 5);
    
    // Données historiques pour les graphiques
    const generateHistoricalData = (baseValue, variance, count) => {
      const data = [];
      let currentValue = baseValue;
      
      for (let i = 0; i < count; i++) {
        // Ajouter une variation aléatoire
        currentValue = Math.max(0, currentValue * (1 + (Math.random() * variance * 2 - variance)));
        data.push(parseFloat(currentValue.toFixed(1)));
      }
      
      return data;
    };
    
    // Générer des données historiques
    const historicalData = {
      ctr: generateHistoricalData(parseFloat(avgCtr), 0.1, 7),
      completionRate: generateHistoricalData(parseFloat(avgCompletionRate), 0.05, 7),
      satisfaction: generateHistoricalData(parseFloat(avgSatisfaction), 0.03, 7)
    };
    
    return {
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: parseFloat(avgCtr),
        completionRate: parseFloat(avgCompletionRate),
        satisfaction: parseFloat(avgSatisfaction),
        avgWatchTime
      },
      byType: typesData,
      historical: historicalData
    };
  };
  
  /**
   * Formate un nombre avec des séparateurs de milliers
   * @param {number} num - Nombre à formater
   * @returns {string} - Nombre formaté
   */
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  
  /**
   * Retourne les données pour le type sélectionné
   * @returns {Object} - Données statistiques
   */
  const getSelectedData = () => {
    if (!stats) return null;
    
    if (selectedType === 'all') {
      return stats.summary;
    }
    
    return stats.byType[selectedType];
  };
  
  /**
   * Génère un graphique simple en barres
   * @param {Array} data - Données du graphique
   * @param {string} color - Couleur du graphique
   * @returns {JSX.Element} - Graphique
   */
  const renderSimpleChart = (data, color) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data);
    
    return (
      <div className="recommendation-stats-chart">
        {data.map((value, index) => (
          <div 
            key={index} 
            className="recommendation-stats-chart-bar"
            style={{ 
              height: `${(value / max) * 100}%`,
              backgroundColor: color
            }}
            title={`${value}`}
          />
        ))}
      </div>
    );
  };
  
  // Données sélectionnées
  const selectedData = getSelectedData();
  
  // Rendu du composant
  return (
    <div className="recommendation-stats-container">
      <div className="recommendation-stats-header">
        <h2 className="recommendation-stats-title">Statistiques des recommandations</h2>
        
        <div className="recommendation-stats-filters">
          <div className="recommendation-stats-time-filter">
            <label htmlFor="timeRange">Période :</label>
            <select 
              id="timeRange" 
              value={timeRange} 
              onChange={(e) => window.location.search = `?timeRange=${e.target.value}`}
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
          
          <div className="recommendation-stats-type-filter">
            <label htmlFor="recommendationType">Type :</label>
            <select 
              id="recommendationType" 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="trending">Tendances</option>
              <option value="personalized">Personnalisées</option>
              <option value="contextual">Contextuelles</option>
              <option value="similar">Similaires</option>
              <option value="continue_watching">Continuer à regarder</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="recommendation-stats-loading">
          <div className="recommendation-stats-loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div className="recommendation-stats-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      ) : stats && selectedData ? (
        <div className="recommendation-stats-content">
          <div className="recommendation-stats-summary">
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Impressions</h3>
                <div className="recommendation-stats-card-value">{formatNumber(selectedData.impressions)}</div>
              </div>
            </div>
            
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Clics</h3>
                <div className="recommendation-stats-card-value">{formatNumber(selectedData.clicks)}</div>
              </div>
            </div>
            
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 5 3-3m-3 3L5 19"></path>
                  <path d="m13 13 6 6"></path>
                  <path d="M2 22 9 9"></path>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Taux de clics</h3>
                <div className="recommendation-stats-card-value">{selectedData.ctr}%</div>
                {selectedType === 'all' && (
                  <div className="recommendation-stats-chart-container">
                    {renderSimpleChart(stats.historical.ctr, '#3b82f6')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Taux de complétion</h3>
                <div className="recommendation-stats-card-value">{selectedData.completionRate}%</div>
                {selectedType === 'all' && (
                  <div className="recommendation-stats-chart-container">
                    {renderSimpleChart(stats.historical.completionRate, '#d946ef')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Satisfaction</h3>
                <div className="recommendation-stats-card-value">{selectedData.satisfaction}/10</div>
                {selectedType === 'all' && (
                  <div className="recommendation-stats-chart-container">
                    {renderSimpleChart(stats.historical.satisfaction, '#eab308')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="recommendation-stats-card">
              <div className="recommendation-stats-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="recommendation-stats-card-content">
                <h3>Temps moyen</h3>
                <div className="recommendation-stats-card-value">{selectedData.avgWatchTime} min</div>
              </div>
            </div>
          </div>
          
          {showDetails && selectedType === 'all' && (
            <div className="recommendation-stats-details">
              <h3 className="recommendation-stats-details-title">Performance par type de recommandation</h3>
              
              <table className="recommendation-stats-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Impressions</th>
                    <th>Clics</th>
                    <th>Taux de clics</th>
                    <th>Taux de complétion</th>
                    <th>Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.byType).map(([type, data]) => (
                    <tr key={type}>
                      <td>
                        {type === 'trending' && 'Tendances'}
                        {type === 'personalized' && 'Personnalisées'}
                        {type === 'contextual' && 'Contextuelles'}
                        {type === 'similar' && 'Similaires'}
                        {type === 'continue_watching' && 'Continuer à regarder'}
                      </td>
                      <td>{formatNumber(data.impressions)}</td>
                      <td>{formatNumber(data.clicks)}</td>
                      <td>{data.ctr}%</td>
                      <td>{data.completionRate}%</td>
                      <td>{data.satisfaction}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="recommendation-stats-insights">
            <h3 className="recommendation-stats-insights-title">Insights</h3>
            
            <div className="recommendation-stats-insight-card">
              <h4>Performance globale</h4>
              <p>
                {selectedType === 'all' 
                  ? `Le système de recommandations a généré ${formatNumber(stats.summary.impressions)} impressions et ${formatNumber(stats.summary.clicks)} clics sur la période sélectionnée.`
                  : `Les recommandations de type "${selectedType === 'trending' ? 'Tendances' : selectedType === 'personalized' ? 'Personnalisées' : selectedType === 'contextual' ? 'Contextuelles' : selectedType === 'similar' ? 'Similaires' : 'Continuer à regarder'}" ont généré ${formatNumber(selectedData.impressions)} impressions et ${formatNumber(selectedData.clicks)} clics.`
                }
              </p>
            </div>
            
            <div className="recommendation-stats-insight-card">
              <h4>Points forts</h4>
              <p>
                {selectedType === 'all' 
                  ? `Le type de recommandation le plus performant est "${stats.byType.continue_watching.ctr > stats.byType.personalized.ctr ? 'Continuer à regarder' : 'Personnalisées'}" avec un taux de clics de ${Math.max(stats.byType.continue_watching.ctr, stats.byType.personalized.ctr)}%.`
                  : `Ce type de recommandation a un taux de complétion de ${selectedData.completionRate}%, ${selectedData.completionRate > stats.summary.completionRate ? 'supérieur' : 'inférieur'} à la moyenne de ${stats.summary.completionRate}%.`
                }
              </p>
            </div>
            
            <div className="recommendation-stats-insight-card">
              <h4>Opportunités d'amélioration</h4>
              <p>
                {selectedType === 'all' 
                  ? `Le type de recommandation ayant le taux de clics le plus bas est "${stats.byType.trending.ctr < stats.byType.contextual.ctr ? 'Tendances' : 'Contextuelles'}" avec ${Math.min(stats.byType.trending.ctr, stats.byType.contextual.ctr)}%.`
                  : `La satisfaction pour ce type de recommandation est de ${selectedData.satisfaction}/10, ${selectedData.satisfaction > stats.summary.satisfaction ? 'supérieure' : 'inférieure'} à la moyenne de ${stats.summary.satisfaction}/10.`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="recommendation-stats-empty">
          <p>Aucune donnée disponible pour la période sélectionnée.</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationStats;
