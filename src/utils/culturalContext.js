/**
 * Service de contexte culturel pour FloDrama
 * Fournit des informations culturelles pertinentes pour enrichir l'expérience de visionnage
 */

import { getTranslation } from './translationService';

// Base de données locale de contextes culturels
const culturalDatabase = {
  // Contextes culturels coréens
  'korea': {
    honorifics: [
      { term: 'oppa', description: "Terme utilisé par les femmes pour s'adresser à un homme plus âgé avec qui elles ont une relation proche (frère, ami, petit ami)", importance: 'high' },
      { term: 'unnie', description: "Terme utilisé par les femmes pour s'adresser à une femme plus âgée avec qui elles ont une relation proche", importance: 'high' },
      { term: 'hyung', description: "Terme utilisé par les hommes pour s'adresser à un homme plus âgé avec qui ils ont une relation proche", importance: 'high' },
      { term: 'noona', description: "Terme utilisé par les hommes pour s'adresser à une femme plus âgée avec qui ils ont une relation proche", importance: 'high' },
      { term: 'sunbae', description: "Terme utilisé pour s'adresser à quelqu'un de plus expérimenté ou senior dans un contexte académique ou professionnel", importance: 'high' },
      { term: 'hoobae', description: "Terme utilisé pour s'adresser à quelqu'un de moins expérimenté ou junior dans un contexte académique ou professionnel", importance: 'medium' }
    ],
    customs: [
      { name: 'Chuseok', description: "Fête des récoltes coréenne, l'une des plus importantes fêtes traditionnelles où les familles se réunissent", importance: 'high' },
      { name: 'Seollal', description: "Nouvel an lunaire coréen, célébration familiale importante avec des plats traditionnels et des rituels", importance: 'high' },
      { name: 'Jesa', description: "Cérémonie rituelle en l'honneur des ancêtres", importance: 'medium' },
      { name: 'Bowing', description: "S'incliner est une marque de respect importante dans la culture coréenne, avec différents degrés selon le contexte", importance: 'high' }
    ],
    food: [
      { name: 'Kimchi', description: "Plat traditionnel coréen à base de légumes fermentés, généralement du chou chinois avec des épices", importance: 'high' },
      { name: 'Bibimbap', description: "Bol de riz garni de légumes, viande, œuf et gochujang (pâte de piment)", importance: 'medium' },
      { name: 'Soju', description: "Alcool traditionnel coréen, souvent consommé lors de repas entre amis ou collègues", importance: 'medium' },
      { name: 'Banchan', description: "Petits plats d'accompagnement servis avec le plat principal dans un repas coréen", importance: 'medium' }
    ],
    social: [
      { name: 'Nunchi', description: "Concept coréen désignant la capacité à lire les situations sociales et à agir en conséquence", importance: 'high' },
      { name: 'Jeong', description: "Sentiment d'attachement émotionnel, d'affection et de solidarité entre personnes", importance: 'high' },
      { name: 'Kibun', description: "Concept lié à l'humeur, la dignité et le respect de soi et des autres", importance: 'medium' },
      { name: 'Age hierarchy', description: "Hiérarchie sociale basée sur l'âge, très importante dans les interactions sociales", importance: 'high' }
    ]
  },
  
  // Contextes culturels japonais
  'japan': {
    honorifics: [
      { term: 'san', description: "Suffixe de politesse général, équivalent à Monsieur/Madame", importance: 'high' },
      { term: 'kun', description: "Suffixe utilisé généralement pour les garçons ou hommes plus jeunes ou de statut inférieur", importance: 'medium' },
      { term: 'chan', description: "Suffixe affectueux utilisé pour les enfants, les jeunes femmes ou entre amis proches", importance: 'medium' },
      { term: 'sama', description: "Suffixe très respectueux utilisé pour les personnes de haut rang ou les clients", importance: 'medium' },
      { term: 'senpai', description: "Terme désignant un aîné ou quelqu'un de plus expérimenté dans un contexte académique ou professionnel", importance: 'high' },
      { term: 'sensei', description: "Terme respectueux pour désigner un enseignant, un médecin ou un maître dans un domaine", importance: 'high' }
    ],
    customs: [
      { name: 'Hanami', description: "Tradition d'observation des fleurs de cerisier au printemps", importance: 'medium' },
      { name: 'Obon', description: "Festival bouddhiste honorant les esprits des ancêtres", importance: 'medium' },
      { name: 'Omiyage', description: "Tradition d'offrir des souvenirs (généralement alimentaires) après un voyage", importance: 'medium' },
      { name: 'Ofuro', description: "Bain traditionnel japonais, rituel important de la vie quotidienne", importance: 'medium' }
    ],
    food: [
      { name: 'Sushi', description: "Plat à base de riz vinaigré accompagné de poisson cru, fruits de mer, légumes ou œufs", importance: 'high' },
      { name: 'Ramen', description: "Soupe de nouilles servie dans un bouillon avec diverses garnitures", importance: 'medium' },
      { name: 'Sake', description: "Boisson alcoolisée traditionnelle japonaise à base de riz fermenté", importance: 'medium' },
      { name: 'Bento', description: "Boîte-repas compartimentée contenant un repas équilibré", importance: 'medium' }
    ],
    social: [
      { name: 'Honne/Tatemae', description: "Distinction entre les véritables sentiments (honne) et le comportement public (tatemae)", importance: 'high' },
      { name: 'Wa', description: "Concept d'harmonie sociale et d'évitement des conflits", importance: 'high' },
      { name: 'Uchi/Soto', description: "Distinction entre le cercle intime (uchi) et l'extérieur (soto)", importance: 'medium' },
      { name: 'Amae', description: "Dépendance affective considérée comme positive dans les relations", importance: 'medium' }
    ]
  },
  
  // Contextes culturels chinois
  'china': {
    honorifics: [
      { term: 'Lǎoshī', description: "Terme respectueux pour désigner un enseignant", importance: 'high' },
      { term: 'Xiānsheng', description: "Terme respectueux équivalent à Monsieur", importance: 'medium' },
      { term: 'Tàitai', description: "Terme respectueux pour désigner une femme mariée", importance: 'medium' },
      { term: 'Lǎo', description: "Préfixe respectueux utilisé pour les personnes âgées ou expérimentées", importance: 'medium' }
    ],
    customs: [
      { name: 'Spring Festival', description: "Nouvel an chinois, la plus importante fête traditionnelle chinoise", importance: 'high' },
      { name: 'Mid-Autumn Festival', description: "Fête de la mi-automne célébrant la récolte et la pleine lune", importance: 'medium' },
      { name: 'Qingming Festival', description: "Jour des morts chinois, pour honorer les ancêtres", importance: 'medium' },
      { name: 'Red envelopes', description: "Enveloppes rouges contenant de l'argent, offertes lors d'occasions spéciales", importance: 'medium' }
    ],
    food: [
      { name: 'Dumplings', description: "Raviolis chinois, souvent associés aux célébrations du Nouvel An", importance: 'medium' },
      { name: 'Hot Pot', description: "Plat convivial où les convives cuisent eux-mêmes leurs aliments dans un bouillon chaud", importance: 'medium' },
      { name: 'Baijiu', description: "Alcool de grain traditionnel chinois à forte teneur en alcool", importance: 'low' },
      { name: 'Tea ceremony', description: "Rituel traditionnel de préparation et de dégustation du thé", importance: 'medium' }
    ],
    social: [
      { name: 'Face', description: "Concept de réputation sociale et de dignité, très important dans les interactions", importance: 'high' },
      { name: 'Guanxi', description: "Réseau de relations et de connexions personnelles", importance: 'high' },
      { name: 'Filial piety', description: "Respect et obéissance envers les parents et les aînés", importance: 'high' },
      { name: 'Collectivism', description: "Valorisation du groupe au-dessus de l'individu", importance: 'medium' }
    ]
  }
};

// Correspondance entre régions et pays
const regionMapping = {
  'asia': ['korea', 'japan', 'china', 'taiwan', 'thailand', 'vietnam'],
  'east_asia': ['korea', 'japan', 'china', 'taiwan'],
  'southeast_asia': ['thailand', 'vietnam', 'philippines', 'indonesia', 'malaysia'],
  'korea': ['korea'],
  'japan': ['japan'],
  'china': ['china', 'taiwan'],
};

/**
 * Récupère le contexte culturel pertinent pour un contenu donné
 * @param {Object} content - Objet contenant les informations sur le contenu (titre, origine, etc.)
 * @param {string} region - Région culturelle (asia, korea, japan, china, etc.)
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.translate - Traduire les descriptions (false par défaut)
 * @param {string} options.language - Langue cible pour la traduction (fr par défaut)
 * @param {boolean} options.includeAll - Inclure tous les éléments culturels (false par défaut)
 * @param {number} options.relevanceThreshold - Seuil de pertinence (0.5 par défaut)
 * @returns {Promise<Object>} - Contexte culturel pour le contenu
 */
export async function getCulturalContext(content, region = 'asia', options = {}) {
  // Valeurs par défaut des options
  const {
    translate = false,
    language = 'fr',
    includeAll = false,
    relevanceThreshold = 0.5
  } = options;

  // Déterminer les pays à inclure en fonction de la région
  const countries = regionMapping[region.toLowerCase()] || regionMapping['asia'];
  
  // Analyser le contenu pour déterminer l'origine si non spécifiée
  const contentOrigin = content.origin || detectOrigin(content);
  
  // Récupérer les éléments culturels pertinents
  let culturalElements = [];
  
  // Priorité aux éléments culturels du pays d'origine du contenu
  if (contentOrigin && culturalDatabase[contentOrigin]) {
    culturalElements = extractCulturalElements(culturalDatabase[contentOrigin], content);
  }
  
  // Ajouter des éléments d'autres pays de la région si nécessaire
  if (includeAll || culturalElements.length < 3) {
    for (const country of countries) {
      if (country !== contentOrigin && culturalDatabase[country]) {
        const additionalElements = extractCulturalElements(culturalDatabase[country], content);
        culturalElements = [...culturalElements, ...additionalElements];
      }
    }
  }
  
  // Filtrer par pertinence
  culturalElements = culturalElements
    .filter(element => element.relevance >= relevanceThreshold)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10); // Limiter à 10 éléments maximum
  
  // Traduire les descriptions si demandé
  if (translate && culturalElements.length > 0) {
    const descriptions = culturalElements.map(element => element.description);
    const translations = await Promise.all(
      descriptions.map(desc => getTranslation(desc, language))
    );
    
    culturalElements = culturalElements.map((element, index) => ({
      ...element,
      description: translations[index].translated
    }));
  }
  
  return {
    region,
    origin: contentOrigin,
    culturalElements,
    relevance: calculateOverallRelevance(culturalElements),
    timestamp: new Date().toISOString()
  };
}

/**
 * Détecte l'origine probable d'un contenu en fonction de ses métadonnées
 * @private
 */
function detectOrigin(content) {
  // Vérifier si l'origine est explicitement mentionnée
  if (content.country) {
    const country = content.country.toLowerCase();
    if (country.includes('korea') || country.includes('corée')) return 'korea';
    if (country.includes('japan') || country.includes('japon')) return 'japan';
    if (country.includes('china') || country.includes('chine')) return 'china';
  }
  
  // Analyser le titre et les tags
  const textToAnalyze = [
    content.title,
    content.originalTitle,
    ...(content.tags || []),
    ...(content.genres || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Mots-clés associés à chaque pays
  const keywords = {
    'korea': ['k-drama', 'korean', 'korea', 'seoul', 'busan', 'hangul', 'hangeul', 'hallyu'],
    'japan': ['j-drama', 'japanese', 'japan', 'tokyo', 'osaka', 'anime', 'manga', 'jdrama'],
    'china': ['c-drama', 'chinese', 'china', 'beijing', 'shanghai', 'mandarin', 'cdrama']
  };
  
  // Compter les occurrences de mots-clés
  const counts = {};
  for (const [country, words] of Object.entries(keywords)) {
    counts[country] = words.filter(word => textToAnalyze.includes(word)).length;
  }
  
  // Déterminer le pays avec le plus de correspondances
  const entries = Object.entries(counts);
  if (entries.length === 0) return 'asia';
  
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : 'asia';
}

/**
 * Extrait les éléments culturels pertinents pour un contenu donné
 * @private
 */
function extractCulturalElements(countryData, content) {
  const elements = [];
  const contentText = [
    content.title,
    content.originalTitle,
    content.description,
    content.synopsis,
    ...(content.tags || []),
    ...(content.genres || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Parcourir toutes les catégories (honorifics, customs, food, social)
  for (const [category, items] of Object.entries(countryData)) {
    for (const item of items) {
      // Calculer la pertinence en fonction de la présence dans le contenu
      // et de l'importance intrinsèque de l'élément
      const mentionedInContent = contentText.includes(item.name.toLowerCase()) || 
                                contentText.includes(item.term?.toLowerCase());
      
      const importanceScore = 
        item.importance === 'high' ? 0.9 :
        item.importance === 'medium' ? 0.6 : 0.3;
      
      const relevance = mentionedInContent ? 
        Math.min(1, importanceScore + 0.3) : // Bonus si mentionné
        calculateRelevanceByGenre(category, content.genres, importanceScore);
      
      if (relevance > 0) {
        elements.push({
          type: category,
          name: item.term || item.name,
          description: item.description,
          importance: item.importance,
          relevance
        });
      }
    }
  }
  
  return elements;
}

/**
 * Calcule la pertinence d'un élément culturel en fonction du genre du contenu
 * @private
 */
function calculateRelevanceByGenre(category, genres = [], baseScore) {
  if (!genres || genres.length === 0) return baseScore;
  
  const genresLower = genres.map(g => g.toLowerCase());
  
  // Correspondance entre catégories et genres
  const categoryGenreMapping = {
    'honorifics': ['drama', 'romance', 'family', 'historical', 'slice of life'],
    'customs': ['historical', 'drama', 'family', 'slice of life', 'documentary'],
    'food': ['slice of life', 'comedy', 'reality', 'documentary'],
    'social': ['drama', 'romance', 'thriller', 'crime', 'slice of life']
  };
  
  const relevantGenres = categoryGenreMapping[category] || [];
  const genreMatches = genresLower.filter(g => relevantGenres.some(rg => g.includes(rg))).length;
  
  // Bonus de pertinence basé sur le nombre de genres correspondants
  const genreBonus = genreMatches * 0.15;
  
  return Math.min(1, baseScore + genreBonus);
}

/**
 * Calcule la pertinence globale du contexte culturel
 * @private
 */
function calculateOverallRelevance(elements) {
  if (elements.length === 0) return 0;
  
  // Moyenne pondérée des pertinences individuelles
  const totalWeight = elements.reduce((sum, el) => {
    const weight = el.importance === 'high' ? 3 : 
                  el.importance === 'medium' ? 2 : 1;
    return sum + weight;
  }, 0);
  
  const weightedSum = elements.reduce((sum, el) => {
    const weight = el.importance === 'high' ? 3 : 
                  el.importance === 'medium' ? 2 : 1;
    return sum + (el.relevance * weight);
  }, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Récupère les préférences régionales pour l'affichage du contenu
 * @returns {Object} - Préférences par région
 */
export function getRegionalPreferences() {
  return {
    'asia': { 
      subtitles: true, 
      dubbing: false, 
      culturalNotes: true,
      honorifics: 'original',
      foodNames: 'original',
      locationNames: 'original'
    },
    'korea': { 
      subtitles: true, 
      dubbing: false, 
      culturalNotes: true,
      honorifics: 'original',
      foodNames: 'original',
      locationNames: 'original'
    },
    'japan': { 
      subtitles: true, 
      dubbing: false, 
      culturalNotes: true,
      honorifics: 'original',
      foodNames: 'original',
      locationNames: 'original'
    },
    'china': { 
      subtitles: true, 
      dubbing: false, 
      culturalNotes: true,
      honorifics: 'original',
      foodNames: 'original',
      locationNames: 'original'
    },
    'europe': { 
      subtitles: true, 
      dubbing: true, 
      culturalNotes: true,
      honorifics: 'translated',
      foodNames: 'both',
      locationNames: 'both'
    },
    'north_america': { 
      subtitles: false, 
      dubbing: true, 
      culturalNotes: false,
      honorifics: 'translated',
      foodNames: 'translated',
      locationNames: 'translated'
    }
  };
}

/**
 * Récupère les notes culturelles pour un moment spécifique dans un contenu
 * @param {Object} content - Informations sur le contenu
 * @param {number} timestamp - Timestamp en secondes
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Notes culturelles pour ce moment
 */
export async function getCulturalNotesAtTimestamp(content, timestamp, options = {}) {
  // Simuler des notes culturelles à des moments spécifiques
  // Dans une implémentation réelle, ces données viendraient d'une base de données
  const mockTimestampedNotes = [
    { start: 120, end: 140, note: "Cette cérémonie du thé est typique de la culture japonaise traditionnelle." },
    { start: 350, end: 380, note: "L'utilisation de 'sunbae' montre la hiérarchie basée sur l'ancienneté dans les universités coréennes." },
    { start: 890, end: 920, note: "Ce plat est du kimchi, un accompagnement fermenté essentiel dans la cuisine coréenne." },
    { start: 1200, end: 1230, note: "Ce geste d'inclinaison (bow) montre le respect dans la culture est-asiatique." }
  ];
  
  // Trouver les notes pertinentes pour ce timestamp
  const relevantNotes = mockTimestampedNotes.filter(
    note => timestamp >= note.start && timestamp <= note.end
  );
  
  if (relevantNotes.length === 0) {
    return { hasNotes: false };
  }
  
  // Traduire les notes si nécessaire
  if (options.translate) {
    const translations = await Promise.all(
      relevantNotes.map(note => getTranslation(note.note, options.language || 'fr'))
    );
    
    relevantNotes.forEach((note, index) => {
      note.note = translations[index].translated;
    });
  }
  
  return {
    hasNotes: true,
    notes: relevantNotes.map(note => note.note),
    timestamp
  };
}

// Exporter toutes les fonctions
export default {
  getCulturalContext,
  getRegionalPreferences,
  getCulturalNotesAtTimestamp
};
