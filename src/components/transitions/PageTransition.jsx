import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/components/PageTransition.css';

/**
 * Composant de transition entre les pages
 * Ajoute des animations fluides lors des changements de page
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Contenu à afficher
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  
  useEffect(() => {
    // Si le chemin a changé
    if (location.pathname !== displayLocation.pathname) {
      // Démarrer l'animation de sortie
      setTransitionStage('fadeOut');
      
      // Attendre la fin de l'animation avant de changer de page
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 300); // Durée de l'animation (ms)
      
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);
  
  return (
    <div className={`page-transition ${transitionStage}`}>
      {children}
    </div>
  );
};

export default PageTransition;
