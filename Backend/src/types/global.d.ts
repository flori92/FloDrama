/**
 * Déclarations de types globaux pour l'environnement Cloudflare Workers
 * Ces déclarations complètent les types standards du Web
 */

// Types standards du Web qui pourraient manquer
interface Request extends Body {
  readonly cache: RequestCache;
  readonly credentials: RequestCredentials;
  readonly destination: RequestDestination;
  readonly headers: Headers;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly method: string;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
  readonly url: string;
  clone(): Request;
}

// Types pour l'environnement global
declare global {
  // Fonctions globales
  function atob(data: string): string;
  function btoa(data: string): string;
  
  // Objets globaux
  const crypto: Crypto;
  const caches: CacheStorage;
  
  // Types pour les timers
  function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  function clearTimeout(id?: number): void;
  function setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
  function clearInterval(id?: number): void;
  
  // Types pour les événements programmés
  interface ScheduledEvent {
    readonly scheduledTime: number;
    readonly cron: string;
    readonly noRetry?: boolean;
  }
  
  // Types pour le contexte d'exécution
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

export {};
