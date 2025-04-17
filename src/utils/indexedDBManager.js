/**
 * Gestionnaire de cache IndexedDB pour FloDrama
 * 
 * Ce module permet de stocker et récupérer des données volumineuses en cache
 * en utilisant IndexedDB pour améliorer les performances et le support hors ligne.
 */

// Configuration de la base de données
const DB_CONFIG = {
  name: 'flodrama-cache',
  version: 1,
  stores: {
    content: { keyPath: 'id' },
    images: { keyPath: 'id' },
    user: { keyPath: 'id' },
    settings: { keyPath: 'id' }
  },
  // Durée de vie du cache en millisecondes
  ttl: {
    content: 3 * 60 * 60 * 1000, // 3 heures pour le contenu
    images: 7 * 24 * 60 * 60 * 1000, // 7 jours pour les images
    user: 30 * 24 * 60 * 60 * 1000, // 30 jours pour les données utilisateur
    settings: 90 * 24 * 60 * 60 * 1000 // 90 jours pour les paramètres
  },
  // Taille maximale du cache en octets (50 Mo)
  maxSize: 50 * 1024 * 1024
};

// Variable pour stocker la connexion à la base de données
let dbConnection = null;

/**
 * Initialise la connexion à la base de données IndexedDB
 * @returns {Promise<IDBDatabase>} - Connexion à la base de données
 */
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (dbConnection) {
      resolve(dbConnection);
      return;
    }
    
    // Vérifier si IndexedDB est disponible
    if (!window.indexedDB) {
      reject(new Error('IndexedDB n\'est pas supporté par ce navigateur'));
      return;
    }
    
    try {
      const request = window.indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
      
      // Gérer la mise à niveau de la base de données
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Créer les object stores si nécessaire
        Object.entries(DB_CONFIG.stores).forEach(([storeName, storeConfig]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, storeConfig);
            console.log(`Store "${storeName}" créé avec succès`);
          }
        });
      };
      
      // Gérer le succès de l'ouverture
      request.onsuccess = (event) => {
        dbConnection = event.target.result;
        console.log('Connexion à IndexedDB établie avec succès');
        
        // Nettoyer le cache au démarrage
        cleanupDatabase(dbConnection);
        
        resolve(dbConnection);
      };
      
      // Gérer les erreurs
      request.onerror = (event) => {
        console.error('Erreur lors de l\'ouverture de la base de données:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      reject(error);
    }
  });
};

/**
 * Nettoie la base de données en supprimant les entrées expirées
 * @param {IDBDatabase} db - Connexion à la base de données
 */
const cleanupDatabase = async (db) => {
  try {
    const now = Date.now();
    
    // Nettoyer chaque store
    for (const [storeName, ttl] of Object.entries(DB_CONFIG.ttl)) {
      if (!db.objectStoreNames.contains(storeName)) continue;
      
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Récupérer toutes les clés
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          
          // Vérifier si l'entrée est expirée
          if (entry.timestamp && (now - entry.timestamp > ttl)) {
            // Supprimer l'entrée expirée
            store.delete(cursor.key);
            console.log(`Entrée expirée supprimée: ${cursor.key} du store ${storeName}`);
          }
          
          cursor.continue();
        }
      };
      
      // Gérer les erreurs
      transaction.onerror = (event) => {
        console.error(`Erreur lors du nettoyage du store ${storeName}:`, event.target.error);
      };
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
  }
};

/**
 * Calcule la taille approximative d'un objet
 * @param {Object} object - Objet à mesurer
 * @returns {number} - Taille approximative en octets
 */
const getObjectSize = (object) => {
  try {
    const jsonString = JSON.stringify(object);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.warn('Erreur lors du calcul de la taille de l\'objet:', error);
    return 0;
  }
};

/**
 * Enregistre des données dans IndexedDB
 * @param {string} storeName - Nom du store
 * @param {string} id - Identifiant unique de l'entrée
 * @param {any} data - Données à stocker
 * @returns {Promise<boolean>} - true si l'opération a réussi
 */
export const setItem = async (storeName, id, data) => {
  try {
    // Vérifier si le store existe
    if (!DB_CONFIG.stores[storeName]) {
      console.error(`Store "${storeName}" non défini dans la configuration`);
      return false;
    }
    
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Créer l'entrée avec un timestamp
    const entry = {
      id,
      data,
      timestamp: Date.now(),
      size: getObjectSize(data)
    };
    
    // Vérifier la taille de l'entrée
    if (entry.size > DB_CONFIG.maxSize * 0.1) {
      console.warn(`Entrée trop volumineuse (${entry.size} octets), ignorée`);
      return false;
    }
    
    // Créer la transaction
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Enregistrer les données
    return new Promise((resolve) => {
      const request = store.put(entry);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de l'enregistrement dans ${storeName}:`, event.target.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement dans ${storeName}:`, error);
    return false;
  }
};

/**
 * Récupère des données depuis IndexedDB
 * @param {string} storeName - Nom du store
 * @param {string} id - Identifiant unique de l'entrée
 * @returns {Promise<any>} - Données stockées ou null si non trouvées
 */
export const getItem = async (storeName, id) => {
  try {
    // Vérifier si le store existe
    if (!DB_CONFIG.stores[storeName]) {
      console.error(`Store "${storeName}" non défini dans la configuration`);
      return null;
    }
    
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Créer la transaction
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    // Récupérer les données
    return new Promise((resolve) => {
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const entry = event.target.result;
        
        // Vérifier si l'entrée existe
        if (!entry) {
          resolve(null);
          return;
        }
        
        // Vérifier si l'entrée est expirée
        const now = Date.now();
        const ttl = DB_CONFIG.ttl[storeName];
        
        if (now - entry.timestamp > ttl) {
          // Supprimer l'entrée expirée
          const deleteTransaction = db.transaction(storeName, 'readwrite');
          const deleteStore = deleteTransaction.objectStore(storeName);
          deleteStore.delete(id);
          
          resolve(null);
          return;
        }
        
        // Mettre à jour le timestamp pour prolonger la durée de vie
        if (now - entry.timestamp > ttl / 2) {
          setItem(storeName, id, entry.data).catch(console.error);
        }
        
        resolve(entry.data);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération depuis ${storeName}:`, event.target.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération depuis ${storeName}:`, error);
    return null;
  }
};

/**
 * Supprime une entrée de la base de données
 * @param {string} storeName - Nom du store
 * @param {string} id - Identifiant unique de l'entrée
 * @returns {Promise<boolean>} - true si l'opération a réussi
 */
export const removeItem = async (storeName, id) => {
  try {
    // Vérifier si le store existe
    if (!DB_CONFIG.stores[storeName]) {
      console.error(`Store "${storeName}" non défini dans la configuration`);
      return false;
    }
    
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Créer la transaction
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Supprimer l'entrée
    return new Promise((resolve) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la suppression depuis ${storeName}:`, event.target.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression depuis ${storeName}:`, error);
    return false;
  }
};

/**
 * Vide un store complet
 * @param {string} storeName - Nom du store à vider
 * @returns {Promise<boolean>} - true si l'opération a réussi
 */
export const clearStore = async (storeName) => {
  try {
    // Vérifier si le store existe
    if (!DB_CONFIG.stores[storeName]) {
      console.error(`Store "${storeName}" non défini dans la configuration`);
      return false;
    }
    
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Créer la transaction
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Vider le store
    return new Promise((resolve) => {
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log(`Store "${storeName}" vidé avec succès`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors du vidage du store ${storeName}:`, event.target.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error(`Erreur lors du vidage du store ${storeName}:`, error);
    return false;
  }
};

/**
 * Vide tous les stores de la base de données
 * @returns {Promise<boolean>} - true si l'opération a réussi
 */
export const clearAll = async () => {
  try {
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Vider chaque store
    const results = await Promise.all(
      Object.keys(DB_CONFIG.stores).map(storeName => clearStore(storeName))
    );
    
    // Vérifier si toutes les opérations ont réussi
    return results.every(result => result === true);
  } catch (error) {
    console.error('Erreur lors du vidage de la base de données:', error);
    return false;
  }
};

/**
 * Récupère la taille totale utilisée par la base de données
 * @returns {Promise<number>} - Taille totale en octets
 */
export const getDatabaseSize = async () => {
  try {
    // Initialiser la base de données
    const db = await initDatabase();
    
    let totalSize = 0;
    
    // Calculer la taille de chaque store
    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      if (!db.objectStoreNames.contains(storeName)) continue;
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      // Récupérer toutes les entrées
      const entries = await new Promise((resolve) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          resolve([]);
        };
      });
      
      // Calculer la taille totale
      for (const entry of entries) {
        if (entry.size) {
          totalSize += entry.size;
        } else {
          totalSize += getObjectSize(entry);
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Erreur lors du calcul de la taille de la base de données:', error);
    return 0;
  }
};

/**
 * Récupère des statistiques sur la base de données
 * @returns {Promise<Object>} - Statistiques de la base de données
 */
export const getDatabaseStats = async () => {
  try {
    // Initialiser la base de données
    const db = await initDatabase();
    
    const stats = {
      totalSize: 0,
      totalEntries: 0,
      stores: {}
    };
    
    // Calculer les statistiques pour chaque store
    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      if (!db.objectStoreNames.contains(storeName)) continue;
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      // Récupérer toutes les entrées
      const entries = await new Promise((resolve) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          resolve([]);
        };
      });
      
      // Calculer les statistiques du store
      let storeSize = 0;
      for (const entry of entries) {
        if (entry.size) {
          storeSize += entry.size;
        } else {
          storeSize += getObjectSize(entry);
        }
      }
      
      stats.stores[storeName] = {
        entries: entries.length,
        size: storeSize
      };
      
      stats.totalEntries += entries.length;
      stats.totalSize += storeSize;
    }
    
    return stats;
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques de la base de données:', error);
    return {
      totalSize: 0,
      totalEntries: 0,
      stores: {}
    };
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  clearStore,
  clearAll,
  getDatabaseSize,
  getDatabaseStats
};
