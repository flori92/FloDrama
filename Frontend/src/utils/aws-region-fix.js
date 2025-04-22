// Script de correction de la région AWS pour FloDrama
// Créé le 29-03-2025

// Configuration globale de la région AWS
window.AWS_REGION = 'us-east-1';
window.API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flodrama-cors-proxy.onrender.com/api';
window.MEDIA_CDN_URL = 'https://d1pbqs2b6em4ha.cloudfront.net';

// Intercepter les requêtes fetch pour ajouter la région correcte
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Si l'URL contient amazonaws.com, s'assurer que la région est correcte
  if (typeof url === 'string' && url.includes('amazonaws.com')) {
    // Forcer la région us-east-1 dans les en-têtes d'autorisation
    if (!options.headers) {
      options.headers = {};
    }
    
    // Convertir les Headers en objet si nécessaire
    if (options.headers instanceof Headers) {
      const headerObj = {};
      for (const [key, value] of options.headers.entries()) {
        headerObj[key] = value;
      }
      options.headers = headerObj;
    }
    
    // Ajouter ou remplacer l'en-tête x-amz-region
    options.headers['x-amz-region'] = 'us-east-1';
  }
  
  return originalFetch(url, options);
};

// Intercepter les requêtes XMLHttpRequest pour ajouter la région correcte
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
  this._url = url;
  return originalXHROpen.apply(this, arguments);
};

const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
  if (typeof this._url === 'string' && this._url.includes('amazonaws.com') && header.toLowerCase() === 'x-amz-region') {
    value = 'us-east-1';
  }
  return originalXHRSetRequestHeader.call(this, header, value);
};

// Définir la configuration AWS si le SDK est chargé
if (typeof window !== 'undefined' && typeof window.AWS !== 'undefined') {
  window.AWS.config.update({ region: 'us-east-1' });
  
  // Intercepter la configuration de région dans le SDK AWS
  const originalUpdateMethod = window.AWS.config.update;
  window.AWS.config.update = function(options) {
    if (options && options.region && options.region !== 'us-east-1') {
      console.warn('Tentative de modification de la région AWS. Forçage de la région us-east-1.');
      options.region = 'us-east-1';
    }
    return originalUpdateMethod.call(this, options);
  };
}

// Exporter les variables pour l'utilisation dans le projet
export const AWS_REGION = 'us-east-1';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flodrama-cors-proxy.onrender.com/api';
export const MEDIA_CDN_URL = 'https://d1pbqs2b6em4ha.cloudfront.net';
