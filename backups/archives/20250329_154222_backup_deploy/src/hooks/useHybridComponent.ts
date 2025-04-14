import { useState, useEffect } from 'react';
import { ComponentName, ComponentProps, getComponentConfig, needsReactFallback } from '../adapters/ui-component-registry';

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
  const [isUsingLynx, setIsUsingLynx] = useState(false);
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
        let finalProps = {
          ...config.defaultProps,
          ...props
        } as ComponentProps<T>;

        // Appliquer l'adaptateur de props si disponible
        if (config.adaptProps) {
          finalProps = config.adaptProps(finalProps, !needsFallback);
        }

        setAdaptedProps(finalProps);
        setError(null);
      } catch (err) {
        console.error(`[useHybridComponent] Erreur pour ${componentName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsUsingLynx(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkComponent();
  }, [componentName, options.forceReact]);

  // Mettre à jour les props adaptées quand les props d'origine changent
  useEffect(() => {
    const config = getComponentConfig(componentName);
    if (!config) return;

    let updatedProps = {
      ...config.defaultProps,
      ...props
    } as ComponentProps<T>;

    if (config.adaptProps) {
      updatedProps = config.adaptProps(updatedProps, isUsingLynx);
    }

    setAdaptedProps(updatedProps);
  }, [props, componentName, isUsingLynx]);

  return {
    isUsingLynx,
    adaptedProps,
    error,
    isLoading
  };
}

/**
 * Crée un hook personnalisé pour un composant spécifique
 */
export function createHybridComponentHook<T extends ComponentName, P extends Record<string, any>>(
  componentName: T,
  propsAdapter: (props: P) => ComponentProps<T>
) {
  return function(props: P, options = { forceReact: false }) {
    const adaptedProps = propsAdapter(props);
    return useHybridComponent(componentName, adaptedProps, options);
  };
}
