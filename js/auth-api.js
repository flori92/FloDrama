/**
 * Service d'API d'authentification
 * 
 * Ce module gère les appels API pour l'authentification avec le backend MongoDB Atlas via AWS API Gateway
 */

// URL de base de l'API - utilise import.meta.env qui est disponible dans Vite/navigateur
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL + '/auth'
  : '/api/auth';

/**
 * Enregistre un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur (nom, email, mot de passe)
 * @returns {Promise} Promesse résolue avec les données de l'utilisateur et le token
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'inscription');
    }
    
    // Stocker le token dans le localStorage
    if (data.token) {
      localStorage.setItem('flodrama_token', data.token);
      localStorage.setItem('flodrama_user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    throw error;
  }
};

/**
 * Connecte un utilisateur existant
 * @param {Object} credentials - Identifiants de l'utilisateur (email, mot de passe)
 * @returns {Promise} Promesse résolue avec les données de l'utilisateur et le token
 */
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      // Ajout des options CORS pour GitHub Pages
      mode: 'cors',
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }
    
    // Stocker le token dans le localStorage
    if (data.token) {
      localStorage.setItem('flodrama_token', data.token);
      localStorage.setItem('flodrama_user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const logout = () => {
  localStorage.removeItem('flodrama_token');
  localStorage.removeItem('flodrama_user');
};

/**
 * Récupère les informations de l'utilisateur connecté
 * @returns {Promise} Promesse résolue avec les données de l'utilisateur
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('flodrama_token');
    
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      // Ajout des options CORS pour GitHub Pages
      mode: 'cors',
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération du profil');
    }
    
    return data.data;
  } catch (error) {
    console.error('Erreur de récupération du profil:', error);
    // Si l'erreur est due à un token invalide, déconnecter l'utilisateur
    if (error.message.includes('token') || error.message.includes('non autorisé')) {
      logout();
    }
    throw error;
  }
};

/**
 * Met à jour le profil de l'utilisateur
 * @param {Object} profileData - Données du profil à mettre à jour
 * @returns {Promise} Promesse résolue avec les données mises à jour
 */
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('flodrama_token');
    
    if (!token) {
      throw new Error('Utilisateur non connecté');
    }
    
    const response = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
    }
    
    // Mettre à jour les données utilisateur dans le localStorage
    const currentUser = JSON.parse(localStorage.getItem('flodrama_user') || '{}');
    const updatedUser = { ...currentUser, ...data.data };
    localStorage.setItem('flodrama_user', JSON.stringify(updatedUser));
    
    return data.data;
  } catch (error) {
    console.error('Erreur de mise à jour du profil:', error);
    throw error;
  }
};

/**
 * Met à jour le mot de passe de l'utilisateur
 * @param {Object} passwordData - Données de mot de passe (currentPassword, newPassword)
 * @returns {Promise} Promesse résolue avec un message de succès
 */
export const updatePassword = async (passwordData) => {
  try {
    const token = localStorage.getItem('flodrama_token');
    
    if (!token) {
      throw new Error('Utilisateur non connecté');
    }
    
    const response = await fetch(`${API_URL}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour du mot de passe');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur de mise à jour du mot de passe:', error);
    throw error;
  }
};

/**
 * Gère les favoris (ajouter/supprimer)
 * @param {String} contentId - ID du contenu
 * @param {String} action - Action à effectuer ('add' ou 'remove')
 * @returns {Promise} Promesse résolue avec la liste des favoris mise à jour
 */
export const manageFavorites = async (contentId, action) => {
  try {
    const token = localStorage.getItem('flodrama_token');
    
    if (!token) {
      throw new Error('Utilisateur non connecté');
    }
    
    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contentId, action }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la gestion des favoris');
    }
    
    // Mettre à jour les favoris dans le localStorage
    const currentUser = JSON.parse(localStorage.getItem('flodrama_user') || '{}');
    currentUser.favorites = data.data;
    localStorage.setItem('flodrama_user', JSON.stringify(currentUser));
    
    return data.data;
  } catch (error) {
    console.error('Erreur de gestion des favoris:', error);
    throw error;
  }
};

/**
 * Met à jour l'historique de visionnage
 * @param {String} contentId - ID du contenu
 * @param {Number} progress - Progression du visionnage (0-100)
 * @returns {Promise} Promesse résolue avec l'historique de visionnage mis à jour
 */
export const updateWatchHistory = async (contentId, progress) => {
  try {
    const token = localStorage.getItem('flodrama_token');
    
    if (!token) {
      throw new Error('Utilisateur non connecté');
    }
    
    const response = await fetch(`${API_URL}/watch-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contentId, progress }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour de l\'historique de visionnage');
    }
    
    return data.data;
  } catch (error) {
    console.error('Erreur de mise à jour de l\'historique de visionnage:', error);
    throw error;
  }
};

// Exporter un objet avec toutes les fonctions
export default {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updatePassword,
  manageFavorites,
  updateWatchHistory
};
