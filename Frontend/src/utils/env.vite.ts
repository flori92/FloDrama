// src/utils/env.vite.ts
/**
 * Accès aux variables d'environnement dans Vite (import.meta.env)
 */
export function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return undefined;
}
