import { useHybridSystemContext } from './HybridComponentProvider';

export const useHybridSystem = () => {
  const { isLynxAvailable, forceReact, setForceReact } = useHybridSystemContext();

  return {
    isLynxAvailable,
    forceReact,
    setForceReact,
    useLynx: isLynxAvailable && !forceReact
  };
};
