/**
 * FloDrama - Script principal
 * 
 * Ce fichier sert de point d'entrée pour l'application FloDrama.
 * Il initialise tous les modules et configure les interactions entre eux.
 */

// Importer les modules
import auth from './auth.js';
import authUI from './auth-ui.js';

// Classe principale de l'application
class FloDramaApp {
  constructor() {
    this.init();
  }
  
  /**
   * Initialise l'application
   */
  init() {
    // Initialiser les composants d'interface utilisateur
    this.initUI();
    
    // Écouter les changements d'état d'authentification
    this.setupAuthListeners();
    
    // Initialiser les fonctionnalités de la liste de favoris
    this.initFavorites();
    
    console.log('FloDrama App initialisée');
  }
  
  /**
   * Initialise les composants d'interface utilisateur
   */
  initUI() {
    // Mettre à jour les avatars utilisateur
    this.updateUserAvatars();
    
    // Configurer les boutons d'authentification
    this.setupAuthButtons();
    
    // Configurer les boutons de favoris
    this.setupFavoriteButtons();
  }
  
  /**
   * Met à jour les avatars utilisateur avec les initiales de l'utilisateur connecté
   */
  updateUserAvatars() {
    const user = auth.getCurrentUser();
    const userAvatars = document.querySelectorAll('.user-avatar');
    
    userAvatars.forEach(avatar => {
      if (user) {
        // Utiliser les initiales du nom de l'utilisateur
        const initials = user.name
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase();
        
        avatar.textContent = initials;
      } else {
        avatar.textContent = 'FD';
      }
    });
  }
  
  /**
   * Configure les boutons d'authentification
   */
  setupAuthButtons() {
    // Les boutons sont déjà configurés dans auth-ui.js
    // Cette méthode est prévue pour des configurations supplémentaires si nécessaire
  }
  
  /**
   * Configure les écouteurs pour les changements d'état d'authentification
   */
  setupAuthListeners() {
    auth.addAuthStateListener(user => {
      // Mettre à jour l'interface utilisateur en fonction de l'état d'authentification
      this.updateUI(user);
    });
  }
  
  /**
   * Met à jour l'interface utilisateur en fonction de l'état d'authentification
   * @param {Object|null} user - Utilisateur connecté ou null si déconnecté
   */
  updateUI(user) {
    // Mettre à jour les avatars utilisateur
    this.updateUserAvatars();
    
    // Mettre à jour les boutons de favoris
    this.updateFavoriteButtons();
    
    // Mettre à jour les sections réservées aux utilisateurs connectés
    const userOnlyElements = document.querySelectorAll('.user-only');
    userOnlyElements.forEach(element => {
      element.style.display = user ? 'block' : 'none';
    });
    
    // Mettre à jour les sections réservées aux utilisateurs non connectés
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    guestOnlyElements.forEach(element => {
      element.style.display = user ? 'none' : 'block';
    });
  }
  
  /**
   * Initialise les fonctionnalités de la liste de favoris
   */
  initFavorites() {
    // Mettre à jour les boutons de favoris
    this.updateFavoriteButtons();
  }
  
  /**
   * Configure les boutons d'ajout/suppression de favoris
   */
  setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('[data-favorite]');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Vérifier si l'utilisateur est connecté
        if (!auth.isLoggedIn()) {
          // Afficher la modale de connexion
          authUI.showLoginModal();
          return;
        }
        
        const contentId = parseInt(button.dataset.favorite);
        const isFavorite = auth.isFavorite(contentId);
        
        if (isFavorite) {
          // Supprimer des favoris
          auth.removeFromFavorites(contentId);
          button.classList.remove('is-favorite');
          button.setAttribute('title', 'Ajouter aux favoris');
        } else {
          // Ajouter aux favoris
          auth.addToFavorites(contentId);
          button.classList.add('is-favorite');
          button.setAttribute('title', 'Retirer des favoris');
        }
      });
    });
  }
  
  /**
   * Met à jour l'état des boutons de favoris
   */
  updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('[data-favorite]');
    
    favoriteButtons.forEach(button => {
      const contentId = parseInt(button.dataset.favorite);
      const isFavorite = auth.isFavorite(contentId);
      
      if (isFavorite) {
        button.classList.add('is-favorite');
        button.setAttribute('title', 'Retirer des favoris');
      } else {
        button.classList.remove('is-favorite');
        button.setAttribute('title', 'Ajouter aux favoris');
      }
    });
  }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si les modules ES sont supportés
  if (typeof window.flodramaApp === 'undefined') {
    window.flodramaApp = new FloDramaApp();
  }
});
