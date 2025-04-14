import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import WatchlistPage from './pages/WatchlistPage';
import DramaPage from './pages/DramaPage';
import MoviePage from './pages/MoviePage';
import LandingPage from './pages/LandingPage';

/**
 * Composant principal de l'application FloDrama
 */
function App() {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si l'interface améliorée est demandée via l'URL ou les paramètres
  useEffect(() => {
    try {
      // Vérifier les paramètres d'URL
      const urlParams = new URLSearchParams(window.location.search);
      const enhancedParam = urlParams.get('enhanced');
      
      // Vérifier les variables d'environnement
      const skipLanding = import.meta.env.VITE_SKIP_LANDING_PAGE === 'true';
      const defaultInterface = import.meta.env.VITE_DEFAULT_INTERFACE === 'enhanced';
      const enableEnhancedUI = import.meta.env.VITE_ENABLE_ENHANCED_UI === 'true';
      
      // Forcer l'interface améliorée sur tous les domaines
      const shouldShowEnhanced = true;
      
      setIsEnhanced(shouldShowEnhanced);
      setIsLoading(false);
      
      // Supprimer le préchargeur si présent
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          try {
            preloader.remove();
          } catch (e) {
            console.warn('Erreur lors de la suppression du preloader:', e);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de l\'application:', err);
      setError('Une erreur est survenue lors du chargement de l\'application.');
      setIsLoading(false);
    }
  }, []);

  // Afficher un écran de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Chargement de FloDrama...</p>
        </div>
      </div>
    );
  }

  // Afficher une page d'erreur en cas de problème
  if (error) {
    return <ErrorPage message={error} />;
  }

  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Redirection en fonction du mode d'interface */}
            <Route 
              path="/" 
              element={isEnhanced ? <HomePage /> : <LandingPage />} 
            />
            
            {/* Routes principales */}
            <Route path="/app" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            
            {/* Routes de catégories */}
            <Route path="/category/dramas" element={<DramaPage />} />
            <Route path="/category/movies" element={<MoviePage />} />
            <Route path="/category/:category" element={<DramaPage />} />
            
            {/* Routes de détail et lecture */}
            <Route path="/details/:id" element={<DetailPage />} />
            <Route path="/watch/:id" element={<VideoPlayerPage />} />
            <Route path="/watch/:type/:id" element={<VideoPlayerPage />} />
            <Route path="/watch/:type/:id/:episode" element={<VideoPlayerPage />} />
            
            {/* Route 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
