import React, { Suspense } from 'react';
import { LynxView } from '@lynx/core';
import { useTheme } from '@lynx/hooks';
import { ComponentName, ComponentProps, getComponentConfig, isLynxComponentAvailable } from './component-registry';

interface HybridComponentProps<T extends ComponentName> {
  // Nom du composant à utiliser (doit être enregistré dans le registre)
  componentName: T;
  // Props spécifiques au composant
  componentProps?: ComponentProps<T>;
  // Condition pour forcer l'utilisation du composant React
  forceReact?: boolean;
  // Style du conteneur
  style?: React.CSSProperties;
  // Enfants du composant
  children?: React.ReactNode;
  // ID de test pour le composant
  testID?: string;
  // Composant de fallback pendant le chargement
  fallback?: React.ReactNode;
}

/**
 * Composant hybride amélioré qui utilise le registre des composants
 * pour gérer automatiquement le basculement entre Lynx et React
 */
export function HybridComponent<T extends ComponentName>({
  componentName,
  componentProps = {},
  forceReact = false,
  style,
  children,
  testID,
  fallback = <div>Chargement...</div>
}: HybridComponentProps<T>) {
  const theme = useTheme();
  const config = getComponentConfig(componentName);

  if (!config) {
    console.error(`Composant "${componentName}" non trouvé dans le registre`);
    return null;
  }

  const finalProps = {
    ...config.defaultProps,
    ...componentProps,
    style: {
      ...config.defaultProps?.style,
      ...style
    }
  };

  // Si le composant Lynx est disponible et qu'on ne force pas React
  if (isLynxComponentAvailable(componentName) && !forceReact) {
    const LynxComponent = config.lynxComponent;
    return (
      <LynxView testID={testID} style={style}>
        <LynxComponent {...finalProps}>
          {children}
        </LynxComponent>
      </LynxView>
    );
  }

  // Fallback vers le composant React avec Suspense pour le chargement dynamique
  const ReactComponent = config.reactFallback;
  return (
    <Suspense fallback={fallback}>
      <div data-testid={testID} style={style}>
        <ReactComponent {...finalProps}>
          {children}
        </ReactComponent>
      </div>
    </Suspense>
  );
}

/**
 * HOC pour créer un composant hybride spécifique
 */
export function createHybridComponent<T extends ComponentName>(
  componentName: T,
  additionalProps: Partial<ComponentProps<T>> = {}
) {
  return React.forwardRef<any, Omit<HybridComponentProps<T>, 'componentName'>>((props, ref) => (
    <HybridComponent
      componentName={componentName}
      componentProps={{ ...additionalProps, ...props, ref }}
      {...props}
    />
  ));
}

// Création des composants hybrides courants
export const HybridVideo = createHybridComponent('LecteurVideo');
export const HybridCarousel = createHybridComponent('Carousel');
export const HybridModal = createHybridComponent('Modal');
export const HybridNavigation = createHybridComponent('Navigation');
export const HybridForm = createHybridComponent('Form');
export const HybridAnimation = createHybridComponent('Animation');
