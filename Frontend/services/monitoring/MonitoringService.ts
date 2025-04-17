import { EventEmitter } from 'events';
import { MetricsCollector } from './MetricsCollector';
import { AlertManager } from './AlertManager';
import { Alert, Event, MetricData, MonitoringConfig } from './types';

/**
 * Service de monitoring pour FloDrama
 */
export class MonitoringService extends EventEmitter {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private config: MonitoringConfig | null = null;
  private isRunning: boolean = false;
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null;
  private static instance: MonitoringService | null = null;

  constructor() {
    super();
    this.configure = this.configure.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.recordEvent = this.recordEvent.bind(this);
    this.recordAlert = this.recordAlert.bind(this);
    this.recordMetric = this.recordMetric.bind(this);
    this.logEvent = this.logEvent.bind(this);
    this.logError = this.logError.bind(this);
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
    this.getCurrentMetrics = this.getCurrentMetrics.bind(this);
    this.getActiveAlerts = this.getActiveAlerts.bind(this);
    this.metricsCollector = new MetricsCollector();
    this.alertManager = new AlertManager();
  }

  /**
   * Récupère l'instance unique du service de monitoring (singleton)
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Configure le service de monitoring
   */
  public configure(config: MonitoringConfig): void {
    this.config = config;
    this.metricsCollector.configure(this.config.metrics);
    this.alertManager.configure(this.config.alerts);
    this.emit('configured', config);
  }

  /**
   * Démarre le service de monitoring
   */
  public start(): void {
    if (!this.config) {
      throw new Error('MonitoringService must be configured before starting');
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startMetricsCollection();
    this.metricsCollector.start();
    this.emit('started');
  }

  /**
   * Alias pour start() pour compatibilité avec l'API existante
   */
  public async startMonitoring(): Promise<void> {
    this.start();
    return Promise.resolve();
  }

  /**
   * Arrête le service de monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.metricsIntervalId !== null) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
    this.metricsCollector.stop();
    this.emit('stopped');
  }

  /**
   * Alias pour stop() pour compatibilité avec l'API existante
   */
  public stopMonitoring(): void {
    this.stop();
  }

  /**
   * Enregistre un événement
   */
  public recordEvent(event: Event): void {
    if (!this.isRunning) {
      return;
    }

    this.emit('event', event);
    this.alertManager.recordEvent(event);
  }

  /**
   * Enregistre une alerte
   */
  public recordAlert(alert: Alert): void {
    if (!this.isRunning) {
      return;
    }

    this.emit('alert', alert);
    this.alertManager.recordAlert(alert);
  }

  /**
   * Enregistre une métrique
   */
  public recordMetric(metric: MetricData): void {
    if (!this.isRunning) {
      return;
    }

    this.emit('metric', metric);
    this.metricsCollector.recordMetric(metric);
  }

  /**
   * Enregistre un événement avec des métadonnées
   * @param eventName Nom de l'événement
   * @param metadata Métadonnées associées à l'événement (optionnel)
   */
  public logEvent(eventName: string, metadata?: Record<string, any>): void {
    if (!this.isRunning) {
      return;
    }

    const event: Event = {
      name: eventName,
      timestamp: Date.now(),
      metadata: metadata || {}
    };

    this.recordEvent(event);
    console.log(`[Event] ${eventName}`, metadata);
  }

  /**
   * Enregistre une erreur
   * @param errorName Nom de l'erreur
   * @param error Objet d'erreur
   * @param metadata Métadonnées supplémentaires (optionnel)
   */
  public logError(errorName: string, error: Error, metadata?: Record<string, any>): void {
    if (!this.isRunning) {
      return;
    }

    const alert: Alert = {
      name: errorName,
      level: 'error',
      message: error.message,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        stack: error.stack,
        name: error.name
      }
    };

    this.recordAlert(alert);
    console.error(`[Error] ${errorName}: ${error.message}`, error);
  }

  /**
   * Récupère les métriques actuelles
   * @returns Métriques actuelles sous forme d'objet
   */
  public async getCurrentMetrics(): Promise<Record<string, number>> {
    return this.getMetrics();
  }

  /**
   * Récupère les alertes actives
   * @returns Liste des alertes actives
   */
  public async getActiveAlerts(): Promise<Alert[]> {
    if (!this.isRunning || !this.alertManager) {
      return [];
    }
    
    return this.alertManager.getActiveAlerts();
  }

  private startMetricsCollection(): void {
    if (!this.config?.service?.interval) {
      return;
    }

    this.metricsIntervalId = setInterval(() => {
      const metrics = this.collectMetrics();
      this.emit('metrics', metrics);
    }, this.config.service.interval);
  }

  private collectMetrics(): MetricData[] {
    if (!this.config?.metrics) {
      return [];
    }

    const metrics: MetricData[] = [];
    const timestamp = Date.now();

    if (this.config.metrics.performance?.enabled) {
      const performanceMetrics = this.collectPerformanceMetrics();
      metrics.push(...performanceMetrics.map(metric => ({
        ...metric,
        timestamp,
        source: 'performance'
      })));
    }

    return metrics;
  }

  private collectPerformanceMetrics(): MetricData[] {
    const metrics: MetricData[] = [];

    // CPU Usage
    if (this.config?.metrics?.performance?.metrics?.cpu?.enabled) {
      metrics.push({
        name: 'cpu_usage',
        value: this.getCPUUsage(),
        timestamp: Date.now(),
        source: 'performance'
      });
    }

    // Memory Usage
    if (this.config?.metrics?.performance?.metrics?.memory?.enabled) {
      metrics.push({
        name: 'memory_usage',
        value: this.getMemoryUsage(),
        timestamp: Date.now(),
        source: 'performance'
      });
    }

    // FPS
    if (this.config?.metrics?.performance?.metrics?.fps?.enabled) {
      metrics.push({
        name: 'fps',
        value: this.getFPS(),
        timestamp: Date.now(),
        source: 'performance'
      });
    }

    return metrics;
  }

  private getCPUUsage(): number {
    // Implémentation à venir
    return 0;
  }

  private getMemoryUsage(): number {
    // Implémentation à venir
    return 0;
  }

  private getFPS(): number {
    // Implémentation à venir
    return 60;
  }

  /**
   * Récupère les métriques actuelles
   */
  public getMetrics(options?: {
    startTime?: number;
    endTime?: number;
    name?: string;
    source?: string;
  }): Record<string, number> {
    const metrics = this.metricsCollector.getMetrics(options);
    const result: Record<string, number> = {};

    // Traitement des métriques
    for (const metric of metrics) {
      if (!result[metric.name]) {
        result[metric.name] = metric.value;
      }
    }

    return result;
  }

  /**
   * Récupère les alertes actives
   */
  public getAlerts(options?: {
    startTime?: number;
    endTime?: number;
    type?: string;
    severity?: Alert['severity'];
  }): Alert[] {
    return this.alertManager.getAlerts(options);
  }

  /**
   * Récupère les événements récents
   */
  public getEvents(options?: {
    startTime?: number;
    endTime?: number;
    type?: string;
  }): Event[] {
    return this.alertManager.getEvents(options);
  }

  /**
   * Nettoie les anciennes données
   */
  public clearData(): void {
    this.metricsCollector.clearMetrics();
    this.alertManager.clearAlerts();
    this.alertManager.clearEvents();
    this.emit('data:cleared');
  }
}
