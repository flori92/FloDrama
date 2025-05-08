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
  fetch(`${API_BASE_URL}/api/health`)
    .then(response => {
      if (response.ok) {
        console.log('Connexion à l\'API Cloudflare établie avec succès');
      } else {
        console.warn('L\'API Cloudflare est accessible mais renvoie une erreur');
      }
    })
    .catch(error => {
      console.error('Erreur de connexion à l\'API Cloudflare:', error);
      // Fallback sur les données locales si nécessaire
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
