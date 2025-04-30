// Déclarations de types pour les modules @lynx-js
declare module '@lynx-js/core' {
  // Types de base pour le module core
  export interface LynxConfig {
    apiKey?: string;
    endpoint?: string;
    options?: Record<string, any>;
  }

  export function initialize(config: LynxConfig): void;
  export function getClient(): any;
  
  // Autres exports du module core
  export const version: string;
}

declare module '@lynx-js/react' {
  import * as React from 'react';
  
  // Types pour les composants React
  export interface LynxProviderProps {
    children: React.ReactNode;
    config?: any;
  }
  
  export function LynxProvider(props: LynxProviderProps): JSX.Element;
  export function useLynx(): any;
  
  // Autres hooks et composants
  export function withLynx<P>(Component: React.ComponentType<P>): React.ComponentType<P>;
}

declare module '@lynx-js/runtime' {
  // Types pour le runtime
  export interface RuntimeOptions {
    debug?: boolean;
    timeout?: number;
    cache?: boolean;
  }
  
  export function createRuntime(options?: RuntimeOptions): any;
  export function executeQuery(query: string, variables?: Record<string, any>): Promise<any>;
  
  // Autres exports du runtime
  export const constants: Record<string, any>;
}
