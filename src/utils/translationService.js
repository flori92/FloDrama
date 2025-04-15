/**
 * Service de traduction pour FloDrama
 * Utilise LibreTranslate comme API principale avec fallback sur MyMemory
 */

// Configuration des APIs de traduction
const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const FLODRAMA_EMAIL = 'contact@flodrama.com'; // Pour augmenter la limite quotidienne MyMemory

// Cache en mémoire pour les traductions
const translationCache = new Map();
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

/**
 * Traduit un texte dans la langue cible spécifiée
 * @param {string} text - Texte à traduire
 * @param {string} targetLanguage - Code ISO de la langue cible (fr, en, ja, ko, zh, etc.)
 * @param {Object} options - Options supplémentaires
 * @param {string} options.sourceLanguage - Code ISO de la langue source (auto par défaut)
 * @param {boolean} options.useCache - Utiliser le cache (true par défaut)
 * @param {boolean} options.preferLibre - Préférer LibreTranslate à MyMemory (true par défaut)
 * @returns {Promise<Object>} - Résultat de la traduction
 */
export async function getTranslation(text, targetLanguage = 'fr', options = {}) {
  // Valeurs par défaut des options
  const {
    sourceLanguage = 'auto',
    useCache = true,
    preferLibre = true
  } = options;

  // Si le texte est vide, retourner tel quel
  if (!text || text.trim() === '') {
    return {
      original: text,
      translated: text,
      confidence: 1,
      provider: 'none'
    };
  }

  // Normaliser le texte et les langues
  const normalizedText = text.trim();
  const normalizedSource = sourceLanguage.toLowerCase();
  const normalizedTarget = targetLanguage.toLowerCase();

  // Clé de cache unique
  const cacheKey = `${normalizedSource}:${normalizedTarget}:${normalizedText}`;

  // Vérifier le cache si activé
  if (useCache && translationCache.has(cacheKey)) {
    const cachedResult = translationCache.get(cacheKey);
    // Vérifier si le cache n'est pas expiré
    if (cachedResult.timestamp > Date.now() - CACHE_EXPIRY) {
      console.log('[TranslationService] Traduction récupérée depuis le cache');
      return cachedResult.data;
    } else {
      // Supprimer l'entrée expirée
      translationCache.delete(cacheKey);
    }
  }

  // Stratégie de traduction
  let result;
  let error;

  // Essayer avec l'API préférée en premier
  try {
    if (preferLibre) {
      result = await translateWithLibre(normalizedText, normalizedSource, normalizedTarget);
    } else {
      result = await translateWithMyMemory(normalizedText, normalizedSource, normalizedTarget);
    }
  } catch (e) {
    console.warn(`[TranslationService] Erreur avec l'API principale: ${e.message}`);
    error = e;

    // Essayer avec l'API de secours
    try {
      if (preferLibre) {
        result = await translateWithMyMemory(normalizedText, normalizedSource, normalizedTarget);
      } else {
        result = await translateWithLibre(normalizedText, normalizedSource, normalizedTarget);
      }
    } catch (fallbackError) {
      console.error(`[TranslationService] Erreur avec l'API de secours: ${fallbackError.message}`);
      
      // Utiliser une traduction simulée en dernier recours
      result = {
        original: normalizedText,
        translated: `[${normalizedTarget}] ${normalizedText}`,
        confidence: 0.5,
        provider: 'mock'
      };
    }
  }

  // Mettre en cache le résultat si le cache est activé
  if (useCache) {
    translationCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Limiter la taille du cache (max 1000 entrées)
    if (translationCache.size > 1000) {
      // Supprimer l'entrée la plus ancienne
      const oldestKey = [...translationCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      translationCache.delete(oldestKey);
    }
  }

  return result;
}

/**
 * Traduit un texte avec l'API LibreTranslate
 * @private
 */
async function translateWithLibre(text, source, target) {
  // Adapter les codes de langue pour LibreTranslate si nécessaire
  const sourceCode = source === 'auto' ? 'auto' : source;
  
  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: sourceCode,
        target: target,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      original: text,
      translated: data.translatedText,
      confidence: data.confidence || 0.8,
      provider: 'libretranslate'
    };
  } catch (error) {
    console.error(`[TranslationService] Erreur LibreTranslate: ${error.message}`);
    throw error;
  }
}

/**
 * Traduit un texte avec l'API MyMemory
 * @private
 */
async function translateWithMyMemory(text, source, target) {
  try {
    const sourceCode = source === 'auto' ? '' : source;
    const langPair = sourceCode ? `${sourceCode}|${target}` : `|${target}`;
    
    const url = new URL(MYMEMORY_URL);
    url.searchParams.append('q', text);
    url.searchParams.append('langpair', langPair);
    url.searchParams.append('de', FLODRAMA_EMAIL);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(`Erreur MyMemory: ${data.responseStatus} - ${data.responseDetails}`);
    }
    
    return {
      original: text,
      translated: data.responseData.translatedText,
      confidence: data.responseData.match || 0.7,
      provider: 'mymemory'
    };
  } catch (error) {
    console.error(`[TranslationService] Erreur MyMemory: ${error.message}`);
    throw error;
  }
}

/**
 * Traduit un tableau de textes en parallèle
 * @param {string[]} texts - Tableau de textes à traduire
 * @param {string} targetLanguage - Code ISO de la langue cible
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object[]>} - Tableau des résultats de traduction
 */
export async function batchTranslate(texts, targetLanguage = 'fr', options = {}) {
  // Limiter le nombre de requêtes parallèles pour éviter de surcharger les APIs
  const BATCH_SIZE = 5;
  const results = [];
  
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const promises = batch.map(text => getTranslation(text, targetLanguage, options));
    
    // Attendre que toutes les traductions du lot soient terminées
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Pause entre les lots pour éviter le rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Traduit des sous-titres
 * @param {Object[]} subtitles - Tableau d'objets de sous-titres
 * @param {string} targetLanguage - Code ISO de la langue cible
 * @returns {Promise<Object[]>} - Sous-titres traduits
 */
export async function translateSubtitles(subtitles, targetLanguage = 'fr') {
  const texts = subtitles.map(subtitle => subtitle.text);
  const translations = await batchTranslate(texts, targetLanguage);
  
  return subtitles.map((subtitle, index) => ({
    ...subtitle,
    text: translations[index].translated
  }));
}

/**
 * Vérifie l'état du service de traduction
 * @returns {Promise<Object>} - État du service
 */
export async function checkTranslationService() {
  const status = {
    libretranslate: false,
    mymemory: false,
    cacheSize: translationCache.size
  };
  
  try {
    // Vérifier LibreTranslate
    const libreResult = await translateWithLibre('test', 'en', 'fr');
    status.libretranslate = libreResult.translated !== 'test';
  } catch (error) {
    console.warn(`[TranslationService] LibreTranslate non disponible: ${error.message}`);
  }
  
  try {
    // Vérifier MyMemory
    const myMemoryResult = await translateWithMyMemory('test', 'en', 'fr');
    status.mymemory = myMemoryResult.translated !== 'test';
  } catch (error) {
    console.warn(`[TranslationService] MyMemory non disponible: ${error.message}`);
  }
  
  return status;
}

/**
 * Vide le cache de traduction
 */
export function clearTranslationCache() {
  translationCache.clear();
  console.log('[TranslationService] Cache vidé');
}

// Exporter toutes les fonctions
export default {
  getTranslation,
  batchTranslate,
  translateSubtitles,
  checkTranslationService,
  clearTranslationCache
};
