'use strict';

/**
 * Fonction Lambda pour améliorer les en-têtes de sécurité HTTP pour FloDrama
 * Optimisée pour obtenir une note A+ sur SSL Labs
 */

exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // Strict-Transport-Security (HSTS)
  // Force les navigateurs à utiliser HTTPS pour les visites futures
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }];

  // X-Content-Type-Options
  // Empêche le navigateur d'interpréter les fichiers comme un type MIME différent
  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  // X-Frame-Options
  // Protège contre les attaques de clickjacking
  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  }];

  // X-XSS-Protection
  // Protège contre les attaques XSS
  headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }];

  // Referrer-Policy
  // Contrôle les informations envoyées dans l'en-tête Referer
  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];

  // Content-Security-Policy
  // Définit les sources autorisées pour les ressources
  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.google-analytics.com 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://api.flodrama.com https://www.google-analytics.com; media-src 'self' blob: https://cdn.flodrama.com; frame-ancestors 'self'; upgrade-insecure-requests;"
  }];

  // Permissions-Policy (anciennement Feature-Policy)
  // Contrôle les fonctionnalités du navigateur qui peuvent être utilisées
  headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }];

  // Cache-Control
  // Optimise la mise en cache pour les ressources statiques
  if (!headers['cache-control']) {
    const url = event.Records[0].cf.request.uri;
    
    if (url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff2|woff|ttf|eot)(\?.*)?$/i)) {
      headers['cache-control'] = [{
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }];
    } else {
      headers['cache-control'] = [{
        key: 'Cache-Control',
        value: 'no-cache, no-store, must-revalidate'
      }];
    }
  }

  // Expect-CT
  // Applique la transparence des certificats
  headers['expect-ct'] = [{
    key: 'Expect-CT',
    value: 'max-age=86400, enforce'
  }];

  // NEL (Network Error Logging)
  // Permet de signaler les erreurs réseau
  headers['nel'] = [{
    key: 'NEL',
    value: '{"report_to":"default","max_age":31536000,"include_subdomains":true}'
  }];

  // Report-To
  // Définit où envoyer les rapports d'erreurs
  headers['report-to'] = [{
    key: 'Report-To',
    value: '{"group":"default","max_age":31536000,"endpoints":[{"url":"https://api.flodrama.com/reports/nel"}],"include_subdomains":true}'
  }];

  return response;
};
