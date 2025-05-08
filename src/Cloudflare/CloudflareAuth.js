/**
 * Service d'authentification Cloudflare pour FloDrama
 * Remplace les fonctionnalités Firebase Auth
 */

import axios from 'axios';
import { AUTH_API_URL, USERS_API_URL, handleApiResponse } from './CloudflareConfig';

// Classe principale d'authentification
class CloudflareAuth {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Vérifier si l'utilisateur est déjà connecté (via token localStorage)
    this.initAuth();
  }

  // Initialisation de l'authentification
  async initAuth() {
    const token = localStorage.getItem('flodrama_auth_token');
    if (token) {
      try {
        // Vérifier la validité du token
        const response = await axios.get(`${AUTH_API_URL}/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 200) {
          this.currentUser = response.data.user;
          this.notifyAuthStateChanged();
        } else {
          // Token invalide, déconnexion
          this.signOut();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        this.signOut();
      }
    }
  }

  // Connexion avec email/mot de passe
  async signInWithEmailAndPassword(email, password) {
    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email,
        password
      });
      
      if (response.status === 200 && response.data.token) {
        localStorage.setItem('flodrama_auth_token', response.data.token);
        this.currentUser = response.data.user;
        this.notifyAuthStateChanged();
        return response.data;
      } else {
        throw new Error(response.data.message || "Échec de la connexion");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  }

  // Création de compte
  async createUserWithEmailAndPassword(email, password) {
    try {
      const response = await axios.post(`${AUTH_API_URL}/register`, {
        email,
        password
      });
      
      if (response.status === 201 && response.data.token) {
        localStorage.setItem('flodrama_auth_token', response.data.token);
        this.currentUser = response.data.user;
        this.notifyAuthStateChanged();
        return response.data;
      } else {
        throw new Error(response.data.message || "Échec de la création de compte");
      }
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);
      throw error;
    }
  }

  // Déconnexion
  async signOut() {
    try {
      const token = localStorage.getItem('flodrama_auth_token');
      if (token) {
        // Informer le serveur de la déconnexion
        await axios.post(`${AUTH_API_URL}/logout`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      // Nettoyage local quoi qu'il arrive
      localStorage.removeItem('flodrama_auth_token');
      this.currentUser = null;
      this.notifyAuthStateChanged();
    }
  }

  // Mise à jour du profil utilisateur
  async updateProfile(userData) {
    try {
      const token = localStorage.getItem('flodrama_auth_token');
      if (!token || !this.currentUser) {
        throw new Error("Utilisateur non connecté");
      }
      
      const response = await axios.put(`${USERS_API_URL}/${this.currentUser.uid}/profile`, userData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        // Mettre à jour l'utilisateur local
        this.currentUser = { ...this.currentUser, ...response.data.user };
        this.notifyAuthStateChanged();
        return response.data;
      } else {
        throw new Error(response.data.message || "Échec de la mise à jour du profil");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      throw error;
    }
  }

  // Observer les changements d'état d'authentification (similaire à onAuthStateChanged de Firebase)
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    
    // Appeler immédiatement avec l'état actuel
    callback(this.currentUser);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  // Notifier tous les listeners des changements d'état
  notifyAuthStateChanged() {
    this.authStateListeners.forEach(listener => {
      listener(this.currentUser);
    });
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    return this.currentUser;
  }
}

// Créer une instance unique du service d'authentification
const authService = new CloudflareAuth();

// Exporter les fonctions d'authentification pour remplacer les imports Firebase
export const getAuth = () => authService;
export const signInWithEmailAndPassword = (email, password) => authService.signInWithEmailAndPassword(email, password);
export const createUserWithEmailAndPassword = (email, password) => authService.createUserWithEmailAndPassword(email, password);
export const signOut = () => authService.signOut();
export const updateProfile = (userData) => authService.updateProfile(userData);
export const onAuthStateChanged = (callback) => authService.onAuthStateChanged(callback);

export default authService;
