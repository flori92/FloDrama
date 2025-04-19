// Styles CSS pour FloDrama
// Implémente les styles globaux et spécifiques pour l'interface

export const styles = `
// Fonction pour ajouter les styles CSS
function addStyles() {
  const style = document.createElement('style');
  style.textContent = \`
    /* Variables CSS */
    :root {
      --color-primary: #3b82f6;
      --color-accent: #d946ef;
      --color-background: #121118;
      --color-background-secondary: #1A1926;
      --color-text-primary: #ffffff;
      --color-text-secondary: rgba(255, 255, 255, 0.7);
      --gradient-primary: linear-gradient(to right, #3b82f6, #d946ef);
      --transition-default: all 0.3s ease;
      --border-radius-sm: 4px;
      --border-radius-md: 8px;
      --border-radius-lg: 12px;
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 2rem;
      --spacing-xl: 3rem;
    }
    
    /* Styles de base */
    body {
      margin: 0;
      padding: 0;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--color-background);
      color: var(--color-text-primary);
      line-height: 1.5;
      overflow-x: hidden;
    }
    
    * {
      box-sizing: border-box;
    }
    
    /* Conteneur principal */
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
    }
    
    /* Styles de la navbar */
    .navbar {
      background: rgba(26, 25, 38, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .navbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 2rem;
      max-width: 1440px;
      margin: 0 auto;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
    }
    
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
    }
    
    .brand-name {
      margin-left: 10px;
      font-size: 1.5rem;
      font-weight: bold;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .nav-links {
      display: flex;
      gap: 1.5rem;
      margin-left: 2rem;
    }
    
    .nav-link {
      color: var(--color-text-primary);
      text-decoration: none;
      font-weight: 500;
      transition: var(--transition-default);
      padding: 0.5rem 0.75rem;
      border-radius: var(--border-radius-sm);
      position: relative;
    }
    
    .nav-link:hover {
      color: var(--color-accent);
    }
    
    .search-container {
      position: relative;
    }
    
    .search-input {
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      color: var(--color-text-primary);
      width: 200px;
      transition: var(--transition-default);
    }
    
    .search-input:focus {
      width: 250px;
      background-color: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      outline: none;
    }
    
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
    }
    
    .user-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .notifications-button,
    .profile-button {
      background: none;
      border: none;
      color: var(--color-text-primary);
      cursor: pointer;
      position: relative;
    }
    
    .notification-indicator {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 8px;
      height: 8px;
      background: var(--gradient-primary);
      border-radius: 50%;
    }
    
    /* Styles du carrousel héroïque */
    .hero-carousel {
      position: relative;
      height: 70vh;
      max-height: 600px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    
    .hero-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.5s ease;
      overflow: hidden;
    }
    
    .hero-slide.active {
      opacity: 1;
    }
    
    .slide-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
    }
    
    .slide-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 5rem;
    }
    
    .slide-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      max-width: 60%;
    }
    
    .slide-subtitle {
      font-size: 1.5rem;
      color: var(--color-text-secondary);
      margin-bottom: 2rem;
      max-width: 50%;
    }
    
    .slide-cta {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: var(--gradient-primary);
      border-radius: var(--border-radius-sm);
      color: white;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.3s ease;
    }
    
    .slide-cta:hover {
      transform: scale(1.05);
    }
    
    .carousel-controls {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 2rem;
      z-index: 10;
    }
    
    .carousel-control {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    
    .carousel-control:hover {
      background-color: rgba(0, 0, 0, 0.8);
    }
    
    .slide-indicators {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    }
    
    .slide-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.5);
      border: none;
      cursor: pointer;
      transition: var(--transition-default);
    }
    
    .slide-indicator.active {
      background-color: var(--color-accent);
    }
    
    .slide-indicator:hover:not(.active) {
      transform: scale(1.2);
    }
    
    /* Styles des sections de contenu */
    .content-sections {
      padding: 0 2rem;
      max-width: 1440px;
      margin: 0 auto;
    }
    
    .content-section {
      margin-bottom: 3rem;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .view-all-button {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      transition: var(--transition-default);
    }
    
    .view-all-button:hover {
      color: var(--color-accent);
    }
    
    .content-carousel-container {
      position: relative;
      overflow: hidden;
    }
    
    .cards-container {
      display: flex;
      gap: 1rem;
      transition: transform 0.5s ease;
      padding: 0.5rem 0;
    }
    
    .content-card {
      flex: 0 0 auto;
      width: 200px;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      position: relative;
      transition: var(--transition-default);
      cursor: pointer;
    }
    
    .content-card:hover {
      transform: scale(1.05);
      z-index: 10;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    
    .card-image-container {
      position: relative;
      width: 100%;
      height: 300px;
      overflow: hidden;
    }
    
    .card-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .content-card:hover .card-image-container img {
      transform: scale(1.1);
    }
    
    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(18, 17, 24, 0.9), transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1rem;
    }
    
    .content-card:hover .card-overlay {
      opacity: 1;
    }
    
    .card-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
    }
    
    .card-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }
    
    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .play-button {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--gradient-primary);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .info-button,
    .favorite-button {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    /* Styles du footer */
    .footer {
      background-color: var(--color-background-secondary);
      padding: 3rem 0;
      margin-top: 2rem;
    }
    
    .footer-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .footer-brand {
      margin-bottom: 2rem;
    }
    
    .footer-logo {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: bold;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    
    .footer-description {
      color: var(--color-text-secondary);
      max-width: 400px;
    }
    
    .footer-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .footer-section-title {
      color: white;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    
    .footer-link-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .footer-link-item {
      margin-bottom: 0.5rem;
    }
    
    .footer-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: var(--transition-default);
    }
    
    .footer-link:hover {
      color: var(--color-accent);
    }
    
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .copyright {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }
    
    .social-links {
      display: flex;
      gap: 1rem;
    }
    
    .social-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 1.2rem;
      transition: var(--transition-default);
    }
    
    .social-link:hover {
      color: var(--color-accent);
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
      .slide-title {
        font-size: 2.5rem;
        max-width: 70%;
      }
      
      .slide-subtitle {
        font-size: 1.2rem;
        max-width: 60%;
      }
    }
    
    @media (max-width: 768px) {
      .navbar-container {
        flex-wrap: wrap;
      }
      
      .nav-links {
        order: 3;
        width: 100%;
        margin: 1rem 0 0;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }
      
      .slide-title {
        font-size: 2rem;
        max-width: 80%;
      }
      
      .slide-subtitle {
        font-size: 1rem;
        max-width: 70%;
      }
      
      .hero-carousel {
        height: 50vh;
      }
      
      .footer-links {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 480px) {
      .slide-content {
        padding: 0 2rem;
      }
      
      .slide-title {
        font-size: 1.5rem;
        max-width: 100%;
      }
      
      .slide-subtitle {
        font-size: 0.9rem;
        max-width: 100%;
      }
      
      .content-sections {
        padding: 0 1rem;
      }
      
      .footer-links {
        grid-template-columns: 1fr;
      }
      
      .footer-bottom {
        flex-direction: column;
        gap: 1rem;
      }
    }
  \`;
  
  document.head.appendChild(style);
}
`;
