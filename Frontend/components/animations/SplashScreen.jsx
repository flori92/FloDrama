import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SplashScreen.css';

/**
 * Composant SplashScreen pour FloDrama
 * Affiche un écran de chargement avec le logo et une animation
 * Se ferme automatiquement après un délai spécifié
 */
const SplashScreen = ({ 
  duration = 2500,
  minDuration = 1000,
  onComplete = () => {}
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Fonction pour fermer le splash screen
    const closeSplashScreen = () => {
      // Vérifier si le temps minimum est écoulé
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime < minDuration) {
        // Si le temps minimum n'est pas écoulé, attendre la différence
        const remainingTime = minDuration - elapsedTime;
        setTimeout(() => {
          setIsTransitioning(true);
          
          // Attendre la fin de l'animation de transition avant de masquer complètement
          setTimeout(() => {
            setIsVisible(false);
            onComplete();
          }, 800); // Durée de l'animation de transition
        }, remainingTime);
      } else {
        // Si le temps minimum est déjà écoulé, lancer la transition
        setIsTransitioning(true);
        
        setTimeout(() => {
          setIsVisible(false);
          onComplete();
        }, 800); // Durée de l'animation de transition
      }
    };
    
    // Fermer automatiquement après la durée spécifiée
    const timer = setTimeout(closeSplashScreen, duration);
    
    // Nettoyage du timer si le composant est démonté
    return () => clearTimeout(timer);
  }, [duration, minDuration, onComplete, startTime]);

  // Ne rien rendre si le splash screen n'est plus visible
  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className={`splash-container ${isTransitioning ? 'fade-out' : ''}`}>
        <svg className="splash-logo" width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Définition du dégradé */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#0066CC", stopOpacity:0.2}}/>
              <stop offset="100%" style={{stopColor:"#0066CC", stopOpacity:0.1}}/>
            </linearGradient>
          </defs>
          
          {/* Fond avec dégradé */}
          <rect x="10" y="10" width="180" height="180" rx="20" fill="url(#bgGradient)" className="splash-logo-bg"/>
          
          {/* Cadre de l'écran */}
          <rect x="20" y="40" width="160" height="120" rx="10" fill="none" stroke="#0066CC" strokeWidth="3" className="splash-screen-frame"/>
          
          {/* Vagues de streaming */}
          <path d="M30 80 Q50 80 70 80" className="splash-wave"/>
          <path d="M30 100 Q50 100 70 100" className="splash-wave"/>
          <path d="M30 120 Q50 120 70 120" className="splash-wave"/>
          
          {/* Bouton de lecture (triangle) */}
          <path d="M80 60 L140 100 L80 140 Z" fill="#FF00FF"/>
        </svg>
        <div className="splash-title">FloDrama</div>
        <div className="splash-loading">
          <div className="splash-dot"></div>
          <div className="splash-dot"></div>
          <div className="splash-dot"></div>
        </div>
      </div>
      
      {/* Élément pour l'animation de transition */}
      <div className={`splash-transition ${isTransitioning ? 'active' : ''}`}></div>
    </>
  );
};

SplashScreen.propTypes = {
  duration: PropTypes.number,
  minDuration: PropTypes.number,
  onComplete: PropTypes.func
};

export default SplashScreen;
