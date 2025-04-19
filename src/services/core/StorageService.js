// Service de stockage unifié pour FloDrama
// Gère différents types de stockage (localStorage, sessionStorage, IndexedDB)

/**
 * Service de gestion du stockage avec support pour localStorage, sessionStorage et IndexedDB
 * @class StorageService
 */
export class StorageService {
  /**
   * Constructeur du service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.prefix - Préfixe pour les clés de stockage (défaut: 'flodrama_')
   * @param {string} config.defaultStorage - Type de stockage par défaut (défaut: 'local')
   * @param {Object} config.indexedDB - Configuration pour IndexedDB
   * @param {string} config.indexedDB.name - Nom de la base de données (défaut: 'flodrama_db')
   * @param {number} config.indexedDB.version - Version de la base de données (défaut: 1)
   * @param {Array} config.indexedDB.stores - Stores à créer (défaut: ['user', 'content', 'settings'])
   */
  constructor(config = {}) {
    this.prefix = config.prefix || 'flodrama_';
    this.defaultStorage = config.defaultStorage || 'local';
    
    // Configuration IndexedDB
    this.indexedDBConfig = {
      name: config.indexedDB?.name || 'flodrama_db',
      version: config.indexedDB?.version || 1,
      stores: config.indexedDB?.stores || ['user', 'content', 'settings']
    };
    
    // Initialiser IndexedDB
    this._initIndexedDB();
    
    console.log('StorageService initialisé');
  }
  
  /**
   * Initialiser IndexedDB
   * @private
   */
  _initIndexedDB() {
    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB n\'est pas supporté par ce navigateur');
        resolve(null);
        return;
      }
      
      const request = indexedDB.open(this.indexedDBConfig.name, this.indexedDBConfig.version);
      
      request.onerror = (event) => {
        console.error('Erreur lors de l\'ouverture de la base de données IndexedDB:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        console.log('IndexedDB ouvert avec succès');
        resolve(event.target.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Créer les stores si nécessaire
        this.indexedDBConfig.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
            console.log(`Store IndexedDB créé: ${storeName}`);
          }
        });
      };
    });
  }
  
  /**
   * Générer une clé préfixée
   * @param {string} key - Clé originale
   * @returns {string} - Clé préfixée
   * @private
   */
  _prefixKey(key) {
    return `${this.prefix}${key}`;
  }
  
  /**
   * Obtenir le stockage approprié
   * @param {string} type - Type de stockage ('local', 'session')
   * @returns {Storage} - Objet de stockage
   * @private
   */
  _getStorage(type) {
    switch (type) {
      case 'local':
        return localStorage;
      case 'session':
        return sessionStorage;
      default:
        return localStorage;
    }
  }
  
  /**
   * Sauvegarder des données dans le stockage
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker
   * @param {Object} options - Options de stockage
   * @param {string} options.storage - Type de stockage ('local', 'session', 'indexedDB')
   * @param {string} options.store - Nom du store IndexedDB (si applicable)
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async set(key, value, options = {}) {
    const storage = options.storage || this.defaultStorage;
    
    try {
      if (storage === 'indexedDB') {
        const store = options.store || 'content';
        return await this._setInIndexedDB(store, key, value);
      } else {
        const storageObj = this._getStorage(storage);
        const prefixedKey = this._prefixKey(key);
        
        storageObj.setItem(prefixedKey, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données (${key}):`, error);
      return false;
    }
  }
  
  /**
   * Sauvegarder des données dans IndexedDB
   * @param {string} store - Nom du store
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker
   * @returns {Promise<boolean>} - Succès de l'opération
   * @private
   */
  async _setInIndexedDB(store, key, value) {
    const db = await this.dbPromise;
    
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      
      // Préparer l'objet à stocker
      const item = {
        id: key,
        value,
        timestamp: Date.now()
      };
      
      const request = objectStore.put(item);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error(`Erreur lors de la sauvegarde dans IndexedDB (${key}):`, event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Récupérer des données du stockage
   * @param {string} key - Clé de stockage
   * @param {Object} options - Options de récupération
   * @param {string} options.storage - Type de stockage ('local', 'session', 'indexedDB')
   * @param {string} options.store - Nom du store IndexedDB (si applicable)
   * @param {*} options.defaultValue - Valeur par défaut si la clé n'existe pas
   * @returns {Promise<*>} - Valeur récupérée
   */
  async get(key, options = {}) {
    const storage = options.storage || this.defaultStorage;
    const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;
    
    try {
      if (storage === 'indexedDB') {
        const store = options.store || 'content';
        return await this._getFromIndexedDB(store, key, defaultValue);
      } else {
        const storageObj = this._getStorage(storage);
        const prefixedKey = this._prefixKey(key);
        const value = storageObj.getItem(prefixedKey);
        
        return value ? JSON.parse(value) : defaultValue;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des données (${key}):`, error);
      return defaultValue;
    }
  }
  
  /**
   * Récupérer des données depuis IndexedDB
   * @param {string} store - Nom du store
   * @param {string} key - Clé de stockage
   * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas
   * @returns {Promise<*>} - Valeur récupérée
   * @private
   */
  async _getFromIndexedDB(store, key, defaultValue) {
    const db = await this.dbPromise;
    
    if (!db) return defaultValue;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.value : defaultValue);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération depuis IndexedDB (${key}):`, event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Supprimer des données du stockage
   * @param {string} key - Clé de stockage
   * @param {Object} options - Options de suppression
   * @param {string} options.storage - Type de stockage ('local', 'session', 'indexedDB')
   * @param {string} options.store - Nom du store IndexedDB (si applicable)
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async remove(key, options = {}) {
    const storage = options.storage || this.defaultStorage;
    
    try {
      if (storage === 'indexedDB') {
        const store = options.store || 'content';
        return await this._removeFromIndexedDB(store, key);
      } else {
        const storageObj = this._getStorage(storage);
        const prefixedKey = this._prefixKey(key);
        
        storageObj.removeItem(prefixedKey);
        return true;
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression des données (${key}):`, error);
      return false;
    }
  }
  
  /**
   * Supprimer des données depuis IndexedDB
   * @param {string} store - Nom du store
   * @param {string} key - Clé de stockage
   * @returns {Promise<boolean>} - Succès de l'opération
   * @private
   */
  async _removeFromIndexedDB(store, key) {
    const db = await this.dbPromise;
    
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error(`Erreur lors de la suppression depuis IndexedDB (${key}):`, event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Vérifier si une clé existe dans le stockage
   * @param {string} key - Clé de stockage
   * @param {Object} options - Options de vérification
   * @param {string} options.storage - Type de stockage ('local', 'session', 'indexedDB')
   * @param {string} options.store - Nom du store IndexedDB (si applicable)
   * @returns {Promise<boolean>} - Existence de la clé
   */
  async has(key, options = {}) {
    const storage = options.storage || this.defaultStorage;
    
    try {
      if (storage === 'indexedDB') {
        const store = options.store || 'content';
        return await this._hasInIndexedDB(store, key);
      } else {
        const storageObj = this._getStorage(storage);
        const prefixedKey = this._prefixKey(key);
        
        return storageObj.getItem(prefixedKey) !== null;
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification des données (${key}):`, error);
      return false;
    }
  }
  
  /**
   * Vérifier si une clé existe dans IndexedDB
   * @param {string} store - Nom du store
   * @param {string} key - Clé de stockage
   * @returns {Promise<boolean>} - Existence de la clé
   * @private
   */
  async _hasInIndexedDB(store, key) {
    const db = await this.dbPromise;
    
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.count(key);
      
      request.onsuccess = (event) => {
        resolve(event.target.result > 0);
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la vérification dans IndexedDB (${key}):`, event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Effacer tout le stockage
   * @param {Object} options - Options de nettoyage
   * @param {string} options.storage - Type de stockage ('local', 'session', 'indexedDB', 'all')
   * @param {string} options.store - Nom du store IndexedDB (si applicable)
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clear(options = {}) {
    const storage = options.storage || 'all';
    
    try {
      if (storage === 'all' || storage === 'local') {
        this._clearStorage('local');
      }
      
      if (storage === 'all' || storage === 'session') {
        this._clearStorage('session');
      }
      
      if (storage === 'all' || storage === 'indexedDB') {
        const store = options.store;
        await this._clearIndexedDB(store);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error);
      return false;
    }
  }
  
  /**
   * Effacer un type de stockage spécifique
   * @param {string} type - Type de stockage ('local', 'session')
   * @private
   */
  _clearStorage(type) {
    const storageObj = this._getStorage(type);
    const prefix = this.prefix;
    
    // Supprimer uniquement les clés avec notre préfixe
    Object.keys(storageObj).forEach(key => {
      if (key.startsWith(prefix)) {
        storageObj.removeItem(key);
      }
    });
    
    console.log(`Stockage ${type} nettoyé`);
  }
  
  /**
   * Effacer IndexedDB
   * @param {string} store - Nom du store spécifique à effacer (optionnel)
   * @returns {Promise<boolean>} - Succès de l'opération
   * @private
   */
  async _clearIndexedDB(store) {
    const db = await this.dbPromise;
    
    if (!db) return false;
    
    return new Promise((resolve, reject) => {
      if (store) {
        // Effacer un store spécifique
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.clear();
        
        request.onsuccess = () => {
          console.log(`Store IndexedDB nettoyé: ${store}`);
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors du nettoyage du store IndexedDB (${store}):`, event.target.error);
          reject(event.target.error);
        };
      } else {
        // Effacer tous les stores
        const storeNames = Array.from(db.objectStoreNames);
        const transaction = db.transaction(storeNames, 'readwrite');
        
        let completed = 0;
        let hasError = false;
        
        storeNames.forEach(storeName => {
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.clear();
          
          request.onsuccess = () => {
            completed++;
            if (completed === storeNames.length && !hasError) {
              console.log('Tous les stores IndexedDB nettoyés');
              resolve(true);
            }
          };
          
          request.onerror = (event) => {
            hasError = true;
            console.error(`Erreur lors du nettoyage du store IndexedDB (${storeName}):`, event.target.error);
            reject(event.target.error);
          };
        });
      }
    });
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default StorageService;
