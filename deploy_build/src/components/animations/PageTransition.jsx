import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant amélioré pour les transitions entre les pages
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Éléments enfants
 * @param {string} props.type - Type de transition (fade, slide, scale, cinema, push)
 * @param {number} props.duration - Durée de la transition en secondes
 * @param {string} props.direction - Direction de la transition (up, down, left, right)
 * @param {boolean} props.isBack - Indique si la navigation est un retour en arrière
 */
const PageTransition = ({ 
  children, 
  type = 'fade', 
  duration = 0.5, 
  direction = 'up',
  isBack = false
}) => {
  // Définir les variantes d'animation en fonction du type
  const getVariants = () => {
    // Valeurs de déplacement pour les animations directionnelles
    const distance = 50;
    const directions = {
      up: { y: distance, x: 0 },
      down: { y: -distance, x: 0 },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 }
    };
    
    // Direction inverse si c'est un retour en arrière
    const actualDirection = isBack ? 
      (direction === 'left' ? 'right' : 
       direction === 'right' ? 'left' : 
       direction === 'up' ? 'down' : 'up') : 
      direction;
    
    // Variantes de base pour l'opacité
    const fadeVariants = {
      initial: { opacity: 0 },
      in: { opacity: 1 },
      out: { opacity: 0 }
    };
    
    // Variantes pour le déplacement
    const slideVariants = {
      initial: { opacity: 0, ...directions[actualDirection] },
      in: { opacity: 1, x: 0, y: 0 },
      out: { opacity: 0, ...directions[actualDirection === 'left' ? 'right' : 
                                      actualDirection === 'right' ? 'left' : 
                                      actualDirection === 'up' ? 'down' : 'up'] }
    };
    
    // Variantes pour l'échelle
    const scaleVariants = {
      initial: { opacity: 0, scale: actualDirection === 'up' ? 0.8 : 1.2 },
      in: { opacity: 1, scale: 1 },
      out: { opacity: 0, scale: actualDirection === 'up' ? 1.2 : 0.8 }
    };
    
    // Effet cinématographique avec volet
    const cinemaVariants = {
      initial: { opacity: 0, scaleY: 0 },
      in: { opacity: 1, scaleY: 1 },
      out: { opacity: 0, scaleY: 0 }
    };
    
    // Effet de poussée (push)
    const pushVariants = {
      initial: { 
        x: actualDirection === 'left' ? '100%' : 
           actualDirection === 'right' ? '-100%' : 0,
        y: actualDirection === 'up' ? '100%' : 
           actualDirection === 'down' ? '-100%' : 0
      },
      in: { x: 0, y: 0 },
      out: { 
        x: actualDirection === 'left' ? '-100%' : 
           actualDirection === 'right' ? '100%' : 0,
        y: actualDirection === 'up' ? '-100%' : 
           actualDirection === 'down' ? '100%' : 0
      }
    };
    
    // Retourner les variantes appropriées
    switch (type) {
      case 'slide':
        return slideVariants;
      case 'scale':
        return scaleVariants;
      case 'cinema':
        return cinemaVariants;
      case 'push':
        return pushVariants;
      case 'fade':
      default:
        return fadeVariants;
    }
  };

  // Obtenir les variantes en fonction du type
  const pageVariants = getVariants();

  // Configuration de la transition
  const pageTransition = {
    type: 'tween',
    ease: type === 'cinema' ? 'circOut' : 'easeInOut',
    duration: duration
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// Validation des props
PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['fade', 'slide', 'scale', 'cinema', 'push']),
  duration: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  isBack: PropTypes.bool
};

export default PageTransition;
