/**
 * Module d'initialisation directe de l'interface enrichie
 * Ce module permet de charger directement l'interface enrichie sans passer par la landing page
 */

// Fonction pour vérifier si on doit charger l'interface enrichie directement
export const shouldLoadEnhancedDirectly = () => {
  // Vérifier les paramètres d'URL
  const urlParams = new URLSearchParams(window.location.search);
  const enhancedParam = urlParams.get('enhanced');
  
  // Vérifier les variables d'environnement
  const skipLandingPage = import.meta.env.VITE_SKIP_LANDING_PAGE === 'true';
  const defaultInterface = import.meta.env.VITE_DEFAULT_INTERFACE === 'enhanced';
  
  // Vérifier si on est sur une route spécifique
  const isEnhancedRoute = ['/app', '/enhanced', '/direct-enhanced'].includes(window.location.pathname);
  
  return enhancedParam === 'true' || skipLandingPage || defaultInterface || isEnhancedRoute;
};

// Fonction pour initialiser l'interface enrichie
export const initializeEnhancedInterface = () => {
  // Supprimer la préloader si elle existe
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.remove();
    }, 300);
  }
  
  // Ajouter la classe pour l'interface enrichie
  document.body.classList.add('enhanced-ui');
  
  // Définir le thème par défaut
  document.body.classList.add('theme-dark');
  
  console.log('Interface enrichie initialisée directement');
};

export default {
  shouldLoadEnhancedDirectly,
  initializeEnhancedInterface
};
