/**
 * Service de traduction hybride pour FloDrama
 * Utilise Google Translate comme solution principale et MyMemory Translation API comme solution de secours
 */

// Importation conditionnelle pour éviter les problèmes de build
let googleTranslate;
try {
  // Essayer d'importer google-translate-api de manière dynamique
  if (typeof window !== 'undefined') {
    const module = require('@vitalets/google-translate-api');
    googleTranslate = module.translate;
  }
} catch (error) {
  console.warn('Module de traduction Google non disponible, fonctionnalités de traduction limitées');
  // Créer un mock pour éviter les erreurs
  googleTranslate = async (text) => ({ text });
}

import axios from 'axios';
let redis;

try {
  const Redis = await import('ioredis').then(module => module.default);
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
} catch (error) {
  console.error(`[TranslationService] Erreur d'initialisation Redis: ${error.message}`);
  redis = null;
}

// Configuration de l'API de traduction gratuite
const MYMEMORY_API_ENDPOINT = 'https://api.mymemory.translated.net/';

// Cache en mémoire comme fallback si Redis n'est pas disponible
const memoryCache = new Map();

class TranslationService {
  /**
   * Traduit un texte en utilisant le cache et les services de traduction en cascade
   * @param {string} text - Le texte à traduire
   * @param {string} targetLang - La langue cible (code ISO 639-1)
   * @param {string} sourceLang - La langue source (code ISO 639-1, 'auto' par défaut)
   * @returns {Promise<string>} - Le texte traduit
   */
  static async translate(text, targetLang = 'fr', sourceLang = 'auto') {
    // Si le texte est vide, retourner tel quel
    if (!text || text.trim() === '') {
      return text;
    }
    
    // Création d'une clé de cache unique
    const cacheKey = `translation:${targetLang}:${Buffer.from(text).toString('base64')}`;
    
    try {
      // Vérification du cache (Redis ou mémoire)
      let cachedTranslation = null;
      
      if (redis) {
        try {
          cachedTranslation = await redis.get(cacheKey);
        } catch (redisError) {
          console.error(`[TranslationService] Erreur Redis lors de la récupération: ${redisError.message}`);
        }
      } else if (memoryCache.has(cacheKey)) {
        cachedTranslation = memoryCache.get(cacheKey);
      }
      
      if (cachedTranslation) {
        console.log('[TranslationService] Traduction récupérée depuis le cache');
        return cachedTranslation;
      }
      
      // Tentative avec Google Translate
      try {
        console.log('[TranslationService] Tentative avec Google Translate');
        const { text: translatedText } = await googleTranslate(text, { 
          from: sourceLang, 
          to: targetLang 
        });
        
        // Mise en cache pour les futures requêtes (expiration après 7 jours)
        this._saveToCache(cacheKey, translatedText);
        
        return translatedText;
      } catch (googleError) {
        console.error(`[TranslationService] Erreur Google Translate: ${googleError.message}`);
        
        // Fallback sur MyMemory API
        console.log('[TranslationService] Utilisation de MyMemory API');
        const response = await axios.get(`${MYMEMORY_API_ENDPOINT}get`, {
          params: {
            q: text,
            langpair: `${sourceLang}|${targetLang}`,
            de: 'flodrama@example.com'
          }
        });
        
        if (response.data && response.data.responseData) {
          // Mise en cache pour les futures requêtes
          this._saveToCache(cacheKey, response.data.responseData.translatedText);
          return response.data.responseData.translatedText;
        } else {
          throw new Error('Réponse MyMemory API invalide');
        }
      }
    } catch (error) {
      console.error(`[TranslationService] Erreur de traduction: ${error.message}`);
      // En cas d'échec complet, retourner le texte original
      return text;
    }
  }
  
  /**
   * Sauvegarde une traduction dans le cache (Redis ou mémoire)
   * @param {string} key - Clé de cache
   * @param {string} value - Valeur à mettre en cache
   * @private
   */
  static _saveToCache(key, value) {
    if (redis) {
      try {
        // Expiration après 7 jours
        redis.set(key, value, 'EX', 60 * 60 * 24 * 7);
      } catch (redisError) {
        console.error(`[TranslationService] Erreur Redis lors de la sauvegarde: ${redisError.message}`);
        // Fallback sur le cache mémoire
        memoryCache.set(key, value);
      }
    } else {
      // Utiliser le cache mémoire si Redis n'est pas disponible
      memoryCache.set(key, value);
    }
  }
  
  /**
   * Vérifie si les services de traduction sont disponibles
   * @returns {Promise<Object>} - Statut des services de traduction
   */
  static async checkStatus() {
    const status = {
      google: false,
      mymemory: false,
      redis: false,
      memoryCache: true // Le cache mémoire est toujours disponible
    };
    
    // Vérification de Redis
    if (redis) {
      try {
        await redis.ping();
        status.redis = true;
      } catch (error) {
        console.error(`[TranslationService] Erreur Redis: ${error.message}`);
      }
    }
    
    // Vérification de Google Translate
    try {
      await googleTranslate('test', { to: 'fr' });
      status.google = true;
    } catch (error) {
      console.error(`[TranslationService] Erreur Google Translate: ${error.message}`);
    }
    
    // Vérification de MyMemory API
    try {
      const response = await axios.get(`${MYMEMORY_API_ENDPOINT}get`, {
        params: {
          q: 'test',
          langpair: 'en|fr',
          de: 'flodrama@example.com'
        }
      });
      
      status.mymemory = response.data && response.data.responseData;
    } catch (error) {
      console.error(`[TranslationService] Erreur MyMemory API: ${error.message}`);
    }
    
    return status;
  }
  
  /**
   * Traduit un fichier de sous-titres complet
   * @param {Array} subtitleCues - Les segments de sous-titres à traduire
   * @param {string} targetLang - La langue cible
   * @returns {Promise<Array>} - Les segments traduits
   */
  static async translateSubtitles(subtitleCues, targetLang = 'fr') {
    console.log(`[TranslationService] Traduction de ${subtitleCues.length} segments de sous-titres`);
    
    // Traitement par lots pour éviter les limitations d'API
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < subtitleCues.length; i += batchSize) {
      const batch = subtitleCues.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (cue) => {
        try {
          const translatedText = await this.translate(cue.text, targetLang);
          return {
            ...cue,
            text: translatedText
          };
        } catch (error) {
          console.error(`[TranslationService] Erreur de traduction du segment: ${error.message}`);
          return cue; // En cas d'erreur, conserver le texte original
        }
      });
      
      const translatedBatch = await Promise.all(batchPromises);
      results.push(...translatedBatch);
      
      // Pause entre les lots pour éviter le rate limiting
      if (i + batchSize < subtitleCues.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export default TranslationService;
