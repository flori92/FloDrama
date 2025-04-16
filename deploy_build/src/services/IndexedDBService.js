/**
 * IndexedDBService
 * 
 * Service de gestion de la base de données IndexedDB pour le stockage local des métadonnées.
 * Fournit une interface simple pour les opérations CRUD sur la base de données.
 */

class IndexedDBService {
  /**
   * Constructeur
   * @param {String} dbName - Nom de la base de données
   * @param {Number} version - Version de la base de données
   */
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.isOpening = false;
    this.openPromise = null;
  }

  /**
   * Ouvre la connexion à la base de données
   * @param {Array} stores - Configuration des magasins d'objets
   * @returns {Promise<IDBDatabase>} Instance de la base de données
   */
  open(stores = []) {
    // Si la base de données est déjà ouverte, retourner la promesse existante
    if (this.db) {
      return Promise.resolve(this.db);
    }

    // Si une ouverture est déjà en cours, retourner la promesse existante
    if (this.isOpening) {
      return this.openPromise;
    }

    this.isOpening = true;
    this.openPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        this.isOpening = false;
        return reject(new Error('IndexedDB n\'est pas supporté par ce navigateur.'));
      }

      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error(`[IndexedDBService] Erreur lors de l'ouverture de la base de données:`, event.target.error);
        this.isOpening = false;
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isOpening = false;
        console.log(`[IndexedDBService] Base de données ${this.dbName} ouverte avec succès.`);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log(`[IndexedDBService] Mise à niveau de la base de données ${this.dbName} vers la version ${this.version}.`);

        // Créer ou mettre à jour les magasins d'objets
        for (const store of stores) {
          let objectStore;

          // Vérifier si le magasin existe déjà
          if (!db.objectStoreNames.contains(store.name)) {
            // Créer un nouveau magasin
            objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            console.log(`[IndexedDBService] Magasin d'objets ${store.name} créé.`);
          } else {
            // Utiliser un magasin existant
            objectStore = event.target.transaction.objectStore(store.name);
            console.log(`[IndexedDBService] Magasin d'objets ${store.name} existant.`);
          }

          // Créer les indices si spécifiés
          if (store.indices) {
            for (const index of store.indices) {
              // Vérifier si l'indice existe déjà
              if (!objectStore.indexNames.contains(index.name)) {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: !!index.unique,
                  multiEntry: !!index.multiEntry
                });
                console.log(`[IndexedDBService] Indice ${index.name} créé pour ${store.name}.`);
              }
            }
          }
        }
      };
    });

    return this.openPromise;
  }

  /**
   * Ferme la connexion à la base de données
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log(`[IndexedDBService] Connexion à la base de données ${this.dbName} fermée.`);
    }
  }

  /**
   * Effectue une transaction sur un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {String} mode - Mode de transaction ('readonly' ou 'readwrite')
   * @param {Function} callback - Fonction de rappel avec l'objet de transaction
   * @returns {Promise<any>} Résultat de la transaction
   */
  async transaction(storeName, mode, callback) {
    await this.open();

    return new Promise((resolve, reject) => {
      if (!this.db.objectStoreNames.contains(storeName)) {
        return reject(new Error(`Le magasin d'objets ${storeName} n'existe pas.`));
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      let result;
      try {
        result = callback(store, transaction);
      } catch (error) {
        reject(error);
      }

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onerror = (event) => {
        console.error(`[IndexedDBService] Erreur de transaction:`, event.target.error);
        reject(event.target.error);
      };

      transaction.onabort = (event) => {
        console.warn(`[IndexedDBService] Transaction annulée:`, event.target.error);
        reject(event.target.error || new Error('Transaction annulée'));
      };
    });
  }

  /**
   * Ajoute un élément à un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {Object} item - Élément à ajouter
   * @returns {Promise<any>} Clé de l'élément ajouté
   */
  async add(storeName, item) {
    return this.transaction(storeName, 'readwrite', (store) => {
      const request = store.add(item);
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Met à jour un élément dans un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {Object} item - Élément à mettre à jour
   * @returns {Promise<any>} Clé de l'élément mis à jour
   */
  async put(storeName, item) {
    return this.transaction(storeName, 'readwrite', (store) => {
      const request = store.put(item);
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Ajoute ou met à jour plusieurs éléments dans un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {Array} items - Éléments à ajouter ou mettre à jour
   * @returns {Promise<Array>} Clés des éléments ajoutés ou mis à jour
   */
  async bulkPut(storeName, items) {
    if (!items || !items.length) {
      return [];
    }

    return this.transaction(storeName, 'readwrite', (store) => {
      const promises = items.map((item) => {
        return new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = (event) => reject(event.target.error);
        });
      });

      return Promise.all(promises);
    });
  }

  /**
   * Récupère un élément par sa clé
   * @param {String} storeName - Nom du magasin d'objets
   * @param {any} key - Clé de l'élément
   * @returns {Promise<any>} Élément trouvé ou undefined
   */
  async get(storeName, key) {
    return this.transaction(storeName, 'readonly', (store) => {
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Récupère tous les éléments d'un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {IDBKeyRange} query - Requête de plage de clés (optionnel)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>} Tous les éléments
   */
  async getAll(storeName, query = null, options = {}) {
    const { limit, direction = 'next' } = options;

    return this.transaction(storeName, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const items = [];
        let cursorRequest;

        if (options.index) {
          const index = store.index(options.index);
          cursorRequest = index.openCursor(query, direction);
        } else {
          cursorRequest = store.openCursor(query, direction);
        }

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            items.push(cursor.value);
            if (limit && items.length >= limit) {
              resolve(items);
            } else {
              cursor.continue();
            }
          } else {
            resolve(items);
          }
        };

        cursorRequest.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Récupère tous les éléments correspondant à un indice
   * @param {String} storeName - Nom du magasin d'objets
   * @param {String} indexName - Nom de l'indice
   * @param {any} indexValue - Valeur de l'indice
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>} Éléments correspondants
   */
  async getAllFromIndex(storeName, indexName, indexValue, options = {}) {
    const { limit, direction = 'next' } = options;

    return this.transaction(storeName, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        if (!store.indexNames.contains(indexName)) {
          return reject(new Error(`L'indice ${indexName} n'existe pas dans ${storeName}.`));
        }

        const index = store.index(indexName);
        const items = [];
        let cursorRequest;

        if (indexValue !== undefined) {
          const keyRange = IDBKeyRange.only(indexValue);
          cursorRequest = index.openCursor(keyRange, direction);
        } else {
          cursorRequest = index.openCursor(null, direction);
        }

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            items.push(cursor.value);
            if (limit && items.length >= limit) {
              resolve(items);
            } else {
              cursor.continue();
            }
          } else {
            resolve(items);
          }
        };

        cursorRequest.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Supprime un élément par sa clé
   * @param {String} storeName - Nom du magasin d'objets
   * @param {any} key - Clé de l'élément
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    return this.transaction(storeName, 'readwrite', (store) => {
      const request = store.delete(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Supprime tous les éléments d'un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    return this.transaction(storeName, 'readwrite', (store) => {
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Compte le nombre d'éléments dans un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @returns {Promise<Number>} Nombre d'éléments
   */
  async count(storeName) {
    return this.transaction(storeName, 'readonly', (store) => {
      const request = store.count();
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      });
    });
  }

  /**
   * Vérifie si un élément existe
   * @param {String} storeName - Nom du magasin d'objets
   * @param {any} key - Clé de l'élément
   * @returns {Promise<Boolean>} True si l'élément existe
   */
  async exists(storeName, key) {
    const item = await this.get(storeName, key);
    return !!item;
  }

  /**
   * Effectue une recherche dans un magasin d'objets
   * @param {String} storeName - Nom du magasin d'objets
   * @param {Function} predicate - Fonction de prédicat pour filtrer les éléments
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>} Éléments correspondants
   */
  async search(storeName, predicate, options = {}) {
    const { limit } = options;
    const allItems = await this.getAll(storeName);
    const filteredItems = allItems.filter(predicate);
    
    if (limit) {
      return filteredItems.slice(0, limit);
    }
    
    return filteredItems;
  }
}

export { IndexedDBService };
export default IndexedDBService;
