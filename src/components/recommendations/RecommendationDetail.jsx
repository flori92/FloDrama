/**
 * Composant de détail pour une recommandation FloDrama
 * Affiche des informations détaillées sur une recommandation avec explication
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ClockIcon, DevicePhoneMobileIcon, CalendarIcon } from '@heroicons/react/24/outline';

const RecommendationDetail = ({ recommendation, onClose }) => {
  if (!recommendation) return null;
  
  // Extraire les informations de la recommandation
  const {
    title,
    posterUrl,
    backdropUrl,
    description,
    genres = [],
    releaseYear,
    duration,
    rating,
    source,
    contextSource,
    similarityScore,
    contextScore,
    finalScore
  } = recommendation;
  
  // Déterminer la source principale de la recommandation
  const getSourceIcon = () => {
    switch (source) {
      case 'similar':
        return (
          <div className="flex items-center text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span>Contenu similaire</span>
          </div>
        );
      case 'trending':
        return (
          <div className="flex items-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span>Tendance</span>
          </div>
        );
      case 'contextual':
        return (
          <div className="flex items-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Contextuel</span>
          </div>
        );
      case 'genre':
        return (
          <div className="flex items-center text-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Basé sur vos genres préférés</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-fuchsia-500">
            <SparklesIcon className="w-5 h-5 mr-1" />
            <span>Personnalisé</span>
          </div>
        );
    }
  };
  
  // Obtenir l'explication contextuelle
  const getContextualExplanation = () => {
    if (!contextSource) return null;
    
    switch (contextSource) {
      case 'time':
        return (
          <div className="flex items-center mt-2">
            <ClockIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-300">
              Recommandé pour ce moment de la journée
            </span>
          </div>
        );
      case 'device':
        return (
          <div className="flex items-center mt-2">
            <DevicePhoneMobileIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-300">
              Optimisé pour votre appareil actuel
            </span>
          </div>
        );
      case 'season':
        return (
          <div className="flex items-center mt-2">
            <CalendarIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-300">
              Parfait pour cette saison
            </span>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Calculer la largeur de la barre de score
  const getScoreWidth = (score) => {
    if (!score && score !== 0) return '0%';
    return `${Math.min(Math.max(score * 100, 0), 100)}%`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative bg-[#1A1926] rounded-lg overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image d'arrière-plan avec dégradé */}
        {backdropUrl && (
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${backdropUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1926] via-[#1A1926]/90 to-[#1A1926]/70"></div>
            </div>
          </div>
        )}
        
        {/* Bouton de fermeture */}
        <button
          className="absolute top-4 right-4 z-10 p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Contenu principal */}
        <div className="relative z-10 p-6 flex flex-col md:flex-row gap-6">
          {/* Affiche du contenu */}
          <div className="flex-shrink-0 w-full md:w-1/3">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
              {posterUrl ? (
                <img 
                  src={posterUrl} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400">Image non disponible</span>
                </div>
              )}
              
              {/* Badge de notation */}
              {rating && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white px-2 py-1 rounded-md text-sm font-bold">
                  {rating}/10
                </div>
              )}
            </div>
          </div>
          
          {/* Informations détaillées */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            
            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-300">
              {releaseYear && <span>{releaseYear}</span>}
              {duration && <span>{duration} min</span>}
              {releaseYear && duration && <span className="w-1 h-1 rounded-full bg-gray-500"></span>}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-800 rounded-md text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Description */}
            {description && (
              <p className="text-gray-300 mb-6">{description}</p>
            )}
            
            {/* Source de la recommandation */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Pourquoi cette recommandation ?</h3>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                {getSourceIcon()}
                {getContextualExplanation()}
                
                {/* Scores détaillés */}
                {(similarityScore || contextScore || finalScore) && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-medium text-gray-400">Facteurs de recommandation</h4>
                    
                    {similarityScore !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Similarité</span>
                          <span className="text-blue-400">{Math.round(similarityScore * 100)}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: getScoreWidth(similarityScore) }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {contextScore !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Contexte</span>
                          <span className="text-green-400">{Math.round(contextScore * 100)}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: getScoreWidth(contextScore) }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {finalScore !== undefined && (
                      <div className="space-y-1 pt-1 mt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Score global</span>
                          <span className="text-fuchsia-400">{Math.round(finalScore * 100)}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#d946ef] rounded-full" 
                            style={{ width: getScoreWidth(finalScore) }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bouton d'action */}
            <div className="flex space-x-3">
              <button className="flex-1 py-2 px-4 bg-gradient-to-r from-[#3b82f6] to-[#d946ef] rounded-md text-white font-medium hover:opacity-90 transition-opacity">
                Regarder maintenant
              </button>
              <button className="py-2 px-4 border border-gray-600 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors">
                Ajouter à ma liste
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecommendationDetail;
