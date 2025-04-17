import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkLynxAvailability } from '../hooks/useHybridComponent';
import theme from '../styles/theme';

interface HybridContextType {
  isLynxAvailable: boolean;
  missingPackages: string[];
  isLoading: boolean;
  forceReactMode: boolean;
  toggleForceReactMode: () => void;
  refreshLynxAvailability: () => void;
  theme: typeof theme;
}

const HybridContext = createContext<HybridContextType>({
  isLynxAvailable: false,
  missingPackages: [],
  isLoading: true,
  forceReactMode: false,
  toggleForceReactMode: () => {},
  refreshLynxAvailability: () => {},
  theme: theme
});

/**
 * Hook pour accéder au contexte du système hybride
 */
export const useHybridSystem = () => useContext(HybridContext);

interface HybridComponentProviderProps {
  children: ReactNode;
  initialForceReactMode?: boolean;
}

/**
 * Fournisseur de contexte pour le système hybride Lynx/React
 * Gère la détection de disponibilité et les préférences utilisateur
 */
export const HybridComponentProvider: React.FC<HybridComponentProviderProps> = ({
  children,
  initialForceReactMode = false
}) => {
  const [isLynxAvailable, setIsLynxAvailable] = useState(false);
  const [missingPackages, setMissingPackages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceReactMode, setForceReactMode] = useState(initialForceReactMode);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Injecter les styles globaux du thème FloDrama
  useEffect(() => {
    // Créer un élément style pour les variables CSS globales
    const styleElement = document.createElement('style');
    styleElement.id = 'flodrama-global-styles';
    
    // Définir les variables CSS basées sur notre thème
    styleElement.textContent = `
      :root {
        /* Couleurs */
        --flodrama-primary-blue: ${theme.colors.primary.blue};
        --flodrama-primary-fuchsia: ${theme.colors.primary.fuchsia};
        --flodrama-primary-gradient: ${theme.colors.primary.gradient};
        --flodrama-bg-main: ${theme.colors.background.main};
        --flodrama-bg-card: ${theme.colors.background.card};
        --flodrama-text-primary: ${theme.colors.text.primary};
        --flodrama-text-secondary: ${theme.colors.text.secondary};
        
        /* Typographie */
        --flodrama-font-family: ${theme.typography.fontFamily};
        
        /* Animations */
        --flodrama-transition-normal: all ${theme.animations.durations.normal} ${theme.animations.easings.easeInOut};
      }
      
      /* Styles globaux */
      body {
        font-family: var(--flodrama-font-family);
        background-color: var(--flodrama-bg-main);
        color: var(--flodrama-text-primary);
        margin: 0;
        padding: 0;
      }
      
      /* Classes utilitaires */
      .flodrama-gradient-text {
        background: ${theme.colors.primary.gradient};
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .flodrama-card {
        background-color: ${theme.colors.background.card};
        border-radius: ${theme.borders.radius['2xl']};
        overflow: hidden;
        transition: ${theme.animations.durations.normal} ${theme.animations.easings.easeInOut};
      }
      
      .flodrama-card:hover {
        transform: translateY(-4px);
        box-shadow: ${theme.shadows.lg};
      }
      
      .flodrama-button {
        border-radius: ${theme.borders.radius.full};
        transition: ${theme.animations.durations.normal} ${theme.animations.easings.easeInOut};
        font-weight: ${theme.typography.fontWeights.medium};
        position: relative;
        overflow: hidden;
      }
      
      .flodrama-button-primary {
        background: ${theme.colors.primary.gradient};
        color: ${theme.colors.text.primary};
        border: none;
      }
    `;
    
    // Ajouter l'élément style au document
    document.head.appendChild(styleElement);
    
    // Nettoyer lors du démontage du composant
    return () => {
      const existingStyle = document.getElementById('flodrama-global-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Vérifier la disponibilité de Lynx au chargement
  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        const result = await checkLynxAvailability();
        setIsLynxAvailable(result.available);
        setMissingPackages(result.missingPackages);
        
        // Journalisation pour le débogage
        if (result.available) {
          console.info('[HybridSystem] Lynx est disponible et sera utilisé par défaut');
        } else {
          console.warn(`[HybridSystem] Lynx n'est pas disponible, React sera utilisé. Packages manquants: ${result.missingPackages.join(', ')}`);
        }
      } catch (error) {
        console.error('[HybridSystem] Erreur lors de la vérification de Lynx:', error);
        setIsLynxAvailable(false);
        setMissingPackages(['@lynx/core', '@lynx/react', '@lynx/hooks', '@lynx/runtime']);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [refreshCounter]);

  // Fonction pour forcer l'utilisation de React
  const toggleForceReactMode = () => {
    setForceReactMode(prev => !prev);
    console.info(`[HybridSystem] Mode React forcé: ${!forceReactMode}`);
  };

  // Fonction pour rafraîchir la vérification de disponibilité
  const refreshLynxAvailability = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <HybridContext.Provider
      value={{
        isLynxAvailable,
        missingPackages,
        isLoading,
        forceReactMode,
        toggleForceReactMode,
        refreshLynxAvailability,
        theme
      }}
    >
      {children}
    </HybridContext.Provider>
  );
};

/**
 * Composant hybride qui bascule automatiquement entre Lynx et React
 */
interface HybridComponentProps {
  lynxComponent: React.ComponentType<any>;
  reactComponent: React.ComponentType<any>;
  componentProps: any;
  loadingComponent?: React.ReactNode;
}

export const HybridComponent: React.FC<HybridComponentProps> = ({
  lynxComponent: LynxComponent,
  reactComponent: ReactComponent,
  componentProps,
  loadingComponent = <div>Chargement...</div>
}) => {
  const { isLynxAvailable, forceReactMode, isLoading } = useHybridSystem();

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Utiliser React si Lynx n'est pas disponible ou si le mode React est forcé
  if (!isLynxAvailable || forceReactMode) {
    return <ReactComponent {...componentProps} />;
  }

  // Sinon utiliser Lynx
  return <LynxComponent {...componentProps} />;
};

/**
 * Panneau de contrôle pour le système hybride
 * Permet de visualiser l'état et de basculer entre les modes
 */
export const HybridSystemControlPanel: React.FC = () => {
  const {
    isLynxAvailable,
    missingPackages,
    isLoading,
    forceReactMode,
    toggleForceReactMode,
    refreshLynxAvailability
  } = useHybridSystem();

  if (isLoading) {
    return <div className="p-4 bg-gray-100 rounded-lg">Vérification du système hybride...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Système Hybride Lynx/React</h3>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="mr-2">État Lynx:</span>
          <span className={`px-2 py-1 rounded text-white text-sm ${isLynxAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
            {isLynxAvailable ? 'Disponible' : 'Non disponible'}
          </span>
        </div>
        
        {!isLynxAvailable && missingPackages.length > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            <p>Packages manquants:</p>
            <ul className="list-disc pl-5">
              {missingPackages.map(pkg => (
                <li key={pkg}>{pkg}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center mb-2">
          <span className="mr-2">Mode actuel:</span>
          <span className="font-medium">{forceReactMode || !isLynxAvailable ? 'React' : 'Lynx'}</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={toggleForceReactMode}
          disabled={!isLynxAvailable}
          className={`px-3 py-1 rounded text-white ${
            isLynxAvailable ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {forceReactMode ? 'Utiliser Lynx' : 'Forcer React'}
        </button>
        
        <button
          onClick={refreshLynxAvailability}
          className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
        >
          Rafraîchir
        </button>
      </div>
    </div>
  );
};
