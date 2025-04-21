import React, { lazy, ReactNode } from 'react';

// Type pour les composants du registre
export interface ComponentConfig {
  name: string;
  component: React.ComponentType<any>;
  loadAsync?: boolean;
  defaultProps?: Record<string, any>;
  fallback?: ReactNode;
  lazyOptions?: {
    ssr: boolean;
    suspense: boolean;
  };
}

// Imports dynamiques pour les composants principaux
const HeroBanner = lazy(() => import('./HeroBanner'));
const ContentRow = lazy(() => import('./ContentRow'));
const ContentCard = lazy(() => import('./ContentCard'));
const FeaturedSection = lazy(() => import('./FeaturedSection'));
const Header = lazy(() => import('./Header'));
const Footer = lazy(() => import('./Footer'));

// Fallbacks par défaut
const defaultFallbacks = {
  heroBanner: <div className="h-[85vh] w-full bg-gradient-to-r from-blue-500/20 to-fuchsia-500/20 animate-pulse rounded-lg"></div>,
  contentRow: <div className="h-64 w-full bg-gradient-to-r from-blue-500/10 to-fuchsia-500/10 animate-pulse rounded-lg my-8"></div>,
  contentCard: <div className="w-[200px] h-[300px] bg-white/5 animate-pulse rounded-md"></div>,
  featuredSection: <div className="h-96 w-full bg-gradient-to-r from-blue-500/10 to-fuchsia-500/10 animate-pulse rounded-lg my-8"></div>,
  header: <div className="h-16 w-full bg-black/80 animate-pulse"></div>,
  footer: <div className="h-64 w-full bg-black animate-pulse mt-8"></div>
};

// Registre de composants
const componentRegistry: Record<string, ComponentConfig> = {
  // Navigation & Structure
  'Header': {
    name: 'Header',
    component: Header,
    loadAsync: true,
    fallback: defaultFallbacks.header,
    lazyOptions: { ssr: true, suspense: true }
  },
  'Footer': {
    name: 'Footer',
    component: Footer,
    loadAsync: true,
    fallback: defaultFallbacks.footer,
    lazyOptions: { ssr: true, suspense: true }
  },
  
  // Composants de contenu
  'HeroBanner': {
    name: 'HeroBanner',
    component: HeroBanner,
    loadAsync: true,
    defaultProps: {
      autoPlay: true,
      interval: 6000,
      enableHoverPause: true
    },
    fallback: defaultFallbacks.heroBanner,
    lazyOptions: { ssr: true, suspense: true }
  },
  'ContentRow': {
    name: 'ContentRow',
    component: ContentRow,
    loadAsync: true,
    defaultProps: {
      items: []
    },
    fallback: defaultFallbacks.contentRow,
    lazyOptions: { ssr: true, suspense: true }
  },
  'ContentCard': {
    name: 'ContentCard',
    component: ContentCard,
    loadAsync: true,
    defaultProps: {
      title: '',
      image: '/static/placeholders/content-placeholder.jpg'
    },
    fallback: defaultFallbacks.contentCard,
    lazyOptions: { ssr: true, suspense: true }
  },
  'FeaturedSection': {
    name: 'FeaturedSection',
    component: FeaturedSection,
    loadAsync: true,
    defaultProps: {
      title: '',
      items: []
    },
    fallback: defaultFallbacks.featuredSection,
    lazyOptions: { ssr: true, suspense: true }
  }
};

/**
 * Récupère un composant du registre
 * @param name Nom du composant à récupérer
 * @returns Configuration du composant
 */
export const getComponent = (name: string): ComponentConfig | undefined => {
  return componentRegistry[name];
};

/**
 * Récupère un composant avec chargement dynamique
 * @param name Nom du composant à récupérer
 * @param props Props à passer au composant
 * @returns Composant avec chargement dynamique
 */
export const getDynamicComponent = (name: string, props: any = {}): ReactNode => {
  const config = getComponent(name);
  
  if (!config) {
    console.warn(`Component "${name}" not found in registry`);
    return null;
  }
  
  const Component = config.component;
  const mergedProps = { ...config.defaultProps, ...props };
  
  if (config.loadAsync && config.fallback) {
    return (
      <React.Suspense fallback={config.fallback}>
        <Component {...mergedProps} />
      </React.Suspense>
    );
  }
  
  return <Component {...mergedProps} />;
};

export default componentRegistry;
