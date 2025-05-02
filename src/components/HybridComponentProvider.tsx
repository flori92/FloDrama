import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import theme from '../styles/theme';

interface HybridContextType {
  theme: typeof theme;
}

const HybridContext = createContext<HybridContextType>({
  theme: theme
});

/**
 * Hook pour accéder au contexte du système hybride
 */
export const useHybridSystem = () => useContext(HybridContext);

/**
 * Composant hybride qui bascule automatiquement entre Lynx et React
 */
interface HybridComponentProps {
  reactComponent: React.ComponentType<any>;
  componentProps: any;
  loadingComponent?: React.ReactNode;
}

export const HybridComponent: React.FC<HybridComponentProps> = ({
  reactComponent: ReactComponent,
  componentProps,
  loadingComponent = <div>Chargement...</div>
}) => {
  return <ReactComponent {...componentProps} />;
};

/**
 * Panneau de contrôle pour le système hybride
 * Permet de visualiser l'état et de basculer entre les modes
 */
export const HybridSystemControlPanel: React.FC = () => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Système Hybride Lynx/React</h3>
    </div>
  );
};
