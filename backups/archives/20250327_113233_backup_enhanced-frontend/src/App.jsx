import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PlayerPage from './pages/PlayerPage';
import ContentPage from './pages/ContentPage';
import ErrorPage from './pages/ErrorPage';
import LoadingSpinner from './components/LoadingSpinner';
import ContentDataService from './services/ContentDataService';
import './styles/App.css';

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
  const generateMockData = () => {
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
  };
  
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
  }, []);
  
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
        <Routes>
          <Route path="/" element={<HomePage initialData={homeData} />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
