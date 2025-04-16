/**
 * Script d'initialisation pour FloDrama
 * Ce script intègre toutes nos optimisations :
 * - Système d'optimisation d'images
 * - Données locales pour les carrousels
 */
import { initializeImageSystem } from './utils/imageOptimizer';
import LocalContentService from './api/local-content-data';

// Initialiser le système d'optimisation d'images
initializeImageSystem();

// Ajouter les données locales à window pour un accès facile
window.flodramaContent = LocalContentService.getAllContent();

console.log('FloDrama - Système optimisé initialisé avec succès');

// Exposer les services locaux pour le débogage et les tests
window.LocalContentService = LocalContentService;

// Fonction pour vérifier les erreurs d'images
window.checkMissingImages = () => {
  const imagesWithError = document.querySelectorAll('img.lazy-image-fallback');
  console.log(`Images avec erreurs remplacées : ${imagesWithError.length}`);
  return imagesWithError;
};
