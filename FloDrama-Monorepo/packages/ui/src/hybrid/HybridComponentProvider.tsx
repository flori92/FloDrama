import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HybridSystemContextType {
  isLynxAvailable: boolean;
  forceReact: boolean;
  setForceReact: (force: boolean) => void;
}

const HybridSystemContext = createContext<HybridSystemContextType | null>(null);

export const useHybridSystemContext = () => {
  const context = useContext(HybridSystemContext);
  if (!context) {
    throw new Error('useHybridSystemContext must be used within a HybridComponentProvider');
  }
  return context;
};

export interface HybridComponentProviderProps {
  children: ReactNode;
}

export const HybridComponentProvider: React.FC<HybridComponentProviderProps> = ({ children }) => {
  const [isLynxAvailable, setIsLynxAvailable] = useState(false);
  const [forceReact, setForceReact] = useState(false);

  useEffect(() => {
    const checkLynxAvailability = async () => {
      try {
        // Vérifier si Lynx est disponible
        const lynx = await import('@lynx-js/core');
        setIsLynxAvailable(!!lynx);
      } catch {
        setIsLynxAvailable(false);
      }
    };

    checkLynxAvailability();
  }, []);

  return (
    <HybridSystemContext.Provider value={{ isLynxAvailable, forceReact, setForceReact }}>
      {children}
    </HybridSystemContext.Provider>
  );
};
