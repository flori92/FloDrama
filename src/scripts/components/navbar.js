/**
 * FloDrama - Composant de barre de navigation
 * Gère l'affichage et le comportement de la barre de navigation
 */

class NavbarComponent {
  constructor() {
    this.isInitialized = false;
    this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('NavbarComponent initialisé - Page courante:', this.currentPage);
  }

  /**
   * Initialise la barre de navigation
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupActiveLinks();
    this.setupMobileMenu();
    this.setupUserMenu();
    
    this.isInitialized = true;
    console.log('NavbarComponent complètement initialisé');
  }

  /**
   * Configure les liens actifs en fonction de la page courante
   */
  setupActiveLinks() {
    // Sélectionner tous les liens de navigation
    const navLinks = document.querySelectorAll('.nav-item, .mobile-nav-item');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Si le lien correspond à la page actuelle
      if (href === this.currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Configure le menu mobile
   */
  setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const overlay = document.getElementById('overlay');
    
    if (!menuToggle || !mobileMenu) return;
    
    const openMobileMenu = () => {
      menuToggle.classList.add('active');
      mobileMenu.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    
    const closeMobileMenu = () => {
      menuToggle.classList.remove('active');
      mobileMenu.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    // Ajouter les événements
    menuToggle.addEventListener('click', openMobileMenu);
    
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }
    
    if (overlay) {
      overlay.addEventListener('click', closeMobileMenu);
    }
    
    // Fermer le menu mobile en cliquant sur un lien
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', closeMobileMenu);
    });
  }

  /**
   * Configure le menu utilisateur
   */
  setupUserMenu() {
    const loginButtons = document.querySelectorAll('[data-action="login"]');
    const registerButtons = document.querySelectorAll('[data-action="register"]');
    const profileButtons = document.querySelectorAll('[data-action="profile"]');
    
    // Configurer les boutons de connexion
    loginButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        // Déclencher l'événement personnalisé pour l'ouverture de la modale
        document.dispatchEvent(new CustomEvent('flodrama:auth:login'));
      });
    });
    
    // Configurer les boutons d'inscription
    registerButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        // Déclencher l'événement personnalisé pour l'ouverture de la modale
        document.dispatchEvent(new CustomEvent('flodrama:auth:register'));
      });
    });
    
    // Configurer les boutons de profil
    profileButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        // Rediriger vers la page de profil ou ouvrir une modale
        // window.location.href = 'profile.html';
        document.dispatchEvent(new CustomEvent('flodrama:profile:open'));
      });
    });
  }
}

// Exporter une instance unique du composant
const navbarComponent = new NavbarComponent();

document.addEventListener('DOMContentLoaded', () => {
  navbarComponent.init();
});

export default navbarComponent;
