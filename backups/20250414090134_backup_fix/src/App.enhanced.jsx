import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { MetadataProvider } from './contexts/MetadataContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/enhanced.css';

// Chargement paresseux des composants pour optimiser les performances
const EnhancedHomePage = lazy(() => import('./pages/EnhancedHomePage'));
const DramaDetailsPage = lazy(() => import('./pages/DramaDetailsPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

// Composant de chargement pour Suspense
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Chargement en cours...</p>
  </div>
);

// Composant de fallback pour les erreurs
const ErrorFallback = (error, errorInfo, { onReset, onReload, onGoHome }) => (
  <div className="error-container">
    <div className="error-content">
      <h2>Une erreur est survenue</h2>
      <p>Nous sommes désolés pour ce désagrément. Notre équipe technique a été informée du problème.</p>
      
      <div className="error-actions">
        <button onClick={onReset} className="btn btn-primary">
          Réessayer
        </button>
        <button onClick={onReload} className="btn btn-secondary">
          Recharger la page
        </button>
        <button onClick={onGoHome} className="btn btn-outline">
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  </div>
);

/**
 * Application FloDrama améliorée
 * Version refonte complète avec une nouvelle interface utilisateur
 * et une meilleure gestion des données pour une expérience de streaming optimale
 */
const EnhancedApp = () => {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <ThemeProvider>
        <UserProvider>
          <MetadataProvider>
            <WatchlistProvider>
              <Router>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Page d'accueil */}
                      <Route path="/" element={<EnhancedHomePage />} />
                      
                      {/* Pages de navigation */}
                      <Route path="/dramas" element={<BrowsePage category="drama" />} />
                      <Route path="/films" element={<BrowsePage category="movie" />} />
                      <Route path="/nouveautes" element={<BrowsePage category="new" />} />
                      
                      {/* Pages de détails et lecture */}
                      <Route path="/details/:id" element={<DramaDetailsPage />} />
                      <Route path="/watch/:id" element={<PlayerPage />} />
                      
                      {/* Pages utilisateur */}
                      <Route path="/ma-liste" element={<WatchlistPage />} />
                      <Route path="/profil" element={<ProfilePage />} />
                      <Route path="/recherche" element={<SearchResultsPage />} />
                      
                      {/* Page d'erreur */}
                      <Route path="/erreur" element={<ErrorPage />} />
                      
                      {/* Redirection vers la page d'accueil pour les routes non définies */}
                      <Route path="*" element={<Navigate to="/erreur" replace />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </Router>
            </WatchlistProvider>
          </MetadataProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default EnhancedApp;
