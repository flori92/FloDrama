import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant pour afficher des éléments en grille avec un effet de cascade
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Éléments à afficher
 * @param {Function} props.renderItem - Fonction de rendu pour chaque élément
 * @param {number} props.columns - Nombre de colonnes (responsive)
 * @param {number} props.staggerDelay - Délai entre chaque élément (en secondes)
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.itemClassName - Classes CSS pour chaque élément
 * @param {string} props.direction - Direction de l'animation (top, bottom, left, right)
 */
const CascadeGrid = ({
  items = [],
  renderItem,
  columns = { xs: 2, sm: 3, md: 4, lg: 6 },
  staggerDelay = 0.05,
  className = '',
  itemClassName = '',
  direction = 'top'
}) => {
  // Définir les variantes d'animation pour le conteneur
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  // Définir les variantes d'animation pour chaque élément
  const getItemVariants = () => {
    const distance = 30;
    
    switch (direction) {
      case 'bottom':
        return {
          hidden: { y: -distance, opacity: 0 },
          visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
          }
        };
      case 'left':
        return {
          hidden: { x: distance, opacity: 0 },
          visible: { 
            x: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
          }
        };
      case 'right':
        return {
          hidden: { x: -distance, opacity: 0 },
          visible: { 
            x: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
          }
        };
      case 'top':
      default:
        return {
          hidden: { y: distance, opacity: 0 },
          visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
          }
        };
    }
  };

  // Obtenir les variantes d'élément
  const itemVariants = getItemVariants();

  // Générer les classes CSS pour la grille responsive
  const getGridClasses = () => {
    const gridClasses = [];
    
    if (columns.xs) gridClasses.push(`grid-cols-${columns.xs}`);
    if (columns.sm) gridClasses.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) gridClasses.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) gridClasses.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) gridClasses.push(`xl:grid-cols-${columns.xl}`);
    
    return gridClasses.join(' ');
  };

  return (
    <motion.div
      className={`grid ${getGridClasses()} gap-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          className={itemClassName}
          variants={itemVariants}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Validation des props
CascadeGrid.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  columns: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number
    })
  ]),
  staggerDelay: PropTypes.number,
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  direction: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

export default CascadeGrid;
