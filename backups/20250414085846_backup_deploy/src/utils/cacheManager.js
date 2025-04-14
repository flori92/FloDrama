/**
 * Gestionnaire de cache local pour FloDrama
 * Permet de stocker et récupérer des données en cache pour améliorer les performances
 */

// Configuration du cache
const CACHE_CONFIG = {
  // Durée de vie du cache en millisecondes
  ttl: {
    metadata: 15 * 60 * 1000, // 15 minutes pour les métadonnées
    images: 24 * 60 * 60 * 1000, // 24 heures pour les images
    user: 7 * 24 * 60 * 60 * 1000 // 7 jours pour les données utilisateur
  },
  // Préfixes pour les clés de cache
  prefix: {
    metadata: 'flodrama_metadata_',
    images: 'flodrama_img_',
    user: 'flodrama_user_'
  },
  // Taille maximale du cache en octets (10 Mo)
  maxSize: 10 * 1024 * 1024
};

/**
 * Vérifie si une entrée de cache est valide
 * @param {Object} cacheEntry - Entrée de cache à vérifier
 * @param {number} ttl - Durée de vie en millisecondes
 * @returns {boolean} - true si l'entrée est valide, false sinon
 */
const isValidCacheEntry = (cacheEntry, ttl) => {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  
  const now = Date.now();
  const expirationTime = cacheEntry.timestamp + ttl;
  
  return now < expirationTime;
};

/**
 * Calcule la taille approximative d'un objet en mémoire
 * @param {Object} object - Objet à mesurer
 * @returns {number} - Taille approximative en octets
 */
const getObjectSize = (object) => {
  const jsonString = JSON.stringify(object);
  return new Blob([jsonString]).size;
};

/**
 * Nettoie le cache en supprimant les entrées les plus anciennes si nécessaire
 */
const cleanupCache = () => {
  try {
    // Récupérer toutes les clés du localStorage qui commencent par les préfixes de FloDrama
    const allKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(CACHE_CONFIG.prefix.metadata) || 
      key.startsWith(CACHE_CONFIG.prefix.images) || 
      key.startsWith(CACHE_CONFIG.prefix.user)
    );
    
    // Si le nombre de clés est faible, pas besoin de nettoyer
    if (allKeys.length < 10) return;
    
    // Calculer la taille totale du cache
    let totalSize = 0;
    const cacheEntries = [];
    
    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        totalSize += size;
        
        // Récupérer le timestamp pour trier par ancienneté
        let timestamp = Date.now();
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.timestamp) {
            timestamp = parsed.timestamp;
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
        
        cacheEntries.push({ key, size, timestamp });
      } catch (e) {
        console.warn('Erreur lors du calcul de la taille du cache:', e);
      }
    });
    
    // Si la taille totale dépasse la limite, supprimer les entrées les plus anciennes
    if (totalSize > CACHE_CONFIG.maxSize) {
      console.log(`Nettoyage du cache: ${totalSize} octets utilisés, limite: ${CACHE_CONFIG.maxSize} octets`);
      
      // Trier par timestamp (du plus ancien au plus récent)
      cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Supprimer les entrées les plus anciennes jusqu'à ce que la taille soit acceptable
      let currentSize = totalSize;
      for (const entry of cacheEntries) {
        if (currentSize <= CACHE_CONFIG.maxSize * 0.8) break; // Garder une marge de 20%
        
        try {
          localStorage.removeItem(entry.key);
          currentSize -= entry.size;
          console.log(`Cache: suppression de ${entry.key}, ${entry.size} octets libérés`);
        } catch (e) {
          console.warn('Erreur lors de la suppression du cache:', e);
        }
      }
    }
  } catch (e) {
    console.error('Erreur lors du nettoyage du cache:', e);
  }
};

/**
 * Met en cache des données
 * @param {string} key - Clé pour identifier les données
 * @param {Object} data - Données à mettre en cache
 * @param {string} type - Type de données ('metadata', 'images', 'user')
 * @returns {boolean} - true si la mise en cache a réussi, false sinon
 */
export const setCache = (key, data, type = 'metadata') => {
  try {
    // Nettoyer le cache si nécessaire
    cleanupCache();
    
    // Préfixer la clé selon le type
    const prefix = CACHE_CONFIG.prefix[type] || CACHE_CONFIG.prefix.metadata;
    const prefixedKey = `${prefix}${key}`;
    
    // Créer l'entrée de cache avec un timestamp
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    // Vérifier la taille de l'entrée
    const size = getObjectSize(cacheEntry);
    if (size > CACHE_CONFIG.maxSize * 0.1) {
      console.warn(`Entrée de cache trop volumineuse: ${size} octets, ignorée`);
      return false;
    }
    
    // Stocker dans le localStorage
    localStorage.setItem(prefixedKey, JSON.stringify(cacheEntry));
    return true;
  } catch (e) {
    console.error('Erreur lors de la mise en cache:', e);
    return false;
  }
};

/**
 * Récupère des données du cache
 * @param {string} key - Clé pour identifier les données
 * @param {string} type - Type de données ('metadata', 'images', 'user')
 * @returns {Object|null} - Données en cache ou null si non trouvées ou expirées
 */
export const getCache = (key, type = 'metadata') => {
  try {
    // Préfixer la clé selon le type
    const prefix = CACHE_CONFIG.prefix[type] || CACHE_CONFIG.prefix.metadata;
    const prefixedKey = `${prefix}${key}`;
    
    // Récupérer l'entrée du cache
    const cachedData = localStorage.getItem(prefixedKey);
    if (!cachedData) return null;
    
    // Parser l'entrée
    const cacheEntry = JSON.parse(cachedData);
    
    // Vérifier si l'entrée est valide
    const ttl = CACHE_CONFIG.ttl[type] || CACHE_CONFIG.ttl.metadata;
    if (!isValidCacheEntry(cacheEntry, ttl)) {
      // Supprimer l'entrée expirée
      localStorage.removeItem(prefixedKey);
      return null;
    }
    
    return cacheEntry.data;
  } catch (e) {
    console.error('Erreur lors de la récupération du cache:', e);
    return null;
  }
};

/**
 * Supprime une entrée du cache
 * @param {string} key - Clé de l'entrée à supprimer
 * @param {string} type - Type de données ('metadata', 'images', 'user')
 */
export const removeCache = (key, type = 'metadata') => {
  try {
    const prefix = CACHE_CONFIG.prefix[type] || CACHE_CONFIG.prefix.metadata;
    const prefixedKey = `${prefix}${key}`;
    localStorage.removeItem(prefixedKey);
  } catch (e) {
    console.error('Erreur lors de la suppression du cache:', e);
  }
};

/**
 * Vide tout le cache de l'application
 */
export const clearCache = () => {
  try {
    Object.values(CACHE_CONFIG.prefix).forEach(prefix => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
    });
    console.log('Cache vidé avec succès');
  } catch (e) {
    console.error('Erreur lors du vidage du cache:', e);
  }
};

export default {
  setCache,
  getCache,
  removeCache,
  clearCache
};
