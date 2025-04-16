import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant de chargement thématique pour FloDrama
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type d'animation (logo, film, minimal)
 * @param {string} props.text - Texte à afficher pendant le chargement
 * @param {string} props.className - Classes CSS additionnelles
 * @param {boolean} props.fullScreen - Afficher en plein écran
 */
const ThematicLoader = ({ 
  type = 'logo', 
  text = 'Chargement...', 
  className = '',
  fullScreen = false
}) => {
  // Animation pour le logo FloDrama
  const renderLogoLoader = () => {
    // Animation du logo
    const logoVariants = {
      initial: { scale: 0.8, opacity: 0 },
      animate: { 
        scale: 1, 
        opacity: 1,
        transition: { duration: 0.5 }
      }
    };
    
    // Animation du texte qui apparaît lettre par lettre
    const textVariants = {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: { 
          staggerChildren: 0.1,
          delayChildren: 0.3
        }
      }
    };
    
    // Animation pour chaque lettre
    const letterVariants = {
      initial: { y: 20, opacity: 0 },
      animate: { 
        y: 0, 
        opacity: 1,
        transition: { type: 'spring', stiffness: 200 }
      }
    };
    
    // Diviser le texte en lettres pour l'animation
    const letters = text.split('');
    
    return (
      <div className="flex flex-col items-center justify-center">
        <motion.div
          className="mb-6"
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">FD</span>
          </div>
        </motion.div>
        
        <motion.div
          className="flex"
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-xl"
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.div>
      </div>
    );
  };
  
  // Animation style film cinématographique
  const renderFilmLoader = () => {
    // Animation des bandes de film
    const filmStripVariants = {
      animate: {
        y: [0, -100],
        transition: {
          repeat: Infinity,
          duration: 3,
          ease: "linear"
        }
      }
    };
    
    // Animation du cercle de chargement
    const circleVariants = {
      animate: {
        rotate: 360,
        transition: {
          repeat: Infinity,
          duration: 2,
          ease: "linear"
        }
      }
    };
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-4">
          {/* Cercle rotatif */}
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full"
            variants={circleVariants}
            animate="animate"
          />
          
          {/* Bande de film */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-0 right-0 top-0 h-[200px]"
              variants={filmStripVariants}
              animate="animate"
            >
              {Array.from({ length: 10 }).map((_, index) => (
                <div 
                  key={index} 
                  className="h-10 flex justify-between mb-1"
                >
                  <div className="w-3 h-3 bg-gray-700 rounded-sm mx-1"></div>
                  <div className="w-3 h-3 bg-gray-700 rounded-sm mx-1"></div>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Icône centrale */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">FD</span>
            </div>
          </div>
        </div>
        
        <p className="text-lg">{text}</p>
      </div>
    );
  };
  
  // Animation minimaliste avec points
  const renderMinimalLoader = () => {
    // Animation des points
    const dotsContainerVariants = {
      animate: {
        transition: {
          staggerChildren: 0.2
        }
      }
    };
    
    const dotVariants = {
      initial: { y: 0 },
      animate: {
        y: [0, -10, 0],
        transition: {
          repeat: Infinity,
          duration: 0.8
        }
      }
    };
    
    return (
      <div className="flex flex-col items-center justify-center">
        <motion.div
          className="flex space-x-2 mb-4"
          variants={dotsContainerVariants}
          animate="animate"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-blue-500 rounded-full"
              variants={dotVariants}
              initial="initial"
              custom={index}
            />
          ))}
        </motion.div>
        
        <p className="text-lg">{text}</p>
      </div>
    );
  };
  
  // Sélectionner le type de loader à afficher
  const renderLoader = () => {
    switch (type) {
      case 'film':
        return renderFilmLoader();
      case 'minimal':
        return renderMinimalLoader();
      case 'logo':
      default:
        return renderLogoLoader();
    }
  };
  
  // Wrapper pour le loader en plein écran ou en composant
  return fullScreen ? (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 ${className}`}>
      {renderLoader()}
    </div>
  ) : (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      {renderLoader()}
    </div>
  );
};

// Validation des props
ThematicLoader.propTypes = {
  type: PropTypes.oneOf(['logo', 'film', 'minimal']),
  text: PropTypes.string,
  className: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default ThematicLoader;
