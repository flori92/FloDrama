/**
 * Fonctions d'analyse du style visuel pour FloDrama
 * Utilisées par le service d'analyse du style visuel
 */

import {
  COLOR_PALETTES,
  VISUAL_STYLES,
  LIGHTING_TYPES,
  COMPOSITION_TYPES,
  VISUAL_MOODS,
  GENRE_VISUAL_MODELS,
  VISUAL_TERMS_TRANSLATIONS
} from '../data/visualStyleData';

/**
 * Détermine le style visuel en fonction des genres et de l'origine
 * @param {Array} genres - Liste des genres du contenu
 * @param {string} origin - Origine du contenu (pays)
 * @param {Array} visualTags - Tags visuels associés au contenu
 * @returns {string} - Style visuel dominant
 */
export function determineVisualStyle(genres = [], origin = '', visualTags = []) {
  // Convertir en minuscules pour faciliter la comparaison
  const genresLower = genres.map(g => g.toLowerCase());
  const tagsLower = visualTags.map(t => t.toLowerCase());
  
  // Mots-clés associés à chaque style
  const styleKeywords = {
    'minimaliste': ['minimaliste', 'épuré', 'simple', 'moderne', 'slice of life'],
    'opulent': ['historique', 'fantasy', 'période', 'luxueux', 'royal', 'dynasty'],
    'naturaliste': ['réaliste', 'documentaire', 'naturel', 'social', 'quotidien'],
    'stylisé': ['thriller', 'noir', 'action', 'science-fiction', 'fantastique'],
    'nostalgique': ['rétro', 'nostalgie', 'souvenirs', 'vintage', 'années']
  };
  
  // Compter les correspondances pour chaque style
  const styleCounts = {};
  
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    styleCounts[style] = 0;
    
    // Vérifier les genres
    for (const genre of genresLower) {
      if (keywords.some(keyword => genre.includes(keyword))) {
        styleCounts[style] += 1;
      }
    }
    
    // Vérifier les tags visuels
    for (const tag of tagsLower) {
      if (keywords.some(keyword => tag.includes(keyword))) {
        styleCounts[style] += 2; // Les tags visuels ont plus de poids
      }
    }
    
    // Ajustements en fonction de l'origine
    if (origin) {
      const originLower = origin.toLowerCase();
      
      if (originLower.includes('korea') || originLower.includes('corée')) {
        if (style === 'minimaliste' || style === 'stylisé') {
          styleCounts[style] += 1;
        }
      } else if (originLower.includes('japan') || originLower.includes('japon')) {
        if (style === 'stylisé' || style === 'naturaliste') {
          styleCounts[style] += 1;
        }
      }
    }
  }
  
  // Déterminer le style avec le plus de correspondances
  let maxCount = 0;
  let dominantStyle = 'minimaliste'; // Style par défaut
  
  for (const [style, count] of Object.entries(styleCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantStyle = style;
    }
  }
  
  return dominantStyle;
}

/**
 * Détermine la palette de couleurs en fonction de l'origine, du type et de l'année
 * @param {string} origin - Origine du contenu (pays)
 * @param {string} type - Type de contenu (film, série, anime)
 * @param {number} year - Année de sortie
 * @param {string} visualStyle - Style visuel dominant
 * @returns {Object} - Palette de couleurs
 */
export function determineColorPalette(origin = '', type = '', year = null, visualStyle = '') {
  // Palette par défaut (identité visuelle FloDrama)
  const defaultPalette = COLOR_PALETTES.flodrama_default;
  
  // Sélectionner une palette prédéfinie si possible
  if (origin && type) {
    const originLower = origin?.toLowerCase() || '';
    const typeLower = type?.toLowerCase() || '';
    
    if (originLower.includes('korea') || originLower.includes('corée')) {
      // Dramas coréens
      if (visualStyle === 'historique' || (year && year < 1950)) {
        return COLOR_PALETTES.korean_historical;
      } else {
        return COLOR_PALETTES.korean_modern;
      }
    } else if (originLower.includes('japan') || originLower.includes('japon')) {
      // Contenus japonais
      if (typeLower.includes('anime') || typeLower.includes('animation')) {
        if (visualStyle === 'stylisé') {
          return COLOR_PALETTES.anime_vibrant;
        } else {
          return COLOR_PALETTES.anime_pastel;
        }
      }
    }
    
    // Films en général
    if (typeLower.includes('film') || typeLower.includes('movie')) {
      if (visualStyle === 'noir' || visualStyle === 'dramatique') {
        return COLOR_PALETTES.film_noir;
      } else {
        return COLOR_PALETTES.film_colorful;
      }
    }
  }
  
  // Si aucune correspondance, utiliser la palette par défaut
  return defaultPalette;
}

/**
 * Détermine l'ambiance visuelle en fonction des genres et des tags
 * @param {Array} genres - Liste des genres du contenu
 * @param {Array} visualTags - Tags visuels associés au contenu
 * @returns {string} - Ambiance visuelle dominante
 */
export function determineVisualMood(genres = [], visualTags = []) {
  // Convertir en minuscules pour faciliter la comparaison
  const genresLower = genres.map(g => g.toLowerCase());
  const tagsLower = visualTags.map(t => t.toLowerCase());
  
  // Mots-clés associés à chaque ambiance
  const moodKeywords = {
    'dramatique': ['drame', 'tragédie', 'intense', 'émotionnel', 'dramatique'],
    'mélancolique': ['mélancolie', 'triste', 'nostalgique', 'doux-amer'],
    'romantique': ['romance', 'amour', 'doux', 'sentimental', 'passion'],
    'tendue': ['thriller', 'suspense', 'tension', 'mystère', 'angoisse'],
    'sereine': ['paisible', 'calme', 'contemplatif', 'zen', 'tranquille']
  };
  
  // Compter les correspondances pour chaque ambiance
  const moodCounts = {};
  
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    moodCounts[mood] = 0;
    
    // Vérifier les genres
    for (const genre of genresLower) {
      if (keywords.some(keyword => genre.includes(keyword))) {
        moodCounts[mood] += 1;
      }
    }
    
    // Vérifier les tags visuels
    for (const tag of tagsLower) {
      if (keywords.some(keyword => tag.includes(keyword))) {
        moodCounts[mood] += 2; // Les tags visuels ont plus de poids
      }
    }
  }
  
  // Déterminer l'ambiance avec le plus de correspondances
  let maxCount = 0;
  let dominantMood = 'dramatique'; // Ambiance par défaut
  
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantMood = mood;
    }
  }
  
  return dominantMood;
}

/**
 * Détermine le type d'éclairage
 * @param {Array} genres - Liste des genres du contenu
 * @param {Array} visualTags - Tags visuels associés au contenu
 * @returns {string} - Type d'éclairage
 */
export function determineLighting(genres = [], visualTags = []) {
  // Convertir en minuscules pour faciliter la comparaison
  const genresLower = genres.map(g => g.toLowerCase());
  const tagsLower = visualTags.map(t => t.toLowerCase());
  
  // Vérifier les tags visuels en priorité
  if (tagsLower.some(t => t.includes('low-key') || t.includes('sombre') || t.includes('contrasté'))) {
    return 'low-key';
  }
  
  if (tagsLower.some(t => t.includes('high-key') || t.includes('lumineux') || t.includes('clair'))) {
    return 'high-key';
  }
  
  if (tagsLower.some(t => t.includes('naturel') || t.includes('réaliste'))) {
    return 'naturel';
  }
  
  if (tagsLower.some(t => t.includes('stylisé') || t.includes('artistique') || t.includes('coloré'))) {
    return 'stylisé';
  }
  
  // Si pas de tag spécifique, déduire de genres
  if (genresLower.some(g => g.includes('thriller') || g.includes('horreur') || g.includes('mystère'))) {
    return 'low-key';
  }
  
  if (genresLower.some(g => g.includes('comédie') || g.includes('romance'))) {
    return 'high-key';
  }
  
  if (genresLower.some(g => g.includes('documentaire') || g.includes('réaliste'))) {
    return 'naturel';
  }
  
  if (genresLower.some(g => g.includes('fantasy') || g.includes('sci-fi'))) {
    return 'stylisé';
  }
  
  // Valeur par défaut
  return 'naturel';
}

/**
 * Détermine le type de composition
 * @param {Array} genres - Liste des genres du contenu
 * @param {Array} visualTags - Tags visuels associés au contenu
 * @returns {string} - Type de composition
 */
export function determineComposition(genres = [], visualTags = []) {
  // Convertir en minuscules pour faciliter la comparaison
  const genresLower = genres.map(g => g.toLowerCase());
  const tagsLower = visualTags.map(t => t.toLowerCase());
  
  // Vérifier les tags visuels en priorité
  if (tagsLower.some(t => t.includes('symétrique') || t.includes('équilibré'))) {
    return 'symétrique';
  }
  
  if (tagsLower.some(t => t.includes('asymétrique') || t.includes('déséquilibré'))) {
    return 'asymétrique';
  }
  
  if (tagsLower.some(t => t.includes('profondeur') || t.includes('perspective'))) {
    return 'profondeur';
  }
  
  if (tagsLower.some(t => t.includes('minimaliste') || t.includes('épuré'))) {
    return 'minimaliste';
  }
  
  // Si pas de tag spécifique, déduire de genres
  if (genresLower.some(g => g.includes('action') || g.includes('thriller'))) {
    return 'asymétrique';
  }
  
  if (genresLower.some(g => g.includes('drame') || g.includes('art'))) {
    return 'symétrique';
  }
  
  if (genresLower.some(g => g.includes('épique') || g.includes('aventure'))) {
    return 'profondeur';
  }
  
  if (genresLower.some(g => g.includes('minimaliste') || g.includes('slice of life'))) {
    return 'minimaliste';
  }
  
  // Valeur par défaut
  return 'balanced';
}

/**
 * Analyse les éléments visuels spécifiques
 * @param {Array} genres - Liste des genres du contenu
 * @param {Array} visualTags - Tags visuels associés au contenu
 * @param {string} origin - Origine du contenu
 * @param {string} type - Type de contenu
 * @returns {Array} - Liste des éléments visuels
 */
export function analyzeVisualElements(genres = [], visualTags = [], origin = '', type = '') {
  const elements = [];
  
  // Déterminer le type d'éclairage
  const lighting = determineLighting(genres, visualTags);
  if (lighting) {
    elements.push({
      type: 'lighting',
      value: lighting,
      confidence: 0.8
    });
  }
  
  // Déterminer le type de composition
  const composition = determineComposition(genres, visualTags);
  if (composition) {
    elements.push({
      type: 'composition',
      value: composition,
      confidence: 0.7
    });
  }
  
  // Ajouter d'autres éléments visuels en fonction des tags
  const tagsLower = visualTags.map(t => t.toLowerCase());
  
  // Vérifier la présence de certains éléments visuels spécifiques
  if (tagsLower.some(t => t.includes('grain') || t.includes('film') || t.includes('vintage'))) {
    elements.push({
      type: 'texture',
      value: 'film grain',
      confidence: 0.9
    });
  }
  
  if (tagsLower.some(t => t.includes('saturé') || t.includes('vif') || t.includes('coloré'))) {
    elements.push({
      type: 'color',
      value: 'saturated',
      confidence: 0.85
    });
  }
  
  if (tagsLower.some(t => t.includes('désaturé') || t.includes('pâle') || t.includes('fade'))) {
    elements.push({
      type: 'color',
      value: 'desaturated',
      confidence: 0.85
    });
  }
  
  return elements;
}

/**
 * Génère des recommandations de design basées sur l'analyse visuelle
 * @param {string} style - Style visuel
 * @param {string} mood - Ambiance visuelle
 * @param {Object} palette - Palette de couleurs
 * @returns {Object} - Recommandations de design
 */
export function generateDesignRecommendations(style, mood, palette) {
  // Recommandations de base
  const recommendations = {
    typography: {},
    layout: {},
    animations: {},
    accents: {}
  };
  
  // Recommandations typographiques
  if (style === 'minimaliste') {
    recommendations.typography = {
      family: 'SF Pro Display, sans-serif',
      weight: 'light to regular',
      spacing: 'airy'
    };
  } else if (style === 'opulent') {
    recommendations.typography = {
      family: 'Playfair Display, serif',
      weight: 'regular to bold',
      spacing: 'normal'
    };
  } else {
    recommendations.typography = {
      family: 'SF Pro Display, sans-serif',
      weight: 'regular',
      spacing: 'normal'
    };
  }
  
  // Recommandations de mise en page
  if (mood === 'dramatique' || mood === 'tendue') {
    recommendations.layout = {
      spacing: 'contrasté',
      alignment: 'dynamique',
      hierarchy: 'marquée'
    };
  } else if (mood === 'sereine' || mood === 'mélancolique') {
    recommendations.layout = {
      spacing: 'généreux',
      alignment: 'équilibré',
      hierarchy: 'subtile'
    };
  } else {
    recommendations.layout = {
      spacing: 'équilibré',
      alignment: 'aligné',
      hierarchy: 'claire'
    };
  }
  
  // Recommandations d'animations
  if (mood === 'tendue') {
    recommendations.animations = {
      speed: 'rapide',
      easing: 'sharp',
      transitions: 'abruptes'
    };
  } else if (mood === 'romantique' || mood === 'sereine') {
    recommendations.animations = {
      speed: 'lente',
      easing: 'ease-in-out',
      transitions: 'fluides'
    };
  } else {
    recommendations.animations = {
      speed: 'modérée',
      easing: 'ease',
      transitions: 'naturelles'
    };
  }
  
  // Recommandations d'accents visuels
  recommendations.accents = {
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.background,
    gradient: `linear-gradient(to right, ${palette.primary}, ${palette.secondary})`,
    shadows: mood === 'dramatique' || mood === 'tendue' ? 'marquées' : 'subtiles'
  };
  
  return recommendations;
}

/**
 * Traduit un terme visuel dans la langue spécifiée
 * @param {string} term - Terme à traduire
 * @param {string} language - Langue cible (en, ko, ja)
 * @returns {string} - Terme traduit
 */
export function translateVisualTerm(term, language = 'en') {
  if (language === 'fr') return term;
  
  const translation = VISUAL_TERMS_TRANSLATIONS[term];
  if (translation && translation[language]) {
    return translation[language];
  }
  
  return term;
}

/**
 * Convertit une couleur hexadécimale en RGB
 * @param {string} hex - Couleur hexadécimale
 * @returns {string} - Couleur RGB
 */
export function hexToRgb(hex) {
  // Supprimer le # si présent
  hex = hex.replace(/^#/, '');
  
  // Convertir en RGB
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return `${r}, ${g}, ${b}`;
}

export default {
  determineVisualStyle,
  determineColorPalette,
  determineVisualMood,
  determineLighting,
  determineComposition,
  analyzeVisualElements,
  generateDesignRecommendations,
  translateVisualTerm,
  hexToRgb
};
