import React, { Suspense } from 'react';

/**
 * Utilitaire pour le chargement paresseux des composants
 * Permet de réduire la taille du bundle initial et d'améliorer les performances
 */

/**
 * Composant de fallback pendant le chargement
 * Respecte l'identité visuelle de FloDrama
 */
const DefaultLoadingFallback = ({ height = '200px', width = '100%' }) => (
  <div 
    style={{
      height,
      width,
      background: '#1A1926',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}
  >
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, #1A1926 0%, #2a293a 50%, #1A1926 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden'
      }}
      dangerouslySetInnerHTML={{
        __html: `
          <style>
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          </style>
        `
      }}
    />
  </div>
);

/**
 * Composant de fallback pour les erreurs de chargement
 * Respecte l'identité visuelle de FloDrama
 */
const DefaultErrorFallback = ({ error, retry }) => (
  <div 
    style={{
      padding: '20px',
      background: '#1A1926',
      borderRadius: '8px',
      color: 'white',
      textAlign: 'center'
    }}
  >
    <div 
      style={{
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
      }}
    >
      FD
    </div>
    <h3 
      style={{
        margin: '0 0 10px',
        background: 'linear-gradient(to right, #3b82f6, #d946ef)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      Erreur de chargement
    </h3>
    <p>Impossible de charger ce composant.</p>
    {retry && (
      <button
        onClick={retry}
        style={{
          background: 'linear-gradient(to right, #3b82f6, #d946ef)',
          border: 'none',
          borderRadius: '20px',
          color: 'white',
          padding: '8px 16px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '10px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(217, 70, 239, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Réessayer
      </button>
    )}
  </div>
);

/**
 * Fonction pour charger un composant de manière paresseuse
 * @param {Function} importFunc - Fonction d'importation dynamique (ex: () => import('./MonComposant'))
 * @param {Object} options - Options de configuration
 * @param {React.Component} options.LoadingFallback - Composant à afficher pendant le chargement
 * @param {React.Component} options.ErrorFallback - Composant à afficher en cas d'erreur
 * @returns {React.Component} - Composant chargé de manière paresseuse
 */
export const lazyLoad = (importFunc, {
  LoadingFallback = DefaultLoadingFallback,
  ErrorFallback = DefaultErrorFallback
} = {}) => {
  const LazyComponent = React.lazy(importFunc);
  
  // Composant d'erreur avec retry
  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState(null);
    
    React.useEffect(() => {
      // Réinitialiser l'erreur lorsque le composant change
      setHasError(false);
      setError(null);
    }, [importFunc]);
    
    // Gestionnaire d'erreur
    const handleCatch = (e) => {
      console.error('Erreur de chargement du composant:', e);
      setHasError(true);
      setError(e);
    };
    
    // Fonction pour réessayer
    const retry = () => {
      setHasError(false);
      setError(null);
    };
    
    if (hasError) {
      return <ErrorFallback error={error} retry={retry} />;
    }
    
    return (
      <React.Fragment>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.target.tagName && e.target.tagName.toLowerCase() === 'script') {
                  ${handleCatch.toString()}(new Error('Erreur de chargement du script: ' + e.target.src));
                }
              }, true);
            `
          }}
        />
      </React.Fragment>
    );
  };
  
  // Composant wrapper avec Suspense et ErrorBoundary
  return (props) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default {
  lazyLoad
};
