import { useCallback } from 'react';
import { useHybridSystem } from './useHybridSystem';

export const useHybridComponent = <T extends Record<string, any>>(
  lynxImport: () => Promise<T>,
  reactImport: () => Promise<T>
) => {
  const { useLynx } = useHybridSystem();

  const loadComponent = useCallback(async () => {
    try {
      const module = await (useLynx ? lynxImport() : reactImport());
      return module;
    } catch (error) {
      console.error('Erreur lors du chargement du composant:', error);
      // Fallback vers React en cas d'erreur
      return reactImport();
    }
  }, [useLynx, lynxImport, reactImport]);

  return { loadComponent };
};
