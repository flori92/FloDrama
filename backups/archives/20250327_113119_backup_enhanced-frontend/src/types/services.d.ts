declare module 'events' {
  export class EventEmitter {
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    listenerCount(event: string | symbol): number;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    eventNames(): Array<string | symbol>;
  }
}

declare module 'fs' {
  export function readFileSync(path: string, options?: { encoding?: string; flag?: string; } | string): string | Buffer;
  export function writeFileSync(path: string, data: string | Buffer, options?: { encoding?: string; mode?: number; flag?: string; } | string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean; mode?: number; }): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
}

declare namespace NodeJS {
  interface Process {
    cwd(): string;
  }
  interface Global {
    process: Process;
  }
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

declare var process: NodeJS.Process;
declare var Buffer: typeof Buffer;
