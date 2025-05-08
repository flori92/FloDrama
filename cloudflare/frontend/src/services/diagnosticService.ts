/**
 * Service de diagnostic pour FloDrama
 * 
 * Ce service fournit des informations de diagnostic sur l'état du système,
 * y compris les performances du cache et les erreurs d'API.
 */

// Informations de diagnostic de base
export interface DiagnosticInfo {
  apiBaseUrl: string;
  apiTimeout: number;
  cacheDuration: number;
  cacheStats: {
    totalItems: number;
    itemsByType: Record<string, number>;
    oldestItem: {
      key: string;
      age: number;
    } | null;
    newestItem: {
      key: string;
      age: number;
    } | null;
    averageAge: number;
  };
  apiErrors: Array<{
    endpoint: string;
    timestamp: number;
    error: string;
  }>;
  lastChecked: number;
}

/**
 * Récupère les informations de diagnostic actuelles
 */
export function getDiagnosticInfo(): DiagnosticInfo {
  // Configuration de l'API
  const apiBaseUrl = 'https://flodrama-api-prod.florifavi.workers.dev';
  const apiTimeout = 8000; // 8 secondes
  const cacheDuration = 5 * 60 * 1000; // 5 minutes
  
  // Statistiques du cache (simulées car l'ancien service a été archivé)
  const cacheStats = {
    totalItems: 0,
    itemsByType: {},
    oldestItem: null,
    newestItem: null,
    averageAge: 0
  };
  
  // Erreurs d'API (simulées)
  const apiErrors: Array<{endpoint: string; timestamp: number; error: string}> = [];
  
  return {
    apiBaseUrl,
    apiTimeout,
    cacheDuration,
    cacheStats,
    apiErrors,
    lastChecked: Date.now()
  };
}
