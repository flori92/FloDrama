import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant de chargement avec effet de skeleton animé
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de skeleton (card, banner, text, grid)
 * @param {number} props.count - Nombre d'éléments à afficher
 * @param {string} props.className - Classes CSS additionnelles
 */
const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  // Animation de pulsation pour l'effet de chargement
  const pulseAnimation = {
    initial: { opacity: 0.6 },
    animate: { 
      opacity: [0.6, 0.8, 0.6],
      transition: { 
        repeat: Infinity, 
        duration: 1.5,
        ease: 'easeInOut'
      }
    }
  };

  // Rendu d'un skeleton de carte (pour films/séries)
  const renderCardSkeleton = () => (
    <motion.div 
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ width: '180px', height: '270px', backgroundColor: 'var(--color-background-secondary)' }}
      variants={pulseAnimation}
      initial="initial"
      animate="animate"
    >
      <div className="w-full h-4/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>
      <div className="p-2 space-y-2">
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
        <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
      </div>
    </motion.div>
  );

  // Rendu d'un skeleton de bannière
  const renderBannerSkeleton = () => (
    <motion.div 
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ height: '200px', backgroundColor: 'var(--color-background-secondary)' }}
      variants={pulseAnimation}
      initial="initial"
      animate="animate"
    >
      <div className="h-full w-full relative">
        <div 
          className="absolute bottom-0 left-0 w-full p-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
        >
          <div className="h-6 w-1/3 rounded mb-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
          <div className="h-4 w-1/2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
        </div>
      </div>
    </motion.div>
  );

  // Rendu d'un skeleton de texte
  const renderTextSkeleton = () => (
    <motion.div 
      className={`space-y-2 ${className}`}
      variants={pulseAnimation}
      initial="initial"
      animate="animate"
    >
      <div className="h-5 w-3/4 rounded" style={{ backgroundColor: 'var(--color-background-secondary)' }}></div>
      <div className="h-5 w-full rounded" style={{ backgroundColor: 'var(--color-background-secondary)' }}></div>
      <div className="h-5 w-2/3 rounded" style={{ backgroundColor: 'var(--color-background-secondary)' }}></div>
    </motion.div>
  );

  // Rendu d'un skeleton de grille
  const renderGridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex justify-center">
          {renderCardSkeleton()}
        </div>
      ))}
    </div>
  );

  // Rendu en fonction du type
  const renderSkeleton = () => {
    switch (type) {
      case 'banner':
        return renderBannerSkeleton();
      case 'text':
        return renderTextSkeleton();
      case 'grid':
        return renderGridSkeleton();
      case 'card':
      default:
        if (count === 1) {
          return renderCardSkeleton();
        }
        return (
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index}>
                {renderCardSkeleton()}
              </div>
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

// Validation des props
SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['card', 'banner', 'text', 'grid']),
  count: PropTypes.number,
  className: PropTypes.string
};

export default SkeletonLoader;
