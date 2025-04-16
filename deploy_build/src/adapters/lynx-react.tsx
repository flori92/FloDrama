/**
 * Adaptateur pour @lynx/react
 * 
 * Ce fichier sert d'adaptateur pour le package @lynx/react qui n'est pas disponible publiquement.
 * Il fournit des fonctions similaires à celles de Lynx mais en utilisant React standard.
 */

// Importation de React via require pour éviter les problèmes de typage
// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react');

// Réexportation des hooks et composants React
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useRef = React.useRef;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useContext = React.useContext;
export const createContext = React.createContext;
export const memo = React.memo;
export const forwardRef = React.forwardRef;
export const Fragment = React.Fragment;

// Type pour les dépendances des hooks
type DependencyList = ReadonlyArray<any>;

// Hooks spécifiques à Lynx adaptés pour React standard
export function useMainThreadRef<T>(initialValue: T) {
  return useRef<T>(initialValue);
}

export function useLynxGlobalEventListener(
  eventName: string, 
  callback: (event: Event) => void, 
  deps: DependencyList = []
) {
  useEffect(() => {
    // Simulation de l'écouteur d'événements global de Lynx
    const handler = (event: Event) => {
      callback(event);
    };
    
    window.addEventListener(eventName, handler);
    
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, deps);
}

export function useInitData<T>(key: string, defaultValue: T): T {
  // Simulation de l'accès aux données d'initialisation de Lynx
  return useMemo(() => {
    try {
      const storedValue = localStorage.getItem(`lynx_init_data_${key}`);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données d'initialisation pour ${key}:`, error);
      return defaultValue;
    }
  }, [key, defaultValue]);
}

// Fonctions utilitaires spécifiques à Lynx
export function runOnMainThread<T>(callback: () => T): T {
  // Dans un environnement standard, exécution synchrone
  return callback();
}

export function runOnBackground<T>(callback: () => T): Promise<T> {
  // Simulation d'exécution en arrière-plan avec setTimeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(callback());
    }, 0);
  });
}

export function createRoot(container: Element) {
  // Utilisation de l'API ReactDOM.createRoot pour React 18+
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactDOM = require('react-dom/client');
  return ReactDOM.createRoot(container);
}

// Export par défaut
export default React;
