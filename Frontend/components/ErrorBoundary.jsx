import React from 'react';
import PropTypes from 'prop-types';

/**
 * Composant ErrorBoundary pour capturer et gérer les erreurs dans les composants React
 * Empêche que l'application entière ne plante lorsqu'une erreur se produit dans un composant
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Méthode du cycle de vie appelée lorsqu'une erreur est levée dans un composant enfant
   * @param {Error} error - L'erreur qui a été levée
   * @returns {Object} - Nouvel état avec l'erreur
   */
  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher le fallback UI
    return { hasError: true, error };
  }

  /**
   * Méthode du cycle de vie appelée après qu'une erreur a été levée
   * @param {Error} error - L'erreur qui a été levée
   * @param {Object} errorInfo - Informations sur l'erreur, notamment la stack trace
   */
  componentDidCatch(error, errorInfo) {
    // Enregistrer l'erreur pour le débogage
    console.error('ErrorBoundary a capturé une erreur:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Journaliser l'erreur (pourrait être envoyée à un service de monitoring)
    this.logError(error, errorInfo);
  }

  /**
   * Journalise l'erreur (pourrait être envoyée à un service comme Sentry)
   * @param {Error} error - L'erreur qui a été levée
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  logError(error, errorInfo) {
    // Ici, on pourrait envoyer l'erreur à un service de monitoring
    // Par exemple, si Sentry était configuré :
    // Sentry.captureException(error, { extra: errorInfo });
    
    // Pour l'instant, on se contente de la journaliser dans la console
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href
    };
    
    console.group('Détails de l\'erreur pour le débogage:');
    console.table(errorLog);
    console.groupEnd();
    
    // Stocker dans localStorage pour référence ultérieure (limité aux 10 dernières erreurs)
    try {
      const errorLogs = JSON.parse(localStorage.getItem('flodrama_error_logs') || '[]');
      errorLogs.unshift(errorLog);
      localStorage.setItem('flodrama_error_logs', JSON.stringify(errorLogs.slice(0, 10)));
    } catch (e) {
      console.warn('Impossible de stocker l\'erreur dans localStorage:', e);
    }
  }

  /**
   * Réinitialise l'état de l'erreur pour tenter de récupérer
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  /**
   * Recharge la page pour tenter de récupérer complètement
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Retourne à la page d'accueil
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    // Si une erreur s'est produite, afficher le fallback UI
    if (hasError) {
      // Si un composant fallback personnalisé est fourni, l'utiliser
      if (fallback) {
        return fallback(error, errorInfo, {
          onReset: this.handleReset,
          onReload: this.handleReload,
          onGoHome: this.handleGoHome
        });
      }

      // Sinon, afficher le fallback par défaut
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2>Oups ! Quelque chose s&apos;est mal passé</h2>
            <p>Nous sommes désolés pour ce problème. Notre équipe a été informée et travaille à le résoudre.</p>
            
            {showDetails && (
              <details className="error-details">
                <summary>Détails techniques</summary>
                <p>{error?.toString()}</p>
                <pre>{errorInfo?.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReset} className="btn btn-primary">
                Réessayer
              </button>
              <button onClick={this.handleReload} className="btn btn-secondary">
                Recharger la page
              </button>
              <button onClick={this.handleGoHome} className="btn btn-outline">
                Retour à l&apos;accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Si tout va bien, afficher les enfants normalement
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  showDetails: PropTypes.bool
};

export default ErrorBoundary;
