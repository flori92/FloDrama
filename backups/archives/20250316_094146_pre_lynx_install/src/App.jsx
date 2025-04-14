import React, { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import DramaPage from './pages/DramaPage';
import MoviePage from './pages/MoviePage';
import SearchPage from './pages/SearchPage';
import WatchlistPage from './pages/WatchlistPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import DownloadAppPage from './pages/DownloadAppPage';
import PageTransition from './components/animations/PageTransition';
import SplashScreen from './components/animations/SplashScreen';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { initBunnyCDN } from './utils/bunny-cdn-integration';
import { initMonitoring } from './utils/monitor-flodrama';
import LoadingSpinner from './components/ui/LoadingSpinner';
import scrapingService from './services/ScrapingService';

// Composant wrapper pour les transitions de page
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Pages de support chargées de manière asynchrone pour optimiser le chargement initial
  const FAQPage = React.lazy(() => import('./pages/support/FAQPage'));
  const ContactPage = React.lazy(() => import('./pages/support/ContactPage'));
  const AboutPage = React.lazy(() => import('./pages/support/AboutPage'));
  const TechnologiesPage = React.lazy(() => import('./pages/support/TechnologiesPage'));
  const TermsPage = React.lazy(() => import('./pages/support/TermsPage'));
  const PrivacyPage = React.lazy(() => import('./pages/support/PrivacyPage'));
  const HelpPage = React.lazy(() => import('./pages/support/HelpPage'));
  const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
  const DetailPage = React.lazy(() => import('./pages/DetailPage'));
  const PlayPage = React.lazy(() => import('./pages/PlayPage'));
  const WatchPartyPage = React.lazy(() => import('./pages/WatchPartyPage'));
  const WatchPartyListPage = React.lazy(() => import('./pages/WatchPartyListPage'));
  const VideoPlayerPage = React.lazy(() => import('./pages/VideoPlayerPage'));
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Routes principales */}
            <Route path="/" element={
              <PageTransition type="fade">
                <HomePage />
              </PageTransition>
            } />
            
            <Route path="/dramas" element={
              <PageTransition type="slide" direction="right">
                <DramaPage />
              </PageTransition>
            } />
            
            <Route path="/movies" element={
              <PageTransition type="slide" direction="left">
                <MoviePage />
              </PageTransition>
            } />
            
            <Route path="/search" element={
              <PageTransition type="fade">
                <SearchPage />
              </PageTransition>
            } />
            
            {/* Route de la liste personnelle */}
            <Route path="/watchlist" element={
              <PageTransition type="slide" direction="right">
                <WatchlistPage />
              </PageTransition>
            } />
            
            {/* Route de détail */}
            <Route path="/:type/:id" element={
              <PageTransition type="zoom">
                <Suspense fallback={<LoadingSpinner />}>
                  <DetailPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/:type/:id/play/:episode?" element={
              <PageTransition type="fade">
                <Suspense fallback={<LoadingSpinner />}>
                  <PlayPage />
                </Suspense>
              </PageTransition>
            } />
            
            {/* Route d'abonnement */}
            <Route path="/subscription" element={
              <PageTransition type="fade">
                <Suspense fallback={<LoadingSpinner />}>
                  <SubscriptionPage />
                </Suspense>
              </PageTransition>
            } />
            
            {/* Routes pour les pages de support */}
            <Route path="/support/faq" element={
              <PageTransition type="fade">
                <Suspense fallback={<LoadingSpinner />}>
                  <FAQPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/contact" element={
              <PageTransition type="slide" direction="right">
                <Suspense fallback={<LoadingSpinner />}>
                  <ContactPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/about" element={
              <PageTransition type="slide" direction="left">
                <Suspense fallback={<LoadingSpinner />}>
                  <AboutPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/technologies" element={
              <PageTransition type="slide" direction="left">
                <Suspense fallback={<LoadingSpinner />}>
                  <TechnologiesPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/terms" element={
              <PageTransition type="slide" direction="left">
                <Suspense fallback={<LoadingSpinner />}>
                  <TermsPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/privacy" element={
              <PageTransition type="slide" direction="left">
                <Suspense fallback={<LoadingSpinner />}>
                  <PrivacyPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/support/help" element={
              <PageTransition type="slide" direction="left">
                <Suspense fallback={<LoadingSpinner />}>
                  <HelpPage />
                </Suspense>
              </PageTransition>
            } />
            
            {/* Route pour télécharger l'application */}
            <Route path="/download" element={
              <PageTransition type="slide" direction="up">
                <DownloadAppPage />
              </PageTransition>
            } />
            
            {/* Route d'administration */}
            <Route path="/admin" element={
              <PageTransition type="fade">
                <AdminPage />
              </PageTransition>
            } />
            
            {/* Routes sociales */}
            <Route path="/watch-party/:id" element={
              <PageTransition type="slide">
                <Suspense fallback={<LoadingSpinner />}>
                  <WatchPartyPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/watch-parties" element={
              <PageTransition type="slide" direction="right">
                <Suspense fallback={<LoadingSpinner />}>
                  <WatchPartyListPage />
                </Suspense>
              </PageTransition>
            } />
            
            <Route path="/video/:id" element={
              <PageTransition type="fade">
                <Suspense fallback={<LoadingSpinner />}>
                  <VideoPlayerPage />
                </Suspense>
              </PageTransition>
            } />
            
            {/* Route 404 */}
            <Route path="*" element={
              <PageTransition type="fade">
                <NotFoundPage />
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

/**
 * Composant principal de l'application FloDrama
 * Initialise les services et configure le routage
 */
function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    // Initialisation de Bunny CDN
    initBunnyCDN();
    
    // Initialisation du système de surveillance
    initMonitoring();
    
    // Initialisation du service de scraping en arrière-plan
    const initScraping = async () => {
      console.log('[INFO] Initialisation du service de scraping en arrière-plan');
      try {
        // Récupération des données de base (dramas populaires)
        const dramaData = await scrapingService.fetchFromVoirDrama({ category: 'drama-list', page: 1 });
        console.log(`[INFO] ${dramaData.length} dramas récupérés par scraping`);
        
        // Récupération des films populaires
        const movieData = await scrapingService.fetchFromVoirDrama({ category: 'movie-list', page: 1 });
        console.log(`[INFO] ${movieData.length} films récupérés par scraping`);
      } catch (error) {
        console.error('[ERROR] Erreur lors de l\'initialisation du scraping:', error);
      }
    };
    
    // Lancer le scraping en arrière-plan
    initScraping();
    
    console.log('FloDrama initialized successfully');
  }, []);
  
  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <Router>
          <AnimatedRoutes />
        </Router>
      )}
    </>
  );
}

export default App;
