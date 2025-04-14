/**
 * FloDrama - Interface utilisateur pour l'authentification
 * 
 * Ce module gère les composants d'interface utilisateur pour l'authentification,
 * y compris les modales de connexion, d'inscription et de profil utilisateur.
 * Intégré avec MongoDB Atlas et stockage local de secours.
 */

import auth from './auth.js';

class AuthUI {
  constructor() {
    this.loginModal = null;
    this.registerModal = null;
    this.profileModal = null;
    this.overlay = null;
    
    // Initialiser les composants d'interface
    this.init();
  }
  
  /**
   * Initialise les composants d'interface utilisateur
   */
  init() {
    // Créer les modales et l'overlay s'ils n'existent pas déjà
    this.createModals();
    
    // Ajouter les styles CSS nécessaires
    this.addStyles();
    
    // Ajouter les écouteurs d'événements
    this.addEventListeners();
    
    // S'abonner aux changements d'état d'authentification
    auth.addAuthStateListener(this.handleAuthStateChange.bind(this));
    
    // Mettre à jour l'interface en fonction de l'état d'authentification actuel
    this.updateUI(auth.getCurrentUser());
  }
  
  /**
   * Crée les modales d'authentification
   */
  createModals() {
    // Vérifier si les modales existent déjà
    if (document.getElementById('loginModal')) {
      return;
    }
    
    // Créer l'overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'authOverlay';
    this.overlay.className = 'auth-overlay';
    document.body.appendChild(this.overlay);
    
    // Créer la modale de connexion
    this.loginModal = document.createElement('div');
    this.loginModal.id = 'loginModal';
    this.loginModal.className = 'auth-modal';
    this.loginModal.innerHTML = `
      <div class="auth-modal-content">
        <div class="auth-modal-header">
          <h2>Connexion</h2>
          <button class="auth-modal-close" data-action="close-modal">&times;</button>
        </div>
        <div class="auth-modal-body">
          <form id="loginForm">
            <div class="auth-form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" name="email" required placeholder="votre@email.com">
            </div>
            <div class="auth-form-group">
              <label for="loginPassword">Mot de passe</label>
              <input type="password" id="loginPassword" name="password" required placeholder="Votre mot de passe">
            </div>
            <div class="auth-form-error" id="loginError"></div>
            <div class="auth-form-actions">
              <button type="submit" class="auth-button auth-button-primary">Se connecter</button>
            </div>
          </form>
          <div class="auth-form-footer">
            <p>Pas encore de compte ? <a href="#" data-action="show-register">S'inscrire</a></p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.loginModal);
    
    // Créer la modale d'inscription
    this.registerModal = document.createElement('div');
    this.registerModal.id = 'registerModal';
    this.registerModal.className = 'auth-modal';
    this.registerModal.innerHTML = `
      <div class="auth-modal-content">
        <div class="auth-modal-header">
          <h2>Inscription</h2>
          <button class="auth-modal-close" data-action="close-modal">&times;</button>
        </div>
        <div class="auth-modal-body">
          <form id="registerForm">
            <div class="auth-form-group">
              <label for="registerName">Nom complet</label>
              <input type="text" id="registerName" name="name" required placeholder="Votre nom">
            </div>
            <div class="auth-form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" name="email" required placeholder="votre@email.com">
            </div>
            <div class="auth-form-group">
              <label for="registerPassword">Mot de passe</label>
              <input type="password" id="registerPassword" name="password" required placeholder="6 caractères minimum">
            </div>
            <div class="auth-form-group">
              <label for="registerPasswordConfirm">Confirmer le mot de passe</label>
              <input type="password" id="registerPasswordConfirm" name="passwordConfirm" required placeholder="Confirmer votre mot de passe">
            </div>
            <div class="auth-form-error" id="registerError"></div>
            <div class="auth-form-actions">
              <button type="submit" class="auth-button auth-button-primary">S'inscrire</button>
            </div>
          </form>
          <div class="auth-form-footer">
            <p>Déjà inscrit ? <a href="#" data-action="show-login">Se connecter</a></p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.registerModal);
    
    // Créer la modale de profil utilisateur
    this.profileModal = document.createElement('div');
    this.profileModal.id = 'profileModal';
    this.profileModal.className = 'auth-modal';
    this.profileModal.innerHTML = `
      <div class="auth-modal-content">
        <div class="auth-modal-header">
          <h2>Mon profil</h2>
          <button class="auth-modal-close" data-action="close-modal">&times;</button>
        </div>
        <div class="auth-modal-body">
          <div class="profile-header">
            <div class="profile-avatar">
              <div class="user-avatar profile-avatar-large">FD</div>
            </div>
            <div class="profile-info">
              <h3 id="profileName">Nom de l'utilisateur</h3>
              <p id="profileEmail">email@utilisateur.com</p>
            </div>
          </div>
          
          <div class="profile-section">
            <h4>Mes préférences</h4>
            <form id="preferencesForm">
              <div class="auth-form-group">
                <label>Thème</label>
                <div class="auth-radio-group">
                  <label>
                    <input type="radio" name="theme" value="dark" checked> Sombre
                  </label>
                  <label>
                    <input type="radio" name="theme" value="light"> Clair
                  </label>
                </div>
              </div>
              
              <div class="auth-form-group">
                <label>Notifications</label>
                <div class="auth-switch">
                  <input type="checkbox" id="notificationsSwitch" name="notifications" checked>
                  <label for="notificationsSwitch"></label>
                </div>
              </div>
              
              <div class="auth-form-group">
                <label>Filtres de contenu</label>
                <div class="auth-checkbox-group">
                  <label>
                    <input type="checkbox" name="showAdult" id="showAdultContent"> Afficher le contenu adulte
                  </label>
                </div>
              </div>
              
              <div class="auth-form-actions">
                <button type="submit" class="auth-button auth-button-primary">Enregistrer</button>
              </div>
            </form>
          </div>
          
          <div class="profile-section">
            <h4>Actions</h4>
            <div class="profile-actions">
              <button class="auth-button auth-button-secondary" data-action="logout">Se déconnecter</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.profileModal);
  }
  
  /**
   * Ajoute les styles CSS nécessaires
   */
  addStyles() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('authStyles')) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'authStyles';
    
    styleElement.textContent = `
      /* Overlay */
      .auth-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        display: none;
      }
      
      /* Modales */
      .auth-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #1A1926;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        width: 90%;
        max-width: 450px;
        z-index: 1001;
        display: none;
        overflow: hidden;
      }
      
      .auth-modal-content {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
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
        font-size: 24px;
        background: linear-gradient(to right, #3b82f6, #d946ef);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      
      .auth-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.3s ease;
      }
      
      .auth-modal-close:hover {
        opacity: 1;
        color: #d946ef;
      }
      
      .auth-modal-body {
        padding: 20px;
        overflow-y: auto;
      }
      
      /* Formulaires */
      .auth-form-group {
        margin-bottom: 20px;
      }
      
      .auth-form-group label {
        display: block;
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
      }
      
      .auth-form-group input[type="text"],
      .auth-form-group input[type="email"],
      .auth-form-group input[type="password"] {
        width: 100%;
        padding: 12px 15px;
        background-color: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: white;
        font-size: 16px;
        transition: all 0.3s ease;
      }
      
      .auth-form-group input:focus {
        outline: none;
        border-color: #d946ef;
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .auth-form-error {
        color: #f87171;
        font-size: 14px;
        margin-bottom: 15px;
        min-height: 20px;
      }
      
      .auth-form-actions {
        margin-top: 10px;
      }
      
      .auth-form-footer {
        margin-top: 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }
      
      .auth-form-footer a {
        color: #3b82f6;
        text-decoration: none;
        transition: all 0.3s ease;
      }
      
      .auth-form-footer a:hover {
        color: #d946ef;
        text-decoration: underline;
      }
      
      /* Boutons */
      .auth-button {
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        width: 100%;
      }
      
      .auth-button-primary {
        background: linear-gradient(to right, #3b82f6, #d946ef);
        color: white;
      }
      
      .auth-button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      .auth-button-secondary {
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      .auth-button-secondary:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      /* Profil */
      .profile-header {
        display: flex;
        align-items: center;
        margin-bottom: 30px;
      }
      
      .profile-avatar {
        margin-right: 20px;
      }
      
      .profile-avatar-large {
        width: 64px;
        height: 64px;
        font-size: 24px;
      }
      
      .profile-info h3 {
        margin: 0 0 5px 0;
        font-size: 20px;
      }
      
      .profile-info p {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }
      
      .profile-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .profile-section:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .profile-section h4 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.9);
      }
      
      /* Groupes de boutons radio et checkbox */
      .auth-radio-group,
      .auth-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .auth-radio-group label,
      .auth-checkbox-group label {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-bottom: 0;
      }
      
      .auth-radio-group input,
      .auth-checkbox-group input {
        margin-right: 10px;
      }
      
      /* Switch */
      .auth-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .auth-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .auth-switch label {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.2);
        transition: .4s;
        border-radius: 24px;
      }
      
      .auth-switch label:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      .auth-switch input:checked + label {
        background: linear-gradient(to right, #3b82f6, #d946ef);
      }
      
      .auth-switch input:checked + label:before {
        transform: translateX(26px);
      }
      
      /* Classes d'état */
      .auth-modal.active,
      .auth-overlay.active {
        display: block;
      }
      
      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translate(-50%, -60%); opacity: 0; }
        to { transform: translate(-50%, -50%); opacity: 1; }
      }
      
      .auth-overlay.active {
        animation: fadeIn 0.3s ease forwards;
      }
      
      .auth-modal.active {
        animation: slideIn 0.3s ease forwards;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .auth-modal {
          width: 95%;
          max-height: 80vh;
        }
        
        .auth-modal-header h2 {
          font-size: 20px;
        }
      }
      
      /* Toast */
      .auth-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #3b82f6;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.3s ease forwards;
        transform: translateY(100%);
      }
      
      .auth-toast-hide {
        animation: fadeOut 0.3s ease forwards;
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(100%); }
      }
      
      .auth-toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .auth-toast-icon {
        font-size: 24px;
      }
      
      .auth-toast-message {
        font-size: 16px;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  /**
   * Ajoute les écouteurs d'événements
   */
  addEventListeners() {
    // Écouteurs pour les boutons de connexion
    document.querySelectorAll('.login-button, [data-action="login"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginModal();
      });
    });
    
    // Écouteurs pour les boutons de profil
    document.querySelectorAll('.profile-button, [data-action="profile"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (auth.isLoggedIn()) {
          this.showProfileModal();
        } else {
          this.showLoginModal();
        }
      });
    });
    
    // Écouteurs pour les boutons de fermeture des modales
    document.querySelectorAll('[data-action="close-modal"]').forEach(button => {
      button.addEventListener('click', () => {
        this.hideAllModals();
      });
    });
    
    // Fermer les modales en cliquant sur l'overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.hideAllModals();
      });
    }
    
    // Écouteurs pour les liens entre modales
    document.querySelectorAll('[data-action="show-register"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterModal();
      });
    });
    
    document.querySelectorAll('[data-action="show-login"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginModal();
      });
    });
    
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
    
    // Formulaire de préférences
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUpdatePreferences();
      });
    }
    
    // Bouton de déconnexion
    document.querySelectorAll('[data-action="logout"]').forEach(button => {
      button.addEventListener('click', () => {
        auth.logout();
        this.hideAllModals();
      });
    });
  }
  
  /**
   * Gère les changements d'état d'authentification
   * @param {Object|null} user - Utilisateur connecté ou null si déconnecté
   */
  handleAuthStateChange(user) {
    this.updateUI(user);
  }
  
  /**
   * Met à jour l'interface utilisateur en fonction de l'état d'authentification
   * @param {Object|null} user - Utilisateur connecté ou null si déconnecté
   */
  updateUI(user) {
    // Mettre à jour les éléments d'interface utilisateur
    const userAvatars = document.querySelectorAll('.user-avatar');
    const loginButtons = document.querySelectorAll('.login-button, [data-action="login"]');
    const profileButtons = document.querySelectorAll('.profile-button, [data-action="profile"]');
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    
    if (user) {
      // Utilisateur connecté
      
      // Mettre à jour les avatars utilisateur
      userAvatars.forEach(avatar => {
        // Utiliser les initiales du nom de l'utilisateur
        const initials = user.name
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase();
        
        avatar.textContent = initials;
      });
      
      // Mettre à jour les boutons de connexion/profil
      loginButtons.forEach(button => {
        button.style.display = 'none';
      });
      
      profileButtons.forEach(button => {
        button.style.display = 'flex';
      });
      
      // Mettre à jour le contenu de la modale de profil
      if (this.profileModal) {
        const profileName = this.profileModal.querySelector('#profileName');
        const profileEmail = this.profileModal.querySelector('#profileEmail');
        
        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;
        
        // Mettre à jour les préférences
        const preferences = auth.getPreferences();
        
        const themeRadios = this.profileModal.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
          radio.checked = radio.value === preferences.theme;
        });
        
        const notificationsSwitch = this.profileModal.querySelector('#notificationsSwitch');
        if (notificationsSwitch) {
          notificationsSwitch.checked = preferences.notifications;
        }
        
        const showAdultContent = this.profileModal.querySelector('#showAdultContent');
        if (showAdultContent) {
          showAdultContent.checked = preferences.contentFilters?.showAdult || false;
        }
      }
    } else {
      // Utilisateur déconnecté
      
      // Mettre à jour les avatars utilisateur
      userAvatars.forEach(avatar => {
        avatar.textContent = 'FD';
      });
      
      // Mettre à jour les boutons de connexion/profil
      loginButtons.forEach(button => {
        button.style.display = 'flex';
      });
      
      profileButtons.forEach(button => {
        button.style.display = 'none';
      });
    }
  }
  
  /**
   * Affiche la modale de connexion
   */
  showLoginModal() {
    this.hideAllModals();
    
    if (this.loginModal && this.overlay) {
      this.loginModal.classList.add('active');
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le champ email
      setTimeout(() => {
        const emailInput = this.loginModal.querySelector('#loginEmail');
        if (emailInput) emailInput.focus();
      }, 100);
    }
  }
  
  /**
   * Affiche la modale d'inscription
   */
  showRegisterModal() {
    this.hideAllModals();
    
    if (this.registerModal && this.overlay) {
      this.registerModal.classList.add('active');
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le champ nom
      setTimeout(() => {
        const nameInput = this.registerModal.querySelector('#registerName');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  }
  
  /**
   * Affiche la modale de profil utilisateur
   */
  showProfileModal() {
    this.hideAllModals();
    
    if (this.profileModal && this.overlay) {
      this.profileModal.classList.add('active');
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  /**
   * Cache toutes les modales
   */
  hideAllModals() {
    const modals = [this.loginModal, this.registerModal, this.profileModal];
    
    modals.forEach(modal => {
      if (modal) modal.classList.remove('active');
    });
    
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
  }
  
  /**
   * Gère la soumission du formulaire de connexion
   */
  handleLogin() {
    const loginForm = document.getElementById('loginForm');
    const errorElement = document.getElementById('loginError');
    
    if (!loginForm || !errorElement) return;
    
    // Réinitialiser le message d'erreur
    errorElement.textContent = '';
    
    // Récupérer les valeurs du formulaire
    const email = loginForm.querySelector('#loginEmail').value;
    const password = loginForm.querySelector('#loginPassword').value;
    
    // Valider les champs
    if (!email || !password) {
      errorElement.textContent = 'Veuillez remplir tous les champs.';
      return;
    }
    
    // Afficher un indicateur de chargement
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Connexion en cours...';
    
    // Tentative de connexion
    auth.login(email, password)
      .then(user => {
        // Connexion réussie
        this.hideAllModals();
        
        // Afficher un message de bienvenue
        const welcomeToast = document.createElement('div');
        welcomeToast.className = 'auth-toast';
        welcomeToast.innerHTML = `
          <div class="auth-toast-content">
            <div class="auth-toast-icon">✓</div>
            <div class="auth-toast-message">Bienvenue, ${user.name} !</div>
          </div>
        `;
        document.body.appendChild(welcomeToast);
        
        // Supprimer le toast après 3 secondes
        setTimeout(() => {
          welcomeToast.classList.add('auth-toast-hide');
          setTimeout(() => {
            welcomeToast.remove();
          }, 300);
        }, 3000);
      })
      .catch(error => {
        // Erreur de connexion
        errorElement.textContent = error.message || 'Erreur de connexion. Veuillez réessayer.';
      })
      .finally(() => {
        // Restaurer le bouton
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      });
  }
  
  /**
   * Gère la soumission du formulaire d'inscription
   */
  handleRegister() {
    const registerForm = document.getElementById('registerForm');
    const errorElement = document.getElementById('registerError');
    
    if (!registerForm || !errorElement) return;
    
    // Réinitialiser le message d'erreur
    errorElement.textContent = '';
    
    // Récupérer les valeurs du formulaire
    const name = registerForm.querySelector('#registerName').value;
    const email = registerForm.querySelector('#registerEmail').value;
    const password = registerForm.querySelector('#registerPassword').value;
    const passwordConfirm = registerForm.querySelector('#registerPasswordConfirm').value;
    
    // Valider les champs
    if (!name || !email || !password || !passwordConfirm) {
      errorElement.textContent = 'Veuillez remplir tous les champs.';
      return;
    }
    
    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorElement.textContent = 'Veuillez entrer une adresse email valide.';
      return;
    }
    
    // Valider le mot de passe
    if (password.length < 6) {
      errorElement.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    
    // Vérifier que les mots de passe correspondent
    if (password !== passwordConfirm) {
      errorElement.textContent = 'Les mots de passe ne correspondent pas.';
      return;
    }
    
    // Afficher un indicateur de chargement
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Inscription en cours...';
    
    // Tentative d'inscription
    auth.register({ name, email, password })
      .then(user => {
        // Inscription réussie
        this.hideAllModals();
        
        // Afficher un message de bienvenue
        const welcomeToast = document.createElement('div');
        welcomeToast.className = 'auth-toast auth-toast-success';
        welcomeToast.innerHTML = `
          <div class="auth-toast-content">
            <div class="auth-toast-icon">✓</div>
            <div class="auth-toast-message">
              <strong>Bienvenue sur FloDrama, ${user.name} !</strong>
              <p>Votre compte a été créé avec succès.</p>
            </div>
          </div>
        `;
        document.body.appendChild(welcomeToast);
        
        // Supprimer le toast après 5 secondes
        setTimeout(() => {
          welcomeToast.classList.add('auth-toast-hide');
          setTimeout(() => {
            welcomeToast.remove();
          }, 300);
        }, 5000);
      })
      .catch(error => {
        // Erreur d'inscription
        errorElement.textContent = error.message || 'Erreur d\'inscription. Veuillez réessayer.';
      })
      .finally(() => {
        // Restaurer le bouton
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      });
  }
  
  /**
   * Gère la mise à jour des préférences utilisateur
   */
  handleUpdatePreferences() {
    const preferencesForm = document.getElementById('preferencesForm');
    
    if (!preferencesForm) return;
    
    // Récupérer les valeurs du formulaire
    const theme = preferencesForm.querySelector('input[name="theme"]:checked').value;
    const notifications = preferencesForm.querySelector('#notificationsSwitch').checked;
    const showAdult = preferencesForm.querySelector('#showAdultContent').checked;
    
    // Mettre à jour les préférences
    const preferences = {
      theme,
      notifications,
      contentFilters: {
        showAdult
      }
    };
    
    auth.updatePreferences(preferences);
    
    // Afficher un message de confirmation
    alert('Vos préférences ont été enregistrées.');
  }
}

// Exporter une instance unique du module d'interface utilisateur
const authUI = new AuthUI();
export default authUI;
