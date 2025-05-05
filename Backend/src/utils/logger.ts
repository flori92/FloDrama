/**
 * Utilitaire de logging compatible avec Cloudflare Workers
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level: LogLevel;
  timestamp?: boolean;
}

class CloudflareLogger {
  private level: LogLevel;
  private showTimestamp: boolean;

  constructor(options: LogOptions = { level: 'info', timestamp: true }) {
    this.level = options.level;
    this.showTimestamp = options.timestamp !== false;
  }

  private getTimestamp(): string {
    return this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[messageLevel] >= levels[this.level];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`${this.getTimestamp()}DEBUG: ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`${this.getTimestamp()}INFO: ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`${this.getTimestamp()}WARN: ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`${this.getTimestamp()}ERROR: ${message}`, ...args);
    }
  }
}

// Créer et exporter l'instance du logger
export const logger = new CloudflareLogger({
  level: (globalThis.process?.env?.NODE_ENV === 'production') ? 'info' : 'debug',
  timestamp: true
});
