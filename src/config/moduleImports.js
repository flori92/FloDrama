/**
 * Configuration centralisée des imports de modules pour FloDrama
 * Ce fichier résout les problèmes de chargement de modules en environnement local et production
 */

// Fonction pour résoudre les chemins des modules en fonction de l'environnement
export function resolveModulePath(path) {
  // Détection d'environnement
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocalhost ? '' : '/FloDrama/';
  
  // Normalisation du chemin
  if (path.startsWith('./')) {
    path = path.substring(2);
  } else if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  return `${baseUrl}${path}`;
}

// Fonction pour charger un module de manière asynchrone
export async function loadModule(modulePath) {
  try {
    const resolvedPath = resolveModulePath(modulePath);
    console.log(`Chargement du module: ${resolvedPath}`);
    return await import(resolvedPath);
  } catch (error) {
    console.error(`Erreur lors du chargement du module ${modulePath}:`, error);
    throw error;
  }
}

// Liste des chemins des modules essentiels
export const MODULE_PATHS = {
  // Services
  HybridContentService: './src/services/HybridContentService.js',
  FreeAPIProvider: './src/services/api/FreeAPIProvider.js',
  
  // Pages
  HybridHomePage: './src/pages/HybridHomePage.jsx',
  DynamicHomePage: './src/pages/DynamicHomePage.jsx',
  
  // Utilitaires
  CacheManager: './src/utils/cacheManager.js',
  LocalImageFallback: './src/utils/localImageFallback.js',
  ImageOptimizer: './src/utils/imageOptimizer.js',
  
  // PWA
  PWAInit: './src/pwa/initPWA.js'
};

// Charge tous les modules essentiels et les expose à l'objet window.FloDrama
export async function initializeModules() {
  try {
    const modules = {};
    
    // Charger les modules essentiels
    for (const [name, path] of Object.entries(MODULE_PATHS)) {
      try {
        const module = await loadModule(path);
        modules[name] = module.default || module;
        console.log(`Module ${name} chargé avec succès`);
      } catch (error) {
        console.warn(`Échec du chargement du module ${name}, utilisation du fallback si disponible`);
      }
    }
    
    // Créer ou mettre à jour l'objet global FloDrama
    window.FloDrama = {
      ...(window.FloDrama || {}),
      ...modules,
      moduleLoadTime: new Date().toISOString()
    };
    
    console.log('Tous les modules ont été chargés dans l\'objet global FloDrama');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des modules:', error);
    return false;
  }
}
