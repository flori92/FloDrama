/**
 * Point d'entrée pour l'intégration des nouveaux services FloDrama avec l'application existante
 * Ce fichier permet de connecter la nouvelle architecture de services avec le code existant
 */

import { initializeServices } from '../services';
import { initializeImageSystemAdapter } from './image-system-adapter';

/**
 * Initialise l'intégration des services FloDrama
 * @returns {Object} - Les services et adaptateurs initialisés
 */
export function initializeIntegration() {
  console.info('[FloDrama] Initialisation de l\'intégration des services');
  
  // Initialiser les services
  const services = initializeServices();
  
  // Initialiser les adaptateurs
  const imageAdapter = initializeImageSystemAdapter();
  
  // Exposer les services et adaptateurs globalement pour faciliter le débogage
  if (typeof window !== 'undefined') {
    window.FloDramaServices = services;
    window.FloDramaAdapters = {
      imageAdapter
    };
  }
  
  console.info('[FloDrama] Intégration des services terminée');
  
  return {
    services,
    adapters: {
      imageAdapter
    }
  };
}

// Initialisation automatique si le script est chargé directement
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIntegration);
  } else {
    initializeIntegration();
  }
}
