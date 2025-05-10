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
  addSecurityMeta('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com; img-src 'self' data: https://i.ytimg.com https://*.flodrama.com https://*.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; connect-src 'self' https://flodrama-api-worker.florifavi.workers.dev https://*.flodrama.com");
  addSecurityMeta('X-Content-Type-Options', 'nosniff');
  addSecurityMeta('X-Frame-Options', 'DENY');
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
