/**
 * Service d'analyse du style visuel pour FloDrama
 * Permet d'analyser les aspects visuels des contenus vidéo
 */

import { COLOR_PALETTES, VISUAL_STYLES, VISUAL_MOODS } from '../data/visualStyleData';
import {
  determineVisualStyle,
  determineColorPalette,
  determineVisualMood,
  analyzeVisualElements,
  generateDesignRecommendations,
  hexToRgb
} from './visualStyleAnalyzer';

/**
 * Analyse le style visuel d'un contenu vidéo
 * @param {Object} content - Objet contenant les métadonnées du contenu
 * @param {Object} options - Options d'analyse
 * @param {boolean} options.detailed - Inclure des détails supplémentaires dans l'analyse
 * @param {string} options.language - Langue des résultats (fr, en, ko, ja)
 * @returns {Object} - Analyse du style visuel
 */
export function analyzeVisualStyle(content, options = {}) {
  // Valeurs par défaut des options
  const {
    detailed = false,
    language = 'fr'
  } = options;
  
  // Extraire les informations pertinentes du contenu
  const {
    genres = [],
    origin,
    year,
    type,
    visualTags = []
  } = content;
  
  // Déterminer le style visuel en fonction des genres et de l'origine
  const visualStyle = determineVisualStyle(genres, origin, visualTags);
  
  // Déterminer la palette de couleurs
  const colorPalette = determineColorPalette(origin, type, year, visualStyle);
  
  // Déterminer l'ambiance visuelle
  const mood = determineVisualMood(genres, visualTags);
  
  // Analyser les éléments visuels spécifiques
  const visualElements = analyzeVisualElements(genres, visualTags, origin, type);
  
  // Préparer le résultat de base
  const result = {
    palette: colorPalette,
    style: visualStyle,
    mood,
    visualElements
  };
  
  // Ajouter des détails supplémentaires si demandé
  if (detailed) {
    result.styleDetails = VISUAL_STYLES[visualStyle] || {};
    result.moodDetails = VISUAL_MOODS[mood] || {};
    
    // Ajouter des recommandations de design
    result.designRecommendations = generateDesignRecommendations(visualStyle, mood, colorPalette);
  }
  
  return result;
}

/**
 * Extrait la palette de couleurs dominante d'une image
 * Note: Cette fonction est un placeholder - dans une implémentation réelle,
 * elle utiliserait une bibliothèque d'analyse d'image comme color-thief
 * @param {string} _imageUrl - URL de l'image à analyser
 * @returns {Promise<Object>} - Palette de couleurs extraite
 */
export async function extractColorPalette(_imageUrl) {
  // Dans une implémentation réelle, cette fonction analyserait l'image
  // Pour l'instant, retourne une palette par défaut basée sur l'interface FloDrama
  return {
    primary: '#3b82f6',    // Bleu signature
    secondary: '#d946ef',  // Fuchsia accent
    background: '#121118', // Fond sombre
    accent1: '#8b5cf6',    // Violet (pour les dégradés)
    accent2: '#3b82f6',    // Bleu clair (pour les dégradés)
    text: '#f3f4f6',       // Texte clair
    gradient: 'linear-gradient(to bottom, #d946ef, #8b5cf6, #3b82f6)' // Dégradé des cartes
  };
}

/**
 * Applique un style visuel à un élément d'interface
 * @param {Object} element - Élément d'interface à styliser
 * @param {Object} visualStyle - Style visuel à appliquer
 * @returns {Object} - Élément stylisé
 */
export function applyVisualStyle(element, visualStyle) {
  // Extraire les informations du style visuel
  const { palette, mood } = visualStyle;
  
  // Appliquer les styles de base
  const styledElement = {
    ...element,
    style: {
      ...element.style,
      backgroundColor: palette.background,
      color: palette.text,
      borderColor: palette.primary
    }
  };
  
  // Appliquer des styles spécifiques en fonction de l'ambiance
  if (mood === 'dramatique' || mood === 'tendue') {
    styledElement.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.3)`;
    styledElement.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
  } else if (mood === 'romantique') {
    styledElement.style.boxShadow = `0 2px 8px rgba(${hexToRgb(palette.secondary)}, 0.2)`;
    styledElement.style.transition = 'all 0.5s ease-in-out';
  } else {
    styledElement.style.boxShadow = 'none';
    styledElement.style.transition = 'all 0.3s ease';
  }
  
  return styledElement;
}

/**
 * Génère un CSS pour appliquer le style visuel à un conteneur
 * @param {Object} visualStyle - Style visuel à appliquer
 * @returns {string} - CSS à appliquer
 */
export function generateVisualStyleCSS(visualStyle) {
  const { palette, mood } = visualStyle;
  
  // CSS de base
  let css = `
    background-color: ${palette.background};
    color: ${palette.text};
    border-color: ${palette.primary};
  `;
  
  // Ajouter des styles spécifiques en fonction de l'ambiance
  if (mood === 'dramatique' || mood === 'tendue') {
    css += `
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;
  } else if (mood === 'romantique') {
    css += `
      box-shadow: 0 2px 8px rgba(${hexToRgb(palette.secondary)}, 0.2);
      transition: all 0.5s ease-in-out;
    `;
  } else {
    css += `
      box-shadow: none;
      transition: all 0.3s ease;
    `;
  }
  
  return css;
}

/**
 * Génère un style pour les cartes de contenu basé sur l'interface FloDrama
 * @returns {Object} - Style pour les cartes de contenu
 */
export function generateContentCardStyle() {
  // Style par défaut basé sur les captures d'écran de FloDrama
  return {
    card: {
      borderRadius: '8px',
      overflow: 'hidden',
      background: COLOR_PALETTES.flodrama_default.gradient,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      aspectRatio: '2/3',
      position: 'relative'
    },
    title: {
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: '500',
      marginTop: '0.5rem',
      marginBottom: '0.25rem'
    },
    metadata: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.875rem'
    },
    hover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)'
    }
  };
}

// Exporter toutes les fonctions
export default {
  analyzeVisualStyle,
  extractColorPalette,
  applyVisualStyle,
  generateVisualStyleCSS,
  generateContentCardStyle
};
