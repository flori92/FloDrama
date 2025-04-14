/**
 * Composant de statistiques pour le système de recommandations FloDrama
 * Affiche des métriques et des visualisations sur les performances du système
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Données fictives pour la démo
const DEMO_STATS = {
  userEngagement: {
    clickThroughRate: 0.28,
    watchCompletionRate: 0.72,
    averageWatchTime: 42, // minutes
    trend: 0.05 // augmentation de 5%
  },
  algorithmPerformance: {
    precisionScore: 0.85,
    recallScore: 0.79,
    f1Score: 0.82,
    trend: 0.03 // augmentation de 3%
  },
  recommendationSources: {
    personalized: 45,
    similar: 25,
    trending: 20,
    contextual: 10
  },
  contentDistribution: {
    dramas: 40,
    movies: 35,
    anime: 25
  },
  contextualFactors: {
    timeOfDay: 35,
    deviceType: 25,
    userPreferences: 30,
    trending: 10
  }
};

const RecommendationStats = () => {
  const [stats, setStats] = useState(DEMO_STATS);
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simuler le chargement des statistiques
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dans une implémentation réelle, nous chargerions les données depuis l'API
      setStats(DEMO_STATS);
      setIsLoading(false);
    };
    
    loadStats();
  }, [timeRange]);
  
  // Formater un pourcentage
  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Obtenir la classe de couleur pour une tendance
  const getTrendClass = (trend) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-400';
  };
  
  // Obtenir l'icône de tendance
  const getTrendIcon = (trend) => {
    if (trend > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    }
    if (trend < 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };
  
  // Rendu d'une barre de progression
  const ProgressBar = ({ value, maxValue, color }) => {
    const percentage = (value / maxValue) * 100;
    
    return (
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  // Rendu d'une carte de statistique
  const StatCard = ({ title, value, icon, trend, suffix = '', color = 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef]' }) => {
    return (
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${color.includes('gradient') ? color : `bg-opacity-20 ${color}`}`}>
              {icon}
            </div>
            <h3 className="ml-3 text-sm font-medium text-gray-300">{title}</h3>
          </div>
          
          {trend !== undefined && (
            <div className={`flex items-center ${getTrendClass(trend)}`}>
              {getTrendIcon(trend)}
              <span className="ml-1 text-xs">{formatPercent(Math.abs(trend))}</span>
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold text-white">
          {value}{suffix}
        </div>
      </div>
    );
  };
  
  // Rendu d'un graphique à barres horizontal
  const HorizontalBarChart = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    return (
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
        
        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 capitalize">{key}</span>
                <span className="text-white">{formatPercent(value / total)}</span>
              </div>
              <ProgressBar 
                value={value} 
                maxValue={total} 
                color={colors[index % colors.length]} 
              />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Couleurs pour les graphiques
  const chartColors = [
    'bg-blue-500',
    'bg-fuchsia-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500'
  ];
  
  return (
    <div className="bg-[#1A1926] rounded-lg shadow-xl overflow-hidden">
      {/* En-tête */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white mb-2 sm:mb-0">
            Statistiques du système de recommandation
          </h2>
          
          {/* Sélecteur de période */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            {['jour', 'semaine', 'mois'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d946ef]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cartes de statistiques principales */}
            <StatCard
              title="Taux de clics"
              value={formatPercent(stats.userEngagement.clickThroughRate)}
              icon={<EyeIcon className="h-5 w-5 text-blue-500" />}
              trend={stats.userEngagement.trend}
              color="bg-blue-500"
            />
            
            <StatCard
              title="Taux de complétion"
              value={formatPercent(stats.userEngagement.watchCompletionRate)}
              icon={<ArrowTrendingUpIcon className="h-5 w-5 text-fuchsia-500" />}
              trend={stats.userEngagement.trend}
              color="bg-fuchsia-500"
            />
            
            <StatCard
              title="Temps moyen de visionnage"
              value={stats.userEngagement.averageWatchTime}
              suffix=" min"
              icon={<ClockIcon className="h-5 w-5 text-green-500" />}
              trend={stats.userEngagement.trend}
              color="bg-green-500"
            />
            
            <StatCard
              title="Précision de l'algorithme"
              value={formatPercent(stats.algorithmPerformance.precisionScore)}
              icon={<ChartBarIcon className="h-5 w-5 text-yellow-500" />}
              trend={stats.algorithmPerformance.trend}
              color="bg-yellow-500"
            />
            
            {/* Graphiques à barres */}
            <HorizontalBarChart
              title="Sources des recommandations"
              data={stats.recommendationSources}
              colors={chartColors}
            />
            
            <HorizontalBarChart
              title="Distribution des contenus"
              data={stats.contentDistribution}
              colors={chartColors}
            />
            
            <div className="md:col-span-2 lg:col-span-3">
              <HorizontalBarChart
                title="Facteurs contextuels"
                data={stats.contextualFactors}
                colors={chartColors}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Pied de page */}
      <div className="bg-gray-900 bg-opacity-50 px-4 py-3 sm:px-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <button className="text-sm text-[#3b82f6] hover:text-[#d946ef] transition-colors">
            Exporter les données
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationStats;
