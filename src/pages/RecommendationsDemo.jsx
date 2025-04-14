/**
 * Page de démonstration du système de recommandations FloDrama
 * Présente les différents types de recommandations avec l'interface utilisateur
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';
import { RECOMMENDATION_TYPES, CONTENT_TYPES } from '../services/recommendations/constants';

// Utilisateur de démonstration
const DEMO_USER_ID = 'demo-user-123';

const RecommendationsDemo = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  
  // Animation pour les éléments de la page
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  // Filtrer le contenu en fonction de l'onglet actif
  const getContentTypeForTab = () => {
    switch (activeTab) {
      case 'dramas':
        return CONTENT_TYPES.DRAMA;
      case 'movies':
        return CONTENT_TYPES.MOVIE;
      case 'anime':
        return CONTENT_TYPES.ANIME;
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121118] to-[#1A1926] text-white">
      {/* En-tête */}
      <header className="pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#d946ef]">
            Recommandations IA FloDrama
          </h1>
          <p className="mt-2 text-gray-300">
            Découvrez des contenus personnalisés grâce à notre moteur de recommandation intelligent
          </p>
        </div>
      </header>
      
      {/* Navigation par onglets */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'all', name: 'Tous les contenus' },
              { id: 'dramas', name: 'Dramas' },
              { id: 'movies', name: 'Films' },
              { id: 'anime', name: 'Anime' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-[#d946ef] text-[#d946ef]'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Section des recommandations personnalisées */}
          <motion.section variants={itemVariants}>
            <RecommendationCarousel
              title="Recommandations personnalisées"
              userId={DEMO_USER_ID}
              type={RECOMMENDATION_TYPES.PERSONALIZED}
              contentType={getContentTypeForTab()}
              limit={10}
              showSource={showDetails}
            />
          </motion.section>
          
          {/* Section des recommandations contextuelles */}
          <motion.section variants={itemVariants}>
            <RecommendationCarousel
              title="Pour votre soirée"
              userId={DEMO_USER_ID}
              type={RECOMMENDATION_TYPES.CONTEXTUAL}
              contentType={getContentTypeForTab()}
              limit={10}
              showSource={showDetails}
            />
          </motion.section>
          
          {/* Section des tendances */}
          <motion.section variants={itemVariants}>
            <RecommendationCarousel
              title="Tendances du moment"
              userId={DEMO_USER_ID}
              type={RECOMMENDATION_TYPES.TRENDING}
              contentType={getContentTypeForTab()}
              limit={10}
              showSource={showDetails}
            />
          </motion.section>
          
          {/* Section des recommandations similaires */}
          <motion.section variants={itemVariants}>
            <RecommendationCarousel
              title="Si vous avez aimé 'Crash Landing on You'"
              userId={DEMO_USER_ID}
              type={RECOMMENDATION_TYPES.SIMILAR}
              contentId="drama-12345" // ID fictif pour la démo
              contentType={getContentTypeForTab()}
              limit={10}
              showSource={showDetails}
            />
          </motion.section>
        </motion.div>
        
        {/* Panneau de contrôle */}
        <div className="mt-12 bg-gray-800 bg-opacity-30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Options de démonstration</h2>
            
            <div className="flex items-center">
              <label htmlFor="show-details" className="mr-2 text-sm text-gray-300">
                Afficher les sources
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="show-details"
                  checked={showDetails}
                  onChange={() => setShowDetails(!showDetails)}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full ${showDetails ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef]' : 'bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${showDetails ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-300">
            <p>Cette page démontre les capacités du système de recommandation IA de FloDrama.</p>
            <p className="mt-1">Les recommandations sont générées en temps réel en fonction du contexte utilisateur, de l'historique de visionnage et des préférences.</p>
          </div>
        </div>
      </main>
      
      {/* Pied de page */}
      <footer className="bg-[#121118] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-6">
            <p className="text-center text-sm text-gray-400">
              Système de recommandation IA FloDrama — Propulsé par des algorithmes d'apprentissage avancés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RecommendationsDemo;
