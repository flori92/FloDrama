/**
 * @file home-init.js
 * @description Script d'initialisation pour la page d'accueil de FloDrama
 * Initialise les composants nécessaires et gère le chargement de la page
 */

import { HomeContentComponent } from '../scripts/components/HomeContentComponent.js';
import { NavbarComponent } from '../scripts/components/navbar.js';
import footerComponent from '../scripts/components/footer.js';

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialiser la barre de navigation
    const navbar = new NavbarComponent();
    await navbar.init();
    
    // Initialiser le composant de contenu de la page d'accueil
    new HomeContentComponent({
      containerId: 'main-content'
    });
    
    // Initialiser le pied de page
    await footerComponent.init();
    
    // Masquer l'écran de chargement une fois que tout est initialisé
    hideLoadingScreen();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la page d\'accueil:', error);
    // Masquer l'écran de chargement même en cas d'erreur
    hideLoadingScreen();
    // Afficher un message d'erreur à l'utilisateur
    showErrorMessage(error);
  }
});

/**
 * Masque l'écran de chargement avec une animation
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Ajouter une classe pour l'animation de fondu
    loadingScreen.classList.add('fade-out');
    
    // Supprimer l'élément après l'animation
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
}

/**
 * Affiche un message d'erreur à l'utilisateur
 * @param {Error} error - L'erreur survenue
 */
function showErrorMessage(error) {
  // Créer un élément pour afficher l'erreur
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-notification';
  errorContainer.innerHTML = `
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <div class="error-message">
        <h3>Une erreur est survenue</h3>
        <p>${error.message || 'Impossible de charger la page. Veuillez réessayer plus tard.'}</p>
      </div>
      <button class="error-close">×</button>
    </div>
  `;
  
  // Ajouter l'élément au document
  document.body.appendChild(errorContainer);
  
  // Ajouter un gestionnaire d'événement pour fermer la notification
  const closeButton = errorContainer.querySelector('.error-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      errorContainer.classList.add('fade-out');
      setTimeout(() => errorContainer.remove(), 300);
    });
  }
  
  // Fermer automatiquement après 10 secondes
  setTimeout(() => {
    if (document.body.contains(errorContainer)) {
      errorContainer.classList.add('fade-out');
      setTimeout(() => errorContainer.remove(), 300);
    }
  }, 10000);
}
