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

// Re-export depuis le fichier .tsx
export { getComponent, getDynamicComponent } from './component-registry.tsx';

// Export du registre de composants
import componentRegistry from './component-registry.tsx';
export default componentRegistry;
