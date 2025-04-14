import React from 'react';
import { View, Text, Platform } from '@lynx/core';
import { styled } from '@lynx/styled';
import { useNavigation, useRoute } from '@lynx/navigation';
import { useAnimationLynx } from '../../hooks/useAnimationLynx';
import { BarreNavigation } from './BarreNavigation';

const ConteneurPrincipal = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

const ConteneurPage = styled(View)`
  flex: 1;
`;

const ConteneurTransition = styled(View)`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const NavigationPrincipale = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const animation = useAnimationLynx({
    type: 'page',
    customConfig: {
      duration: Platform.select({
        ios: 300,
        android: 250,
        web: 200
      })
    }
  });

  // Gestion des transitions entre les pages
  const transitionPage = async (page, direction = 'gauche') => {
    // Préparer la nouvelle page
    const nouvellePage = (
      <ConteneurTransition ref={animation.elementRef}>
        {page}
      </ConteneurTransition>
    );

    // Animation de transition
    await animation.sequence([
      {
        type: 'translate',
        direction: direction === 'gauche' ? 'right' : 'left',
        distance: window.innerWidth
      },
      {
        type: 'fade',
        direction: 'in'
      }
    ]);

    return nouvellePage;
  };

  // Configuration des routes
  const routes = {
    accueil: {
      titre: 'Accueil',
      component: React.lazy(() => import('../../pages/Accueil')),
      options: {
        animation: 'fade'
      }
    },
    dramas: {
      titre: 'Dramas',
      component: React.lazy(() => import('../../pages/Dramas')),
      options: {
        animation: 'slide'
      }
    },
    films: {
      titre: 'Films',
      component: React.lazy(() => import('../../pages/Films')),
      options: {
        animation: 'slide'
      }
    },
    favoris: {
      titre: 'Favoris',
      component: React.lazy(() => import('../../pages/Favoris')),
      options: {
        animation: 'slide'
      }
    },
    recherche: {
      titre: 'Recherche',
      component: React.lazy(() => import('../../pages/Recherche')),
      options: {
        animation: 'fade'
      }
    },
    lecteur: {
      titre: 'Lecteur',
      component: React.lazy(() => import('../../pages/Lecteur')),
      options: {
        animation: 'fade',
        pleinEcran: true
      }
    }
  };

  // Rendu de la page actuelle
  const renderPage = () => {
    const routeActuelle = route.name;
    const RouteComponent = routes[routeActuelle]?.component;

    if (!RouteComponent) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Page non trouvée</Text>
        </View>
      );
    }

    return (
      <React.Suspense fallback={<Text>Chargement...</Text>}>
        <RouteComponent />
      </React.Suspense>
    );
  };

  return (
    <ConteneurPrincipal>
      <ConteneurPage>
        {renderPage()}
      </ConteneurPage>
      
      {/* Masquer la barre de navigation en mode plein écran */}
      {!routes[route.name]?.options?.pleinEcran && (
        <BarreNavigation />
      )}
    </ConteneurPrincipal>
  );
};
