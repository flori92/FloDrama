import { EventEmitter } from 'events';
import { MetricData, MetricsConfig } from './types';

export class MetricsCollector extends EventEmitter {
  private metrics: MetricData[] = [];
  private config: MetricsConfig;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      performance: {
        enabled: false,
        interval: 5000,
        metrics: {
          cpu: { enabled: false, threshold: 80 },
          memory: { enabled: false, threshold: 90 },
          fps: { enabled: false, threshold: 24 }
        }
      }
    };
  }

  public configure(config: Partial<MetricsConfig>): void {
    this.config = {
      ...this.config,
      performance: {
        ...this.config.performance,
        ...(config.performance || {}),
        metrics: {
          ...this.config.performance.metrics,
          ...(config.performance?.metrics || {})
        }
      }
    };
  }

  public start(): void {
    if (!this.config.performance.enabled) return;

    this.startPerformanceCollection();
  }

  public stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  public recordMetric(metric: MetricData): void {
    this.metrics.push(metric);
    this.emit('metric:recorded', metric);
  }

  public getMetrics(options?: {
    startTime?: number;
    endTime?: number;
    name?: string;
    source?: string;
  }): MetricData[] {
    let filteredMetrics = [...this.metrics];

    if (options) {
      if (options.startTime) {
        filteredMetrics = filteredMetrics.filter(metric => metric.timestamp >= options.startTime!);
      }
      if (options.endTime) {
        filteredMetrics = filteredMetrics.filter(metric => metric.timestamp <= options.endTime!);
      }
      if (options.name) {
        filteredMetrics = filteredMetrics.filter(metric => metric.name === options.name);
      }
      if (options.source) {
        filteredMetrics = filteredMetrics.filter(metric => metric.source === options.source);
      }
    }

    return filteredMetrics;
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.emit('metrics:cleared');
  }

  private startPerformanceCollection(): void {
    if (this.collectionInterval) return;

    this.collectionInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.config.performance.interval);
  }

  private collectPerformanceMetrics(): void {
    const timestamp = Date.now();

    if (this.config.performance.metrics.cpu.enabled) {
      this.recordMetric({
        name: 'cpu_usage',
        value: Math.random() * 100, // Simulé pour l'exemple
        timestamp,
        source: 'system'
      });
    }

    if (this.config.performance.metrics.memory.enabled) {
      this.recordMetric({
        name: 'memory_usage',
        value: Math.random() * 100, // Simulé pour l'exemple
        timestamp,
        source: 'system'
      });
    }

    if (this.config.performance.metrics.fps.enabled) {
      this.recordMetric({
        name: 'fps',
        value: Math.random() * 60, // Simulé pour l'exemple
        timestamp,
        source: 'system'
      });
    }
  }
}
