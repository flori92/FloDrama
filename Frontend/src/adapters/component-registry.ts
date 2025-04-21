/**
 * Registre des composants hybrides pour FloDrama
 * Permet de gérer la compatibilité entre les composants React et Lynx
 */

// Types de composants disponibles
export type ComponentName = 
  | 'Button' 
  | 'Card' 
  | 'ContentCard'
  | 'HeroBanner'
  | 'MainNavigation'
  | 'Footer'
  | 'ContentRow'
  | 'ContentSection';

// Configuration d'un composant
export interface ComponentConfig {
  name: ComponentName;
  reactPath: string;
  lynxPath?: string;
  defaultToReact?: boolean;
}

// Registre des composants
const componentRegistry: Record<ComponentName, ComponentConfig> = {
  Button: {
    name: 'Button',
    reactPath: '../components/ui/Button',
    lynxPath: '@lynx/react/components/button',
    defaultToReact: true
  },
  Card: {
    name: 'Card',
    reactPath: '../components/ui/Card',
    lynxPath: '@lynx/react/components/card',
    defaultToReact: true
  },
  ContentCard: {
    name: 'ContentCard',
    reactPath: '../components/ui/ContentCard',
    defaultToReact: true
  },
  HeroBanner: {
    name: 'HeroBanner',
    reactPath: '../components/ui/HeroBanner',
    defaultToReact: true
  },
  MainNavigation: {
    name: 'MainNavigation',
    reactPath: '../components/ui/MainNavigation',
    defaultToReact: true
  },
  Footer: {
    name: 'Footer',
    reactPath: '../components/ui/Footer',
    defaultToReact: true
  },
  ContentRow: {
    name: 'ContentRow',
    reactPath: '../components/ui/ContentRow',
    defaultToReact: true
  },
  ContentSection: {
    name: 'ContentSection',
    reactPath: '../components/ui/ContentSection',
    defaultToReact: true
  }
};

/**
 * Récupère la configuration d'un composant
 * @param name Nom du composant
 * @returns Configuration du composant ou undefined si non trouvé
 */
export function getComponentConfig(name: ComponentName): ComponentConfig | undefined {
  return componentRegistry[name];
}

/**
 * Vérifie si un composant doit utiliser la version React
 * @param name Nom du composant
 * @returns true si la version React doit être utilisée
 */
export async function needsReactFallback(name: ComponentName): Promise<boolean> {
  const config = componentRegistry[name];
  
  if (!config) {
    return true;
  }
  
  if (config.defaultToReact || !config.lynxPath) {
    return true;
  }
  
  // Dans le cadre de la migration Lynx → React, on force l'utilisation de React
  return true;
}
