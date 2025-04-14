import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ErrorPage.css';

/**
 * Page d'erreur 404
 * Affichée lorsque l'utilisateur accède à une URL qui n'existe pas
 */
const ErrorPage = () => {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-code">404</div>
        <h1 className="error-title">Page non trouvée</h1>
        <p className="error-message">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="error-actions">
          <Link to="/" className="home-button">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
