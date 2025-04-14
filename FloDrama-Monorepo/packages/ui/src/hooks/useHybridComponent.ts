import { useState, useEffect } from 'react';
import { ComponentName, ComponentProps, getComponentConfig } from '../adapters/component-registry';
import { needsReactFallback } from '../config/dependencies';

interface UseHybridComponentResult<T extends ComponentName> {
  // Indique si on utilise Lynx ou React
  isUsingLynx: boolean;
  // Props adaptées selon le framework utilisé
  adaptedProps: ComponentProps<T>;
  // Erreurs éventuelles
  error: Error | null;
  // État du chargement
  isLoading: boolean;
}

/**
 * Hook personnalisé pour gérer les composants hybrides
 * Facilite la transition entre Lynx et React
 */
export function useHybridComponent<T extends ComponentName>(
  componentName: T,
  props: ComponentProps<T>,
  options = { forceReact: false }
): UseHybridComponentResult<T> {
  const [isUsingLynx, setIsUsingLynx] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adaptedProps, setAdaptedProps] = useState<ComponentProps<T>>(props);

  useEffect(() => {
    const checkComponent = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si on doit utiliser React
        const needsFallback = options.forceReact || await needsReactFallback(componentName);
        setIsUsingLynx(!needsFallback);

        // Récupérer la configuration du composant
        const config = getComponentConfig(componentName);
        if (!config) {
          throw new Error(`Composant "${componentName}" non trouvé dans le registre`);
        }

        // Adapter les props selon le framework
        const finalProps = {
          ...config.defaultProps,
          ...props,
          style: {
            ...config.defaultProps?.style,
            ...props.style
          }
        };

        // Si on utilise React, adapter les props spécifiques
        if (needsFallback) {
          // Exemple : adapter les événements Lynx vers React
          const adaptedEvents = {
            onPress: finalProps.onClick,
            onLayout: finalProps.onResize,
            // ... autres adaptations d'événements
          };

          setAdaptedProps({
            ...finalProps,
            ...adaptedEvents
          });
        } else {
          setAdaptedProps(finalProps);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
        setIsUsingLynx(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkComponent();
  }, [componentName, props, options.forceReact]);

  return {
    isUsingLynx,
    adaptedProps,
    error,
    isLoading
  };
}

/**
 * Hook pour créer un composant hybride avec des props spécifiques
 */
export function createHybridComponentHook<T extends ComponentName, P extends object>(
  componentName: T,
  propsAdapter: (props: P) => ComponentProps<T>
) {
  return function useCustomHybridComponent(props: P, options = { forceReact: false }) {
    return useHybridComponent(componentName, propsAdapter(props), options);
  };
}

// Exemple d'utilisation pour le lecteur vidéo
export const useLecteurVideo = createHybridComponentHook('LecteurVideo', (props: {
  url: string;
  onFinish?: () => void;
  autoplay?: boolean;
}) => ({
  source: { uri: props.url },
  onFinLecture: props.onFinish,
  autoPlay: props.autoplay
}));
