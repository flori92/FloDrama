/**
 * Utilitaire de chargement paresseux pour les composants React
 * 
 * Ce module permet de charger les composants de page à la demande,
 * ce qui améliore les performances de l'application en réduisant
 * la taille du bundle initial.
 */

import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Wrapper de chargement paresseux avec Suspense
 * @param {Function} importFunc - Fonction d'importation dynamique
 * @returns {React.LazyExoticComponent} Composant chargé paresseusement
 */
export const lazyLoad = (importFunc) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={<LazyLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Composant de fallback pendant le chargement
 */
const LazyLoadingFallback = () => {
  return (
    <div className="lazy-loading-fallback">
      <LoadingSpinner />
      <p>Chargement en cours...</p>
    </div>
  );
};

/**
 * Précharge un composant sans l'afficher
 * Utile pour précharger les pages qui seront probablement visitées
 * @param {Function} importFunc - Fonction d'importation dynamique
 */
export const preloadComponent = (importFunc) => {
  try {
    importFunc();
  } catch (error) {
    console.warn('Erreur lors du préchargement du composant:', error);
  }
};

/**
 * Précharge les composants en fonction de la page actuelle
 * @param {string} currentPath - Chemin actuel
 */
export const preloadRelatedComponents = (currentPath) => {
  // Précharger les composants en fonction de la page actuelle
  if (currentPath === '/') {
    // Sur la page d'accueil, précharger les pages les plus visitées
    preloadComponent(() => import('../pages/SearchPage'));
    preloadComponent(() => import('../pages/CategoryPage'));
  } else if (currentPath.startsWith('/contenu/')) {
    // Sur une page de contenu, précharger le lecteur vidéo
    preloadComponent(() => import('../pages/PlayerPage'));
  } else if (currentPath.startsWith('/dramas') || 
             currentPath.startsWith('/animes') || 
             currentPath.startsWith('/bollywood')) {
    // Sur une page de catégorie, précharger la page de contenu
    preloadComponent(() => import('../pages/ContentPage'));
  }
};

export default {
  lazyLoad,
  preloadComponent,
  preloadRelatedComponents
};
