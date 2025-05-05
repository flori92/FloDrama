import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { checkApiStatus } from './services/apiService';
import VideoProvider from './components/VideoProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import './styles/global.css';
import './styles/identity.css';

// Import des pages existantes avec lazy loading
const HomePage = lazy(() => import('./pages/HomePage'));

// Composants temporaires pour les pages non encore implémentées
const PageFallback = ({ title }) => (
  <div className="page-fallback">
    <h2 className="flo-section-title flo-text-gradient">Page {title} en cours de développement</h2>
    <p>Cette section sera bientôt disponible.</p>
  </div>
);

const FilmsPage = () => <PageFallback title="Films" />;
const DramasPage = () => <PageFallback title="Dramas" />;
const AnimesPage = () => <PageFallback title="Animes" />;
const BollywoodPage = () => <PageFallback title="Bollywood" />;

// Composant de chargement
const LoadingFallback = () => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
    <p>Chargement...</p>
  </div>
);

function App() {
  const [apiStatus, setApiStatus] = useState({ status: 'loading', message: 'Connexion à l\'API...' });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const status = await checkApiStatus();
        setApiStatus({ 
          status: 'connected', 
          message: `API connectée (${status.environment})` 
        });
      } catch (error) {
        console.error('Erreur de connexion à l\'API:', error);
        setApiStatus({ 
          status: 'error', 
          message: 'Erreur de connexion à l\'API' 
        });
      }
    };

    checkApi();
  }, []);

  return (
    <VideoProvider>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <div className={`api-status ${apiStatus.status}`}>
            {apiStatus.message}
          </div>
          
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/films" element={<FilmsPage />} />
              <Route path="/dramas" element={<DramasPage />} />
              <Route path="/animes" element={<AnimesPage />} />
              <Route path="/bollywood" element={<BollywoodPage />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </VideoProvider>
  );
}

export default App;
