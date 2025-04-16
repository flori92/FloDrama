import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from './ErrorBoundary';

/**
 * Composant AppErrorBoundary spécifique à FloDrama
 * Utilise ErrorBoundary avec un style personnalisé conforme à l'identité visuelle de FloDrama
 */
const AppErrorBoundary = ({ children }) => {
  // Composant de fallback personnalisé pour les erreurs
  const ErrorFallback = (error, errorInfo, { onReset, onReload, onGoHome }) => (
    <div className="flodrama-error-container">
      <div className="flodrama-error-content">
        <div className="flodrama-error-logo">FD</div>
        <h1 className="flodrama-error-title">Oups ! Une erreur s'est produite</h1>
        <p className="flodrama-error-message">
          Nous sommes désolés pour ce désagrément. Notre équipe a été informée et travaille à résoudre ce problème.
        </p>
        
        <div className="flodrama-error-actions">
          <button onClick={onReset} className="flodrama-btn flodrama-btn-primary">
            Réessayer
          </button>
          <button onClick={onReload} className="flodrama-btn flodrama-btn-secondary">
            Recharger la page
          </button>
          <button onClick={onGoHome} className="flodrama-btn flodrama-btn-outline">
            Retour à l'accueil
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="flodrama-error-details">
            <summary>Détails techniques</summary>
            <p>{error?.toString()}</p>
            <pre>{errorInfo?.componentStack}</pre>
          </details>
        )}
      </div>
      
      <style jsx="true">{`
        .flodrama-error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #121118;
          color: white;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
        }
        
        .flodrama-error-content {
          max-width: 600px;
          padding: 40px;
          background-color: #1A1926;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          text-align: center;
        }
        
        .flodrama-error-logo {
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          color: white;
        }
        
        .flodrama-error-title {
          margin-top: 0;
          font-size: 32px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        .flodrama-error-message {
          margin: 20px 0;
          line-height: 1.6;
          opacity: 0.8;
        }
        
        .flodrama-error-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 30px;
        }
        
        .flodrama-btn {
          padding: 12px 24px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
        }
        
        .flodrama-btn:hover {
          transform: translateY(-2px);
        }
        
        .flodrama-btn-primary {
          background: linear-gradient(to right, #3b82f6, #d946ef);
          color: white;
        }
        
        .flodrama-btn-primary:hover {
          box-shadow: 0 5px 15px rgba(217, 70, 239, 0.4);
        }
        
        .flodrama-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .flodrama-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .flodrama-btn-outline {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .flodrama-btn-outline:hover {
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .flodrama-error-details {
          margin-top: 30px;
          text-align: left;
          background: rgba(0, 0, 0, 0.2);
          padding: 15px;
          border-radius: 8px;
        }
        
        .flodrama-error-details summary {
          cursor: pointer;
          padding: 5px 0;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .flodrama-error-details pre {
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );

  return (
    <ErrorBoundary fallback={ErrorFallback} showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  );
};

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default AppErrorBoundary;
