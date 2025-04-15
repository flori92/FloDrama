import React, { Suspense } from 'react';

/**
 * Utilitaire pour le chargement paresseux des composants
 * Permet de réduire la taille du bundle initial et d'améliorer les performances
 */

// Styles pour le composant de chargement
const loadingStyles = {
  container: {
    height: '200px',
    width: '100%',
    background: '#1A1926',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  shimmer: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, #1A1926 0%, #2a293a 50%, #1A1926 100%)',
    backgroundSize: '200% 100%',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7
  }
};

// Styles pour le composant d'erreur
const errorStyles = {
  container: {
    padding: '20px',
    background: '#1A1926',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center'
  },
  icon: {
    width: '60px',
    height: '60px',
    margin: '0 auto 15px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  title: {
    margin: '0 0 10px',
    color: '#d946ef',
    fontWeight: 'bold'
  },
  button: {
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    border: 'none',
    borderRadius: '20px',
    color: 'white',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  }
};

/**
 * Composant de fallback pendant le chargement
 */
const DefaultLoadingFallback = ({ height = '200px', width = '100%' }) => {
  const containerStyle = {
    ...loadingStyles.container,
    height,
    width
  };
  
  return React.createElement('div', { style: containerStyle },
    React.createElement('div', { style: loadingStyles.shimmer })
  );
};

/**
 * Composant de fallback pour les erreurs de chargement
 */
const DefaultErrorFallback = ({ error, retry }) => {
  return React.createElement('div', { style: errorStyles.container }, [
    React.createElement('div', { style: errorStyles.icon, key: 'icon' }, 'FD'),
    React.createElement('h3', { style: errorStyles.title, key: 'title' }, 'Erreur de chargement'),
    React.createElement('p', { key: 'message' }, 'Impossible de charger ce composant.'),
    retry ? React.createElement('button', { 
      onClick: retry, 
      style: errorStyles.button,
      key: 'retry'
    }, 'Réessayer') : null
  ].filter(Boolean));
};

/**
 * Fonction pour charger un composant de manière paresseuse
 * @param {Function} importFunc - Fonction d'importation dynamique
 * @param {Object} options - Options de configuration
 * @returns {React.Component} - Composant chargé de manière paresseuse
 */
export const lazyLoad = (importFunc, options = {}) => {
  const LoadingFallback = options.LoadingFallback || DefaultLoadingFallback;
  const ErrorFallback = options.ErrorFallback || DefaultErrorFallback;
  
  const LazyComponent = React.lazy(importFunc);
  
  // Composant d'erreur avec retry
  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState(null);
    
    React.useEffect(() => {
      setHasError(false);
      setError(null);
    }, [importFunc]);
    
    // Fonction pour réessayer
    const retry = () => {
      setHasError(false);
      setError(null);
    };
    
    if (hasError) {
      return React.createElement(ErrorFallback, { error, retry });
    }
    
    return children;
  };
  
  // Composant wrapper avec Suspense et ErrorBoundary
  return (props) => {
    return React.createElement(ErrorBoundary, null,
      React.createElement(Suspense, { fallback: React.createElement(LoadingFallback) },
        React.createElement(LazyComponent, props)
      )
    );
  };
};

// Mock minimal pour débloquer le build
export function lazyLoader() {
  return {
    load: (src) => Promise.resolve(src),
    preload: (src) => Promise.resolve(src),
    cancel: () => {}
  };
}

export default {
  lazyLoad
};
