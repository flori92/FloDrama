import React from 'react';
import ReactDOM from 'react-dom/client';
import EnhancedApp from './App.enhanced';
import './styles/enhanced.css';

/**
 * Point d'entrée pour la version améliorée de FloDrama
 * Cette version utilise des composants optimisés et une meilleure gestion des données
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <EnhancedApp />
  </React.StrictMode>
);
