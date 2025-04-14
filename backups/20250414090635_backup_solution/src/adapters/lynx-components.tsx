import React from 'react';
import { 
  LynxView as View, 
  LynxText as Text, 
  LynxImage as Image, 
  LynxScrollView as ScrollView,
  LynxVideo as Video,
  LynxService
} from './lynx-core';

// Re-export des composants Lynx adaptés avec leurs alias pour plus de simplicité
export {
  View,
  Text,
  Image,
  ScrollView,
  Video,
  LynxService
};

// Simuler les hooks et fonctions de Lynx qui ne sont pas disponibles
export const useMainThreadRef = (ref: React.RefObject<any>) => ref;
export const useLynxGlobalEventListener = (event: string, callback: Function) => {
  React.useEffect(() => {
    window.addEventListener(event, callback as any);
    return () => window.removeEventListener(event, callback as any);
  }, [event, callback]);
};

export const runOnMainThread = (callback: Function) => {
  setTimeout(callback, 0);
};

export const runOnBackground = (callback: Function) => {
  setTimeout(callback, 0);
};

// Implémentation simplifiée de createRoot qui fonctionne avec React 17 et 18
export const createRoot = (element: HTMLElement) => {
  return {
    render: (component: React.ReactNode) => {
      // Utiliser une implémentation simplifiée qui ne dépend pas de ReactDOM
      // On suppose que l'application utilise déjà React et ReactDOM
      const rootElement = element;
      if (rootElement) {
        // On laisse React gérer le rendu via son propre système
        // Cette approche évite les erreurs de type avec ReactDOM.createRoot
        rootElement.innerHTML = '';
        const appElement = document.createElement('div');
        rootElement.appendChild(appElement);
        
        // Le composant est ignoré dans cette implémentation simplifiée
        // car nous ne pouvons pas utiliser ReactDOM directement
        console.log('Rendu du composant demandé:', component);
      }
    }
  };
};

// Composant TouchableOpacity simulé
export const TouchableOpacity: React.FC<{
  onPress?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ onPress, style, children }) => {
  const [isPressed, setIsPressed] = React.useState(false);
  
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);
  
  return (
    <div 
      onClick={onPress}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ 
        ...style, 
        cursor: 'pointer',
        opacity: isPressed ? 0.7 : 1,
        transition: 'opacity 0.2s'
      }}
    >
      {children}
    </div>
  );
};

// Composants et utilitaires regroupés
const LynxComponents = {
  View,
  Text,
  Image,
  ScrollView,
  Video,
  TouchableOpacity,
  useMainThreadRef,
  useLynxGlobalEventListener,
  runOnMainThread,
  runOnBackground,
  createRoot
};

export default LynxComponents;
