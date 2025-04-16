import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HybridComponent } from './adapters/hybrid-component';
import { ComponentName } from './adapters/component-registry';

// Chargement paresseux des composants principaux
// Ces imports sont utilisés via React.createElement plus bas
const LecteurVideo = React.lazy(() => import('./components/player/LecteurVideo'));
const CarouselRecommandations = React.lazy(() => import('./components/features/CarouselRecommandations'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

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
    { label: 'Accueil', route: '/' },
    { label: 'Découvrir', route: '/decouvrir' },
    { label: 'Favoris', route: '/favoris' },
    { label: 'Profil', route: '/profil' }
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
                React.createElement(LandingPage, { onEnter: handleEnterApp } as LandingPageProps)
              )}
            </div>
          ) : (
            <Navigate to="/home" replace />
          )
        } />
        
        <Route path="/home" element={
          <div className="app-container">
            {React.createElement(React.Suspense, { fallback: loadingFallback },
              <>
                {/* Navigation principale */}
                <HybridComponent<ComponentName>
                  componentName="Navigation"
                  componentProps={{ items: navigationItems }}
                />

                {/* Contenu principal */}
                <main className="main-content">
                  {React.createElement(React.Suspense, { fallback: <div>Chargement du lecteur...</div> },
                    React.createElement(LecteurVideo, { url: "", titre: "Bienvenue sur FloDrama" })
                  )}

                  {React.createElement(React.Suspense, { fallback: <div>Chargement des recommandations...</div> },
                    React.createElement(CarouselRecommandations, { userId: "user123" })
                  )}
                </main>
              </>
            )}
          </div>
        } />
        
        {/* Redirection vers la landing page pour les routes non définies */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
