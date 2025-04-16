/**
 * Route Validator
 * 
 * Utilitaire pour valider les routes et liens de navigation de l'application FloDrama.
 * Permet de détecter les erreurs 404 potentielles en vérifiant la correspondance
 * entre les routes définies et les liens de navigation.
 */

// Routes définies dans l'application
const definedRoutes = [
  // Routes principales
  '/',
  '/dramas',
  '/movies',
  '/bollywood',
  '/anime',
  '/categories',
  '/search',
  '/watchlist',
  '/subscription',
  '/account',
  '/premium-example',
  '/notifications',
  '/download',
  '/admin',
  '/watch-parties',
  '/video/:id',
  
  // Routes dynamiques
  '/:type/:id',
  '/:type/:id/play/:episode?',
  '/watch-party/:id',
  
  // Routes de support
  '/support/about',
  '/support/faq',
  '/support/help',
  '/support/contact',
  '/support/technologies',
  '/support/terms',
  '/support/privacy'
];

// Liens de navigation dans la barre de navigation
const navbarLinks = [
  // Liens principaux
  { name: 'Accueil', path: '/' },
  { name: 'Dramas', path: '/dramas' },
  { name: 'Films', path: '/movies' },
  { name: 'Bollywood', path: '/bollywood' },
  { name: 'Anime', path: '/anime' },
  { name: 'Catégories', path: '/categories' },
  
  // Liens du menu support
  { name: 'À propos', path: '/support/about' },
  { name: 'FAQ', path: '/support/faq' },
  { name: 'Aide', path: '/support/help' },
  { name: 'Contact', path: '/support/contact' },
  { name: 'Technologies', path: '/support/technologies' },
  { name: 'Conditions d\'utilisation', path: '/support/terms' },
  { name: 'Politique de confidentialité', path: '/support/privacy' },
  { name: 'Abonnements', path: '/subscription' },
  { name: 'Mon compte', path: '/account' },
  { name: 'Télécharger l\'application', path: '/download' },
  
  // Icônes de droite
  { name: 'Recherche', path: '/search' },
  { name: 'Notifications', path: '/notifications' },
  { name: 'Compte', path: '/account' }
];

/**
 * Vérifie si une route est définie dans l'application
 * @param {string} path - Chemin à vérifier
 * @returns {boolean} - True si la route est définie, false sinon
 */
const isRouteDefined = (path) => {
  // Vérifier les routes exactes
  if (definedRoutes.includes(path)) {
    return true;
  }
  
  // Vérifier les routes dynamiques
  for (const route of definedRoutes) {
    if (route.includes(':')) {
      const routeRegex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
      if (routeRegex.test(path)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Vérifie si tous les liens de navigation ont des routes correspondantes
 * @returns {Object} - Résultat de la validation
 */
const validateNavLinks = () => {
  const invalidLinks = [];
  
  for (const link of navbarLinks) {
    if (!isRouteDefined(link.path)) {
      invalidLinks.push(link);
    }
  }
  
  return {
    valid: invalidLinks.length === 0,
    invalidLinks
  };
};

/**
 * Exécute la validation des routes et liens de navigation
 * @returns {Object} - Résultat de la validation
 */
const validateRoutes = () => {
  const navLinksValidation = validateNavLinks();
  
  return {
    navLinksValid: navLinksValidation.valid,
    invalidNavLinks: navLinksValidation.invalidLinks,
    definedRoutes,
    navbarLinks
  };
};

export default {
  validateRoutes,
  isRouteDefined
};
