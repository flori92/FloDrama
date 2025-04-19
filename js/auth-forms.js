/**
 * FloDrama - Gestionnaire des formulaires d'authentification
 * Génère les modales de connexion/inscription avec une gestion correcte de l'accessibilité
 */

document.addEventListener('DOMContentLoaded', function() {
  // Créer les modales de connexion et d'inscription
  function createAuthModals() {
    // Structure HTML des modales
    const modalHTML = `
      <!-- Modale de connexion -->
      <div class="auth-modal" id="loginModal">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h2>Connexion</h2>
            <button class="auth-modal-close" data-action="close-modal">&times;</button>
          </div>
          <div class="auth-modal-body">
            <form id="loginForm">
              <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" name="email" required placeholder="Votre email" autocomplete="email">
              </div>
              <div class="form-group">
                <label for="loginPassword">Mot de passe</label>
                <input type="password" id="loginPassword" name="password" required placeholder="Votre mot de passe" autocomplete="current-password">
              </div>
              <div class="form-group checkbox">
                <input type="checkbox" id="rememberMe" name="rememberMe">
                <label for="rememberMe">Se souvenir de moi</label>
              </div>
              <button type="submit" class="btn btn-primary">Se connecter</button>
            </form>
            <div class="auth-links">
              <a href="#" data-action="forgot-password">Mot de passe oublié ?</a>
              <a href="#" data-action="open-register">Créer un compte</a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modale d'inscription -->
      <div class="auth-modal" id="registerModal">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h2>Créer un compte</h2>
            <button class="auth-modal-close" data-action="close-modal">&times;</button>
          </div>
          <div class="auth-modal-body">
            <form id="registerForm">
              <div class="form-group">
                <label for="registerName">Nom</label>
                <input type="text" id="registerName" name="name" required placeholder="Votre nom" autocomplete="name">
              </div>
              <div class="form-group">
                <label for="registerEmail">Email</label>
                <input type="email" id="registerEmail" name="email" required placeholder="Votre email" autocomplete="email">
              </div>
              <div class="form-group">
                <label for="registerPassword">Mot de passe</label>
                <input type="password" id="registerPassword" name="password" required placeholder="6 caractères minimum" autocomplete="new-password">
              </div>
              <div class="form-group">
                <label for="registerPasswordConfirm">Confirmer le mot de passe</label>
                <input type="password" id="registerPasswordConfirm" name="passwordConfirm" required placeholder="Confirmer votre mot de passe" autocomplete="new-password">
              </div>
              <div class="form-group checkbox">
                <input type="checkbox" id="acceptTerms" name="acceptTerms" required>
                <label for="acceptTerms">J'accepte les <a href="conditions.html" target="_blank">conditions d'utilisation</a></label>
              </div>
              <button type="submit" class="btn btn-primary">S'inscrire</button>
            </form>
            <div class="auth-links">
              <a href="#" data-action="open-login">Déjà un compte ? Se connecter</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Créer un conteneur pour les modales s'il n'existe pas déjà
    let modalsContainer = document.getElementById('authModals');
    if (!modalsContainer) {
      modalsContainer = document.createElement('div');
      modalsContainer.id = 'authModals';
      document.body.appendChild(modalsContainer);
    }

    // Injecter le HTML des modales
    modalsContainer.innerHTML = modalHTML;

    // Ajouter le CSS pour les modales
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      .auth-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1100;
        align-items: center;
        justify-content: center;
      }
      
      .auth-modal.active {
        display: flex;
      }
      
      .auth-modal-content {
        background-color: var(--bg-secondary);
        max-width: 400px;
        width: 90%;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      }
      
      .auth-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .auth-modal-header h2 {
        margin: 0;
        color: white;
        font-size: 1.5em;
      }
      
      .auth-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5em;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.3s;
      }
      
      .auth-modal-close:hover {
        opacity: 1;
      }
      
      .auth-modal-body {
        padding: 20px;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        color: white;
      }
      
      .form-group input[type="text"],
      .form-group input[type="email"],
      .form-group input[type="password"] {
        width: 100%;
        padding: 10px;
        background-color: var(--bg-dark);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: white;
      }
      
      .form-group.checkbox {
        display: flex;
        align-items: center;
      }
      
      .form-group.checkbox input {
        margin-right: 10px;
      }
      
      .form-group.checkbox label {
        margin-bottom: 0;
      }
      
      .auth-links {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .auth-links a {
        color: var(--primary-blue);
        text-decoration: none;
        opacity: 0.8;
        transition: opacity 0.3s;
      }
      
      .auth-links a:hover {
        opacity: 1;
        text-decoration: underline;
      }
    `;
    
    document.head.appendChild(modalStyle);
  }

  // Fonction pour ouvrir une modale
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le premier champ de formulaire
      const firstInput = modal.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  // Fonction pour fermer une modale
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Gérer les événements de clic pour les modales
  function setupModalEvents() {
    document.addEventListener('click', function(event) {
      const target = event.target;
      
      // Ouvrir la modale de connexion
      if (target.matches('[data-action="login"]')) {
        event.preventDefault();
        openModal('loginModal');
      }
      
      // Ouvrir la modale d'inscription
      else if (target.matches('[data-action="register"]') || target.matches('[data-action="open-register"]')) {
        event.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
      }
      
      // Ouvrir la modale de connexion depuis l'inscription
      else if (target.matches('[data-action="open-login"]')) {
        event.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
      }
      
      // Fermer une modale
      else if (target.matches('[data-action="close-modal"]')) {
        event.preventDefault();
        const modal = target.closest('.auth-modal');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      
      // Fermer les modales en cliquant à l'extérieur
      else if (target.classList.contains('auth-modal')) {
        closeModal(target.id);
      }
    });

    // Gérer les soumissions de formulaire
    document.getElementById('loginForm')?.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Simuler une connexion réussie
      const email = document.getElementById('loginEmail').value;
      console.log('Tentative de connexion avec:', email);
      
      // Redirection ou traitement à faire ici
      closeModal('loginModal');
      alert('Connexion réussie (simulation) !');
    });

    document.getElementById('registerForm')?.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Vérifier que les mots de passe correspondent
      const password = document.getElementById('registerPassword').value;
      const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
      
      if (password !== passwordConfirm) {
        alert('Les mots de passe ne correspondent pas.');
        return;
      }
      
      // Simuler une inscription réussie
      const email = document.getElementById('registerEmail').value;
      console.log('Tentative d\'inscription avec:', email);
      
      // Redirection ou traitement à faire ici
      closeModal('registerModal');
      alert('Inscription réussie (simulation) !');
    });
  }

  // Initialiser les modales d'authentification
  createAuthModals();
  setupModalEvents();
  
  console.log('FloDrama auth forms initialized');
});
