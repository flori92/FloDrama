/**
 * Adaptateur pour @react-navigation/native
 * Fournit une implémentation simplifiée des fonctionnalités de navigation
 */
import React, { createContext, useContext, useState } from 'react';

// Contexte de navigation avec valeur par défaut
const defaultNavigationContext = {
  navigate: () => console.warn('Navigation non initialisée'),
  goBack: () => console.warn('Navigation non initialisée'),
  getParam: () => null,
  state: { index: 0, routes: [] },
  currentRoute: { key: '', name: '' }
};

const NavigationContext = createContext(defaultNavigationContext);

// Provider de navigation
export const NavigationProvider = ({
  initialRouteName,
  initialRouteParams = {},
  children
}) => {
  // État initial de la navigation
  const [state, setState] = useState({
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
  const navigate = (routeName, params = {}) => {
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

  const getParam = (paramName, defaultValue) => {
    const params = currentRoute.params || {};
    return params[paramName] !== undefined ? params[paramName] : defaultValue;
  };

  // Valeur du contexte
  const navigationValue = {
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
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  return context;
};

// Hook pour utiliser les paramètres de route
export const useRoute = () => {
  const { currentRoute } = useNavigation();
  return currentRoute;
};

// Hook pour utiliser un paramètre spécifique
export const useParam = (paramName, defaultValue) => {
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
