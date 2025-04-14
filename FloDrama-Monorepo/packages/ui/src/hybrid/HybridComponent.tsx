import React, { Suspense } from 'react';
import { useHybridSystem } from './useHybridSystem';

interface HybridComponentProps {
  lynxComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  reactComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export const HybridComponent: React.FC<HybridComponentProps> = ({
  lynxComponent: LynxComponent,
  reactComponent: ReactComponent,
  fallback = null,
  ...props
}) => {
  const { useLynx } = useHybridSystem();
  const Component = useLynx ? LynxComponent : ReactComponent;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
