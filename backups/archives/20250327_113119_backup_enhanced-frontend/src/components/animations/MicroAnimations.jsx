import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant pour les micro-animations et effets de feedback
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type d'animation (success, error, confetti, pulse, bounce, tooltip)
 * @param {boolean} props.isVisible - Indique si l'animation est visible
 * @param {React.ReactNode} props.children - Éléments enfants
 * @param {string} props.tooltipText - Texte du tooltip (pour type="tooltip")
 * @param {string} props.position - Position du tooltip (top, bottom, left, right)
 * @param {Function} props.onAnimationComplete - Fonction appelée à la fin de l'animation
 */
const MicroAnimations = ({ 
  type = 'pulse', 
  isVisible = true, 
  children, 
  tooltipText = '',
  position = 'top',
  onAnimationComplete = () => {}
}) => {
  // Variantes pour l'effet de pulsation
  const pulseVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.4 }
    }
  };

  // Variantes pour l'effet de rebond
  const bounceVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 10 
      }
    }
  };

  // Variantes pour l'effet de succès
  const successVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      scale: 1.2, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Variantes pour l'effet d'erreur
  const errorVariants = {
    initial: { x: 0 },
    animate: { 
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.4 }
    }
  };

  // Variantes pour l'effet de confettis
  const confettiVariants = {
    initial: { opacity: 0, y: 0, scale: 0 },
    animate: { 
      opacity: [0, 1, 0],
      y: [0, -40],
      scale: [0, 1],
      transition: { duration: 0.8 }
    }
  };

  // Variantes pour le tooltip
  const tooltipVariants = {
    initial: { opacity: 0, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0, x: position === 'left' ? 10 : position === 'right' ? -10 : 0 },
    animate: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
      transition: { duration: 0.2 }
    }
  };

  // Rendu des confettis
  const renderConfetti = () => {
    const colors = ['#FF5252', '#FFD740', '#64FFDA', '#448AFF', '#E040FB'];
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, index) => {
          const size = Math.random() * 8 + 4;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const left = `${Math.random() * 100}%`;
          const delay = Math.random() * 0.3;
          const duration = Math.random() * 0.5 + 0.5;
          
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: '50%',
                left: left,
                top: '50%'
              }}
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [0, -100 - Math.random() * 100],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, Math.random() * 360],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: duration, 
                delay: delay,
                ease: 'easeOut'
              }}
            />
          );
        })}
      </div>
    );
  };

  // Rendu du tooltip
  const renderTooltip = () => {
    // Déterminer la position du tooltip
    const getTooltipPosition = () => {
      switch (position) {
        case 'bottom':
          return { bottom: '-40px', left: '50%', transform: 'translateX(-50%)' };
        case 'left':
          return { left: '-8px', top: '50%', transform: 'translate(-100%, -50%)' };
        case 'right':
          return { right: '-8px', top: '50%', transform: 'translate(100%, -50%)' };
        case 'top':
        default:
          return { top: '-40px', left: '50%', transform: 'translateX(-50%)' };
      }
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap"
            style={getTooltipPosition()}
            variants={tooltipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {tooltipText}
            <div 
              className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
              style={{
                ...(position === 'top' ? { bottom: '-4px', left: 'calc(50% - 4px)' } :
                   position === 'bottom' ? { top: '-4px', left: 'calc(50% - 4px)' } :
                   position === 'left' ? { right: '-4px', top: 'calc(50% - 4px)' } :
                   { left: '-4px', top: 'calc(50% - 4px)' })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Sélectionner les variantes en fonction du type
  const getVariants = () => {
    switch (type) {
      case 'success':
        return successVariants;
      case 'error':
        return errorVariants;
      case 'confetti':
        return confettiVariants;
      case 'bounce':
        return bounceVariants;
      case 'tooltip':
        return null; // Géré séparément
      case 'pulse':
      default:
        return pulseVariants;
    }
  };

  // Si c'est un tooltip, rendu spécial
  if (type === 'tooltip') {
    return (
      <div className="relative inline-block">
        {children}
        {renderTooltip()}
      </div>
    );
  }

  // Si c'est un effet de confettis, ajouter l'animation de confettis
  if (type === 'confetti') {
    return (
      <div className="relative">
        <motion.div
          variants={getVariants()}
          initial="initial"
          animate={isVisible ? "animate" : "initial"}
          onAnimationComplete={onAnimationComplete}
        >
          {children}
        </motion.div>
        {isVisible && renderConfetti()}
      </div>
    );
  }

  // Rendu standard pour les autres types
  return (
    <motion.div
      variants={getVariants()}
      initial="initial"
      animate={isVisible ? "animate" : "initial"}
      exit="exit"
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
};

// Validation des props
MicroAnimations.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'confetti', 'pulse', 'bounce', 'tooltip']),
  isVisible: PropTypes.bool,
  children: PropTypes.node.isRequired,
  tooltipText: PropTypes.string,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  onAnimationComplete: PropTypes.func
};

export default MicroAnimations;
