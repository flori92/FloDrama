/**
 * Utilitaires pour la gestion des contenus
 * 
 * Fonctions utilitaires pour la normalisation, la génération d'identifiants
 * et la détection de métadonnées pour les contenus scrapés.
 */

/**
 * Génère un identifiant unique à partir d'un titre
 * @param {String} title - Titre du contenu
 * @returns {String} Identifiant unique
 */
export const generateId = (title) => {
  if (!title) return `unknown-${Date.now()}`;
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-')     // Remplacer les espaces par des tirets
    .replace(/-+/g, '-')      // Éviter les tirets multiples
    .trim();
};

/**
 * Génère une URL de miniature à partir d'une URL d'image
 * @param {String} imageUrl - URL de l'image originale
 * @returns {String} URL de la miniature
 */
export const generateThumbnailUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // Si l'URL contient déjà "thumbnail", la retourner telle quelle
  if (imageUrl.includes('thumbnail')) {
    return imageUrl;
  }
  
  // Si c'est une URL Cloudinary, ajouter des paramètres de transformation
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl.replace('/upload/', '/upload/c_thumb,w_200,g_face/');
  }
  
  // Si c'est une URL d'image standard, la retourner telle quelle
  return imageUrl;
};

/**
 * Détecte le pays d'origine en fonction des métadonnées disponibles
 * @param {Object} item - Élément de contenu
 * @returns {String} Pays d'origine
 */
export const detectCountry = (item) => {
  // Si le pays est déjà spécifié, le retourner
  if (item.country) return item.country;
  
  // Détecter à partir du type
  if (item.type === 'kshow') return 'Corée du Sud';
  
  // Détecter à partir du titre
  const title = item.title.toLowerCase();
  
  if (title.includes('korean') || 
      title.includes('korea') || 
      title.includes('k-drama')) {
    return 'Corée du Sud';
  }
  
  if (title.includes('japanese') || 
      title.includes('japan') || 
      title.includes('j-drama')) {
    return 'Japon';
  }
  
  if (title.includes('chinese') || 
      title.includes('china') || 
      title.includes('c-drama')) {
    return 'Chine';
  }
  
  if (title.includes('thai') || 
      title.includes('thailand') || 
      title.includes('t-drama')) {
    return 'Thaïlande';
  }
  
  if (title.includes('taiwanese') || 
      title.includes('taiwan')) {
    return 'Taïwan';
  }
  
  // Détecter à partir des genres
  if (item.genres) {
    if (item.genres.includes('Korean Drama')) return 'Corée du Sud';
    if (item.genres.includes('Japanese Drama')) return 'Japon';
    if (item.genres.includes('Chinese Drama')) return 'Chine';
    if (item.genres.includes('Thai Drama')) return 'Thaïlande';
    if (item.genres.includes('Taiwanese Drama')) return 'Taïwan';
  }
  
  // Par défaut
  return 'Inconnu';
};

/**
 * Obtient la priorité d'une source
 * @param {String} source - Nom de la source
 * @returns {Number} Priorité (plus le nombre est bas, plus la priorité est élevée)
 */
export const getSourcePriority = (source) => {
  if (!source) return 999;
  
  const sourceLower = source.toLowerCase();
  
  // Priorités des sources (basées sur la fiabilité et la qualité)
  const priorities = {
    'dramacool': 1,
    'voirdrama': 2,
    'dramafast': 3,
    'myasiantv': 4,
    'newasiantv': 5,
    'kissasian': 6,
    'dramago': 7,
    'asianload': 8,
    'viewasian': 9,
    'dramanice': 10
  };
  
  // Rechercher une correspondance partielle
  for (const [key, value] of Object.entries(priorities)) {
    if (sourceLower.includes(key)) {
      return value;
    }
  }
  
  // Priorité par défaut
  return 100;
};

/**
 * Extrait les métadonnées d'un élément scrapé
 * @param {Object} item - Élément scrapé
 * @returns {Object} Métadonnées extraites
 */
export const extractMetadata = (item) => {
  const metadata = {
    episodes: 0,
    year: null,
    status: 'unknown',
    genres: [],
    country: null,
    duration: null,
    rating: null
  };
  
  // Si l'élément n'a pas de métadonnées, retourner les valeurs par défaut
  if (!item || !item.meta) {
    return metadata;
  }
  
  // Traiter les métadonnées sous forme de texte
  if (typeof item.meta === 'string') {
    const metaText = item.meta.toLowerCase();
    
    // Extraire le nombre d'épisodes
    const episodesMatch = metaText.match(/(\d+)\s*ep/i);
    if (episodesMatch) {
      metadata.episodes = parseInt(episodesMatch[1], 10);
    }
    
    // Extraire l'année
    const yearMatch = metaText.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) {
      metadata.year = parseInt(yearMatch[1], 10);
    }
    
    // Extraire le statut
    if (metaText.includes('ongoing') || metaText.includes('en cours')) {
      metadata.status = 'ongoing';
    } else if (metaText.includes('completed') || metaText.includes('terminé')) {
      metadata.status = 'completed';
    }
    
    // Extraire les genres
    const commonGenres = ['action', 'comedy', 'drama', 'romance', 'thriller', 'horror', 
                          'fantasy', 'sci-fi', 'mystery', 'adventure', 'historical'];
    
    for (const genre of commonGenres) {
      if (metaText.includes(genre)) {
        metadata.genres.push(genre.charAt(0).toUpperCase() + genre.slice(1));
      }
    }
    
    // Extraire le pays
    if (metaText.includes('korean') || metaText.includes('korea')) {
      metadata.country = 'Corée du Sud';
    } else if (metaText.includes('japanese') || metaText.includes('japan')) {
      metadata.country = 'Japon';
    } else if (metaText.includes('chinese') || metaText.includes('china')) {
      metadata.country = 'Chine';
    } else if (metaText.includes('thai') || metaText.includes('thailand')) {
      metadata.country = 'Thaïlande';
    }
  } 
  // Traiter les métadonnées sous forme d'objet
  else if (typeof item.meta === 'object') {
    if (item.meta.episodes) {
      metadata.episodes = parseInt(item.meta.episodes, 10) || 0;
    }
    
    if (item.meta.year) {
      metadata.year = parseInt(item.meta.year, 10) || null;
    }
    
    if (item.meta.status) {
      metadata.status = item.meta.status;
    }
    
    if (Array.isArray(item.meta.genres)) {
      metadata.genres = item.meta.genres;
    }
    
    if (item.meta.country) {
      metadata.country = item.meta.country;
    }
    
    if (item.meta.duration) {
      metadata.duration = item.meta.duration;
    }
    
    if (item.meta.rating) {
      metadata.rating = parseFloat(item.meta.rating) || null;
    }
  }
  
  return metadata;
};

/**
 * Normalise un titre pour la recherche
 * @param {String} title - Titre à normaliser
 * @returns {String} Titre normalisé
 */
export const normalizeTitle = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, ' ')    // Normaliser les espaces
    .trim();
};

/**
 * Calcule la similarité entre deux chaînes (distance de Levenshtein simplifiée)
 * @param {String} str1 - Première chaîne
 * @param {String} str2 - Deuxième chaîne
 * @returns {Number} Score de similarité (0-1)
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  // Si l'une des chaînes est vide, retourner 0
  if (!s1 || !s2) return 0;
  
  // Si les chaînes sont identiques, retourner 1
  if (s1 === s2) return 1;
  
  // Si l'une des chaînes contient l'autre, retourner un score élevé
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Calculer la distance de Levenshtein simplifiée
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  
  let matches = 0;
  const minLen = Math.min(len1, len2);
  
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) {
      matches++;
    }
  }
  
  return matches / maxLen;
};

/**
 * Trouve la meilleure correspondance pour un titre dans une liste d'éléments
 * @param {String} title - Titre à rechercher
 * @param {Array} items - Liste d'éléments
 * @param {Number} threshold - Seuil de similarité (0-1)
 * @returns {Object|null} Meilleure correspondance ou null
 */
export const findBestMatch = (title, items, threshold = 0.7) => {
  if (!title || !items || !items.length) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const item of items) {
    const score = calculateSimilarity(title, item.title);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = item;
    }
  }
  
  return bestMatch;
};
