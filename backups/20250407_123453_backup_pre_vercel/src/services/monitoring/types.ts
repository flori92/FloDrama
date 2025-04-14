export interface Alert {
  id?: string;
  name?: string;
  type?: string;
  level?: 'info' | 'warning' | 'error';
  severity?: 'info' | 'warning' | 'error';
  message: string;
  source?: string;
  timestamp: number;
  status?: 'active' | 'resolved';
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Event {
  name?: string;
  type?: string;
  message?: string;
  source?: string;
  timestamp: number;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  source: string;
  tags?: Record<string, string>;
}

export interface MonitoringConfig {
  service: {
    enabled: boolean;
    name: string;
    version: string;
    interval?: number;
    environment?: string;
    batching?: {
      enabled: boolean;
      size: number;
      interval: string;
    };
  };
  metrics: {
    performance: {
      enabled: boolean;
      interval: number;
      metrics: {
        cpu: { enabled: boolean; threshold: number; warning?: number };
        memory: { enabled: boolean; threshold: number | string; warning?: number | string };
        fps: { enabled: boolean; threshold: number; target?: number; warning?: number };
        network?: {
          enabled: boolean;
          latency?: { threshold: number; warning?: number };
          bandwidth?: { threshold: number | string; warning?: number | string };
        };
      };
    };
    usage?: {
      enabled: boolean;
      interval: number;
      metrics: Record<string, any>;
    };
    business?: {
      enabled: boolean;
      interval: number;
      metrics: Record<string, any>;
    };
  };
  alerts: {
    enabled: boolean;
    channels?: {
      slack?: {
        enabled: boolean;
        webhook?: string;
        channel?: string;
      };
      email?: {
        enabled: boolean;
        recipients?: string[];
      };
    };
    rules?: {
      performance?: {
        cpu?: { threshold: number; duration?: string; severity?: string };
        memory?: { threshold: number | string; duration?: string; severity?: string };
        errors?: { threshold: number; duration?: string; severity?: string };
      };
      business?: Record<string, any>;
    };
    throttling?: {
      enabled: boolean;
      period?: string;
      limit?: number;
    };
  };
  visualization: {
    enabled: boolean;
    refreshInterval?: number;
    dashboards?: Record<string, any>;
    exports?: Record<string, any>;
  };
  platform?: Record<string, any>;
}

export interface AlertConfig {
  enabled: boolean;
  performance: {
    cpu: { enabled?: boolean; threshold: number; duration?: string; severity?: string };
    memory: { enabled?: boolean; threshold: number | string; duration?: string; severity?: string };
    fps: { enabled?: boolean; threshold: number; duration?: string; severity?: string };
  };
  channels?: Record<string, any>;
  rules?: Record<string, any>;
  throttling?: Record<string, any>;
}

export interface MetricsConfig {
  performance: {
    enabled: boolean;
    interval: number;
    metrics: {
      cpu: { enabled: boolean; threshold: number; warning?: number };
      memory: { enabled: boolean; threshold: number | string; warning?: number | string };
      fps: { enabled: boolean; threshold: number; target?: number; warning?: number };
      network?: {
        enabled: boolean;
        latency?: { threshold: number; warning?: number };
        bandwidth?: { threshold: number | string; warning?: number | string };
      };
    };
  };
  usage?: {
    enabled: boolean;
    interval: number;
    metrics: Record<string, any>;
  };
  business?: {
    enabled: boolean;
    interval: number;
    metrics: Record<string, any>;
  };
}
