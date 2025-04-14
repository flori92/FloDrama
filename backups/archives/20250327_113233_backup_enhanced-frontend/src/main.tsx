import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';

// Désactiver temporairement le service worker en production pour éviter les erreurs CORS
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      console.log('Désactivation du service worker:', registration.scope);
      registration.unregister();
    }
  });
}

// Fonction pour initialiser l'application
const initApp = () => {
  const root = document.getElementById('root');
  if (!root) {
    console.error('Élément root non trouvé dans le DOM');
    return;
  }
  
  // Masquer le splash screen
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.classList.add('fade-out');
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 500);
  }
  
  // Rendre l'application avec la méthode render classique pour éviter les erreurs TypeScript
  ReactDOM.render(
    <App />,
    root
  );
};

// Initialiser l'application après un court délai pour s'assurer que les ressources sont chargées
setTimeout(initApp, 1000);
