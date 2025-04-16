import React from 'react';
import { motion } from 'framer-motion';
import AppleStyleCard from '../cards/AppleStyleCard';

/**
 * Grille de contenu inspirée du style Apple TV+ pour FloDrama
 * @param {string} title - Titre de la section
 * @param {string} subtitle - Sous-titre optionnel
 * @param {Array} items - Liste des éléments à afficher
 * @param {number} columns - Nombre de colonnes (2, 3 ou 4)
 */
const AppleStyleGrid = ({ title, subtitle = '', items = [], columns = 4 }) => {
  if (!items || items.length === 0) return null;

  // Définir les classes CSS pour le nombre de colonnes
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  // Animation pour le titre
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="mx-auto px-4 md:px-8 py-6">
      {/* Titre et sous-titre */}
      <motion.div 
        className="mb-4"
        initial="hidden"
        animate="visible"
        variants={titleVariants}
      >
        <h2 className="text-xl font-medium text-white">{title}</h2>
        {subtitle && (
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        )}
      </motion.div>

      {/* Grille de cartes */}
      <div className={`grid ${gridClasses[columns]} gap-6`}>
        {items.map((item, index) => (
          <AppleStyleCard 
            key={item.id} 
            item={item} 
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default AppleStyleGrid;
