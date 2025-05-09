/**
 * Service de base de données Cloudflare pour FloDrama
 * Remplace les fonctionnalités Firebase Firestore
 */

import axios from 'axios';
import { API_BASE_URL, USERS_API_URL, CONTENT_API_URL, determineContentType, useApiMode } from './CloudflareConfig';

// Import des fonctions mock pour les données locales
import {
  mockGetUserHistory,
  mockGetUserLikedMovies,
  mockGetUserList,
  mockGetPopularMovies,
  mockGetPopularDramas,
  mockGetPopularAnimes,
  mockGetPopularBollywood
} from './CloudflareMock';

// Utilisation de useApiMode importé depuis CloudflareConfig

// Classe principale de gestion de base de données
class CloudflareDB {
  constructor() {
    this.token = localStorage.getItem('flodrama_auth_token');
  }

  // Mise à jour du token si changé
  updateToken() {
    this.token = localStorage.getItem('flodrama_auth_token');
  }

  // Obtenir les en-têtes d'authentification
  getAuthHeaders() {
    this.updateToken();
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  // Équivalent à doc() de Firestore
  doc(collection, id) {
    return new CloudflareDocRef(collection, id, this);
  }

  // Équivalent à collection() de Firestore
  collection(collectionName) {
    return new CloudflareCollectionRef(collectionName, this);
  }

  // Récupérer des données utilisateur
  async getUserData(userId, dataType) {
    try {
      // Vérifier si on doit utiliser l'API ou le mode local
      const useApi = await useApiMode();
      
      if (!useApi) {
        console.log(`Utilisation des données locales pour ${dataType}`);
        // Utiliser les fonctions mock en fonction du type de données
        switch (dataType) {
          case 'history':
            return await mockGetUserHistory(userId);
          case 'liked-movies':
            return await mockGetUserLikedMovies(userId);
          case 'my-list':
            return await mockGetUserList(userId);
          default:
            return { [dataType]: [] };
        }
      }
      
      // Mode API: utiliser l'API Cloudflare
      const response = await axios.get(`${USERS_API_URL}/${userId}/${dataType}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données ${dataType}:`, error);
      
      // En cas d'erreur, utiliser les données locales
      console.log(`Fallback vers les données locales pour ${dataType}`);
      switch (dataType) {
        case 'history':
          return await mockGetUserHistory(userId);
        case 'liked-movies':
          return await mockGetUserLikedMovies(userId);
        case 'my-list':
          return await mockGetUserList(userId);
        default:
          return { [dataType]: [] };
      }
    }
  }

  // Mettre à jour des données utilisateur
  async updateUserData(userId, dataType, data) {
    try {
      const response = await axios.put(`${USERS_API_URL}/${userId}/${dataType}`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des données ${dataType}:`, error);
      throw error;
    }
  }

  // Ajouter un élément à une liste utilisateur
  async addToUserList(userId, listType, item) {
    try {
      const response = await axios.post(`${USERS_API_URL}/${userId}/${listType}`, item, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout à ${listType}:`, error);
      throw error;
    }
  }

  // Supprimer un élément d'une liste utilisateur
  async removeFromUserList(userId, listType, itemId) {
    try {
      const response = await axios.delete(`${USERS_API_URL}/${userId}/${listType}/${itemId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${listType}:`, error);
      throw error;
    }
  }

  // Récupérer des détails de contenu
  async getContentDetails(contentId, contentType) {
    try {
      const type = contentType || 'film'; // Par défaut
      const response = await axios.get(`${CONTENT_API_URL}/${type}/${contentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de contenu:`, error);
      throw error;
    }
  }
}

// Référence à un document (équivalent à DocumentReference de Firestore)
class CloudflareDocRef {
  constructor(collection, id, dbInstance) {
    this.collection = collection;
    this.id = id;
    this.db = dbInstance;
    this.path = `${collection}/${id}`;
  }

  // Équivalent à getDoc() de Firestore
  async get() {
    try {
      let endpoint;
      
      // Déterminer l'endpoint en fonction de la collection
      if (this.collection === 'users') {
        endpoint = `${USERS_API_URL}/${this.id}`;
      } else if (['dramas', 'films', 'animes', 'bollywood'].includes(this.collection)) {
        endpoint = `${CONTENT_API_URL}/${this.collection}/${this.id}`;
      } else {
        endpoint = `${API_BASE_URL}/api/${this.collection}/${this.id}`;
      }
      
      const response = await axios.get(endpoint, {
        headers: this.db.getAuthHeaders()
      });
      
      // Créer un objet similaire au snapshot Firestore
      return {
        exists: () => !!response.data,
        data: () => response.data,
        id: this.id
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du document ${this.path}:`, error);
      // Retourner un snapshot vide en cas d'erreur
      return {
        exists: () => false,
        data: () => null,
        id: this.id
      };
    }
  }

  // Équivalent à setDoc() de Firestore
  async set(data, options = {}) {
    try {
      let endpoint;
      
      // Déterminer l'endpoint en fonction de la collection
      if (this.collection === 'users') {
        endpoint = `${USERS_API_URL}/${this.id}`;
      } else {
        endpoint = `${API_BASE_URL}/api/${this.collection}/${this.id}`;
      }
      
      const method = options.merge ? 'PATCH' : 'PUT';
      
      const response = await axios({
        method,
        url: endpoint,
        data,
        headers: this.db.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du document ${this.path}:`, error);
      throw error;
    }
  }

  // Équivalent à updateDoc() de Firestore
  async update(data) {
    return this.set(data, { merge: true });
  }

  // Équivalent à deleteDoc() de Firestore
  async delete() {
    try {
      let endpoint;
      
      // Déterminer l'endpoint en fonction de la collection
      if (this.collection === 'users') {
        endpoint = `${USERS_API_URL}/${this.id}`;
      } else {
        endpoint = `${API_BASE_URL}/api/${this.collection}/${this.id}`;
      }
      
      const response = await axios.delete(endpoint, {
        headers: this.db.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du document ${this.path}:`, error);
      throw error;
    }
  }
}

// Référence à une collection (équivalent à CollectionReference de Firestore)
class CloudflareCollectionRef {
  constructor(collection, dbInstance) {
    this.collection = collection;
    this.db = dbInstance;
  }

  // Équivalent à doc() de Firestore
  doc(id) {
    return new CloudflareDocRef(this.collection, id, this.db);
  }

  // Équivalent à getDocs() de Firestore
  async get() {
    try {
      let endpoint;
      
      // Déterminer l'endpoint en fonction de la collection
      if (this.collection === 'users') {
        endpoint = USERS_API_URL;
      } else if (['dramas', 'films', 'animes', 'bollywood'].includes(this.collection)) {
        endpoint = `${CONTENT_API_URL}/${this.collection}`;
      } else {
        endpoint = `${API_BASE_URL}/api/${this.collection}`;
      }
      
      const response = await axios.get(endpoint, {
        headers: this.db.getAuthHeaders()
      });
      
      // Créer un objet similaire au snapshot Firestore
      return {
        docs: response.data.map(doc => ({
          id: doc.id,
          data: () => doc,
          exists: () => true
        })),
        empty: response.data.length === 0,
        size: response.data.length
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de la collection ${this.collection}:`, error);
      // Retourner un snapshot vide en cas d'erreur
      return {
        docs: [],
        empty: true,
        size: 0
      };
    }
  }
}

// Créer une instance unique du service de base de données
const dbService = new CloudflareDB();

// Exporter les fonctions de base de données pour remplacer les imports Firebase
export const db = dbService;
export const doc = (collection, id) => dbService.doc(collection, id);
export const getDoc = async (docRef) => await docRef.get();
export const setDoc = async (docRef, data, options) => await docRef.set(data, options);
export const updateDoc = async (docRef, data) => await docRef.update(data);
export const deleteDoc = async (docRef) => await docRef.delete();
export const collection = (collectionName) => dbService.collection(collectionName);
export const getDocs = async (collectionRef) => await collectionRef.get();

export default dbService;
