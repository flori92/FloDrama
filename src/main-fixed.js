// Version non-module de main.jsx pour éviter les problèmes de MIME type
console.log('FloDrama - Version fixe chargée');

// Fonction pour vérifier si React est correctement chargé
function isReactAvailable() {
  return (
    typeof React !== 'undefined' && 
    React !== null && 
    typeof React.createElement === 'function' && 
    typeof React.Component === 'function'
  );
}

// Fonction pour supprimer le préchargeur
function removePreloader() {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      try {
        preloader.remove();
      } catch (e) {
        console.warn('Erreur lors de la suppression du preloader:', e);
      }
    }, 500);
  }
}

// Fonction pour afficher un message d'erreur
function showErrorMessage(message) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        background-color: #121118;
        padding: 20px;
        border-radius: 8px;
        margin: 50px auto;
        max-width: 500px;
        text-align: center;
      ">
        <h2 style="color: #d946ef;">FloDrama</h2>
        <p>${message}</p>
        <p>Une refonte complète de l'application est en cours pour résoudre ces problèmes.</p>
        <button onclick="window.location.reload()" style="
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 20px;
        ">
          Rafraîchir la page
        </button>
      </div>
    `;
  }
}

// Fonction pour charger l'interface optimisée de FloDrama
function loadOptimizedInterface() {
  console.log('Chargement de l\'interface optimisée de FloDrama...');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Élément racine 'root' non trouvé dans le DOM");
    return;
  }
  
  // Charger l'interface optimisée
  rootElement.innerHTML = `
    <div class="flodrama-app">
      <header class="header">
        <div class="logo">FloDrama</div>
        <nav class="nav">
          <a href="#" class="nav-item active">Accueil</a>
          <a href="#" class="nav-item">Dramas</a>
          <a href="#" class="nav-item">Films</a>
          <a href="#" class="nav-item">Animés</a>
          <a href="#" class="nav-item">Ma Liste</a>
        </nav>
        <div class="user-menu">
          <button class="search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="user-avatar">FD</div>
        </div>
      </header>
      
      <main class="main-content">
        <section class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">Découvrez le meilleur du streaming asiatique</h1>
            <p class="hero-description">FloDrama vous propose une sélection de dramas coréens, films asiatiques et animés japonais en streaming.</p>
            <div class="hero-buttons">
              <button class="primary-button">Explorer</button>
              <button class="secondary-button">En savoir plus</button>
            </div>
          </div>
          <div class="hero-backdrop"></div>
        </section>
        
        <section class="content-section">
          <h2 class="section-title">Tendances</h2>
          <div class="media-grid">
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Crash Landing on You</h3>
                <p class="media-details">2020 • Drame, Romance</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Parasite</h3>
                <p class="media-details">2019 • Thriller, Drame</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Demon Slayer</h3>
                <p class="media-details">2019 • Action, Fantastique</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">It's Okay to Not Be Okay</h3>
                <p class="media-details">2020 • Drame, Romance</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Your Name</h3>
                <p class="media-details">2016 • Animation, Romance</p>
              </div>
            </div>
          </div>
        </section>
        
        <section class="content-section">
          <h2 class="section-title">Dramas Populaires</h2>
          <div class="media-grid">
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Goblin</h3>
                <p class="media-details">2016 • Fantastique, Romance</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Hospital Playlist</h3>
                <p class="media-details">2020 • Comédie, Médical</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Reply 1988</h3>
                <p class="media-details">2015 • Comédie, Drame</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">Vincenzo</h3>
                <p class="media-details">2021 • Action, Comédie</p>
              </div>
            </div>
            <div class="media-card">
              <div class="media-poster"></div>
              <div class="media-info">
                <h3 class="media-title">My Mister</h3>
                <p class="media-details">2018 • Drame</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-logo">FloDrama</div>
          <div class="footer-links">
            <a href="#" class="footer-link">À propos</a>
            <a href="#" class="footer-link">Conditions d'utilisation</a>
            <a href="#" class="footer-link">Confidentialité</a>
            <a href="#" class="footer-link">Contact</a>
          </div>
          <div class="footer-copyright"> 2025 FloDrama. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  `;
  
  // Ajouter les styles CSS
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .flodrama-app {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #121118;
      color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background-color: rgba(26, 25, 38, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }
    
    .logo {
      font-weight: bold;
      font-size: 24px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    
    .nav {
      display: flex;
      gap: 24px;
    }
    
    .nav-item {
      color: white;
      text-decoration: none;
      font-weight: 500;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }
    
    .nav-item:hover, .nav-item.active {
      opacity: 1;
    }
    
    .nav-item.active {
      position: relative;
    }
    
    .nav-item.active::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      border-radius: 1px;
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .search-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }
    
    .search-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
    }
    
    .main-content {
      flex: 1;
      padding-top: 70px;
    }
    
    .hero-section {
      height: 70vh;
      position: relative;
      display: flex;
      align-items: center;
      padding: 0 24px;
      overflow: hidden;
    }
    
    .hero-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to right, rgba(18, 17, 24, 0.9), rgba(18, 17, 24, 0.7)), url('/public/assets/static/placeholders/backdrop-placeholder.svg');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    
    .hero-content {
      max-width: 700px;
      z-index: 1;
    }
    
    .hero-title {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .hero-description {
      font-size: 18px;
      margin-bottom: 32px;
      opacity: 0.8;
      line-height: 1.6;
    }
    
    .hero-buttons {
      display: flex;
      gap: 16px;
    }
    
    .primary-button {
      background: linear-gradient(to right, #3b82f6, #d946ef);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 28px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(217, 70, 239, 0.4);
    }
    
    .secondary-button {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
      padding: 14px 32px;
      border-radius: 28px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }
    
    .secondary-button:hover {
      border-color: rgba(255, 255, 255, 0.4);
    }
    
    .content-section {
      padding: 40px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 28px;
      margin-bottom: 24px;
      position: relative;
      display: inline-block;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      border-radius: 2px;
    }
    
    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 24px;
    }
    
    .media-card {
      background-color: #1A1926;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }
    
    .media-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    
    .media-poster {
      width: 100%;
      height: 280px;
      background-color: #2a293a;
      background-image: linear-gradient(45deg, #3b82f6, #d946ef);
      position: relative;
    }
    
    .media-info {
      padding: 16px;
    }
    
    .media-title {
      font-weight: 600;
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    
    .media-details {
      font-size: 14px;
      opacity: 0.7;
      margin: 0;
    }
    
    .footer {
      background-color: #1A1926;
      padding: 40px 24px;
      margin-top: 40px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .footer-logo {
      font-weight: bold;
      font-size: 24px;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
      margin-bottom: 24px;
    }
    
    .footer-links {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .footer-link {
      color: white;
      text-decoration: none;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }
    
    .footer-link:hover {
      opacity: 1;
    }
    
    .footer-copyright {
      opacity: 0.5;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .nav {
        display: none;
      }
      
      .hero-title {
        font-size: 32px;
      }
      
      .hero-description {
        font-size: 16px;
      }
      
      .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
      
      .media-poster {
        height: 220px;
      }
      
      .footer-links {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(styleElement);
  
  console.log('Interface optimisée chargée avec succès');
}

// Fonction d'initialisation simplifiée
function initializeSimpleApp() {
  console.log('Initialisation de la version simplifiée de FloDrama...');
  
  try {
    // Supprimer le préchargeur
    removePreloader();
    
    // Charger l'interface optimisée
    loadOptimizedInterface();
    
    // Simuler un chargement réussi
    console.log('Version simplifiée de FloDrama initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    showErrorMessage("Une erreur est survenue lors du chargement de l'application.");
  }
}

// Initialiser l'application simplifiée
document.addEventListener('DOMContentLoaded', function() {
  console.log('FloDrama initialisation simplifiée:', new Date().toISOString());
  
  // Initialiser l'application simplifiée après un court délai
  setTimeout(initializeSimpleApp, 1000);
});
