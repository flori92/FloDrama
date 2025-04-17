import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/landing.css';

/**
 * Page d'accueil simplifiée pour FloDrama
 * Sert de landing page avant d'accéder à l'interface principale
 */
const LandingPage = ({ onEnter }) => {
  const navigate = useNavigate();

  const handleExplore = () => {
    // Appeler la fonction onEnter pour indiquer que l'utilisateur souhaite accéder à l'application
    if (onEnter) {
      onEnter();
    }
    
    // Rediriger vers la page principale avec le contenu enrichi
    navigate('/home');
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="logo-container"
        >
          <img src="/assets/logo.svg" alt="FloDrama Logo" className="logo" />
          <h1>FloDrama</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <p className="tagline">
            Votre plateforme de streaming dédiée aux dramas et films asiatiques.
            Découvrez des histoires captivantes et des productions de qualité.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="cta-container"
        >
          <button className="explore-button" onClick={handleExplore}>
            Explorer
          </button>
        </motion.div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">🎬</div>
            <h3>Dramas</h3>
            <p>Des séries captivantes</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎥</div>
            <h3>Films</h3>
            <p>Des films exclusifs</p>
          </div>
          <div className="feature">
            <div className="feature-icon">✨</div>
            <h3>Nouveautés</h3>
            <p>Mises à jour régulières</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
