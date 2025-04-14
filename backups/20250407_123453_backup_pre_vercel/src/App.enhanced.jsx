import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EnhancedHomePage from './pages/EnhancedHomePage';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { MetadataProvider } from './contexts/MetadataContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/enhanced.css';

/**
 * Application FloDrama améliorée
 * Version refonte complète avec une nouvelle interface utilisateur
 * et une meilleure gestion des données
 */
const EnhancedApp = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <MetadataProvider>
          <WatchlistProvider>
            <Router>
              <Routes>
                {/* Page d'accueil */}
                <Route path="/" element={<EnhancedHomePage />} />
                
                {/* Redirection vers la page d'accueil pour les routes non définies */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </WatchlistProvider>
        </MetadataProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default EnhancedApp;
