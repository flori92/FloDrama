import React from 'react';
import '../styles/LoadingSpinner.css';

/**
 * Composant d'indicateur de chargement
 * Affiche une animation de chargement pendant le traitement des données
 */
const LoadingSpinner = ({ message = "Chargement en cours..." }) => {
  return (
    <div className="loading-spinner-container">
      <div className="spinner-animation"></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
