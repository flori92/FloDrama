import React, { Component } from 'react';

/**
 * Composant de gestion des erreurs pour l'application FloDrama
 * Ce composant capture les erreurs dans ses composants enfants
 * et affiche un message d'erreur élégant au lieu de planter l'application
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Méthode du cycle de vie qui capture les erreurs
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Méthode du cycle de vie qui capture les détails de l'erreur
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log de l'erreur pour le débogage
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    
    // Ici, on pourrait envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
  }

  render() {
    // Si une erreur est survenue, afficher le fallback UI
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-8 rounded-lg bg-gradient-to-r from-red-900/50 to-purple-900/50 text-white m-4">
          <h2 className="text-xl font-semibold mb-4">
            Oups ! Quelque chose s'est mal passé
          </h2>
          <p className="mb-4">
            Nous sommes désolés pour ce désagrément. Notre équipe a été informée du problème.
          </p>
          
          {/* Afficher les détails de l'erreur en mode développement */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-800/50 rounded-md">
              <summary className="cursor-pointer text-yellow-300 mb-2">
                Détails techniques (mode développement)
              </summary>
              <p className="text-red-300 mb-2">
                {this.state.error && this.state.error.toString()}
              </p>
              <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          {/* Bouton pour tenter de récupérer */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Recharger la page
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Retour à la page précédente
            </button>
          </div>
        </div>
      );
    }

    // Si tout va bien, rendre les enfants normalement
    return this.props.children;
  }
}

export default ErrorBoundary;
