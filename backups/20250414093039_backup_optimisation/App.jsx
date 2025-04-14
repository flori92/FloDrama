import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { lazyLoad } from './utils/lazyLoader';
import AppErrorBoundary from './components/AppErrorBoundary';
import localImageFallback from './utils/localImageFallback';

// Chargement paresseux des pages pour optimiser les performances
const OptimizedHomePage = lazyLoad(() => import('./pages/OptimizedHomePage'));
const LazyHomePage = lazyLoad(() => import('./pages/HomePage'));
const LazyDetailPage = lazyLoad(() => import('./pages/DetailPage'));
const LazyVideoPlayerPage = lazyLoad(() => import('./pages/VideoPlayerPage'));
const LazySearchPage = lazyLoad(() => import('./pages/SearchPage'));
const LazyNotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'));
const LazyErrorPage = lazyLoad(() => import('./pages/ErrorPage'));
const LazyWatchlistPage = lazyLoad(() => import('./pages/WatchlistPage'));
const LazyDramaPage = lazyLoad(() => import('./pages/DramaPage'));
const LazyMoviePage = lazyLoad(() => import('./pages/MoviePage'));
const LazyLandingPage = lazyLoad(() => import('./pages/LandingPage'));

// Composant de chargement pour les transitions entre pages
const PageLoading = () => (
  <div className="page-loading">
    <div className="loading-spinner"></div>
    <p>Chargement...</p>
    <style jsx="true">{`
      .page-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #121118;
        color: white;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #d946ef;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 16px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Composant principal de l'application FloDrama
 * Version optimisée avec code splitting et gestion d'erreurs
 */
function App() {
  const [isEnhanced, setIsEnhanced] = useState(true); // Par défaut, utiliser l'interface optimisée
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialiser les utilitaires au démarrage de l'application
  useEffect(() => {
    try {
      // Initialiser les placeholders pour les images
      localImageFallback.createPlaceholders();
      console.log('Placeholders d\'images initialisés');
    } catch (err) {
      console.warn('Erreur lors de l\'initialisation des placeholders:', err);
    }
  }, []);

  // Vérifier si l'interface améliorée est demandée via l'URL ou les paramètres
  useEffect(() => {
    try {
      // Vérifier les paramètres d'URL
      const urlParams = new URLSearchParams(window.location.search);
      const enhancedParam = urlParams.get('enhanced');
      const classicParam = urlParams.get('classic');
      
      // Vérifier les variables d'environnement
      const skipLanding = import.meta.env.VITE_SKIP_LANDING_PAGE === 'true';
      const defaultInterface = import.meta.env.VITE_DEFAULT_INTERFACE === 'enhanced';
      const enableEnhancedUI = import.meta.env.VITE_ENABLE_ENHANCED_UI === 'true';
      
      // Déterminer si l'interface optimisée doit être affichée
      let shouldShowEnhanced = true;
      
      // Si le paramètre classic est présent, utiliser l'interface classique
      if (classicParam !== null) {
        shouldShowEnhanced = false;
      }
      
      // Si le paramètre enhanced est présent, utiliser l'interface optimisée
      if (enhancedParam !== null) {
        shouldShowEnhanced = true;
      }
      
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
      
      // Ajouter un timestamp aux logs pour le débogage
      console.log(`FloDrama initialisation: ${new Date().toISOString()}`);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de l\'application:', err);
      setError('Une erreur est survenue lors du chargement de l\'application.');
      setIsLoading(false);
    }
  }, []);

  // Afficher un écran de chargement
  if (isLoading) {
    return <PageLoading />;
  }

  // Afficher une page d'erreur en cas de problème
  if (error) {
    return (
      <AppErrorBoundary>
        <LazyErrorPage message={error} />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <Router>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                {/* Redirection en fonction du mode d'interface */}
                <Route 
                  path="/" 
                  element={isEnhanced ? <OptimizedHomePage /> : <LazyLandingPage />} 
                />
                
                {/* Routes principales */}
                <Route path="/app" element={<OptimizedHomePage />} />
                <Route path="/home" element={<OptimizedHomePage />} />
                <Route path="/classic" element={<LazyHomePage />} />
                <Route path="/search" element={<LazySearchPage />} />
                <Route path="/watchlist" element={<LazyWatchlistPage />} />
                
                {/* Routes de catégories */}
                <Route path="/category/dramas" element={<LazyDramaPage />} />
                <Route path="/category/movies" element={<LazyMoviePage />} />
                <Route path="/category/:category" element={<LazyDramaPage />} />
                
                {/* Routes de détail et lecture */}
                <Route path="/details/:id" element={<LazyDetailPage />} />
                <Route path="/watch/:id" element={<LazyVideoPlayerPage />} />
                <Route path="/watch/:type/:id" element={<LazyVideoPlayerPage />} />
                <Route path="/watch/:type/:id/:episode" element={<LazyVideoPlayerPage />} />
                
                {/* Route 404 */}
                <Route path="*" element={<LazyNotFoundPage />} />
              </Routes>
            </Suspense>
          </Router>
        </AppProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
