/**
 * Service d'analyse des émotions pour FloDrama
 * Permet d'analyser les émotions présentes dans les contenus vidéo et textuels
 */

// Dictionnaire d'émotions avec leurs synonymes et mots associés
const EMOTION_DICTIONARY = {
  joy: {
    synonyms: ['happiness', 'delight', 'pleasure', 'excitement', 'contentment', 'satisfaction'],
    keywords: ['smile', 'laugh', 'happy', 'cheerful', 'joyful', 'delighted', 'pleased', 'content'],
    french: ['joie', 'bonheur', 'plaisir', 'contentement', 'satisfaction', 'allégresse'],
    korean: ['기쁨', '행복', '즐거움', '환희'],
    japanese: ['喜び', '幸福', '楽しみ'],
    intensity: {
      low: ['content', 'pleased', 'satisfied'],
      medium: ['happy', 'cheerful', 'glad'],
      high: ['ecstatic', 'thrilled', 'overjoyed', 'elated']
    }
  },
  sadness: {
    synonyms: ['sorrow', 'grief', 'melancholy', 'despair', 'depression', 'gloom'],
    keywords: ['sad', 'cry', 'tear', 'depressed', 'unhappy', 'miserable', 'gloomy', 'downcast'],
    french: ['tristesse', 'chagrin', 'mélancolie', 'désespoir', 'dépression'],
    korean: ['슬픔', '비애', '애도', '우울함'],
    japanese: ['悲しみ', '悲嘆', '憂鬱'],
    intensity: {
      low: ['blue', 'down', 'disappointed'],
      medium: ['sad', 'sorrowful', 'unhappy'],
      high: ['devastated', 'heartbroken', 'despairing', 'grief-stricken']
    }
  },
  anger: {
    synonyms: ['rage', 'fury', 'wrath', 'irritation', 'annoyance', 'indignation'],
    keywords: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'enraged', 'outraged'],
    french: ['colère', 'rage', 'fureur', 'irritation', 'agacement', 'indignation'],
    korean: ['분노', '화', '격노', '짜증'],
    japanese: ['怒り', '憤り', 'いらだち'],
    intensity: {
      low: ['annoyed', 'irritated', 'displeased'],
      medium: ['angry', 'mad', 'resentful'],
      high: ['furious', 'enraged', 'livid', 'outraged']
    }
  },
  fear: {
    synonyms: ['terror', 'horror', 'dread', 'panic', 'anxiety', 'apprehension'],
    keywords: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'nervous', 'worried'],
    french: ['peur', 'terreur', 'horreur', 'effroi', 'anxiété', 'appréhension'],
    korean: ['두려움', '공포', '불안', '걱정'],
    japanese: ['恐怖', '不安', '心配'],
    intensity: {
      low: ['concerned', 'uneasy', 'apprehensive'],
      medium: ['afraid', 'scared', 'frightened'],
      high: ['terrified', 'petrified', 'panic-stricken', 'horrified']
    }
  },
  surprise: {
    synonyms: ['astonishment', 'amazement', 'shock', 'wonder', 'disbelief'],
    keywords: ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'stunned'],
    french: ['surprise', 'étonnement', 'stupéfaction', 'choc', 'émerveillement'],
    korean: ['놀람', '경악', '충격', '경이'],
    japanese: ['驚き', '仰天', '衝撃'],
    intensity: {
      low: ['surprised', 'startled', 'taken aback'],
      medium: ['amazed', 'astonished', 'dumbfounded'],
      high: ['shocked', 'stunned', 'flabbergasted', 'astounded']
    }
  },
  disgust: {
    synonyms: ['revulsion', 'aversion', 'distaste', 'repulsion', 'loathing'],
    keywords: ['disgusted', 'revolted', 'repulsed', 'nauseated', 'repelled', 'sickened'],
    french: ['dégoût', 'répulsion', 'aversion', 'écœurement'],
    korean: ['혐오', '역겨움', '구역질', '메스꺼움'],
    japanese: ['嫌悪', '不快', '吐き気'],
    intensity: {
      low: ['dislike', 'distaste', 'aversion'],
      medium: ['disgusted', 'repelled', 'revolted'],
      high: ['repulsed', 'nauseated', 'sickened', 'loathing']
    }
  },
  love: {
    synonyms: ['affection', 'adoration', 'fondness', 'devotion', 'passion', 'infatuation'],
    keywords: ['love', 'adore', 'cherish', 'care', 'devoted', 'passionate', 'romantic'],
    french: ['amour', 'affection', 'adoration', 'tendresse', 'passion'],
    korean: ['사랑', '애정', '연애', '열정'],
    japanese: ['愛', '愛情', '恋愛', '情熱'],
    intensity: {
      low: ['like', 'fond of', 'care for'],
      medium: ['love', 'adore', 'cherish'],
      high: ['passionate', 'devoted', 'infatuated', 'head over heels']
    }
  },
  neutral: {
    synonyms: ['indifference', 'impartiality', 'objectivity', 'detachment'],
    keywords: ['neutral', 'indifferent', 'impartial', 'objective', 'detached', 'dispassionate'],
    french: ['neutre', 'indifférence', 'impartialité', 'objectivité', 'détachement'],
    korean: ['중립', '무관심', '객관성', '초연함'],
    japanese: ['中立', '無関心', '客観性', '超然'],
    intensity: {
      low: ['slightly detached', 'somewhat neutral'],
      medium: ['neutral', 'indifferent', 'impartial'],
      high: ['completely detached', 'utterly dispassionate', 'entirely objective']
    }
  }
};

// Modèles d'analyse émotionnelle pour différents genres
const GENRE_EMOTION_MODELS = {
  'romance': {
    primary: ['love', 'joy', 'sadness'],
    secondary: ['surprise', 'fear'],
    weights: { love: 1.5, joy: 1.2, sadness: 1.2 }
  },
  'drama': {
    primary: ['sadness', 'anger', 'love'],
    secondary: ['fear', 'joy'],
    weights: { sadness: 1.3, anger: 1.2, love: 1.1 }
  },
  'comedy': {
    primary: ['joy', 'surprise'],
    secondary: ['love', 'disgust'],
    weights: { joy: 1.5, surprise: 1.3 }
  },
  'thriller': {
    primary: ['fear', 'surprise', 'anger'],
    secondary: ['disgust', 'sadness'],
    weights: { fear: 1.4, surprise: 1.2, anger: 1.1 }
  },
  'horror': {
    primary: ['fear', 'disgust'],
    secondary: ['surprise', 'anger'],
    weights: { fear: 1.6, disgust: 1.4 }
  },
  'action': {
    primary: ['surprise', 'fear', 'anger'],
    secondary: ['joy'],
    weights: { surprise: 1.3, fear: 1.2, anger: 1.2 }
  },
  'documentary': {
    primary: ['neutral'],
    secondary: ['surprise', 'sadness'],
    weights: { neutral: 1.5 }
  }
};

/**
 * Analyse le contenu émotionnel d'un texte ou d'une description
 * @param {string|Object} content - Texte à analyser ou objet contenant des champs textuels
 * @param {Object} options - Options d'analyse
 * @returns {Object} - Résultat de l'analyse émotionnelle
 */
export function analyzeEmotionalContent(content, options = {}) {
  // Extraire le texte à analyser
  let textToAnalyze = '';
  
  if (typeof content === 'string') {
    textToAnalyze = content;
  } else if (typeof content === 'object') {
    // Concaténer les champs textuels pertinents
    const textFields = [
      content.title,
      content.description,
      content.synopsis,
      ...(content.dialogues || []),
      ...(content.reviews || [])
    ].filter(Boolean);
    
    textToAnalyze = textFields.join(' ');
  }
  
  // Si pas de texte à analyser, retourner une analyse neutre
  if (!textToAnalyze || textToAnalyze.trim() === '') {
    return {
      dominant: 'neutral',
      emotions: {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        love: 0,
        neutral: 1
      },
      intensity: 0,
      tone: 'neutral'
    };
  }
  
  // Normaliser le texte
  const normalizedText = textToAnalyze.toLowerCase();
  
  // Analyser les émotions présentes dans le texte
  const emotionScores = {};
  let totalMatches = 0;
  
  // Parcourir le dictionnaire d'émotions
  for (const [emotion, data] of Object.entries(EMOTION_DICTIONARY)) {
    // Compter les occurrences des mots-clés associés à chaque émotion
    const allKeywords = [
      ...data.synonyms,
      ...data.keywords,
      ...data.french,
      ...data.korean,
      ...data.japanese,
      ...data.intensity.low,
      ...data.intensity.medium,
      ...data.intensity.high
    ];
    
    let matches = 0;
    for (const keyword of allKeywords) {
      // Compter les occurrences du mot-clé
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const occurrences = (normalizedText.match(regex) || []).length;
      matches += occurrences;
    }
    
    // Appliquer des pondérations en fonction du genre si disponible
    if (content.genres && Array.isArray(content.genres)) {
      for (const genre of content.genres) {
        const genreLower = genre.toLowerCase();
        const model = GENRE_EMOTION_MODELS[genreLower];
        
        if (model) {
          // Appliquer une pondération si l'émotion est primaire ou secondaire pour ce genre
          if (model.primary.includes(emotion)) {
            matches *= model.weights[emotion] || 1.2;
          } else if (model.secondary.includes(emotion)) {
            matches *= 1.1;
          }
        }
      }
    }
    
    emotionScores[emotion] = matches;
    totalMatches += matches;
  }
  
  // Normaliser les scores
  if (totalMatches > 0) {
    for (const emotion in emotionScores) {
      emotionScores[emotion] = emotionScores[emotion] / totalMatches;
    }
  } else {
    // Si aucune correspondance, définir neutre à 1
    emotionScores.neutral = 1;
  }
  
  // Déterminer l'émotion dominante
  let dominantEmotion = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion;
    }
  }
  
  // Calculer l'intensité globale (0-1)
  const neutralScore = emotionScores.neutral || 0;
  const intensity = 1 - neutralScore;
  
  // Déterminer le ton en fonction de l'intensité
  let tone;
  if (intensity < 0.3) {
    tone = 'subtle';
  } else if (intensity < 0.6) {
    tone = 'moderate';
  } else {
    tone = 'intense';
  }
  
  return {
    dominant: dominantEmotion,
    emotions: emotionScores,
    intensity,
    tone
  };
}

/**
 * Analyse les émotions dans un contenu avec options avancées
 * @param {Object|string} content - Contenu à analyser
 * @param {Object} options - Options d'analyse
 * @param {boolean} options.includeIntensityLevels - Inclure les niveaux d'intensité pour chaque émotion
 * @param {boolean} options.includeConfidence - Inclure un score de confiance
 * @param {string} options.language - Langue de sortie (en, fr, ko, ja)
 * @returns {Object} - Analyse émotionnelle détaillée
 */
export function getEmotionAnalysis(content, options = {}) {
  // Valeurs par défaut des options
  const {
    includeIntensityLevels = false,
    includeConfidence = true,
    language = 'en'
  } = options;
  
  // Obtenir l'analyse de base
  const baseAnalysis = analyzeEmotionalContent(content, options);
  
  // Préparer le résultat
  const result = {
    dominant: baseAnalysis.dominant,
    emotions: { ...baseAnalysis.emotions },
    intensity: getIntensityLabel(baseAnalysis.intensity)
  };
  
  // Ajouter le score de confiance si demandé
  if (includeConfidence) {
    // Calculer un score de confiance basé sur la différence entre les deux émotions les plus fortes
    const scores = Object.values(baseAnalysis.emotions).sort((a, b) => b - a);
    const difference = scores.length > 1 ? scores[0] - scores[1] : 1;
    
    // Plus la différence est grande, plus la confiance est élevée
    result.confidence = Math.min(0.5 + difference * 2, 0.95);
  }
  
  // Ajouter les niveaux d'intensité pour chaque émotion si demandé
  if (includeIntensityLevels) {
    result.intensityLevels = {};
    
    for (const [emotion, score] of Object.entries(baseAnalysis.emotions)) {
      if (score > 0.1) { // Ignorer les émotions avec un score très faible
        result.intensityLevels[emotion] = getIntensityLabel(score);
      }
    }
  }
  
  // Traduire les résultats si nécessaire
  if (language !== 'en') {
    result.dominant = translateEmotion(result.dominant, language);
    
    const translatedEmotions = {};
    for (const [emotion, score] of Object.entries(result.emotions)) {
      translatedEmotions[translateEmotion(emotion, language)] = score;
    }
    result.emotions = translatedEmotions;
    
    result.intensity = translateIntensity(result.intensity, language);
    
    if (result.intensityLevels) {
      const translatedLevels = {};
      for (const [emotion, level] of Object.entries(result.intensityLevels)) {
        translatedLevels[translateEmotion(emotion, language)] = translateIntensity(level, language);
      }
      result.intensityLevels = translatedLevels;
    }
  }
  
  return result;
}

/**
 * Génère des tags émotionnels pour un contenu
 * @param {Object|string} content - Contenu à analyser
 * @param {Object} options - Options de génération
 * @param {number} options.limit - Nombre maximum de tags à générer
 * @param {string} options.language - Langue des tags (en, fr, ko, ja)
 * @returns {string[]} - Liste de tags émotionnels
 */
export function getEmotionalTags(content, options = {}) {
  // Valeurs par défaut des options
  const {
    limit = 5,
    language = 'en',
    threshold = 0.1 // Seuil minimal pour inclure une émotion
  } = options;
  
  // Obtenir l'analyse émotionnelle
  const analysis = getEmotionAnalysis(content, { language });
  
  // Générer les tags
  const tags = [];
  
  // Ajouter l'émotion dominante avec son intensité
  const dominant = analysis.dominant;
  const dominantIntensity = analysis.intensity;
  
  if (dominant !== 'neutral') {
    tags.push(`${dominantIntensity} ${dominant}`);
  }
  
  // Ajouter d'autres émotions significatives
  for (const [emotion, score] of Object.entries(analysis.emotions)) {
    if (emotion !== dominant && score >= threshold) {
      const intensity = getIntensityLabel(score);
      
      // Ne pas ajouter "neutral" sauf s'il est dominant
      if (emotion !== 'neutral') {
        // Traduire si nécessaire
        const translatedEmotion = language === 'en' ? emotion : translateEmotion(emotion, language);
        const translatedIntensity = language === 'en' ? intensity : translateIntensity(intensity, language);
        
        tags.push(`${translatedIntensity} ${translatedEmotion}`);
      }
    }
  }
  
  // Limiter le nombre de tags
  return tags.slice(0, limit);
}

/**
 * Convertit un score d'intensité numérique en étiquette
 * @private
 */
function getIntensityLabel(score) {
  if (score < 0.3) return 'low';
  if (score < 0.6) return 'medium';
  return 'high';
}

/**
 * Traduit une émotion dans la langue spécifiée
 * @private
 */
function translateEmotion(emotion, language) {
  const translations = {
    fr: {
      joy: 'joie',
      sadness: 'tristesse',
      anger: 'colère',
      fear: 'peur',
      surprise: 'surprise',
      disgust: 'dégoût',
      love: 'amour',
      neutral: 'neutre'
    },
    ko: {
      joy: '기쁨',
      sadness: '슬픔',
      anger: '분노',
      fear: '두려움',
      surprise: '놀람',
      disgust: '혐오',
      love: '사랑',
      neutral: '중립'
    },
    ja: {
      joy: '喜び',
      sadness: '悲しみ',
      anger: '怒り',
      fear: '恐怖',
      surprise: '驚き',
      disgust: '嫌悪',
      love: '愛',
      neutral: '中立'
    }
  };
  
  return translations[language]?.[emotion] || emotion;
}

/**
 * Traduit un niveau d'intensité dans la langue spécifiée
 * @private
 */
function translateIntensity(intensity, language) {
  const translations = {
    fr: {
      low: 'faible',
      medium: 'modéré',
      high: 'intense',
      subtle: 'subtil',
      moderate: 'modéré',
      intense: 'intense'
    },
    ko: {
      low: '낮은',
      medium: '중간',
      high: '높은',
      subtle: '미묘한',
      moderate: '적당한',
      intense: '강렬한'
    },
    ja: {
      low: '低い',
      medium: '中程度',
      high: '高い',
      subtle: '微妙な',
      moderate: '適度な',
      intense: '強烈な'
    }
  };
  
  return translations[language]?.[intensity] || intensity;
}

// Exporter toutes les fonctions
export default {
  analyzeEmotionalContent,
  getEmotionAnalysis,
  getEmotionalTags
};
