/**
 * Registre de composants pour l'application
 * Permet de gérer les composants disponibles et leurs configurations
 */

// Types de composants disponibles dans l'application
export enum ComponentName {
  VIDEO_PLAYER = 'VIDEO_PLAYER',
  CAROUSEL = 'CAROUSEL',
  NAVIGATION = 'NAVIGATION',
  WATCH_PARTY = 'WATCH_PARTY',
  RECOMMENDATION = 'RECOMMENDATION',
  LOADING = 'LOADING'
}

// Interface de base pour les propriétés de composants
export interface ComponentProps {
  [key: string]: any;
}

// Configuration d'un composant
export interface ComponentConfig {
  name: ComponentName;
  displayName: string;
  description?: string;
  defaultProps?: ComponentProps;
  isAvailable?: boolean;
  version?: string;
}

// Registre des configurations de composants
const componentRegistry: Record<ComponentName, ComponentConfig> = {
  [ComponentName.VIDEO_PLAYER]: {
    name: ComponentName.VIDEO_PLAYER,
    displayName: 'Lecteur Vidéo',
    description: 'Lecteur vidéo pour les dramas',
    defaultProps: {
      autoPlay: false,
      controls: true,
      loop: false
    },
    isAvailable: true,
    version: '1.0.0'
  },
  [ComponentName.CAROUSEL]: {
    name: ComponentName.CAROUSEL,
    displayName: 'Carousel',
    description: 'Carousel pour afficher les contenus',
    defaultProps: {
      autoScroll: false,
      itemsPerPage: 5
    },
    isAvailable: true,
    version: '1.0.0'
  },
  [ComponentName.NAVIGATION]: {
    name: ComponentName.NAVIGATION,
    displayName: 'Navigation',
    description: 'Composant de navigation',
    defaultProps: {},
    isAvailable: true,
    version: '1.0.0'
  },
  [ComponentName.WATCH_PARTY]: {
    name: ComponentName.WATCH_PARTY,
    displayName: 'Watch Party',
    description: 'Fonctionnalité de visionnage en groupe',
    defaultProps: {
      maxMembers: 10
    },
    isAvailable: true,
    version: '1.0.0'
  },
  [ComponentName.RECOMMENDATION]: {
    name: ComponentName.RECOMMENDATION,
    displayName: 'Recommandations',
    description: 'Système de recommandations personnalisées',
    defaultProps: {
      limit: 10
    },
    isAvailable: true,
    version: '1.0.0'
  },
  [ComponentName.LOADING]: {
    name: ComponentName.LOADING,
    displayName: 'Chargement',
    description: 'Indicateur de chargement',
    defaultProps: {
      size: 'medium',
      color: '#4285f4'
    },
    isAvailable: true,
    version: '1.0.0'
  }
};

/**
 * Récupère la configuration d'un composant
 * @param name Nom du composant
 * @returns Configuration du composant
 */
export function getComponentConfig(name: ComponentName): ComponentConfig {
  return componentRegistry[name];
}

/**
 * Vérifie si un composant est disponible
 * @param name Nom du composant
 * @returns true si le composant est disponible, false sinon
 */
export function isComponentAvailable(name: ComponentName): boolean {
  return componentRegistry[name]?.isAvailable || false;
}

/**
 * Met à jour la configuration d'un composant
 * @param name Nom du composant
 * @param config Nouvelle configuration
 */
export function updateComponentConfig(name: ComponentName, config: Partial<ComponentConfig>): void {
  if (componentRegistry[name]) {
    componentRegistry[name] = {
      ...componentRegistry[name],
      ...config
    };
  }
}

/**
 * Récupère tous les composants disponibles
 * @returns Liste des composants disponibles
 */
export function getAvailableComponents(): ComponentConfig[] {
  return Object.values(componentRegistry).filter(config => config.isAvailable);
}

export default {
  ComponentName,
  getComponentConfig,
  isComponentAvailable,
  updateComponentConfig,
  getAvailableComponents
};
