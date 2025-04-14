/**
 * Adaptateur pour les composants hybrides
 * Permet de créer des composants qui peuvent fonctionner à la fois en natif et en web
 */
import React, { useState, useEffect, ReactNode, ComponentType, FC } from 'react';

// Interface pour les props du composant hybride
export interface HybridComponentProps {
  lynxComponent: string;
  reactFallback: ComponentType<any>;
  componentProps: any;
  forceReact?: boolean;
  style?: React.CSSProperties;
  testID?: string;
  fallback?: ReactNode;
}

/**
 * Composant hybride qui peut utiliser une implémentation native ou web
 */
export const HybridComponent: FC<HybridComponentProps> = (props) => {
  const {
    lynxComponent,
    reactFallback,
    componentProps,
    forceReact = false,
    style,
    testID,
    fallback
  } = props;

  const [isLynxAvailable, setIsLynxAvailable] = useState(!forceReact);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (forceReact) {
      setIsLynxAvailable(false);
      return;
    }

    // Vérifier si Lynx est disponible
    try {
      import('@lynx/core')
        .then(() => setIsLynxAvailable(true))
        .catch((err) => {
          console.warn(`[HybridComponent] Lynx not available:`, err);
          setError(err);
          setIsLynxAvailable(false);
        });
    } catch (err) {
      console.warn(`[HybridComponent] Error checking Lynx availability:`, err);
      setIsLynxAvailable(false);
    }
  }, [forceReact]);

  if (error && fallback) {
    return React.createElement(React.Fragment, null, fallback);
  }

  // Si Lynx n'est pas disponible, utiliser le composant React
  if (!isLynxAvailable) {
    return React.createElement(reactFallback, componentProps);
  }

  // Sinon, essayer de rendre le composant Lynx dynamiquement
  try {
    // Utilisation d'un élément div comme conteneur pour le composant Lynx
    return React.createElement(
      'div',
      {
        'data-lynx-component': lynxComponent,
        style,
        'data-testid': testID
      },
      React.createElement(reactFallback, componentProps)
    );
  } catch (renderError) {
    console.error(`[HybridComponent] Error rendering ${lynxComponent}:`, renderError);
    return React.createElement(reactFallback, componentProps);
  }
};

/**
 * Crée un composant hybride qui peut utiliser une implémentation native si disponible
 * ou une implémentation web (fallback) si l'implémentation native n'est pas disponible
 */
export function createHybridComponent<P = any>(
  lynxComponentName: string,
  ReactComponent: ComponentType<P>
): FC<P> {
  return (props: P) => (
    React.createElement(HybridComponent, {
      lynxComponent: lynxComponentName,
      reactFallback: ReactComponent,
      componentProps: props,
      forceReact: false
    })
  );
}

// Exporter les composants
const hybridExports = {
  createHybridComponent,
  HybridComponent
};

export default hybridExports;
