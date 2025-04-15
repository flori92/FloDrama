/**
 * Données de référence pour l'analyse du style visuel
 * Utilisées par le service d'analyse du style visuel
 */

// Palettes de couleurs prédéfinies par style
export const COLOR_PALETTES = {
  // Palettes pour les dramas coréens
  'korean_modern': {
    primary: '#3b82f6',    // Bleu signature FloDrama
    secondary: '#d946ef',  // Fuchsia accent FloDrama
    background: '#121118', // Fond sombre FloDrama
    accent1: '#34d399',    // Vert menthe (populaire dans le design coréen moderne)
    accent2: '#f59e0b',    // Ambre (pour les touches chaleureuses)
    text: '#f3f4f6'        // Texte clair sur fond sombre
  },
  'korean_historical': {
    primary: '#854d0e',    // Brun doré (couleurs traditionnelles coréennes)
    secondary: '#b91c1c',  // Rouge traditionnel
    background: '#292524', // Fond brun foncé
    accent1: '#166534',    // Vert forêt (nature)
    accent2: '#7c2d12',    // Terre cuite
    text: '#fef3c7'        // Texte crème
  },
  
  // Palettes pour les animes japonais
  'anime_vibrant': {
    primary: '#4f46e5',    // Indigo vif
    secondary: '#ec4899',  // Rose vif
    background: '#18181b', // Fond presque noir
    accent1: '#06b6d4',    // Cyan électrique
    accent2: '#fb923c',    // Orange vif
    text: '#ffffff'        // Texte blanc pur
  },
  'anime_pastel': {
    primary: '#93c5fd',    // Bleu pastel
    secondary: '#fbcfe8',  // Rose pastel
    background: '#1f2937', // Fond bleu-gris foncé
    accent1: '#a7f3d0',    // Vert menthe pastel
    accent2: '#fed7aa',    // Pêche pastel
    text: '#f1f5f9'        // Texte gris très clair
  },
  
  // Palettes pour les films
  'film_noir': {
    primary: '#0f172a',    // Bleu très foncé
    secondary: '#475569',  // Gris ardoise
    background: '#030712', // Fond noir
    accent1: '#94a3b8',    // Gris clair
    accent2: '#dc2626',    // Rouge accent (rare)
    text: '#e2e8f0'        // Texte gris clair
  },
  'film_colorful': {
    primary: '#2563eb',    // Bleu royal
    secondary: '#db2777',  // Rose profond
    background: '#0f172a', // Fond bleu foncé
    accent1: '#16a34a',    // Vert émeraude
    accent2: '#ca8a04',    // Or
    text: '#f8fafc'        // Texte blanc cassé
  },
  
  // Palette FloDrama (basée sur les captures d'écran)
  'flodrama_default': {
    primary: '#3b82f6',    // Bleu signature
    secondary: '#d946ef',  // Fuchsia accent
    background: '#121118', // Fond sombre
    accent1: '#8b5cf6',    // Violet (pour les dégradés)
    accent2: '#3b82f6',    // Bleu clair (pour les dégradés)
    text: '#f3f4f6',       // Texte clair
    gradient: 'linear-gradient(to bottom, #d946ef, #8b5cf6, #3b82f6)' // Dégradé des cartes
  }
};

// Styles visuels avec leurs caractéristiques
export const VISUAL_STYLES = {
  'minimaliste': {
    description: 'Style épuré avec peu d'éléments visuels, mettant l'accent sur l'essentiel',
    characteristics: ['espaces négatifs', 'palette limitée', 'composition simple', 'peu de textures'],
    common_in: ['dramas coréens modernes', 'films d'auteur japonais', 'séries slice-of-life']
  },
  'opulent': {
    description: 'Style riche et détaillé avec de nombreux éléments visuels et décoratifs',
    characteristics: ['couleurs riches', 'nombreux détails', 'textures complexes', 'composition chargée'],
    common_in: ['dramas historiques', 'films de fantasy', 'productions à gros budget']
  },
  'naturaliste': {
    description: 'Style privilégiant un rendu naturel et réaliste des scènes et personnages',
    characteristics: ['éclairage naturel', 'palette de couleurs réaliste', 'caméra observationnelle'],
    common_in: ['documentaires', 'drames réalistes', 'films sociaux']
  },
  'stylisé': {
    description: 'Style avec une forte direction artistique et des choix esthétiques marqués',
    characteristics: ['palette distinctive', 'composition recherchée', 'éclairage dramatique'],
    common_in: ['thrillers', 'films de genre', 'dramas artistiques']
  },
  'nostalgique': {
    description: 'Style évoquant une période passée avec des éléments visuels rétro',
    characteristics: ['filtres sépia/vintage', 'aspect ratio modifié', 'grain film'],
    common_in: ['dramas rétrospectifs', 'films d'époque', 'récits de souvenirs']
  }
};

// Types d'éclairage et leurs caractéristiques
export const LIGHTING_TYPES = {
  'high-key': {
    description: 'Éclairage lumineux et uniforme avec peu d'ombres',
    mood: ['joyeux', 'léger', 'optimiste'],
    common_in: ['comédies', 'dramas romantiques légers', 'émissions de variétés']
  },
  'low-key': {
    description: 'Éclairage contrasté avec des zones d'ombre importantes',
    mood: ['dramatique', 'mystérieux', 'tendu'],
    common_in: ['thrillers', 'drames psychologiques', 'films noirs']
  },
  'naturel': {
    description: 'Éclairage imitant les sources de lumière naturelles',
    mood: ['authentique', 'réaliste', 'intime'],
    common_in: ['documentaires', 'dramas réalistes', 'films indépendants']
  },
  'stylisé': {
    description: 'Éclairage artistique avec des couleurs ou des effets non réalistes',
    mood: ['onirique', 'surréaliste', 'fantastique'],
    common_in: ['films de fantasy', 'science-fiction', 'thrillers visuels']
  }
};

// Types de composition et leurs caractéristiques
export const COMPOSITION_TYPES = {
  'symétrique': {
    description: 'Composition équilibrée avec des éléments répartis de façon égale',
    effect: ['ordre', 'harmonie', 'stabilité'],
    common_in: ['films d'auteur', 'dramas contemplatifs']
  },
  'asymétrique': {
    description: 'Composition déséquilibrée créant une tension visuelle',
    effect: ['dynamisme', 'tension', 'mouvement'],
    common_in: ['thrillers', 'films d'action', 'dramas émotionnels']
  },
  'profondeur': {
    description: 'Composition utilisant plusieurs plans pour créer de la profondeur',
    effect: ['immersion', 'perspective', 'hiérarchie'],
    common_in: ['films épiques', 'dramas visuels']
  },
  'minimaliste': {
    description: 'Composition épurée avec peu d'éléments visuels',
    effect: ['focus', 'clarté', 'simplicité'],
    common_in: ['dramas minimalistes', 'films d'auteur']
  }
};

// Ambiances visuelles et leurs caractéristiques
export const VISUAL_MOODS = {
  'dramatique': {
    description: 'Ambiance intense et émotionnelle',
    visual_cues: ['contrastes forts', 'mouvements de caméra expressifs', 'gros plans'],
    color_palette: ['contrastée', 'saturée', 'sombre']
  },
  'mélancolique': {
    description: 'Ambiance triste et nostalgique',
    visual_cues: ['plans larges', 'mouvements lents', 'éclairage doux'],
    color_palette: ['désaturée', 'bleutée', 'pâle']
  },
  'romantique': {
    description: 'Ambiance douce et sentimentale',
    visual_cues: ['flou artistique', 'éclairage doux', 'mouvements fluides'],
    color_palette: ['chaude', 'rose/rouge', 'lumineuse']
  },
  'tendue': {
    description: 'Ambiance stressante et anxiogène',
    visual_cues: ['caméra instable', 'plans serrés', 'montage rapide'],
    color_palette: ['contrastée', 'désaturée', 'froide']
  },
  'sereine': {
    description: 'Ambiance calme et apaisante',
    visual_cues: ['plans larges', 'mouvements lents', 'composition équilibrée'],
    color_palette: ['douce', 'naturelle', 'harmonieuse']
  }
};

// Modèles d'analyse visuelle pour différents genres
export const GENRE_VISUAL_MODELS = {
  'romance': {
    primary_mood: 'romantique',
    secondary_mood: 'mélancolique',
    lighting: 'high-key',
    composition: 'symétrique',
    palette_preference: 'korean_modern'
  },
  'drame': {
    primary_mood: 'dramatique',
    secondary_mood: 'mélancolique',
    lighting: 'low-key',
    composition: 'asymétrique',
    palette_preference: 'film_noir'
  },
  'comédie': {
    primary_mood: 'sereine',
    secondary_mood: 'romantique',
    lighting: 'high-key',
    composition: 'symétrique',
    palette_preference: 'anime_pastel'
  },
  'thriller': {
    primary_mood: 'tendue',
    secondary_mood: 'dramatique',
    lighting: 'low-key',
    composition: 'asymétrique',
    palette_preference: 'film_noir'
  },
  'action': {
    primary_mood: 'tendue',
    secondary_mood: 'dramatique',
    lighting: 'stylisé',
    composition: 'profondeur',
    palette_preference: 'film_colorful'
  },
  'historique': {
    primary_mood: 'dramatique',
    secondary_mood: 'mélancolique',
    lighting: 'naturel',
    composition: 'profondeur',
    palette_preference: 'korean_historical'
  },
  'fantastique': {
    primary_mood: 'dramatique',
    secondary_mood: 'sereine',
    lighting: 'stylisé',
    composition: 'profondeur',
    palette_preference: 'anime_vibrant'
  }
};

// Traductions des termes visuels
export const VISUAL_TERMS_TRANSLATIONS = {
  // Styles
  'minimaliste': { en: 'minimalist', ko: '미니멀리스트', ja: 'ミニマリスト' },
  'opulent': { en: 'opulent', ko: '화려한', ja: '豪華な' },
  'naturaliste': { en: 'naturalistic', ko: '자연주의', ja: '自然主義' },
  'stylisé': { en: 'stylized', ko: '양식화된', ja: '様式化された' },
  'nostalgique': { en: 'nostalgic', ko: '향수를 불러일으키는', ja: 'ノスタルジックな' },
  
  // Ambiances
  'dramatique': { en: 'dramatic', ko: '극적인', ja: 'ドラマチックな' },
  'mélancolique': { en: 'melancholic', ko: '우울한', ja: '憂鬱な' },
  'romantique': { en: 'romantic', ko: '로맨틱한', ja: 'ロマンチックな' },
  'tendue': { en: 'tense', ko: '긴장된', ja: '緊張した' },
  'sereine': { en: 'serene', ko: '평온한', ja: '穏やかな' },
  
  // Éclairage
  'high-key': { en: 'high-key', ko: '하이키', ja: 'ハイキー' },
  'low-key': { en: 'low-key', ko: '로우키', ja: 'ローキー' },
  'naturel': { en: 'natural', ko: '자연광', ja: '自然光' },
  'stylisé': { en: 'stylized', ko: '스타일화된', ja: 'スタイライズされた' },
  
  // Composition
  'symétrique': { en: 'symmetrical', ko: '대칭적인', ja: '対称的な' },
  'asymétrique': { en: 'asymmetrical', ko: '비대칭적인', ja: '非対称的な' },
  'profondeur': { en: 'depth', ko: '깊이감', ja: '奥行き' },
  'minimaliste': { en: 'minimalist', ko: '미니멀리스트', ja: 'ミニマリスト' }
};

export default {
  COLOR_PALETTES,
  VISUAL_STYLES,
  LIGHTING_TYPES,
  COMPOSITION_TYPES,
  VISUAL_MOODS,
  GENRE_VISUAL_MODELS,
  VISUAL_TERMS_TRANSLATIONS
};
