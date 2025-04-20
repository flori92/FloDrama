import { useState, useEffect, useCallback } from 'react';
import { ComponentName, getComponentConfig, needsReactFallback } from '../adapters/component-registry';
import { useHybridSystem } from '../components/HybridComponentProvider';

// Interface pour les résultats de vérification de disponibilité
export interface AvailabilityCheckResult {
  available: boolean;
  missingPackages: string[];
}

// Cache pour les vérifications de disponibilité
interface AvailabilityCache {
  [packageName: string]: {
    result: AvailabilityCheckResult;
    timestamp: number;
  };
}

// Durée de validité du cache (en ms)
const CACHE_VALIDITY_DURATION = 3600000; // 1 heure

// Cache pour éviter de vérifier plusieurs fois les mêmes packages
const availabilityCache: AvailabilityCache = {};

/**
 * Vérifie la disponibilité des packages Lynx
 * @returns Résultat de la vérification avec statut et packages manquants
 */
export async function checkLynxAvailability(): Promise<AvailabilityCheckResult> {
  const requiredPackages = ['@lynx/core', '@lynx/react', '@lynx/hooks', '@lynx/runtime'];
  const missingPackages: string[] = [];
  
  // Vérifier si le résultat est dans le cache et toujours valide
  const cacheKey = 'lynx-availability';
  const cachedResult = availabilityCache[cacheKey];
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.timestamp) < CACHE_VALIDITY_DURATION) {
    return cachedResult.result;
  }
  
  // Vérifier chaque package
  for (const pkg of requiredPackages) {
    try {
      await import(/* @vite-ignore */ pkg);
    } catch (error) {
      missingPackages.push(pkg);
    }
  }
  
  const result: AvailabilityCheckResult = {
    available: missingPackages.length === 0,
    missingPackages
  };
  
  // Mettre à jour le cache
  availabilityCache[cacheKey] = {
    result,
    timestamp: now
  };
  
  return result;
}

/**
 * Hook pour utiliser un composant hybride (Lynx ou React)
 * @param componentName Nom du composant à utiliser
 * @returns Le composant approprié et des informations sur son état
 */
export function useHybridComponent<T extends ComponentName>(componentName: T) {
  const [component, setComponent] = useState<any>(null);
  const [isLynx, setIsLynx] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Utiliser le contexte du système hybride
  const { isLynxAvailable, forceReactMode, refreshLynxAvailability } = useHybridSystem();
  
  // Fonction pour forcer la vérification des dépendances
  const refreshDependencies = useCallback(() => {
    refreshLynxAvailability();
  }, [refreshLynxAvailability]);
  
  // Charger le composant approprié
  useEffect(() => {
    const loadComponent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtenir la configuration du composant
        const config = getComponentConfig(componentName);
        
        if (!config) {
          throw new Error(`Configuration non trouvée pour le composant ${componentName}`);
        }
        
        // Vérifier si on doit utiliser React (soit forcé, soit Lynx non disponible)
        const useFallback = forceReactMode || !isLynxAvailable || await needsReactFallback(componentName);
        
        if (useFallback) {
          // Charger la version React du composant
          const ReactComponent = await import(/* @vite-ignore */ `../components/ui/${componentName.toLowerCase()}`);
          setComponent(ReactComponent.default || ReactComponent);
          setIsLynx(false);
          
          // Journaliser l'utilisation de React
          console.info(`[HybridComponent] Utilisation de React pour ${componentName}`);
        } else {
          try {
            // Charger la version Lynx du composant
            const LynxComponent = await import(/* @vite-ignore */ `@lynx/react/components/${componentName.toLowerCase()}`);
            setComponent(LynxComponent.default || LynxComponent);
            setIsLynx(true);
            
            // Journaliser l'utilisation de Lynx
            console.info(`[HybridComponent] Utilisation de Lynx pour ${componentName}`);
          } catch (lynxError) {
            console.error(`[HybridComponent] Erreur lors du chargement du composant Lynx ${componentName}:`, lynxError);
            
            // Fallback vers React en cas d'erreur
            const ReactComponent = await import(/* @vite-ignore */ `../components/ui/${componentName.toLowerCase()}`);
            setComponent(ReactComponent.default || ReactComponent);
            setIsLynx(false);
            
            // Journaliser le fallback
            console.warn(`[HybridComponent] Fallback vers React pour ${componentName} suite à une erreur`);
          }
        }
      } catch (error) {
        console.error(`[HybridComponent] Erreur lors du chargement du composant ${componentName}:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadComponent();
  }, [componentName, forceReactMode, isLynxAvailable]);
  
  return {
    component,
    isLynx,
    isLoading,
    error,
    refreshDependencies
  };
}

/**
 * Réinitialise le cache de disponibilité
 * Utile pour forcer une nouvelle vérification
 */
export function resetAvailabilityCache(): void {
  Object.keys(availabilityCache).forEach(key => {
    delete availabilityCache[key];
  });
}
