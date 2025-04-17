import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant de sélection de saison
 * Inspiré du design de CinePulse
 */
const SeasonSelector = ({ seasons, currentSeason, onSeasonChange }) => {
  // Animation pour les boutons de saison
  const buttonVariants = {
    initial: { 
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    hover: { 
      scale: 1.05,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transition: { duration: 0.2 }
    },
    active: {
      scale: 1,
      backgroundColor: 'var(--color-accent)',
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3 text-text-secondary">Saisons disponibles</h3>
      
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: seasons }, (_, i) => i + 1).map((season) => (
          <motion.button
            key={season}
            onClick={() => onSeasonChange(season)}
            className={`px-4 py-2 rounded-full text-sm font-medium focus:outline-none
              ${currentSeason === season ? 'text-white' : 'text-text-secondary'}`}
            variants={buttonVariants}
            initial="initial"
            whileHover={currentSeason === season ? "active" : "hover"}
            animate={currentSeason === season ? "active" : "initial"}
          >
            Saison {season}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

SeasonSelector.propTypes = {
  seasons: PropTypes.number.isRequired,
  currentSeason: PropTypes.number.isRequired,
  onSeasonChange: PropTypes.func.isRequired
};

export default SeasonSelector;
