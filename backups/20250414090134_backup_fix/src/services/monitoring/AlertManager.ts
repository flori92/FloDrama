import { EventEmitter } from 'events';
import { Alert, Event, AlertConfig } from './types';

/**
 * Gestionnaire d'alertes pour FloDrama
 */
export class AlertManager extends EventEmitter {
  private alerts: Alert[] = [];
  private events: Event[] = [];
  private config: AlertConfig;

  /**
   * Constructeur de l'AlertManager
   */
  constructor() {
    super();
    this.config = {
      enabled: false,
      performance: {
        cpu: { enabled: false, threshold: 80 },
        memory: { enabled: false, threshold: 90 },
        fps: { enabled: false, threshold: 24 }
      }
    };
  }

  /**
   * Configure le gestionnaire d'alertes
   */
  public configure(config: Partial<AlertConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      performance: {
        ...this.config.performance,
        ...(config.performance || {})
      }
    };
  }

  /**
   * Enregistre une alerte
   */
  public recordAlert(alert: Alert): void {
    if (!this.config.enabled) return;

    this.alerts.push(alert);
    this.emit('alert:recorded', alert);

    if (alert.severity === 'error') {
      this.emit('alert:error', alert);
    }
  }

  /**
   * Enregistre un événement
   */
  public recordEvent(event: Event): void {
    const newEvent: Event = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(newEvent);
    this.emit('event:recorded', newEvent);
  }

  /**
   * Récupère les alertes
   */
  public getAlerts(options?: {
    startTime?: number;
    endTime?: number;
    type?: string;
    severity?: Alert['severity'];
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (options) {
      if (options.startTime) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= options.startTime!);
      }
      if (options.endTime) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= options.endTime!);
      }
      if (options.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === options.type);
      }
      if (options.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === options.severity);
      }
    }

    return filteredAlerts;
  }

  /**
   * Récupère les événements
   */
  public getEvents(options?: {
    startTime?: number;
    endTime?: number;
    type?: string;
  }): Event[] {
    let filteredEvents = [...this.events];

    if (options) {
      if (options.startTime) {
        filteredEvents = filteredEvents.filter(event => event.timestamp >= options.startTime!);
      }
      if (options.endTime) {
        filteredEvents = filteredEvents.filter(event => event.timestamp <= options.endTime!);
      }
      if (options.type) {
        filteredEvents = filteredEvents.filter(event => event.type === options.type);
      }
    }

    return filteredEvents;
  }

  /**
   * Résout une alerte
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'resolved';
      this.emit('alert:resolved', alert);
    }
  }

  /**
   * Nettoie les alertes
   */
  public clearAlerts(): void {
    this.alerts = [];
    this.emit('alerts:cleared');
  }

  /**
   * Nettoie les événements
   */
  public clearEvents(): void {
    this.events = [];
    this.emit('events:cleared');
  }

  /**
   * Récupère les alertes actives
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.status === 'active');
  }

  /**
   * Récupère les alertes résolues
   */
  public getResolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.status === 'resolved');
  }
}
