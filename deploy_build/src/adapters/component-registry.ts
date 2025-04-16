/**
 * Registre des composants hybrides pour FloDrama
 * Ce fichier centralise la configuration et la disponibilité des composants
 */

import { lazy } from 'react';

// Types de base
export interface ComponentConfig {
  lynxComponent: string;
  reactFallback: any;
  defaultProps?: Record<string, any>;
  forceReact?: boolean;
}

// Configuration des composants
export const ComponentRegistry: Record<string, ComponentConfig> = {
  // Composants Vidéo
  LecteurVideo: {
    lynxComponent: 'LynxVideo',
    reactFallback: lazy(() => import('react-player')),
    defaultProps: {
      controls: true,
      width: '100%',
      height: 'auto'
    }
  },

  // Composants Carousel
  Carousel: {
    lynxComponent: 'LynxCarousel',
    reactFallback: lazy(() => import('react-slick')),
    defaultProps: {
      dots: true,
      infinite: true,
      speed: 500
    }
  },

  // Composants Modal
  Modal: {
    lynxComponent: 'LynxModal',
    reactFallback: lazy(() => import('react-modal')),
    defaultProps: {
      closeTimeoutMS: 200
    }
  },

  // Composants de Navigation
  Navigation: {
    lynxComponent: 'LynxNavigation',
    reactFallback: lazy(() => import('react-router-dom').then(m => ({ default: m.BrowserRouter }))),
    defaultProps: {}
  },

  // Composants de Formulaire
  Form: {
    lynxComponent: 'LynxForm',
    reactFallback: lazy(() => import('react-hook-form').then(m => ({ default: m.FormProvider }))),
    defaultProps: {
      mode: 'onChange'
    }
  },

  // Composants d'Animation
  Animation: {
    lynxComponent: 'LynxAnimation',
    reactFallback: lazy(() => import('framer-motion').then(m => ({ default: m.motion.div }))),
    defaultProps: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  }
};

// Fonction utilitaire pour vérifier la disponibilité d'un composant Lynx
export const isLynxComponentAvailable = (componentName: string): boolean => {
  try {
    const config = ComponentRegistry[componentName];
    if (!config) return false;

    // Vérifier si le composant Lynx est disponible
    return !config.forceReact && Boolean(config.lynxComponent);
  } catch {
    return false;
  }
};

// Fonction pour récupérer la configuration d'un composant
export const getComponentConfig = (componentName: string): ComponentConfig | null => {
  return ComponentRegistry[componentName] || null;
};

// Types d'export pour TypeScript
export type ComponentName = keyof typeof ComponentRegistry;
export type ComponentProps<T extends ComponentName> = 
  typeof ComponentRegistry[T]['defaultProps'] & Record<string, any>;
