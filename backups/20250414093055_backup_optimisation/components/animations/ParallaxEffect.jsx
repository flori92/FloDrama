import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant pour créer des effets de parallaxe au défilement
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Éléments enfants
 * @param {number} props.strength - Force de l'effet de parallaxe (1-10)
 * @param {string} props.direction - Direction de l'effet (up, down, left, right)
 * @param {boolean} props.fadeIn - Activer l'effet de fondu à l'entrée
 * @param {string} props.className - Classes CSS additionnelles
 */
const ParallaxEffect = ({ 
  children, 
  strength = 3, 
  direction = 'up', 
  fadeIn = true,
  className = ''
}) => {
  const ref = useRef(null);
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  
  // Normaliser la force entre 0.1 et 0.5
  const normalizedStrength = Math.min(Math.max(strength, 1), 10) / 20;
  
  // Récupérer la position de défilement
  const { scrollY } = useScroll();
  
  // Mettre à jour les dimensions lors du montage et du redimensionnement
  useEffect(() => {
    const element = ref.current;
    const updatePosition = () => {
      const { top } = element.getBoundingClientRect();
      setElementTop(top + window.scrollY);
      setClientHeight(window.innerHeight);
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, []);
  
  // Calculer le début et la fin de l'effet
  const startPosition = elementTop - clientHeight;
  const endPosition = elementTop + clientHeight;
  
  // Transformer la position de défilement en valeurs pour l'animation
  const yTransform = useTransform(
    scrollY, 
    [startPosition, endPosition], 
    direction === 'up' ? [normalizedStrength * 100, -normalizedStrength * 100] : 
    direction === 'down' ? [-normalizedStrength * 100, normalizedStrength * 100] : 
    [0, 0]
  );
  
  const xTransform = useTransform(
    scrollY, 
    [startPosition, endPosition], 
    direction === 'left' ? [normalizedStrength * 100, -normalizedStrength * 100] : 
    direction === 'right' ? [-normalizedStrength * 100, normalizedStrength * 100] : 
    [0, 0]
  );
  
  // Toujours appeler useTransform, mais utiliser des valeurs différentes selon fadeIn
  const opacityTransform = useTransform(
    scrollY, 
    [startPosition, startPosition + clientHeight * 0.2], 
    fadeIn ? [0, 1] : [1, 1]
  );
  
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={{
          x: xTransform,
          y: yTransform,
          opacity: opacityTransform
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Validation des props
ParallaxEffect.propTypes = {
  children: PropTypes.node.isRequired,
  strength: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  fadeIn: PropTypes.bool,
  className: PropTypes.string
};

export default ParallaxEffect;
