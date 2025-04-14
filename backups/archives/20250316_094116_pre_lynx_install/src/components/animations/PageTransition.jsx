import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant pour les transitions entre les pages
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Éléments enfants
 * @param {string} props.type - Type de transition (fade, slide, scale)
 * @param {number} props.duration - Durée de la transition en secondes
 * @param {string} props.direction - Direction de la transition (up, down, left, right)
 */
const PageTransition = ({ 
  children, 
  type = 'fade', 
  duration = 0.5, 
  direction = 'up' 
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
    
    // Variantes de base pour l'opacité
    const fadeVariants = {
      initial: { opacity: 0 },
      in: { opacity: 1 },
      out: { opacity: 0 }
    };
    
    // Variantes pour le déplacement
    const slideVariants = {
      initial: { opacity: 0, ...directions[direction] },
      in: { opacity: 1, x: 0, y: 0 },
      out: { opacity: 0, ...directions[direction] }
    };
    
    // Variantes pour l'échelle
    const scaleVariants = {
      initial: { opacity: 0, scale: direction === 'up' ? 0.8 : 1.2 },
      in: { opacity: 1, scale: 1 },
      out: { opacity: 0, scale: direction === 'up' ? 1.2 : 0.8 }
    };
    
    // Retourner les variantes appropriées
    switch (type) {
      case 'slide':
        return slideVariants;
      case 'scale':
        return scaleVariants;
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
    ease: 'easeInOut',
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
  type: PropTypes.oneOf(['fade', 'slide', 'scale']),
  duration: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right'])
};

export default PageTransition;
