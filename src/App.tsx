import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importation des types pour les props des composants
interface NavigationProps {
  items: Array<{
    label: string;
    route: string;
    icon?: string;
  }>;
  className?: string;
}

interface LecteurVideoProps {
  url: string;
  titre: string;
}

interface CarouselRecommandationsProps {
  userId: string;
}

interface LandingPageProps {
  onEnter: () => void;
}

// Composants de chargement
const LoadingIndicator = () => <div className="loading-container">Chargement de FloDrama...</div>;
const PlayerLoadingIndicator = () => <div>Chargement du lecteur...</div>;
const RecommendationsLoadingIndicator = () => <div>Chargement des recommandations...</div>;

// Composants paresseux avec gestion manuelle de la suspension
const LazyLecteurVideo = () => {
  const LecteurVideo = React.lazy(() => import('./components/player/LecteurVideo'));
  return (
    <React.Suspense fallback={<PlayerLoadingIndicator />}>
      {/* @ts-ignore - Contournement du problème de typage */}
      <LecteurVideo url="" titre="Bienvenue sur FloDrama" />
    </React.Suspense>
  );
};

const LazyCarouselRecommandations = () => {
  const CarouselRecommandations = React.lazy(() => import('./components/features/CarouselRecommandations'));
  return (
    <React.Suspense fallback={<RecommendationsLoadingIndicator />}>
      {/* @ts-ignore - Contournement du problème de typage */}
      <CarouselRecommandations userId="user123" />
    </React.Suspense>
  );
};

const LazyNavigation = (props: { items: NavigationProps['items'] }) => {
  const Navigation = React.lazy(() => import('./components/navigation/Navigation'));
  return (
    <React.Suspense fallback={<LoadingIndicator />}>
      {/* @ts-ignore - Contournement du problème de typage */}
      <Navigation items={props.items} />
    </React.Suspense>
  );
};

const LazyLandingPage = (props: { onEnter: LandingPageProps['onEnter'] }) => {
  const LandingPage = React.lazy(() => import('./pages/LandingPage'));
  return (
    <React.Suspense fallback={<LoadingIndicator />}>
      {/* @ts-ignore - Contournement du problème de typage */}
      <LandingPage onEnter={props.onEnter} />
    </React.Suspense>
  );
};

/**
 * Composant principal de FloDrama
 * Architecture React pure pour Vercel
 */
const App: React.FC = () => {
  // État pour déterminer si l'utilisateur est sur la landing page ou l'interface principale
  const [showLanding, setShowLanding] = useState(true);

  // Vérifier si l'utilisateur a déjà visité l'application ou si un paramètre d'URL est présent
  useEffect(() => {
    const hasVisited = localStorage.getItem('flodrama_visited');
    const urlParams = new URLSearchParams(window.location.search);
    const skipLanding = urlParams.get('skipLanding') === 'true' || 
                        urlParams.get('enhanced') === 'true' || 
                        window.location.pathname === '/app' ||
                        window.location.pathname === '/enhanced' ||
                        window.location.pathname === '/direct-enhanced';
    
    if (hasVisited || skipLanding) {
      setShowLanding(false);
    }
  }, []);

  // Fonction pour passer de la landing page à l'interface principale
  const handleEnterApp = () => {
    localStorage.setItem('flodrama_visited', 'true');
    setShowLanding(false);
  };

  // Configuration des éléments de navigation
  const navigationItems = [
    { label: 'Accueil', route: '/' },
    { label: 'Découvrir', route: '/decouvrir' },
    { label: 'Favoris', route: '/favoris' },
    { label: 'Profil', route: '/profil' }
  ];

  // Interface principale de l'application
  const MainInterface = () => (
    <div className="app-container">
      <LazyNavigation items={navigationItems} />
      <main className="main-content">
        <LazyLecteurVideo />
        <LazyCarouselRecommandations />
      </main>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Route principale qui affiche soit la landing page, soit l'interface principale */}
        <Route 
          path="/" 
          element={showLanding ? (
            <LazyLandingPage onEnter={handleEnterApp} />
          ) : (
            <MainInterface />
          )} 
        />
        
        {/* Routes directes vers l'interface principale */}
        <Route path="/app" element={<MainInterface />} />
        <Route path="/enhanced" element={<MainInterface />} />
        <Route path="/direct-enhanced" element={<MainInterface />} />
        <Route path="/home" element={<MainInterface />} />
        
        {/* Routes spécifiques de l'application */}
        <Route path="/decouvrir" element={<MainInterface />} />
        <Route path="/favoris" element={<MainInterface />} />
        <Route path="/profil" element={<MainInterface />} />
        
        {/* Redirection vers la route principale pour les routes non définies */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
