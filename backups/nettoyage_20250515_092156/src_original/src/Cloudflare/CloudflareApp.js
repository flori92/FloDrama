/**
 * Configuration principale de l'application Cloudflare pour FloDrama
 * Remplace l'ancienne initialisation Firebase
 */

import authService from './CloudflareAuth';
import dbService from './CloudflareDB';
import { API_BASE_URL, CLOUDFLARE_CONFIG } from './CloudflareConfig';

// Initialisation de l'application Cloudflare
const initCloudflare = () => {
  console.log('Initialisation de Cloudflare Workers pour FloDrama');
  
  // Vérifier la connectivité avec l'API Cloudflare
  // Utiliser un endpoint qui existe certainement (root de l'API)
  fetch(`${API_BASE_URL}/api`)
    .then(response => {
      if (response.ok) {
        console.log('Connexion à l\'API Cloudflare établie avec succès');
      } else {
        console.warn('L\'API Cloudflare est accessible mais renvoie une erreur:', response.status);
        // Tenter une connexion alternative
        return fetch(`${API_BASE_URL}`);
      }
    })
    .then(response => {
      if (response && response.ok) {
        console.log('Connexion alternative à l\'API Cloudflare établie');
      }
    })
    .catch(error => {
      console.error('Erreur de connexion à l\'API Cloudflare:', error);
      console.log('Utilisation du mode hors ligne avec données locales');
      // Fallback sur les données locales activé
    });
    
  return {
    auth: authService,
    db: dbService,
    config: CLOUDFLARE_CONFIG
  };
};

// Exporter l'application initialisée
export const CloudflareApp = initCloudflare();

// Exporter les services individuels pour un accès direct
export const auth = authService;
export const db = dbService;

export default CloudflareApp;
