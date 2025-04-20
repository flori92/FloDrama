/**
 * Registre des composants Next.js/React pour FloDrama
 * Ce fichier centralise la configuration des composants utilisés dans l'application
 */

import { lazy } from 'react';

// Types de base
export interface ComponentConfig {
  reactComponent: any;
  defaultProps?: Record<string, any>;
}

// Configuration des composants
export const ComponentRegistry: Record<string, ComponentConfig> = {
  // Composants Vidéo
  LecteurVideo: {
    reactComponent: lazy(() => import('react-player')),
    defaultProps: {
      controls: true,
      width: '100%',
      height: 'auto'
    }
  },

  // Composants Carousel
  Carousel: {
    reactComponent: lazy(() => import('react-slick')),
    defaultProps: {
      dots: true,
      infinite: true,
      speed: 500
    }
  },

  // Composants Modal
  Modal: {
    reactComponent: lazy(() => import('react-modal')),
    defaultProps: {
      closeTimeoutMS: 200
    }
  },

  // Composants de Navigation
  Navigation: {
    reactComponent: lazy(() => import('react-router-dom').then(m => ({ default: m.BrowserRouter }))),
    defaultProps: {}
  },

  // Composants de Formulaire
  Form: {
    reactComponent: lazy(() => import('react-hook-form').then(m => ({ default: m.FormProvider }))),
    defaultProps: {
      mode: 'onChange'
    }
  },

  // Composants d'Animation
  Animation: {
    reactComponent: lazy(() => import('framer-motion').then(m => ({ default: m.motion.div }))),
    defaultProps: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  }
};

// Fonction utilitaire pour vérifier la disponibilité d'un composant
export const isComponentAvailable = (componentName: string): boolean => {
  try {
    const config = ComponentRegistry[componentName];
    if (!config) return false;

    // Vérifier si le composant est disponible
    return Boolean(config.reactComponent);
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
