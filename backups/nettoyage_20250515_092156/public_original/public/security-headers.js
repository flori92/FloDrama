// Ce fichier est chargé dans index.html pour ajouter des en-têtes de sécurité côté client
(function() {
  // Vérifier si nous sommes en mode développement
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Fonction pour ajouter une méta-balise de sécurité
  function addSecurityMeta(name, content) {
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  // Ajouter des en-têtes de sécurité via meta tags
  addSecurityMeta('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com; img-src 'self' data: https://i.ytimg.com https://image.tmdb.org https://*.tmdb.org https://*.flodrama.com https://*.cloudflare.com https://*.jsdelivr.net https://via.placeholder.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://*.jsdelivr.net; font-src 'self' data: https://cdnjs.cloudflare.com https://*.jsdelivr.net; connect-src 'self' https://flodrama-api-worker.florifavi.workers.dev https://flodrama-cors-proxy.florifavi.workers.dev https://api.themoviedb.org https://*.themoviedb.org https://*.flodrama.com https://*.cloudflare.com https://*.florifavi.workers.dev");
  addSecurityMeta('X-Content-Type-Options', 'nosniff');
  // X-Frame-Options ne peut être défini que via un en-tête HTTP, pas via meta
  addSecurityMeta('X-XSS-Protection', '1; mode=block');
  
  // Désactiver la console en production pour limiter les fuites d'informations
  if (!isDev) {
    console.log = function() {};
    console.error = function() {};
    console.warn = function() {};
    console.debug = function() {};
    console.info = function() {};
  }
})();
