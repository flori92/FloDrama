/**
 * Page d'administration du système de recommandations FloDrama
 * Interface de gestion et de visualisation des performances du moteur d'IA
 */

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  AdjustmentsHorizontalIcon, 
  ChartBarIcon, 
  UserIcon, 
  CogIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import RecommendationStats from '../components/recommendations/RecommendationStats';

// Composants internes
import AlgorithmSettings from './admin/AlgorithmSettings';
import UserInsights from './admin/UserInsights';
import SystemLogs from './admin/SystemLogs';

const RecommendationAdmin = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    lastUpdate: new Date().toISOString(),
    cacheSize: 128,
    activeUsers: 1245,
    recommendationsServed: 58432,
    averageResponseTime: 124 // ms
  });
  
  // Simuler le chargement des données du système
  useEffect(() => {
    const loadSystemStatus = async () => {
      setIsLoading(true);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Dans une implémentation réelle, nous chargerions les données depuis l'API
      setSystemStatus({
        status: 'online',
        lastUpdate: new Date().toISOString(),
        cacheSize: 128,
        activeUsers: 1245,
        recommendationsServed: 58432,
        averageResponseTime: 124 // ms
      });
      
      setIsLoading(false);
    };
    
    loadSystemStatus();
  }, []);
  
  // Rafraîchir les données du système
  const refreshSystemStatus = async () => {
    setIsLoading(true);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mettre à jour avec de nouvelles données fictives
    setSystemStatus({
      ...systemStatus,
      lastUpdate: new Date().toISOString(),
      activeUsers: Math.floor(1000 + Math.random() * 500),
      recommendationsServed: systemStatus.recommendationsServed + Math.floor(Math.random() * 100),
      averageResponseTime: Math.floor(100 + Math.random() * 50)
    });
    
    setIsLoading(false);
  };
  
  // Vider le cache du système
  const clearSystemCache = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir vider le cache du système de recommandations ? Cette action peut temporairement affecter les performances.')) {
      return;
    }
    
    setIsLoading(true);
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mettre à jour l'état
    setSystemStatus({
      ...systemStatus,
      lastUpdate: new Date().toISOString(),
      cacheSize: 0
    });
    
    setIsLoading(false);
    
    // Afficher une notification
    alert('Le cache du système a été vidé avec succès.');
  };
  
  // Redémarrer le système de recommandations
  const restartSystem = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir redémarrer le système de recommandations ? Cette action interrompra temporairement le service.')) {
      return;
    }
    
    setIsLoading(true);
    setSystemStatus({
      ...systemStatus,
      status: 'restarting'
    });
    
    // Simuler un redémarrage
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mettre à jour l'état
    setSystemStatus({
      ...systemStatus,
      status: 'online',
      lastUpdate: new Date().toISOString(),
      cacheSize: 0,
      averageResponseTime: Math.floor(80 + Math.random() * 30)
    });
    
    setIsLoading(false);
    
    // Afficher une notification
    alert('Le système de recommandations a été redémarré avec succès.');
  };
  
  // Obtenir la classe de couleur pour le statut du système
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'offline':
        return 'text-red-500';
      case 'restarting':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Obtenir le libellé pour le statut du système
  const getStatusLabel = (status) => {
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'degraded':
        return 'Performances dégradées';
      case 'offline':
        return 'Hors ligne';
      case 'restarting':
        return 'Redémarrage en cours';
      default:
        return 'Statut inconnu';
    }
  };
  
  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121118] to-[#1A1926] text-white">
      {/* En-tête */}
      <header className="pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#d946ef]">
            Administration du système de recommandations
          </h1>
          <p className="mt-2 text-gray-300">
            Gérez et surveillez les performances du moteur d'IA de recommandations FloDrama
          </p>
        </div>
      </header>
      
      {/* Panneau d'état du système */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className={`flex items-center ${getStatusColor(systemStatus.status)}`}>
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                </span>
                <span className="font-medium">{getStatusLabel(systemStatus.status)}</span>
              </div>
              
              <span className="mx-3 text-gray-500">|</span>
              
              <div className="text-sm text-gray-400">
                Dernière mise à jour: {formatDate(systemStatus.lastUpdate)}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={refreshSystemStatus}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <ArrowPathIcon className={`-ml-1 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button
                onClick={clearSystemCache}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                Vider le cache
              </button>
              
              <button
                onClick={restartSystem}
                disabled={isLoading || systemStatus.status === 'restarting'}
                className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-colors"
              >
                <ExclamationTriangleIcon className="-ml-1 mr-2 h-4 w-4" />
                Redémarrer
              </button>
            </div>
          </div>
          
          {/* Métriques du système */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-700">
            <div className="p-4 text-center">
              <div className="text-sm text-gray-400">Taille du cache</div>
              <div className="mt-1 text-2xl font-semibold">{systemStatus.cacheSize} Mo</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-sm text-gray-400">Utilisateurs actifs</div>
              <div className="mt-1 text-2xl font-semibold">{systemStatus.activeUsers.toLocaleString()}</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-sm text-gray-400">Recommandations servies</div>
              <div className="mt-1 text-2xl font-semibold">{systemStatus.recommendationsServed.toLocaleString()}</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-sm text-gray-400">Temps de réponse moyen</div>
              <div className="mt-1 text-2xl font-semibold">{systemStatus.averageResponseTime} ms</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Onglets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 bg-opacity-50 p-1">
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${
                  selected
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.12]'
                }
                `
              }
            >
              <div className="flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Statistiques
              </div>
            </Tab>
            
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${
                  selected
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.12]'
                }
                `
              }
            >
              <div className="flex items-center justify-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Algorithme
              </div>
            </Tab>
            
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${
                  selected
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.12]'
                }
                `
              }
            >
              <div className="flex items-center justify-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Utilisateurs
              </div>
            </Tab>
            
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${
                  selected
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.12]'
                }
                `
              }
            >
              <div className="flex items-center justify-center">
                <CogIcon className="h-5 w-5 mr-2" />
                Système
              </div>
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="mt-6">
            {/* Panneau de statistiques */}
            <Tab.Panel>
              <RecommendationStats />
            </Tab.Panel>
            
            {/* Panneau de paramètres d'algorithme */}
            <Tab.Panel>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Paramètres de l'algorithme</h2>
                <p className="text-gray-300 mb-6">
                  Cette section vous permet de configurer et d'ajuster les paramètres du moteur de recommandations.
                  Les modifications apportées ici affecteront directement la façon dont les recommandations sont générées.
                </p>
                
                {/* Placeholder pour le composant de paramètres d'algorithme */}
                <div className="text-gray-400 text-center py-12">
                  Composant AlgorithmSettings à implémenter
                </div>
              </div>
            </Tab.Panel>
            
            {/* Panneau d'insights utilisateurs */}
            <Tab.Panel>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Insights utilisateurs</h2>
                <p className="text-gray-300 mb-6">
                  Analysez le comportement des utilisateurs et leurs interactions avec le système de recommandations.
                  Ces données vous aideront à comprendre l'efficacité des recommandations et à identifier les opportunités d'amélioration.
                </p>
                
                {/* Placeholder pour le composant d'insights utilisateurs */}
                <div className="text-gray-400 text-center py-12">
                  Composant UserInsights à implémenter
                </div>
              </div>
            </Tab.Panel>
            
            {/* Panneau de logs système */}
            <Tab.Panel>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Logs système</h2>
                <p className="text-gray-300 mb-6">
                  Consultez les logs du système de recommandations pour surveiller son fonctionnement et diagnostiquer d'éventuels problèmes.
                  Les logs sont classés par niveau de gravité et horodatés pour faciliter l'analyse.
                </p>
                
                {/* Placeholder pour le composant de logs système */}
                <div className="text-gray-400 text-center py-12">
                  Composant SystemLogs à implémenter
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      
      {/* Pied de page */}
      <footer className="bg-[#121118] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-6">
            <p className="text-center text-sm text-gray-400">
              Panneau d'administration du système de recommandation IA FloDrama — Version 1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RecommendationAdmin;
