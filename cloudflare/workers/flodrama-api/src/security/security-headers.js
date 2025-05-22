/**
 * Configuration des en-têtes de sécurité pour l'application
 */

export const securityHeaders = {
  // Protection contre le clickjacking
  'X-Frame-Options': 'DENY',
  
  // Protection contre le MIME-sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Politique de sécurité du contenu (CSP)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://flodrama-api.florifavi.workers.dev",
    "frame-ancestors 'none'"
  ].join('; '),
  
  // Politique de référenceur
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'fullscreen=()'
  ].join(', '),
  
  // HSTS (à décommenter en production avec SSL)
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Protection XSS (obsolète mais toujours utile pour les anciens navigateurs)
  'X-XSS-Protection': '1; mode=block',
  
  // Feature Policy (obsolète mais maintenu pour la rétrocompatibilité)
  'Feature-Policy': [
    "camera 'none'",
    "microphone 'none'",
    "geolocation 'none'"
  ].join('; ')
};

/**
 * Applique les en-têtes de sécurité à une réponse
 * @param {Response} response - La réponse à sécuriser
 * @returns {Response} La réponse avec les en-têtes de sécurité
 */
export function applySecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  
  // Ajoute chaque en-tête de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Crée une nouvelle réponse avec les en-têtes mis à jour
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
