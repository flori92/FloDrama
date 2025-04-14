import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { MetadataProvider } from './contexts/MetadataContext';
import { UserProvider } from './contexts/UserContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import EnhancedHomePage from './pages/EnhancedHomePage';
import DramaDetailsPage from './pages/DramaDetailsPage';
import PlayerPage from './pages/PlayerPage';
import BrowsePage from './pages/BrowsePage';
import SearchResultsPage from './pages/SearchResultsPage';
import ProfilePage from './pages/ProfilePage';
import WatchlistPage from './pages/WatchlistPage';
import ErrorPage from './pages/ErrorPage';
import LandingPage from './pages/LandingPage';
import { handleImageError } from './utils/localImageFallback';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Chargement de FloDrama...</p>
  </div>
);

/**
 * Composant principal de l'application
 */
const App = () => {
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Vérifier si l'utilisateur a déjà visité le site
  useEffect(() => {
    // Initialiser le gestionnaire d'erreurs d'images
    window.addEventListener('error', function(e) {
      if (e.target.tagName.toLowerCase() === 'img') {
        handleImageError(e);
        return true; // Empêcher la propagation de l'erreur
      }
    }, true);
    
    // Vérifier si l'utilisateur a déjà visité le site
    const hasVisited = localStorage.getItem('flodrama_visited') === 'true';
    
    // Si l'utilisateur a déjà visité le site ou si l'interface enrichie est demandée dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const showEnhanced = urlParams.get('enhanced') === 'true';
    
    if (hasVisited || showEnhanced || window.location.pathname.includes('/app')) {
      setShowLanding(false);
    }
    
    // Simuler un temps de chargement
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Fonction pour entrer dans l'application depuis la landing page
  const handleEnterApp = () => {
    localStorage.setItem('flodrama_visited', 'true');
    localStorage.setItem('flodrama_interface', 'enhanced');
    setShowLanding(false);
  };

  // Afficher le spinner de chargement
  if (loading) {
    return <LoadingSpinner />;
  }

  // Afficher la landing page ou l'application principale
  return (
    <ThemeProvider>
      <UserProvider>
        <MetadataProvider>
          <WatchlistProvider>
            <Router>
              {showLanding ? (
                <LandingPage onEnter={handleEnterApp} />
              ) : (
                <Routes>
                  <Route path="/" element={<EnhancedHomePage />} />
                  <Route path="/app" element={<EnhancedHomePage />} />
                  <Route path="/details/:id" element={<DramaDetailsPage />} />
                  <Route path="/watch/:id" element={<PlayerPage />} />
                  <Route path="/browse/:category" element={<BrowsePage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="*" element={<Navigate to="/error" replace />} />
                </Routes>
              )}
            </Router>
          </WatchlistProvider>
        </MetadataProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
