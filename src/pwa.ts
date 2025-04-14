// Fichier de gestion PWA pour FloDrama
import { registerSW } from 'virtual:pwa-register';

// Fonction pour mettre à jour le service worker
export function registerServiceWorker() {
  // Fonction de rechargement périodique pour les mises à jour
  const updateSW = registerSW({
    onNeedRefresh() {
      // Afficher une notification stylisée avec l'identité visuelle FloDrama
      const notification = document.createElement('div');
      notification.className = 'flodrama-pwa-update';
      notification.innerHTML = `
        <div class="flodrama-pwa-update-content">
          <div class="flodrama-pwa-update-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="url(#gradient)" />
              <defs>
                <linearGradient id="gradient" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#3b82f6" />
                  <stop offset="1" stop-color="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="flodrama-pwa-update-message">
            <h3>Mise à jour disponible</h3>
            <p>Une nouvelle version de FloDrama est disponible !</p>
          </div>
          <div class="flodrama-pwa-update-actions">
            <button id="pwa-update-accept" class="flodrama-btn-primary">Mettre à jour</button>
            <button id="pwa-update-reject" class="flodrama-btn-secondary">Plus tard</button>
          </div>
        </div>
      `;
      
      // Ajouter la notification au DOM
      document.body.appendChild(notification);
      
      // Ajouter les styles
      const style = document.createElement('style');
      style.textContent = `
        .flodrama-pwa-update {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #1A1926;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          max-width: 320px;
          animation: slideIn 0.3s ease forwards;
        }
        
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .flodrama-pwa-update-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .flodrama-pwa-update-icon {
          display: flex;
          justify-content: center;
        }
        
        .flodrama-pwa-update-message h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .flodrama-pwa-update-message p {
          margin: 0;
          font-size: 14px;
          color: #ffffff;
        }
        
        .flodrama-pwa-update-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        
        .flodrama-btn-primary {
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .flodrama-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .flodrama-btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .flodrama-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
      
      // Ajouter les événements
      document.getElementById('pwa-update-accept')?.addEventListener('click', () => {
        updateSW(true);
        notification.remove();
        style.remove();
      });
      
      document.getElementById('pwa-update-reject')?.addEventListener('click', () => {
        notification.remove();
        style.remove();
      });
    },
    onOfflineReady() {
      console.log('FloDrama est prêt pour une utilisation hors ligne');
      
      // Notification discrète pour le mode hors ligne
      const offlineToast = document.createElement('div');
      offlineToast.className = 'flodrama-offline-toast';
      offlineToast.innerHTML = `
        <div class="flodrama-offline-toast-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM17 11H7V13H17V11Z" fill="#3b82f6" />
          </svg>
          <span>FloDrama est disponible hors ligne</span>
        </div>
      `;
      
      // Ajouter la notification au DOM
      document.body.appendChild(offlineToast);
      
      // Ajouter les styles
      const style = document.createElement('style');
      style.textContent = `
        .flodrama-offline-toast {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: #1A1926;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          animation: fadeIn 0.3s ease forwards, fadeOut 0.3s ease 3s forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; visibility: hidden; }
        }
        
        .flodrama-offline-toast-content {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .flodrama-offline-toast-content span {
          font-size: 14px;
          color: white;
        }
      `;
      document.head.appendChild(style);
      
      // Supprimer après 3.5 secondes
      setTimeout(() => {
        offlineToast.remove();
        style.remove();
      }, 3500);
    }
  });
  
  return updateSW;
}

// Détection de la connexion réseau
export function setupNetworkDetection() {
  const updateNetworkStatus = () => {
    if (navigator.onLine) {
      document.documentElement.classList.remove('flodrama-offline');
      document.documentElement.classList.add('flodrama-online');
    } else {
      document.documentElement.classList.remove('flodrama-online');
      document.documentElement.classList.add('flodrama-offline');
      
      // Notification pour le mode hors ligne
      const offlineAlert = document.createElement('div');
      offlineAlert.className = 'flodrama-offline-alert';
      offlineAlert.innerHTML = `
        <div class="flodrama-offline-alert-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM17 11H7V13H17V11Z" fill="#d946ef" />
          </svg>
          <span>Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.</span>
        </div>
      `;
      
      // Vérifier si l'alerte existe déjà
      if (!document.querySelector('.flodrama-offline-alert')) {
        document.body.appendChild(offlineAlert);
        
        // Ajouter les styles
        const style = document.createElement('style');
        style.className = 'flodrama-offline-alert-style';
        style.textContent = `
          .flodrama-offline-alert {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1A1926;
            z-index: 9999;
            animation: slideDown 0.3s ease forwards;
          }
          
          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
          
          .flodrama-offline-alert-content {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            max-width: 600px;
            margin: 0 auto;
          }
          
          .flodrama-offline-alert-content span {
            font-size: 14px;
            color: white;
          }
        `;
        document.head.appendChild(style);
      }
    }
  };
  
  // Initialiser l'état
  updateNetworkStatus();
  
  // Écouter les changements de connexion
  window.addEventListener('online', () => {
    updateNetworkStatus();
    // Supprimer l'alerte si elle existe
    const alert = document.querySelector('.flodrama-offline-alert');
    const style = document.querySelector('.flodrama-offline-alert-style');
    if (alert) alert.remove();
    if (style) style.remove();
  });
  
  window.addEventListener('offline', updateNetworkStatus);
}

// Initialiser la PWA
export function initPWA() {
  registerServiceWorker();
  setupNetworkDetection();
}

export default initPWA;
