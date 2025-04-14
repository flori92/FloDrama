/**
 * Composant de logs système pour le système de recommandations FloDrama
 * Affiche les logs du système pour le monitoring et le diagnostic
 */

import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Données fictives pour la démo
const DEMO_LOGS = [
  {
    id: 'log-1',
    timestamp: '2023-05-22T15:42:23',
    level: 'info',
    source: 'RecommendationService',
    message: 'Système de recommandations initialisé avec succès'
  },
  {
    id: 'log-2',
    timestamp: '2023-05-22T15:42:24',
    level: 'info',
    source: 'ContentSimilarityEngine',
    message: 'Moteur de similarité de contenu initialisé'
  },
  {
    id: 'log-3',
    timestamp: '2023-05-22T15:42:25',
    level: 'info',
    source: 'ContextualRecommender',
    message: 'Recommandeur contextuel initialisé'
  },
  {
    id: 'log-4',
    timestamp: '2023-05-22T15:43:12',
    level: 'warning',
    source: 'RecommendationAlgorithm',
    message: 'Temps de calcul des recommandations supérieur au seuil (245ms)'
  },
  {
    id: 'log-5',
    timestamp: '2023-05-22T15:45:36',
    level: 'error',
    source: 'ContentSimilarityEngine',
    message: 'Erreur lors du calcul de similarité pour le contenu ID: drama-5678'
  },
  {
    id: 'log-6',
    timestamp: '2023-05-22T15:46:02',
    level: 'info',
    source: 'RecommendationService',
    message: 'Recommandations générées pour l\'utilisateur user-123 (10 items)'
  },
  {
    id: 'log-7',
    timestamp: '2023-05-22T15:47:15',
    level: 'debug',
    source: 'UserBehaviorAnalyzer',
    message: 'Analyse du comportement utilisateur terminée pour user-123'
  },
  {
    id: 'log-8',
    timestamp: '2023-05-22T15:48:30',
    level: 'info',
    source: 'RecommendationIntegrator',
    message: 'Cache de recommandations mis à jour (taille: 128 Mo)'
  },
  {
    id: 'log-9',
    timestamp: '2023-05-22T15:50:12',
    level: 'warning',
    source: 'ContextualRecommender',
    message: 'Données contextuelles incomplètes pour l\'utilisateur user-456'
  },
  {
    id: 'log-10',
    timestamp: '2023-05-22T15:52:45',
    level: 'error',
    source: 'RecommendationService',
    message: 'Timeout lors de la génération de recommandations pour l\'utilisateur user-789'
  },
  {
    id: 'log-11',
    timestamp: '2023-05-22T15:54:18',
    level: 'info',
    source: 'ContentSimilarityEngine',
    message: 'Recalcul des similarités pour 50 nouveaux contenus'
  },
  {
    id: 'log-12',
    timestamp: '2023-05-22T15:55:42',
    level: 'debug',
    source: 'RecommendationAlgorithm',
    message: 'Diversification appliquée aux recommandations (facteur: 0.8)'
  },
  {
    id: 'log-13',
    timestamp: '2023-05-22T15:57:03',
    level: 'info',
    source: 'RecommendationService',
    message: 'Performances du système: 1245 recommandations générées en 5 minutes'
  },
  {
    id: 'log-14',
    timestamp: '2023-05-22T15:58:27',
    level: 'warning',
    source: 'UserBehaviorAnalyzer',
    message: 'Données comportementales insuffisantes pour l\'utilisateur user-321'
  },
  {
    id: 'log-15',
    timestamp: '2023-05-22T16:00:00',
    level: 'info',
    source: 'RecommendationIntegrator',
    message: 'Nettoyage périodique du cache terminé'
  }
];

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: 'all',
    source: 'all',
    search: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Charger les logs
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dans une implémentation réelle, nous chargerions les données depuis l'API
      setLogs(DEMO_LOGS);
      setIsLoading(false);
    };
    
    loadLogs();
    
    // Nettoyage
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  // Configurer l'actualisation automatique
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(async () => {
        // Simuler l'ajout de nouveaux logs
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: ['info', 'debug', 'warning', 'error'][Math.floor(Math.random() * 4)],
          source: ['RecommendationService', 'ContentSimilarityEngine', 'ContextualRecommender', 'RecommendationAlgorithm', 'UserBehaviorAnalyzer'][Math.floor(Math.random() * 5)],
          message: 'Nouvelle activité du système de recommandations'
        };
        
        setLogs(prevLogs => [newLog, ...prevLogs]);
      }, 5000);
      
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);
  
  // Filtrer les logs
  useEffect(() => {
    let result = [...logs];
    
    // Filtrer par niveau
    if (filters.level !== 'all') {
      result = result.filter(log => log.level === filters.level);
    }
    
    // Filtrer par source
    if (filters.source !== 'all') {
      result = result.filter(log => log.source === filters.source);
    }
    
    // Filtrer par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredLogs(result);
  }, [logs, filters]);
  
  // Rafraîchir les logs
  const refreshLogs = async () => {
    setIsLoading(true);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dans une implémentation réelle, nous chargerions les données depuis l'API
    setLogs(DEMO_LOGS);
    setIsLoading(false);
  };
  
  // Effacer les filtres
  const clearFilters = () => {
    setFilters({
      level: 'all',
      source: 'all',
      search: ''
    });
  };
  
  // Formater une date avec l'heure
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Obtenir la couleur pour un niveau de log
  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Obtenir l'icône pour un niveau de log
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'debug':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Obtenir la liste des sources uniques
  const getUniqueSources = () => {
    const sources = new Set(logs.map(log => log.source));
    return ['all', ...sources];
  };
  
  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden">
      {/* En-tête */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-[#d946ef] mr-2" />
            <h2 className="text-xl font-bold text-white">Logs système</h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <ArrowPathIcon className={`-ml-1 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            
            <div className="relative inline-block">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="sr-only"
              />
              <label
                htmlFor="auto-refresh"
                className="flex items-center cursor-pointer"
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef]' : 'bg-gray-600'}`}>
                  <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${autoRefresh ? 'transform translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-2 text-sm text-gray-300">Auto</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="p-4 sm:px-6 sm:py-4 bg-gray-900 bg-opacity-50 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Filtre par niveau */}
            <div>
              <label htmlFor="level-filter" className="block text-xs font-medium text-gray-400 mb-1">
                Niveau
              </label>
              <select
                id="level-filter"
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="block w-full px-3 py-1.5 text-sm rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="error">Erreur</option>
                <option value="warning">Avertissement</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            {/* Filtre par source */}
            <div>
              <label htmlFor="source-filter" className="block text-xs font-medium text-gray-400 mb-1">
                Source
              </label>
              <select
                id="source-filter"
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="block w-full px-3 py-1.5 text-sm rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
              >
                {getUniqueSources().map((source, index) => (
                  <option key={index} value={source}>
                    {source === 'all' ? 'Toutes' : source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Recherche */}
            <div className="relative flex-grow">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Rechercher dans les logs..."
                className="block w-full px-3 py-1.5 text-sm rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
              />
            </div>
            
            {/* Bouton de réinitialisation des filtres */}
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <FunnelIcon className="-ml-1 mr-1 h-4 w-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d946ef]"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-4 sm:p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-center">
              Aucun log ne correspond aux critères de filtrage
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900 bg-opacity-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Heure
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Niveau
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 bg-opacity-50 divide-y divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700 hover:bg-opacity-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getLevelIcon(log.level)}
                      <span className={`ml-2 text-sm font-medium ${getLevelColor(log.level)}`}>
                        {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {log.source}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pied de page */}
      <div className="bg-gray-900 bg-opacity-50 px-4 py-3 sm:px-6 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            Affichage de {filteredLogs.length} logs sur {logs.length} au total
          </div>
          
          <div>
            <button className="text-[#3b82f6] hover:text-[#d946ef] transition-colors">
              Exporter les logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
