import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HybridComponent } from '@/adapters/hybrid-component';
import { useHybridComponent } from '@/hooks/useHybridComponent';

// Chargement paresseux des composants principaux
const Navigation = React.lazy(() => import('@/components/navigation/Navigation'));
const LecteurVideo = React.lazy(() => import('@/components/player/LecteurVideo'));
const CarouselDynamique = React.lazy(() => import('@/components/features/CarouselDynamique'));

/**
 * Composant principal de FloDrama
 * Utilise l'architecture hybride Lynx/React
 */
const App: React.FC = () => {
  // Utilisation du hook hybride pour la navigation
  const { isUsingLynx, adaptedProps, error } = useHybridComponent('Navigation', {
    items: [
      { label: 'Accueil', route: '/' },
      { label: 'Découvrir', route: '/decouvrir' },
      { label: 'Favoris', route: '/favoris' },
      { label: 'Profil', route: '/profil' }
    ]
  });

  if (error) {
    console.error('Erreur de chargement :', error);
    // Fallback en cas d'erreur
    return <div>Une erreur est survenue lors du chargement de l'application.</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Suspense fallback={<div>Chargement...</div>}>
          {/* Navigation principale */}
          <HybridComponent
            componentName="Navigation"
            isLynx={isUsingLynx}
            props={adaptedProps}
          />

          {/* Contenu principal */}
          <main className="main-content">
            <Suspense fallback={<div>Chargement du lecteur...</div>}>
              <LecteurVideo />
            </Suspense>

            <Suspense fallback={<div>Chargement des recommandations...</div>}>
              <CarouselDynamique />
            </Suspense>
          </main>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
