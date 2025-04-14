/**
 * Composant de paramètres d'algorithme pour le système de recommandations FloDrama
 * Permet de configurer et d'ajuster les paramètres du moteur de recommandations
 */

import React, { useState, useEffect } from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { WEIGHTS, THRESHOLDS, ALGORITHM_PARAMS } from '../../services/recommendations/constants';

const AlgorithmSettings = () => {
  // État pour les paramètres de l'algorithme
  const [weights, setWeights] = useState({ ...WEIGHTS });
  const [thresholds, setThresholds] = useState({ ...THRESHOLDS });
  const [algorithmParams, setAlgorithmParams] = useState({ ...ALGORITHM_PARAMS });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  
  // Gérer les changements dans les poids
  const handleWeightChange = (key, value) => {
    setWeights(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
    setIsSaved(false);
  };
  
  // Gérer les changements dans les seuils
  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
    setIsSaved(false);
  };
  
  // Gérer les changements dans les paramètres de l'algorithme
  const handleParamChange = (key, value) => {
    setAlgorithmParams(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
    setIsSaved(false);
  };
  
  // Sauvegarder les paramètres
  const saveSettings = async () => {
    setIsLoading(true);
    
    // Simuler un délai de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dans une implémentation réelle, nous sauvegarderions les paramètres via l'API
    console.log('Paramètres sauvegardés:', { weights, thresholds, algorithmParams });
    
    setIsLoading(false);
    setIsSaved(true);
    
    // Afficher une notification
    alert('Les paramètres ont été sauvegardés avec succès.');
  };
  
  // Réinitialiser les paramètres
  const resetSettings = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      setWeights({ ...WEIGHTS });
      setThresholds({ ...THRESHOLDS });
      setAlgorithmParams({ ...ALGORITHM_PARAMS });
      setIsSaved(false);
    }
  };
  
  // Rendu d'un contrôle de curseur
  const SliderControl = ({ label, value, onChange, min = 0, max = 1, step = 0.05, info = null }) => {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            {info && (
              <div className="relative ml-2 group">
                <InformationCircleIcon className="h-4 w-4 text-gray-500" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-xs text-gray-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {info}
                </div>
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-white">{value.toFixed(2)}</span>
        </div>
        <div className="flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden">
      {/* En-tête */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-[#d946ef] mr-2" />
            <h2 className="text-xl font-bold text-white">Paramètres de l'algorithme</h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={resetSettings}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Réinitialiser
            </button>
            
            <button
              onClick={saveSettings}
              disabled={isLoading || isSaved}
              className={`inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-md ${
                isSaved
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section des poids */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Poids des facteurs</h3>
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
              <SliderControl
                label="Préférences utilisateur"
                value={weights.USER_PREFERENCES}
                onChange={(value) => handleWeightChange('USER_PREFERENCES', value)}
                info="Influence des préférences explicites de l'utilisateur sur les recommandations"
              />
              
              <SliderControl
                label="Historique de visionnage"
                value={weights.WATCH_HISTORY}
                onChange={(value) => handleWeightChange('WATCH_HISTORY', value)}
                info="Influence de l'historique de visionnage sur les recommandations"
              />
              
              <SliderControl
                label="Facteurs contextuels"
                value={weights.CONTEXTUAL}
                onChange={(value) => handleWeightChange('CONTEXTUAL', value)}
                info="Influence du contexte (heure, appareil, etc.) sur les recommandations"
              />
              
              <SliderControl
                label="Popularité"
                value={weights.POPULARITY}
                onChange={(value) => handleWeightChange('POPULARITY', value)}
                info="Influence de la popularité générale sur les recommandations"
              />
              
              <SliderControl
                label="Nouveauté"
                value={weights.RECENCY}
                onChange={(value) => handleWeightChange('RECENCY', value)}
                info="Influence de la nouveauté du contenu sur les recommandations"
              />
              
              <SliderControl
                label="Diversité"
                value={weights.DIVERSITY}
                onChange={(value) => handleWeightChange('DIVERSITY', value)}
                info="Influence de la diversification sur les recommandations"
              />
            </div>
          </div>
          
          {/* Section des seuils */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Seuils et paramètres</h3>
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
              <SliderControl
                label="Seuil de similarité"
                value={thresholds.SIMILARITY}
                onChange={(value) => handleThresholdChange('SIMILARITY', value)}
                info="Seuil minimum pour considérer deux contenus comme similaires"
              />
              
              <SliderControl
                label="Préférence de genre"
                value={thresholds.GENRE_PREFERENCE}
                min={1}
                max={10}
                step={1}
                onChange={(value) => handleThresholdChange('GENRE_PREFERENCE', value)}
                info="Nombre minimum de visionnages pour considérer un genre comme préféré"
              />
              
              <SliderControl
                label="Pourcentage de visionnage"
                value={thresholds.WATCHED_PERCENTAGE}
                onChange={(value) => handleThresholdChange('WATCHED_PERCENTAGE', value)}
                info="Pourcentage minimum d'un épisode regardé pour le considérer comme vu"
              />
              
              <SliderControl
                label="Facteur de décroissance temporelle"
                value={algorithmParams.TIME_DECAY_FACTOR}
                min={0.5}
                max={1}
                step={0.01}
                onChange={(value) => handleParamChange('TIME_DECAY_FACTOR', value)}
                info="Facteur de décroissance pour les contenus plus anciens (plus proche de 1 = décroissance plus lente)"
              />
              
              <SliderControl
                label="Boost pour nouveaux contenus"
                value={algorithmParams.NEW_CONTENT_BOOST}
                min={1}
                max={2}
                step={0.05}
                onChange={(value) => handleParamChange('NEW_CONTENT_BOOST', value)}
                info="Facteur de boost pour les contenus nouveaux"
              />
              
              <SliderControl
                label="Facteur de diversité"
                value={algorithmParams.DIVERSITY_FACTOR}
                min={0.5}
                max={1}
                step={0.05}
                onChange={(value) => handleParamChange('DIVERSITY_FACTOR', value)}
                info="Facteur de diversité pour éviter les recommandations trop similaires (plus proche de 1 = moins de diversité)"
              />
            </div>
          </div>
        </div>
        
        {/* Section des poids personnalisés */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Poids des recommandations personnalisées</h3>
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <SliderControl
                label="Contenus similaires"
                value={weights.PERSONALIZED?.SIMILAR || 0.4}
                onChange={(value) => setWeights(prev => ({
                  ...prev,
                  PERSONALIZED: {
                    ...prev.PERSONALIZED,
                    SIMILAR: value
                  }
                }))}
                info="Poids des recommandations basées sur la similarité de contenu"
              />
              
              <SliderControl
                label="Contenus tendance"
                value={weights.PERSONALIZED?.TRENDING || 0.2}
                onChange={(value) => setWeights(prev => ({
                  ...prev,
                  PERSONALIZED: {
                    ...prev.PERSONALIZED,
                    TRENDING: value
                  }
                }))}
                info="Poids des recommandations basées sur les tendances"
              />
              
              <SliderControl
                label="Contextuels"
                value={weights.PERSONALIZED?.CONTEXTUAL || 0.25}
                onChange={(value) => setWeights(prev => ({
                  ...prev,
                  PERSONALIZED: {
                    ...prev.PERSONALIZED,
                    CONTEXTUAL: value
                  }
                }))}
                info="Poids des recommandations basées sur le contexte utilisateur"
              />
              
              <SliderControl
                label="Basés sur les genres"
                value={weights.PERSONALIZED?.GENRE || 0.15}
                onChange={(value) => setWeights(prev => ({
                  ...prev,
                  PERSONALIZED: {
                    ...prev.PERSONALIZED,
                    GENRE: value
                  }
                }))}
                info="Poids des recommandations basées sur les genres préférés"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pied de page */}
      <div className="bg-gray-900 bg-opacity-50 px-4 py-3 sm:px-6 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Les modifications apportées aux paramètres de l'algorithme prendront effet immédiatement après la sauvegarde.
          Utilisez ces contrôles avec précaution, car ils peuvent avoir un impact significatif sur la qualité des recommandations.
        </p>
      </div>
    </div>
  );
};

export default AlgorithmSettings;
