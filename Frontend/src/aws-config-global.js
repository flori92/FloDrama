// Configuration AWS globale pour FloDrama
// Généré automatiquement par le script de déploiement

// Définir la région AWS globalement
window.AWS_REGION = 'us-east-1';
window.API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flodrama-cors-proxy.onrender.com/api';
window.MEDIA_CDN_URL = 'https://d1323ouxr1qbdp.cloudfront.net';

// Intercepter et corriger les requêtes AWS
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

// Si AWS SDK est présent, configurer la région
if (typeof AWS !== 'undefined') {
  AWS.config.region = 'us-east-1';
  console.log('[AWS Config] Région configurée:', 'us-east-1');
}

console.log('[AWS Config Global] Chargé avec succès');
