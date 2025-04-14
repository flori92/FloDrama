import React from 'react';
import { motion } from 'framer-motion';

/**
 * Composant wrapper pour ajouter des animations à n'importe quel élément
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Éléments enfants
 * @param {string} props.animation - Type d'animation ('fadeIn', 'slideUp', 'scale', 'stagger')
 * @param {number} props.delay - Délai avant le démarrage de l'animation (en secondes)
 * @param {number} props.duration - Durée de l'animation (en secondes)
 * @param {Object} props.custom - Propriétés personnalisées pour l'animation
 */
const MotionWrapper = ({ 
  children, 
  animation = 'fadeIn', 
  delay = 0, 
  duration = 0.5,
  custom = {},
  ...props 
}) => {
  // Définition des animations prédéfinies
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration, delay }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
      transition: { duration, delay, ease: [0.19, 1.0, 0.22, 1.0] }
    },
    stagger: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration, delay: delay + custom.index * 0.1 || delay, ease: 'easeOut' }
    }
  };

  // Sélectionner l'animation
  const selectedAnimation = animations[animation] || animations.fadeIn;
  
  // Fusionner avec les propriétés personnalisées
  const animationProps = {
    ...selectedAnimation,
    ...props
  };

  return (
    <motion.div {...animationProps}>
      {children}
    </motion.div>
  );
};

export default MotionWrapper;
