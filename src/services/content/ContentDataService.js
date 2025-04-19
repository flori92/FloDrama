// Service de données de contenu pour FloDrama
// Gère l'accès aux données de contenu et leur mise en cache
// Version améliorée utilisant ApiService et StorageService

/**
 * Service de gestion des données de contenu
 * @class ContentDataService
 */
export class ContentDataService {
  /**
   * Constructeur du service de données de contenu
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {number} config.cacheDuration - Durée de cache en millisecondes (défaut: 30 minutes)
   * @param {boolean} config.useMockData - Utiliser des données fictives (défaut: true)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.cacheDuration = config.cacheDuration || 30 * 60 * 1000; // 30 minutes par défaut
    this.useMockData = config.useMockData !== undefined ? config.useMockData : true;
    
    // Cache en mémoire
    this.cache = {
      allContent: null,
      contentById: {},
      contentByType: {},
      contentByCategory: {},
      lastFetched: null
    };
    
    console.log('ContentDataService initialisé');
  }
  
  /**
   * Récupérer tout le contenu disponible
   * @param {Object} options - Options de récupération
   * @param {boolean} options.forceRefresh - Forcer le rafraîchissement du cache
   * @param {boolean} options.useStorage - Utiliser le stockage persistant
   * @returns {Promise<Array>} - Liste des contenus
   */
  async getAllContent(options = {}) {
    const { forceRefresh = false, useStorage = true } = options;
    
    // Vérifier si les données en cache mémoire sont encore valides
    if (!forceRefresh && this.cache.allContent && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log('Utilisation du cache mémoire pour getAllContent');
      return this.cache.allContent;
    }
    
    try {
      let content = null;
      
      // Essayer de récupérer depuis le stockage persistant
      if (useStorage && this.storageService) {
        const storedContent = await this.storageService.get('all_content');
        const storedTimestamp = await this.storageService.get('content_timestamp');
        
        if (storedContent && storedTimestamp && !forceRefresh && 
            (Date.now() - storedTimestamp < this.cacheDuration)) {
          console.log('Utilisation du stockage persistant pour getAllContent');
          content = storedContent;
        }
      }
      
      // Si pas de contenu en cache, récupérer depuis l'API ou les mocks
      if (!content) {
        if (this.apiService && !this.useMockData) {
          // Récupérer depuis l'API
          content = await this.apiService.get('/content');
        } else {
          // Utiliser des données fictives
          content = await this.fetchMockContent();
        }
        
        // Sauvegarder dans le stockage persistant
        if (useStorage && this.storageService) {
          await this.storageService.set('all_content', content);
          await this.storageService.set('content_timestamp', Date.now());
        }
      }
      
      // Mettre à jour le cache mémoire
      this.cache.allContent = content;
      this.cache.lastFetched = Date.now();
      
      // Mettre à jour les caches secondaires
      this.updateSecondaryCache(content);
      
      console.log(`${content.length} éléments de contenu récupérés`);
      return content;
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      // Retourner le cache même s'il est périmé en cas d'erreur
      return this.cache.allContent || [];
    }
  }
  
  /**
   * Mettre à jour les caches secondaires
   * @param {Array} content - Liste des contenus
   * @private
   */
  updateSecondaryCache(content) {
    // Réinitialiser les caches secondaires
    this.cache.contentById = {};
    this.cache.contentByType = {};
    this.cache.contentByCategory = {};
    
    // Remplir les caches secondaires
    content.forEach(item => {
      // Cache par ID
      this.cache.contentById[item.id] = item;
      
      // Cache par type
      if (!this.cache.contentByType[item.type]) {
        this.cache.contentByType[item.type] = [];
      }
      this.cache.contentByType[item.type].push(item);
      
      // Cache par catégorie
      if (!this.cache.contentByCategory[item.category]) {
        this.cache.contentByCategory[item.category] = [];
      }
      this.cache.contentByCategory[item.category].push(item);
    });
  }
  
  /**
   * Récupérer un élément de contenu par ID
   * @param {number|string} id - ID de l'élément
   * @param {Object} options - Options de récupération
   * @param {boolean} options.forceRefresh - Forcer le rafraîchissement du cache
   * @returns {Promise<Object|null>} - Élément de contenu
   */
  async getContentById(id, options = {}) {
    const { forceRefresh = false } = options;
    
    // Vérifier si l'élément est dans le cache
    if (!forceRefresh && this.cache.contentById[id]) {
      console.log(`Utilisation du cache pour getContentById(${id})`);
      return this.cache.contentById[id];
    }
    
    // Si le cache principal est valide mais l'élément n'est pas trouvé, il n'existe pas
    if (!forceRefresh && this.cache.allContent && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Élément avec ID ${id} non trouvé`);
      return null;
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        const item = await this.apiService.get(`/content/${id}`);
        
        if (item) {
          // Mettre à jour le cache
          this.cache.contentById[id] = item;
          return item;
        }
        
        return null;
      } else {
        // Sinon, récupérer tout le contenu et chercher l'élément
        const allContent = await this.getAllContent({ forceRefresh });
        return this.cache.contentById[id] || null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu avec ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Récupérer le contenu par type
   * @param {string} type - Type de contenu
   * @param {Object} options - Options de récupération
   * @param {boolean} options.forceRefresh - Forcer le rafraîchissement du cache
   * @returns {Promise<Array>} - Liste des contenus
   */
  async getContentByType(type, options = {}) {
    const { forceRefresh = false } = options;
    
    // Vérifier si les données en cache sont encore valides
    if (!forceRefresh && this.cache.contentByType[type] && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Utilisation du cache pour getContentByType(${type})`);
      return this.cache.contentByType[type];
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        const content = await this.apiService.get('/content', {
          params: { type }
        });
        
        // Mettre à jour le cache
        if (!this.cache.contentByType[type]) {
          this.cache.contentByType[type] = [];
        }
        this.cache.contentByType[type] = content;
        
        return content;
      } else {
        // Sinon, récupérer tout le contenu et filtrer par type
        const allContent = await this.getAllContent({ forceRefresh });
        return this.cache.contentByType[type] || [];
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu de type ${type}:`, error);
      return this.cache.contentByType[type] || [];
    }
  }
  
  /**
   * Récupérer le contenu par catégorie
   * @param {string} category - Catégorie de contenu
   * @param {Object} options - Options de récupération
   * @param {boolean} options.forceRefresh - Forcer le rafraîchissement du cache
   * @returns {Promise<Array>} - Liste des contenus
   */
  async getContentByCategory(category, options = {}) {
    const { forceRefresh = false } = options;
    
    // Vérifier si les données en cache sont encore valides
    if (!forceRefresh && this.cache.contentByCategory[category] && this.cache.lastFetched && 
        (Date.now() - this.cache.lastFetched < this.cacheDuration)) {
      console.log(`Utilisation du cache pour getContentByCategory(${category})`);
      return this.cache.contentByCategory[category];
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        const content = await this.apiService.get('/content', {
          params: { category }
        });
        
        // Mettre à jour le cache
        if (!this.cache.contentByCategory[category]) {
          this.cache.contentByCategory[category] = [];
        }
        this.cache.contentByCategory[category] = content;
        
        return content;
      } else {
        // Sinon, récupérer tout le contenu et filtrer par catégorie
        const allContent = await this.getAllContent({ forceRefresh });
        return this.cache.contentByCategory[category] || [];
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu de catégorie ${category}:`, error);
      return this.cache.contentByCategory[category] || [];
    }
  }
  
  /**
   * Récupérer les tendances
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des contenus tendance
   */
  async getTrending(limit = 8) {
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        return await this.apiService.get('/content/trending', {
          params: { limit }
        });
      } else {
        // Récupérer tout le contenu
        const allContent = await this.getAllContent();
        
        // Simuler un algorithme de tendance (les plus récents avec les meilleures notes)
        return allContent
          .sort((a, b) => {
            // Combiner l'année et la note pour le tri
            const scoreA = parseInt(a.year) * 10 + a.rating;
            const scoreB = parseInt(b.year) * 10 + b.rating;
            return scoreB - scoreA;
          })
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      return [];
    }
  }
  
  /**
   * Récupérer les nouveautés
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des nouveautés
   */
  async getNewReleases(limit = 8) {
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        return await this.apiService.get('/content/new-releases', {
          params: { limit }
        });
      } else {
        // Récupérer tout le contenu
        const allContent = await this.getAllContent();
        const currentYear = new Date().getFullYear().toString();
        
        // Filtrer par année courante et trier par note
        return allContent
          .filter(item => item.year === currentYear)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des nouveautés:', error);
      return [];
    }
  }
  
  /**
   * Récupérer du contenu similaire
   * @param {Object} contentItem - Élément de contenu de référence
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des contenus similaires
   */
  async getSimilarContent(contentItem, limit = 6) {
    if (!contentItem) {
      console.error('Élément de contenu non fourni pour getSimilarContent');
      return [];
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        return await this.apiService.get(`/content/${contentItem.id}/similar`, {
          params: { limit }
        });
      } else {
        // Récupérer tout le contenu
        const allContent = await this.getAllContent();
        
        // Exclure l'élément de référence
        const otherContent = allContent.filter(item => item.id !== contentItem.id);
        
        // Calculer un score de similarité pour chaque élément
        const scoredContent = otherContent.map(item => {
          let similarityScore = 0;
          
          // Même type
          if (item.type === contentItem.type) {
            similarityScore += 2;
          }
          
          // Même catégorie
          if (item.category === contentItem.category) {
            similarityScore += 3;
          }
          
          // Genres communs
          if (item.genre && contentItem.genre) {
            const itemGenres = Array.isArray(item.genre) ? item.genre : [item.genre];
            const contentGenres = Array.isArray(contentItem.genre) ? contentItem.genre : [contentItem.genre];
            
            itemGenres.forEach(genre => {
              if (contentGenres.includes(genre)) {
                similarityScore += 2;
              }
            });
          }
          
          // Acteurs communs
          if (item.actors && contentItem.actors) {
            item.actors.forEach(actor => {
              if (contentItem.actors.includes(actor)) {
                similarityScore += 2;
              }
            });
          }
          
          // Même réalisateur
          if (item.director && contentItem.director) {
            const itemDirectors = Array.isArray(item.director) ? item.director : [item.director];
            const contentDirectors = Array.isArray(contentItem.director) ? contentItem.director : [contentItem.director];
            
            itemDirectors.forEach(director => {
              if (contentDirectors.includes(director)) {
                similarityScore += 3;
              }
            });
          }
          
          // Année proche
          if (item.year && contentItem.year) {
            const yearDiff = Math.abs(parseInt(item.year) - parseInt(contentItem.year));
            if (yearDiff <= 3) {
              similarityScore += 1;
            }
          }
          
          return { ...item, similarityScore };
        });
        
        // Trier par score de similarité et limiter
        return scoredContent
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu similaire:', error);
      return [];
    }
  }
  
  /**
   * Rechercher du contenu
   * @param {string} query - Requête de recherche
   * @param {Object} filters - Filtres de recherche
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchContent(query, filters = {}, limit = 20) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    try {
      if (this.apiService && !this.useMockData) {
        // Récupérer depuis l'API
        return await this.apiService.get('/content/search', {
          params: {
            q: query,
            ...filters,
            limit
          }
        });
      } else {
        // Récupérer tout le contenu
        const allContent = await this.getAllContent();
        
        // Normaliser la requête
        const normalizedQuery = query.toLowerCase().trim();
        
        // Filtrer le contenu
        let results = allContent.filter(item => {
          // Vérifier si la requête correspond au texte recherchable
          const searchableText = [
            item.title,
            item.category,
            item.type,
            ...(Array.isArray(item.genre) ? item.genre : [item.genre]),
            ...(item.actors || []),
            ...(Array.isArray(item.director) ? item.director : [item.director]),
            item.year,
            item.description
          ].join(' ').toLowerCase();
          
          const matchesQuery = searchableText.includes(normalizedQuery);
          
          // Appliquer les filtres
          let matchesFilters = true;
          
          if (filters.type && filters.type !== 'all') {
            matchesFilters = matchesFilters && item.type === filters.type.toLowerCase();
          }
          
          if (filters.category && filters.category !== 'all') {
            matchesFilters = matchesFilters && item.category === filters.category;
          }
          
          if (filters.year) {
            matchesFilters = matchesFilters && item.year === filters.year;
          }
          
          return matchesQuery && matchesFilters;
        });
        
        // Calculer un score de pertinence
        results = results.map(item => {
          let relevanceScore = 0;
          
          // Titre exact = score élevé
          if (item.title.toLowerCase() === normalizedQuery) {
            relevanceScore += 10;
          }
          // Titre contient la requête = score moyen
          else if (item.title.toLowerCase().includes(normalizedQuery)) {
            relevanceScore += 5;
          }
          
          // Correspondance de catégorie
          if (item.category.toLowerCase().includes(normalizedQuery)) {
            relevanceScore += 3;
          }
          
          // Correspondance de genre
          const genres = Array.isArray(item.genre) ? item.genre : [item.genre];
          if (genres.some(genre => genre.toLowerCase().includes(normalizedQuery))) {
            relevanceScore += 2;
          }
          
          return {
            ...item,
            relevanceScore
          };
        });
        
        // Trier par pertinence et limiter
        return results
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu:', error);
      return [];
    }
  }
  
  /**
   * Simuler la récupération de données depuis une API
   * @returns {Promise<Array>} - Liste des contenus
   * @private
   */
  async fetchMockContent() {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      // Trending
      ...this.generateMockItems('trending', 8, 'Drama'),
      
      // Recommended
      ...this.generateMockItems('recommended', 8, 'Divers'),
      
      // Korean Dramas
      ...this.generateMockItems('korean', 8, 'Drama'),
      
      // Movies
      ...this.generateMockItems('movies', 8, 'Film'),
      
      // Anime
      ...this.generateMockItems('anime', 8, 'Anime'),
      
      // Bollywood
      ...this.generateMockItems('bollywood', 8, 'Bollywood')
    ];
  }
  
  /**
   * Générer des éléments mock pour une catégorie
   * @param {string} category - Catégorie
   * @param {number} count - Nombre d'éléments
   * @param {string} type - Type de contenu
   * @returns {Array} - Liste des éléments générés
   * @private
   */
  generateMockItems(category, count, type) {
    const items = [];
    const currentYear = new Date().getFullYear();
    
    // Définir les titres et genres selon la catégorie
    const titles = {
      trending: [
        'Crash Landing on You', 'Squid Game', 'Demon Slayer', 
        'Vincenzo', 'My Name', 'Itaewon Class', 'Kingdom', 'Jujutsu Kaisen'
      ],
      recommended: [
        'Hospital Playlist', 'Reply 1988', 'Attack on Titan', 
        'It\'s Okay to Not Be Okay', 'Hometown Cha-Cha-Cha', 
        'My Hero Academia', 'Goblin', 'Naruto Shippuden'
      ],
      korean: [
        'Descendants of the Sun', 'True Beauty', 'Signal', 
        'Mr. Queen', 'Flower of Evil', 'Start-Up', 'My Mister', 
        'The King: Eternal Monarch'
      ],
      movies: [
        'Parasite', 'Train to Busan', 'The Handmaiden', 
        'Oldboy', 'I Saw the Devil', 'A Taxi Driver', 
        'The Wailing', 'Burning'
      ],
      anime: [
        'One Piece', 'Death Note', 'Fullmetal Alchemist', 
        'Hunter x Hunter', 'Steins;Gate', 'Your Name', 
        'Violet Evergarden', 'Demon Slayer: Mugen Train'
      ],
      bollywood: [
        '3 Idiots', 'Dangal', 'PK', 'Bajrangi Bhaijaan', 
        'Lagaan', 'Kabhi Khushi Kabhie Gham', 
        'Dilwale Dulhania Le Jayenge', 'Kuch Kuch Hota Hai'
      ]
    };
    
    const genres = {
      trending: ['Action', 'Drame', 'Thriller', 'Fantaisie'],
      recommended: ['Comédie', 'Romance', 'Aventure', 'Science-Fiction'],
      korean: ['Romance', 'Comédie', 'Thriller', 'Historique'],
      movies: ['Drame', 'Thriller', 'Horreur', 'Action'],
      anime: ['Aventure', 'Action', 'Fantaisie', 'Science-Fiction'],
      bollywood: ['Romance', 'Comédie', 'Drame', 'Action']
    };
    
    const durations = {
      trending: ['1h20', '50min', '24min', '1h10'],
      recommended: ['1h30', '1h10', '24min', '2h'],
      korean: ['1h', '1h10', '1h20', '1h30'],
      movies: ['2h12', '1h58', '2h25', '2h'],
      anime: ['24min', '25min', '1h46', '1h57'],
      bollywood: ['2h50', '2h41', '3h44', '3h10']
    };
    
    // Générer les éléments
    for (let i = 1; i <= count; i++) {
      const titleIndex = i - 1;
      const genreIndex = Math.floor(Math.random() * genres[category].length);
      const durationIndex = Math.floor(Math.random() * durations[category].length);
      const yearOffset = Math.floor(Math.random() * 5);
      
      items.push({
        id: parseInt(`${category.charCodeAt(0)}${i}`), // ID unique basé sur la catégorie et l'index
        title: titles[category][titleIndex] || `${type} ${i}`,
        type: type.toLowerCase(),
        category: genres[category][genreIndex],
        genre: [genres[category][genreIndex]],
        year: (currentYear - yearOffset).toString(),
        duration: durations[category][durationIndex],
        image: `/public/assets/images/content/${category}/${i}.svg`,
        rating: (Math.floor(Math.random() * 20) + 70) / 10, // Note entre 7.0 et 9.0
        actors: ['Acteur 1', 'Acteur 2', 'Acteur 3'],
        director: 'Réalisateur',
        description: `Description de ${titles[category][titleIndex] || `${type} ${i}`}`,
        tags: [type, genres[category][genreIndex]]
      });
    }
    
    return items;
  }
  
  /**
   * Vider le cache
   * @param {Object} options - Options de nettoyage
   * @param {boolean} options.clearStorage - Vider également le stockage persistant
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearCache(options = {}) {
    const { clearStorage = false } = options;
    
    // Vider le cache mémoire
    this.cache = {
      allContent: null,
      contentById: {},
      contentByType: {},
      contentByCategory: {},
      lastFetched: null
    };
    
    // Vider le stockage persistant si demandé
    if (clearStorage && this.storageService) {
      await this.storageService.remove('all_content');
      await this.storageService.remove('content_timestamp');
    }
    
    console.log('Cache vidé');
    return true;
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default ContentDataService;
