/**
 * ContentCategorizer
 * 
 * Service de catégorisation intelligente des contenus pour alimenter
 * les cartes et widgets appropriés dans l'application.
 * 
 * Ce service analyse les métadonnées des contenus scrapés pour les classer
 * selon différentes taxonomies (genres, origines, types, etc.) et génère
 * des collections thématiques pour les widgets.
 */

class ContentCategorizer {
  constructor() {
    // Configuration des taxonomies
    this.taxonomies = {
      // Types principaux de contenu
      contentTypes: [
        { id: 'drama', name: 'Dramas', priority: 1 },
        { id: 'movie', name: 'Films', priority: 2 },
        { id: 'anime', name: 'Animés', priority: 3 },
        { id: 'kshow', name: 'K-Shows', priority: 4 },
        { id: 'documentary', name: 'Documentaires', priority: 5 }
      ],
      
      // Origines géographiques
      origins: [
        { id: 'kr', name: 'Corée du Sud', aliases: ['korean', 'korea', 'corée', 'kdrama'] },
        { id: 'jp', name: 'Japon', aliases: ['japanese', 'japan', 'japon', 'jdrama'] },
        { id: 'cn', name: 'Chine', aliases: ['chinese', 'china', 'chine', 'cdrama'] },
        { id: 'th', name: 'Thaïlande', aliases: ['thai', 'thailand', 'thailande', 'tdrama'] },
        { id: 'tw', name: 'Taïwan', aliases: ['taiwanese', 'taiwan'] },
        { id: 'ph', name: 'Philippines', aliases: ['filipino', 'philippines', 'pdrama'] },
        { id: 'vn', name: 'Vietnam', aliases: ['vietnamese', 'vietnam'] },
        { id: 'in', name: 'Inde', aliases: ['indian', 'india', 'inde', 'bollywood'] },
        { id: 'id', name: 'Indonésie', aliases: ['indonesian', 'indonesia', 'indonesie'] },
        { id: 'my', name: 'Malaisie', aliases: ['malaysian', 'malaysia', 'malaisie'] },
        { id: 'other', name: 'Autres pays', aliases: [] }
      ],
      
      // Genres principaux
      genres: [
        { id: 'romance', name: 'Romance', aliases: ['romantic', 'love story'], priority: 1 },
        { id: 'comedy', name: 'Comédie', aliases: ['funny', 'humor', 'humour'], priority: 2 },
        { id: 'action', name: 'Action', aliases: ['fight', 'combat'], priority: 3 },
        { id: 'thriller', name: 'Thriller', aliases: ['suspense'], priority: 4 },
        { id: 'drama', name: 'Drame', aliases: ['dramatic', 'melodrama'], priority: 5 },
        { id: 'fantasy', name: 'Fantaisie', aliases: ['fantastic', 'fantastique'], priority: 6 },
        { id: 'historical', name: 'Historique', aliases: ['history', 'period', 'costume'], priority: 7 },
        { id: 'mystery', name: 'Mystère', aliases: ['mystery', 'enigma', 'énigme'], priority: 8 },
        { id: 'horror', name: 'Horreur', aliases: ['scary', 'fear', 'peur'], priority: 9 },
        { id: 'scifi', name: 'Science-Fiction', aliases: ['sci-fi', 'sf'], priority: 10 },
        { id: 'adventure', name: 'Aventure', aliases: ['adventure', 'quest'], priority: 11 },
        { id: 'crime', name: 'Crime', aliases: ['criminal', 'police', 'detective'], priority: 12 },
        { id: 'medical', name: 'Médical', aliases: ['hospital', 'doctor', 'medicine'], priority: 13 },
        { id: 'legal', name: 'Juridique', aliases: ['law', 'lawyer', 'court'], priority: 14 },
        { id: 'school', name: 'École', aliases: ['school', 'college', 'university', 'campus'], priority: 15 },
        { id: 'supernatural', name: 'Surnaturel', aliases: ['ghost', 'spirit', 'paranormal'], priority: 16 },
        { id: 'sports', name: 'Sports', aliases: ['sport', 'athletic', 'competition'], priority: 17 },
        { id: 'music', name: 'Musical', aliases: ['music', 'band', 'idol', 'singer'], priority: 18 },
        { id: 'family', name: 'Famille', aliases: ['family', 'familial'], priority: 19 },
        { id: 'food', name: 'Cuisine', aliases: ['cooking', 'food', 'chef', 'gastronomy'], priority: 20 },
        { id: 'business', name: 'Business', aliases: ['office', 'corporate', 'company'], priority: 21 },
        { id: 'psychological', name: 'Psychologique', aliases: ['mental', 'mind'], priority: 22 },
        { id: 'martial-arts', name: 'Arts Martiaux', aliases: ['kung fu', 'karate', 'martial'], priority: 23 },
        { id: 'war', name: 'Guerre', aliases: ['military', 'army', 'battle'], priority: 24 },
        { id: 'slice-of-life', name: 'Tranche de vie', aliases: ['daily life', 'quotidien'], priority: 25 }
      ],
      
      // Thèmes spécifiques
      themes: [
        { id: 'time-travel', name: 'Voyage dans le temps', keywords: ['time travel', 'time slip', 'voyage temporel'] },
        { id: 'reincarnation', name: 'Réincarnation', keywords: ['reincarnation', 'rebirth', 'past life'] },
        { id: 'revenge', name: 'Vengeance', keywords: ['revenge', 'avenge', 'vendetta'] },
        { id: 'coming-of-age', name: 'Passage à l\'âge adulte', keywords: ['coming of age', 'growing up'] },
        { id: 'forbidden-love', name: 'Amour interdit', keywords: ['forbidden love', 'forbidden romance'] },
        { id: 'rich-poor', name: 'Riche et pauvre', keywords: ['rich', 'poor', 'wealth gap', 'chaebol'] },
        { id: 'workplace', name: 'Milieu professionnel', keywords: ['workplace', 'office', 'job', 'career'] },
        { id: 'friendship', name: 'Amitié', keywords: ['friendship', 'friends', 'bromance', 'sismance'] },
        { id: 'supernatural-powers', name: 'Pouvoirs surnaturels', keywords: ['power', 'ability', 'supernatural'] },
        { id: 'politics', name: 'Politique', keywords: ['politics', 'government', 'election', 'corruption'] },
        { id: 'royalty', name: 'Royauté', keywords: ['royal', 'king', 'queen', 'prince', 'princess', 'palace'] }
      ]
    };
    
    // Collections thématiques prédéfinies pour les widgets
    this.collections = [
      { id: 'korean-romance', name: 'Romances Coréennes', filters: { origin: 'kr', genre: 'romance' } },
      { id: 'chinese-historical', name: 'Historiques Chinois', filters: { origin: 'cn', genre: 'historical' } },
      { id: 'japanese-anime', name: 'Animés Japonais', filters: { origin: 'jp', type: 'anime' } },
      { id: 'thai-bl', name: 'BL Thaïlandais', filters: { origin: 'th', keywords: ['boys love', 'bl'] } },
      { id: 'korean-thriller', name: 'Thrillers Coréens', filters: { origin: 'kr', genre: 'thriller' } },
      { id: 'bollywood', name: 'Bollywood', filters: { origin: 'in' } },
      { id: 'medical-dramas', name: 'Dramas Médicaux', filters: { genre: 'medical' } },
      { id: 'school-romance', name: 'Romances Scolaires', filters: { genre: ['school', 'romance'] } },
      { id: 'action-movies', name: 'Films d\'Action', filters: { type: 'movie', genre: 'action' } },
      { id: 'fantasy-dramas', name: 'Dramas Fantastiques', filters: { type: 'drama', genre: 'fantasy' } },
      { id: 'time-travel', name: 'Voyage dans le Temps', filters: { theme: 'time-travel' } },
      { id: 'revenge-stories', name: 'Histoires de Vengeance', filters: { theme: 'revenge' } },
      { id: 'office-romance', name: 'Romances de Bureau', filters: { theme: 'workplace', genre: 'romance' } },
      // Nouvelles collections pour Bollywood et animés
      { id: 'bollywood-romance', name: 'Romances Bollywood', filters: { origin: 'in', genre: 'romance' } },
      { id: 'bollywood-action', name: 'Action Bollywood', filters: { origin: 'in', genre: 'action' } },
      { id: 'bollywood-musical', name: 'Comédies Musicales Indiennes', filters: { origin: 'in', genre: 'music' } },
      { id: 'anime-shonen', name: 'Anime Shōnen', filters: { type: 'anime', keywords: ['shonen', 'shounen'] } },
      { id: 'anime-seinen', name: 'Anime Seinen', filters: { type: 'anime', keywords: ['seinen'] } },
      { id: 'anime-shojo', name: 'Anime Shōjo', filters: { type: 'anime', keywords: ['shojo', 'shoujo'] } },
      { id: 'anime-isekai', name: 'Anime Isekai', filters: { type: 'anime', keywords: ['isekai', 'autre monde'] } },
      { id: 'anime-mecha', name: 'Anime Mecha', filters: { type: 'anime', keywords: ['mecha', 'robot'] } }
    ];
    
    // Statistiques de catégorisation
    this.stats = {
      categorizedItems: 0,
      matchedCollections: 0,
      unmatchedItems: 0
    };
  }
  
  /**
   * Catégorise une liste de contenus
   * @param {Array} contents - Liste de contenus à catégoriser
   * @returns {Array} Contenus catégorisés
   */
  categorize(contents) {
    if (!Array.isArray(contents)) return [];
    
    return this.categorizeContentList(contents);
  }
  
  /**
   * Catégorise un contenu en fonction de ses métadonnées
   * @param {Object} content - Contenu à catégoriser
   * @returns {Object} Contenu enrichi avec des catégories
   */
  categorizeContent(content) {
    if (!content) return null;
    
    // Initialiser les catégories si elles n'existent pas
    content.categories = content.categories || {
      type: content.type || 'drama',
      origin: null,
      genres: Array.isArray(content.genres) ? [...content.genres] : [],
      themes: [],
      collections: []
    };
    
    // Déterminer l'origine
    if (!content.categories.origin) {
      content.categories.origin = this._detectOrigin(content);
    }
    
    // Enrichir les genres
    this._enrichGenres(content);
    
    // Détecter les thèmes
    this._detectThemes(content);
    
    // Associer aux collections
    this._assignToCollections(content);
    
    // Mettre à jour les statistiques
    this.stats.categorizedItems++;
    
    return content;
  }
  
  /**
   * Catégorise une liste de contenus
   * @param {Array} contents - Liste de contenus à catégoriser
   * @returns {Array} Contenus catégorisés
   */
  categorizeContentList(contents) {
    if (!Array.isArray(contents)) return [];
    
    return contents.map(content => this.categorizeContent(content));
  }
  
  /**
   * Génère des collections thématiques à partir d'une liste de contenus
   * @param {Array} contents - Liste de contenus catégorisés
   * @returns {Object} Collections thématiques
   */
  generateCollections(contents) {
    if (!Array.isArray(contents) || contents.length === 0) {
      return {};
    }
    
    const collections = {};
    
    // Parcourir les collections prédéfinies
    for (const collection of this.collections) {
      // Filtrer les contenus qui correspondent aux critères de la collection
      const matchingContents = contents.filter(content => 
        this._matchesCollectionFilters(content, collection.filters)
      );
      
      if (matchingContents.length > 0) {
        collections[collection.id] = {
          id: collection.id,
          name: collection.name,
          contents: matchingContents,
          count: matchingContents.length
        };
      }
    }
    
    // Générer des collections par origine
    this.taxonomies.origins.forEach(origin => {
      const originContents = contents.filter(content => 
        content.categories && content.categories.origin === origin.id
      );
      
      if (originContents.length > 0) {
        collections[`origin-${origin.id}`] = {
          id: `origin-${origin.id}`,
          name: origin.name,
          contents: originContents,
          count: originContents.length
        };
      }
    });
    
    // Générer des collections par genre principal
    this.taxonomies.genres.slice(0, 10).forEach(genre => {
      const genreContents = contents.filter(content => 
        content.categories && 
        content.categories.genres && 
        content.categories.genres.includes(genre.id)
      );
      
      if (genreContents.length > 0) {
        collections[`genre-${genre.id}`] = {
          id: `genre-${genre.id}`,
          name: genre.name,
          contents: genreContents,
          count: genreContents.length
        };
      }
    });
    
    return collections;
  }
  
  /**
   * Génère des widgets à partir des collections
   * @param {Object} collections - Collections thématiques
   * @param {Number} minItems - Nombre minimum d'éléments par widget
   * @returns {Array} Widgets configurés
   */
  generateWidgets(collections, minItems = 5) {
    const widgets = [];
    
    // Convertir les collections en widgets
    Object.values(collections).forEach(collection => {
      if (collection.contents.length >= minItems) {
        widgets.push({
          id: `widget-${collection.id}`,
          type: 'carousel',
          title: collection.name,
          subtitle: `${collection.count} contenus`,
          items: collection.contents.slice(0, 20), // Limiter à 20 éléments par widget
          viewAllLink: `/browse/${collection.id}`
        });
      }
    });
    
    // Trier les widgets par nombre d'éléments (décroissant)
    widgets.sort((a, b) => b.items.length - a.items.length);
    
    return widgets;
  }
  
  /**
   * Détecte l'origine d'un contenu
   * @param {Object} content - Contenu à analyser
   * @returns {String} Code de l'origine
   * @private
   */
  _detectOrigin(content) {
    // Si le pays est déjà spécifié, trouver l'origine correspondante
    if (content.country) {
      const normalizedCountry = content.country.toLowerCase();
      
      for (const origin of this.taxonomies.origins) {
        if (origin.name.toLowerCase() === normalizedCountry || 
            origin.aliases.some(alias => normalizedCountry.includes(alias))) {
          return origin.id;
        }
      }
    }
    
    // Détecter à partir de la source
    if (content.source && typeof content.source === 'object') {
      const sourceName = content.source.name?.toLowerCase() || '';
      
      if (sourceName.includes('bollywood') || sourceName.includes('india')) {
        return 'in';
      }
      
      if (sourceName.includes('neko sama') || sourceName.includes('anime sama') || 
          sourceName.includes('gogoanime') || sourceName.includes('voiranime')) {
        // Pour les sources d'animés, vérifier d'abord si c'est un animé japonais ou chinois
        const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
        
        if (textToAnalyze.includes('donghua') || textToAnalyze.includes('chinese animation')) {
          return 'cn';
        }
        
        if (textToAnalyze.includes('korean animation') || textToAnalyze.includes('aeni')) {
          return 'kr';
        }
        
        // Par défaut, les animés sont considérés comme japonais
        return 'jp';
      }
    }
    
    // Détecter à partir du type
    if (content.type === 'kshow') return 'kr';
    if (content.type === 'anime') {
      // Vérifier si c'est un animé chinois ou coréen
      const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
      
      if (textToAnalyze.includes('donghua') || textToAnalyze.includes('chinese animation')) {
        return 'cn';
      }
      
      if (textToAnalyze.includes('korean animation') || textToAnalyze.includes('aeni')) {
        return 'kr';
      }
      
      // Par défaut, les animés sont considérés comme japonais
      return 'jp';
    }
    
    // Détecter à partir du titre et de la description
    const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
    
    for (const origin of this.taxonomies.origins) {
      if (origin.aliases.some(alias => textToAnalyze.includes(alias))) {
        return origin.id;
      }
    }
    
    // Détecter à partir des genres
    if (Array.isArray(content.genres)) {
      const genresText = content.genres.join(' ').toLowerCase();
      
      if (genresText.includes('korean')) return 'kr';
      if (genresText.includes('japanese')) return 'jp';
      if (genresText.includes('chinese')) return 'cn';
      if (genresText.includes('thai')) return 'th';
      if (genresText.includes('indian') || genresText.includes('bollywood')) return 'in';
    }
    
    // Par défaut
    return 'other';
  }
  
  /**
   * Enrichit les genres d'un contenu
   * @param {Object} content - Contenu à enrichir
   * @private
   */
  _enrichGenres(content) {
    if (!content.categories) return;
    
    // Normaliser les genres existants
    const normalizedGenres = new Set();
    
    if (Array.isArray(content.genres)) {
      content.genres.forEach(genre => {
        const normalizedGenre = genre.toLowerCase();
        
        // Trouver le genre correspondant dans la taxonomie
        for (const taxonomyGenre of this.taxonomies.genres) {
          if (taxonomyGenre.name.toLowerCase() === normalizedGenre || 
              taxonomyGenre.aliases.some(alias => normalizedGenre.includes(alias))) {
            normalizedGenres.add(taxonomyGenre.id);
            break;
          }
        }
      });
    }
    
    // Détecter des genres supplémentaires à partir du titre et de la description
    const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
    
    // Détection spécifique pour les animés
    if (content.type === 'anime') {
      if (textToAnalyze.includes('shonen') || textToAnalyze.includes('shounen')) {
        normalizedGenres.add('action');
        normalizedGenres.add('adventure');
      }
      
      if (textToAnalyze.includes('shojo') || textToAnalyze.includes('shoujo')) {
        normalizedGenres.add('romance');
        normalizedGenres.add('drama');
      }
      
      if (textToAnalyze.includes('seinen')) {
        normalizedGenres.add('psychological');
      }
      
      if (textToAnalyze.includes('isekai')) {
        normalizedGenres.add('fantasy');
        normalizedGenres.add('adventure');
      }
      
      if (textToAnalyze.includes('mecha')) {
        normalizedGenres.add('scifi');
      }
      
      if (textToAnalyze.includes('slice of life') || textToAnalyze.includes('tranche de vie')) {
        normalizedGenres.add('slice-of-life');
      }
    }
    
    // Détection spécifique pour Bollywood
    if (content.categories.origin === 'in') {
      if (textToAnalyze.includes('dance') || textToAnalyze.includes('song') || 
          textToAnalyze.includes('musical') || textToAnalyze.includes('music')) {
        normalizedGenres.add('music');
      }
      
      if (textToAnalyze.includes('masala')) {
        normalizedGenres.add('action');
        normalizedGenres.add('comedy');
        normalizedGenres.add('romance');
      }
    }
    
    // Détection générale pour tous les contenus
    for (const genre of this.taxonomies.genres) {
      // Vérifier si le genre est déjà détecté
      if (normalizedGenres.has(genre.id)) continue;
      
      // Vérifier si le nom du genre ou ses alias sont présents dans le texte
      if (textToAnalyze.includes(genre.name.toLowerCase()) || 
          genre.aliases.some(alias => textToAnalyze.includes(alias))) {
        normalizedGenres.add(genre.id);
      }
    }
    
    // Mettre à jour les genres
    content.categories.genres = Array.from(normalizedGenres);
  }
  
  /**
   * Détecte les thèmes d'un contenu
   * @param {Object} content - Contenu à analyser
   * @private
   */
  _detectThemes(content) {
    if (!content.categories) return;
    
    const themes = new Set();
    const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
    
    for (const theme of this.taxonomies.themes) {
      if (theme.keywords.some(keyword => textToAnalyze.includes(keyword))) {
        themes.add(theme.id);
      }
    }
    
    content.categories.themes = Array.from(themes);
  }
  
  /**
   * Associe un contenu aux collections appropriées
   * @param {Object} content - Contenu à associer
   * @private
   */
  _assignToCollections(content) {
    if (!content.categories) return;
    
    const matchingCollections = [];
    
    for (const collection of this.collections) {
      if (this._matchesCollectionFilters(content, collection.filters)) {
        matchingCollections.push(collection.id);
      }
    }
    
    content.categories.collections = matchingCollections;
    
    // Mettre à jour les statistiques
    if (matchingCollections.length > 0) {
      this.stats.matchedCollections += matchingCollections.length;
    } else {
      this.stats.unmatchedItems++;
    }
  }
  
  /**
   * Vérifie si un contenu correspond aux filtres d'une collection
   * @param {Object} content - Contenu à vérifier
   * @param {Object} filters - Filtres de la collection
   * @returns {Boolean} True si le contenu correspond aux filtres
   * @private
   */
  _matchesCollectionFilters(content, filters) {
    if (!content.categories) return false;
    
    // Vérifier le type
    if (filters.type && content.categories.type !== filters.type) {
      return false;
    }
    
    // Vérifier l'origine
    if (filters.origin && content.categories.origin !== filters.origin) {
      return false;
    }
    
    // Vérifier les genres
    if (filters.genre) {
      if (Array.isArray(filters.genre)) {
        // Tous les genres doivent correspondre
        if (!filters.genre.every(g => content.categories.genres.includes(g))) {
          return false;
        }
      } else {
        // Un seul genre doit correspondre
        if (!content.categories.genres.includes(filters.genre)) {
          return false;
        }
      }
    }
    
    // Vérifier les thèmes
    if (filters.theme) {
      if (Array.isArray(filters.theme)) {
        // Au moins un thème doit correspondre
        if (!filters.theme.some(t => content.categories.themes.includes(t))) {
          return false;
        }
      } else {
        // Le thème spécifique doit correspondre
        if (!content.categories.themes.includes(filters.theme)) {
          return false;
        }
      }
    }
    
    // Vérifier les mots-clés
    if (filters.keywords) {
      const textToAnalyze = `${content.title} ${content.description || ''}`.toLowerCase();
      
      if (Array.isArray(filters.keywords)) {
        // Au moins un mot-clé doit correspondre
        if (!filters.keywords.some(keyword => textToAnalyze.includes(keyword))) {
          return false;
        }
      } else {
        // Le mot-clé spécifique doit correspondre
        if (!textToAnalyze.includes(filters.keywords)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Obtient les statistiques de catégorisation
   * @returns {Object} Statistiques
   */
  getStats() {
    return { ...this.stats };
  }
}

// Créer une instance unique du service
const contentCategorizer = new ContentCategorizer();

// Exporter le service
export default contentCategorizer;
