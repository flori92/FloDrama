/**
 * Adaptateur pour @react-navigation/native
 * Fournit une implémentation simplifiée des fonctionnalités de navigation
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types pour la navigation
export interface RouteParams {
  [key: string]: any;
}

export interface Route {
  key: string;
  name: string;
  params?: RouteParams;
}

export interface NavigationState {
  index: number;
  routes: Route[];
}

export interface NavigationContextValue {
  navigate: (routeName: string, params?: RouteParams) => void;
  goBack: () => void;
  getParam: (paramName: string, defaultValue?: any) => any;
  state: NavigationState;
  currentRoute: Route;
}

// Contexte de navigation avec valeur par défaut
const defaultNavigationContext: NavigationContextValue = {
  navigate: () => console.warn('Navigation non initialisée'),
  goBack: () => console.warn('Navigation non initialisée'),
  getParam: () => null,
  state: { index: 0, routes: [] },
  currentRoute: { key: '', name: '' }
};

const NavigationContext = createContext<NavigationContextValue>(defaultNavigationContext);

// Provider de navigation
interface NavigationProviderProps {
  initialRouteName: string;
  initialRouteParams?: RouteParams;
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  initialRouteName,
  initialRouteParams = {},
  children
}) => {
  // État initial de la navigation
  const [state, setState] = useState<NavigationState>({
    index: 0,
    routes: [
      {
        key: `${initialRouteName}-${Date.now()}`,
        name: initialRouteName,
        params: initialRouteParams
      }
    ]
  });

  // Route actuelle
  const currentRoute = state.routes[state.index];

  // Fonctions de navigation
  const navigate = (routeName: string, params: RouteParams = {}) => {
    setState((prevState) => {
      const newRoute = {
        key: `${routeName}-${Date.now()}`,
        name: routeName,
        params
      };
      
      return {
        index: prevState.routes.length,
        routes: [...prevState.routes, newRoute]
      };
    });
  };

  const goBack = () => {
    setState((prevState) => {
      if (prevState.index > 0) {
        return {
          ...prevState,
          index: prevState.index - 1
        };
      }
      return prevState;
    });
  };

  const getParam = (paramName: string, defaultValue?: any) => {
    const params = currentRoute.params || {};
    return params[paramName] !== undefined ? params[paramName] : defaultValue;
  };

  // Valeur du contexte
  const navigationValue: NavigationContextValue = {
    navigate,
    goBack,
    getParam,
    state,
    currentRoute
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Hook pour utiliser la navigation
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  return context;
};

// Hook pour utiliser les paramètres de route
export const useRoute = (): Route => {
  const { currentRoute } = useNavigation();
  return currentRoute;
};

// Hook pour utiliser un paramètre spécifique
export const useParam = <T,>(paramName: string, defaultValue?: T): T => {
  const { getParam } = useNavigation();
  return getParam(paramName, defaultValue);
};

// Exporter un objet avec toutes les fonctionnalités
const reactNavigationAdapter = {
  NavigationProvider,
  useNavigation,
  useRoute,
  useParam
};

export default reactNavigationAdapter;
