// src/utils/env.node.ts
/**
 * Accès aux variables d'environnement dans Node/Jest (process.env)
 */
export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}
