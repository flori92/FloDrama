import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazyLoad, preloadRelatedComponents } from './utils/lazyLoader';
import PageTransition from './components/transitions/PageTransition';
import LoadingSpinner from './components/LoadingSpinner';
import ContentDataService from './services/ContentDataService';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import './styles/App.css';

// Chargement paresseux des pages
const HomePage = lazyLoad(() => import('./pages/HomePage'));
const SearchPage = lazyLoad(() => import('./pages/SearchPage'));
const ProfilePage = lazyLoad(() => import('./pages/ProfilePage'));
const SettingsPage = lazyLoad(() => import('./pages/SettingsPage'));
const PlayerPage = lazyLoad(() => import('./pages/PlayerPage'));
const ContentPage = lazyLoad(() => import('./pages/ContentPage'));
const MyListPage = lazyLoad(() => import('./pages/MyListPage'));
const CategoryPage = lazyLoad(() => import('./pages/CategoryPage'));
const ErrorPage = lazyLoad(() => import('./pages/ErrorPage'));
const RecommendationsDemo = lazyLoad(() => import('./pages/RecommendationsDemo'));

// Composant pour précharger les composants liés à la page actuelle
// et gérer les transitions de page
const RouteManager = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    preloadRelatedComponents(location.pathname);
  }, [location.pathname]);
  
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
};

/**
 * Composant principal de l'application FloDrama
 * Initialise les services et configure le routage
 */
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [homeData, setHomeData] = useState({
    popular: [],
    dramas: [],
    animes: [],
    movies: []
  });
  
  // Fonction pour générer des données mockées en cas d'erreur
  const generateMockData = useCallback(() => {
    return {
      popular: Array(10).fill().map((_, i) => ({
        id: `mock-popular-${i}`,
        title: `Contenu populaire ${i+1}`,
        image: '/assets/placeholder.jpg',
        type: i % 2 === 0 ? 'movie' : 'drama'
      })),
      dramas: Array(10).fill().map((_, i) => ({
        id: `mock-drama-${i}`,
        title: `Drama ${i+1}`,
        image: '/assets/placeholder.jpg',
        type: 'drama'
      })),
      animes: Array(10).fill().map((_, i) => ({
        id: `mock-anime-${i}`,
        title: `Anime ${i+1}`,
        image: '/assets/placeholder.jpg',
        type: 'anime'
      })),
      movies: Array(10).fill().map((_, i) => ({
        id: `mock-movie-${i}`,
        title: `Film ${i+1}`,
        image: '/assets/placeholder.jpg',
        type: 'movie'
      }))
    };
  }, []);
  
  useEffect(() => {
    // Initialiser les services
    const initializeApp = async () => {
      try {
        console.log('Initialisation de l\'application...');
        
        // Initialiser le service de contenu
        if (!ContentDataService) {
          throw new Error('ContentDataService n\'est pas défini');
        }
        
        await ContentDataService.init();
        console.log('Service de contenu initialisé avec succès');
        
        // Précharger les données de la page d'accueil
        try {
          const data = await ContentDataService.preloadHomePageData();
          if (data) {
            console.log('Données préchargées avec succès:', data);
            setHomeData(data);
          } else {
            console.warn('Aucune donnée retournée, utilisation des données mockées');
            setHomeData(generateMockData());
          }
        } catch (dataError) {
          console.error('Erreur lors du préchargement des données:', dataError);
          setHomeData(generateMockData());
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        setError(error.message);
        setHomeData(generateMockData());
      } finally {
        // Terminer le chargement après un délai minimum
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };
    
    initializeApp();
  }, [generateMockData]);
  
  // Afficher l'écran de démarrage pendant le chargement
  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p className="loading-text">Chargement de FloDrama...</p>
      </div>
    );
  }
  
  // Afficher un message d'erreur si l'initialisation a échoué
  if (error) {
    console.warn('Affichage de l\'interface malgré l\'erreur:', error);
    // Continuer à afficher l'application avec les données mockées
  }
  
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="app-content">
          <Routes>
            <Route path="/" element={
              <RouteManager>
                <HomePage initialData={homeData} />
              </RouteManager>
            } />
            <Route path="/recherche" element={
              <RouteManager>
                <SearchPage />
              </RouteManager>
            } />
            <Route path="/ma-liste" element={
              <RouteManager>
                <MyListPage />
              </RouteManager>
            } />
            <Route path="/profil" element={
              <RouteManager>
                <ProfilePage />
              </RouteManager>
            } />
            <Route path="/parametres" element={
              <RouteManager>
                <SettingsPage />
              </RouteManager>
            } />
            <Route path="/player" element={
              <RouteManager>
                <PlayerPage />
              </RouteManager>
            } />
            <Route path="/contenu/:id" element={
              <RouteManager>
                <ContentPage />
              </RouteManager>
            } />
            <Route path="/dramas" element={
              <RouteManager>
                <CategoryPage type="drama" title="Dramas" />
              </RouteManager>
            } />
            <Route path="/dramas/:subcategory" element={
              <RouteManager>
                <CategoryPage type="drama" />
              </RouteManager>
            } />
            <Route path="/films" element={
              <RouteManager>
                <CategoryPage type="film" title="Films" />
              </RouteManager>
            } />
            <Route path="/films/:subcategory" element={
              <RouteManager>
                <CategoryPage type="film" />
              </RouteManager>
            } />
            <Route path="/nouveautes" element={
              <RouteManager>
                <CategoryPage type="new" title="Nouveautés" />
              </RouteManager>
            } />
            <Route path="/nouveautes/:subcategory" element={
              <RouteManager>
                <CategoryPage type="new" />
              </RouteManager>
            } />
            <Route path="/top10" element={
              <RouteManager>
                <CategoryPage type="top" title="Top 10" />
              </RouteManager>
            } />
            <Route path="/recommandations" element={
              <RouteManager>
                <RecommendationsDemo />
              </RouteManager>
            } />
            <Route path="/recommandations/:type" element={
              <RouteManager>
                <RecommendationsDemo />
              </RouteManager>
            } />
            <Route path="*" element={
              <RouteManager>
                <ErrorPage />
              </RouteManager>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
