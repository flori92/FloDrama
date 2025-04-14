declare module '@lynx/core' {
  export interface MetricsConfig {
    native: {
      memory: boolean;
      cpu: boolean;
      battery: boolean;
      network: boolean;
    };
    app: {
      crashes: boolean;
      startup: boolean;
      memory: boolean;
    };
    interval?: string;
  }

  export interface AlertsConfig {
    enabled: boolean;
    channels: {
      slack: {
        enabled: boolean;
        webhook?: string;
        channel: string;
      };
      email: {
        enabled: boolean;
        recipients: string[];
      };
    };
    rules: {
      performance: {
        cpu: {
          threshold: number;
          duration: string;
          severity: string;
        };
        memory: {
          threshold: number;
          duration: string;
          severity: string;
        };
        errors: {
          threshold: number;
          duration: string;
          severity: string;
        };
      };
      business: {
        users: {
          threshold: number;
          duration: string;
          severity: string;
        };
        revenue: {
          threshold: number;
          duration: string;
          severity: string;
        };
      };
    };
    thresholds: {
      performance: {
        warning: number;
        critical: number;
      };
      errors: {
        warning: number;
        critical: number;
      };
      usage: {
        warning: number;
        critical: number;
      };
    };
  }

  export interface MonitoringConfig {
    service: {
      enabled: boolean;
      name: string;
      version: string;
    };
    metrics: MetricsConfig;
    alerts: AlertsConfig;
    visualization: {
      dashboards: Record<string, any>;
      exports: Record<string, any>;
    };
  }

  // Interfaces manquantes pour corriger les erreurs TypeScript
  export class LynxMonitoring {
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): Promise<Record<string, any>>;
    getAlerts(): Promise<any[]>;
  }

  export class LynxMetrics {
    constructor();
    collect(): Promise<Record<string, any>>;
    getHistory(options?: any): Promise<Record<string, any>[]>;
  }

  export class LynxAlerts {
    constructor();
    getActive(): Promise<any[]>;
    getHistory(options?: any): Promise<any[]>;
    resolve(id: string): Promise<void>;
  }

  export class LynxCache {
    constructor();
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  }
}

// Déclaration du module react-router-dom pour ajouter la propriété className à LinkProps
declare module 'react-router-dom' {
  interface LinkProps {
    className?: string;
  }
}
