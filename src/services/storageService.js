// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

/**
 * Service de gestion du stockage pour FloDrama
 * Gère le stockage local et distant des données utilisateur et médias
 */

/**
 * Sauvegarde une image dans le stockage
 * @param {string} imageData - Données de l'image (base64 ou blob)
 * @param {string} path - Chemin de destination
 * @param {Object} options - Options de stockage
 * @returns {Promise<string>} - URL de l'image stockée
 */
export function saveImage(imageData, path, options = {}) {
  // Mock retournant une URL fictive
  return Promise.resolve(`https://cdn.flodrama.fr/images/${path}`);
}

/**
 * Récupère une image depuis le stockage
 * @param {string} path - Chemin de l'image
 * @param {Object} options - Options de récupération
 * @returns {Promise<string>} - Données de l'image
 */
export function getImage(path, options = {}) {
  // Mock retournant une URL fictive
  return Promise.resolve(`https://cdn.flodrama.fr/images/${path}`);
}

/**
 * Sauvegarde des préférences utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} preferences - Préférences à sauvegarder
 * @returns {Promise<boolean>} - Succès de l'opération
 */
export function saveUserPreferences(userId, preferences) {
  return Promise.resolve(true);
}

/**
 * Récupère les préférences utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Préférences de l'utilisateur
 */
export function getUserPreferences(userId) {
  // Mock retournant des préférences fictives
  return Promise.resolve({
    theme: 'dark',
    subtitleSize: 'medium',
    language: 'fr',
    qualityPreference: 'auto'
  });
}

/**
 * Vérifie l'espace de stockage disponible
 * @returns {Promise<Object>} - Informations sur l'espace de stockage
 */
export function checkStorageSpace() {
  return Promise.resolve({
    total: 5000000000, // 5 GB
    used: 1200000000,  // 1.2 GB
    available: 3800000000 // 3.8 GB
  });
}

// Mock minimal de storageService.js pour débloquer le build
export function uploadToStorage() {
  return Promise.resolve('mock-upload-url');
}

export function getImageUrl() {
  return 'mock-image-url';
}
