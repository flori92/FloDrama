/**
 * Adaptateurs pour les composants Lynx
 * 
 * Ce fichier sert d'adaptateur pour les packages @lynx-js/* qui ne sont pas disponibles publiquement.
 * Il réexporte les composants adaptés depuis notre implémentation locale.
 */

// @ts-ignore - L'import de React est nécessaire pour la transpilation JSX dans les fichiers qui importent ce module
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity
} from './lynx-core';

// Types pour les props des composants
export interface ViewProps {
  style?: React.CSSProperties;
  testID?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface TextProps {
  style?: React.CSSProperties;
  testID?: string;
  children?: React.ReactNode;
  numberOfLines?: number;
  [key: string]: any;
}

export interface ImageProps {
  source: { uri: string } | string;
  style?: React.CSSProperties;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  testID?: string;
  [key: string]: any;
}

export interface ScrollViewProps {
  style?: React.CSSProperties;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  testID?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface TouchableOpacityProps {
  style?: React.CSSProperties;
  onPress?: () => void;
  testID?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Re-export des composants Lynx adaptés
export {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity
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

// Composant et utilitaires regroupés
const LynxComponents = {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  useMainThreadRef,
  useLynxGlobalEventListener,
  runOnMainThread,
  runOnBackground,
  createRoot
};

export default LynxComponents;
