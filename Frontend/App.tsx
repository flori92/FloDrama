import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Chargement paresseux des composants principaux
// Ces imports sont utilisés via React.createElement plus bas
const HomePage = React.lazy(() => import('./pages/HomePage'));

// Interface pour les props de la landing page
interface LandingPageProps {
  onEnter: () => void;
}

/**
 * Composant principal de FloDrama
 * Utilise l'architecture hybride Lynx/React
 */
const App: React.FC = () => {
  // État pour déterminer si l'utilisateur est sur la landing page ou l'interface principale
  const [showLanding, setShowLanding] = useState(true);

  // Vérifier si l'utilisateur a déjà visité l'application
  useEffect(() => {
    const hasVisited = localStorage.getItem('flodrama_visited');
    const urlParams = new URLSearchParams(window.location.search);
    const skipLanding = urlParams.get('skipLanding') === 'true';
    
    if (hasVisited || skipLanding) {
      setShowLanding(false);
    }
  }, []);

  // Fonction pour passer de la landing page à l'interface principale
  const handleEnterApp = () => {
    localStorage.setItem('flodrama_visited', 'true');
    setShowLanding(false);
  };

  // Configuration des éléments de navigation
  const navigationItems = [
    { label: 'Accueil', route: '/home' },
    { label: 'Dramas', route: '/dramas' },
    { label: 'Films', route: '/films' },
    { label: 'Animés', route: '/animes' },
    { label: 'Bollywood', route: '/bollywood' },
    { label: 'App', route: '/app' },
    { label: 'WatchParty', route: '/watchparty' }
  ];

  // Fallback pour les composants en cours de chargement
  const loadingFallback = <div>Chargement...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          showLanding ? (
            <div className="landing-container">
              {React.createElement(React.Suspense, { fallback: loadingFallback },
                React.createElement(LandingPage, { onEnter: handleEnterApp })
              )}
            </div>
          ) : (
            <Navigate to="/home" replace />
          )
        } />
        
        <Route path="/home" element={
          <div className="app-container">
            {React.createElement(React.Suspense, { fallback: loadingFallback },
              <main className="main-content">
                {React.createElement(HomePage)}
              </main>
            )}
          </div>
        } />
        
        {/* Pages de section */}
        <Route path="/dramas" element={<div>Dramas</div>} />
        <Route path="/films" element={<div>Films</div>} />
        <Route path="/animes" element={<div>Animés</div>} />
        <Route path="/bollywood" element={<div>Bollywood</div>} />
        <Route path="/app" element={<div>App</div>} />
        <Route path="/watchparty" element={<div>WatchParty</div>} />
        
        {/* Redirection pour toutes les routes non définies */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
