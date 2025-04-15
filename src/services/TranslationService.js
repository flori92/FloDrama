/**
 * Service de traduction pour FloDrama
 * Gère les traductions de texte avec mise en cache
 */

import axios from 'axios';

// Variables pour le cache et Redis
let redis = null;
let memoryCache = new Map();

// Initialisation du service Redis
const initializeRedis = async () => {
  try {
    // Import dynamique dans une fonction async (pas de top-level await)
    const ioredis = await import('ioredis');
    const Redis = ioredis.default || ioredis;
    
    // Configuration Redis avec gestion des erreurs
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Désactive les tentatives de reconnexion automatiques
    });
    
    // Gestion des erreurs de connexion Redis
    redis.on('error', (err) => {
      console.error(`[TranslationService] Erreur Redis: ${err.message}`);
      // Utiliser un objet vide comme fallback si Redis n'est pas disponible
      if (err.code === 'ECONNREFUSED') {
        console.warn('[TranslationService] Redis non disponible, utilisation du mode sans cache');
        redis = null;
      }
    });
    
    return true;
  } catch (error) {
    console.error(`[TranslationService] Erreur d'initialisation Redis: ${error.message}`);
    redis = null;
    return false;
  }
};

// Initialisation non-bloquante
initializeRedis().then(success => {
  console.log(`[TranslationService] Initialisation Redis: ${success ? 'Réussie' : 'Échec'}`);
});

// Configuration de l'API de traduction gratuite
const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';

class TranslationService {
  /**
   * Traduit un texte en utilisant le cache et les services de traduction en cascade
   * @param {string} text - Texte à traduire
   * @param {string} targetLang - Langue cible (code ISO)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat de la traduction
   */
  static async translate(text, targetLang, options = {}) {
    if (!text || !targetLang) {
      throw new Error('Le texte et la langue cible sont requis');
    }
    
    // Normalisation des paramètres
    const normalizedText = text.trim();
    const normalizedLang = targetLang.toLowerCase();
    
    // Clé de cache
    const cacheKey = `translation:${normalizedLang}:${normalizedText}`;
    
    // Vérifier le cache Redis
    if (redis) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      } catch (redisError) {
        console.error(`[TranslationService] Erreur Redis lors de la récupération: ${redisError.message}`);
      }
    }
    
    // Vérifier le cache mémoire
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }
    
    // Appel au service de traduction
    let translationResult;
    
    try {
      // Essayer d'abord avec MyMemory (gratuit)
      translationResult = await this._translateWithMyMemory(normalizedText, normalizedLang);
    } catch (error) {
      console.warn(`[TranslationService] Erreur MyMemory: ${error.message}, fallback sur mock`);
      
      // Fallback sur une traduction simulée
      translationResult = {
        original: normalizedText,
        translated: `[${normalizedLang}] ${normalizedText}`, // Simulation
        targetLang: normalizedLang,
        success: true,
        provider: 'mock',
        confidence: 0.5
      };
    }
    
    // Mettre en cache le résultat
    this._saveToCache(cacheKey, translationResult);
    
    return translationResult;
  }
  
  /**
   * Traduit avec le service MyMemory
   * @private
   */
  static async _translateWithMyMemory(text, targetLang) {
    try {
      const sourceLang = 'auto';
      const response = await axios.get(TRANSLATION_API_URL, {
        params: {
          q: text,
          langpair: `${sourceLang}|${targetLang}`,
          de: 'flodrama@example.com' // Email pour quota plus élevé
        },
        timeout: 5000 // Timeout de 5 secondes
      });
      
      if (response.data && response.data.responseStatus === 200) {
        return {
          original: text,
          translated: response.data.responseData.translatedText,
          targetLang,
          success: true,
          provider: 'mymemory',
          confidence: response.data.responseData.match
        };
      } else {
        throw new Error(`Erreur API: ${response.data.responseStatus}`);
      }
    } catch (error) {
      throw new Error(`Erreur de traduction MyMemory: ${error.message}`);
    }
  }
  
  /**
   * Sauvegarde une traduction dans le cache
   * @private
   */
  static _saveToCache(key, value) {
    // Sauvegarder dans Redis si disponible
    if (redis) {
      try {
        // Expiration après 24h
        redis.set(key, JSON.stringify(value), 'EX', 24 * 60 * 60);
      } catch (redisError) {
        console.error(`[TranslationService] Erreur Redis lors de la sauvegarde: ${redisError.message}`);
      }
    }
    
    // Toujours sauvegarder dans le cache mémoire comme fallback
    memoryCache.set(key, value);
    
    // Limiter la taille du cache mémoire (max 1000 entrées)
    if (memoryCache.size > 1000) {
      // Supprimer la plus ancienne entrée (première insérée)
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
  }
  
  /**
   * Vérifier l'état du service
   * @returns {Promise<Object>} - État du service
   */
  static async checkStatus() {
    const status = {
      available: true,
      redis: false,
      memoryCache: {
        size: memoryCache.size
      }
    };
    
    // Vérifier Redis
    if (redis) {
      try {
        await redis.ping();
        status.redis = true;
      } catch (error) {
        console.error(`[TranslationService] Erreur Redis: ${error.message}`);
        status.redis = false;
      }
    }
    
    return status;
  }
}

export default TranslationService;
