const Cache = require('../../core/cache/Cache');

/**
 * Service pour accéder à l'API JustWatch pour les films
 * Remplace l'ancienne intégration TMDB
 */
class FilmApiService {
  constructor(baseUrl = 'https://apis.justwatch.com/content') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.locale = 'fr_FR';
    
    // Pays asiatiques à inclure dans les recherches
    this.asianCountries = [
      'jp', // Japon
      'kr', // Corée du Sud
      'cn', // Chine
      'hk', // Hong Kong
      'tw', // Taiwan
      'th', // Thaïlande
      'vn', // Vietnam
      'id', // Indonésie
      'my', // Malaisie
      'ph', // Philippines
      'sg', // Singapour
      'in'  // Inde
    ];
    
    // Paramètres par défaut pour JustWatch
    this.defaultParams = {
      body_types: ['movie'],
      content_types: ['movie'],
      monetization_types: [],
      page: 1,
      page_size: 50, // Augmenté pour avoir plus de résultats avant filtrage
      presentation_types: [],
      providers: [],
      genres: [],
      languages: 'fr'
      // Ne pas filtrer par pays de production pour avoir plus de résultats
      // Nous filtrerons manuellement après
    };
    
    // Paramètres spécifiques pour la recherche asiatique
    this.asianSearchParams = {
      ...this.defaultParams,
      genres: [1, 8, 9], // Action, Science-Fiction, Thriller (genres populaires en Asie)
      release_year_from: 2000, // Films récents
      release_year_until: new Date().getFullYear() // Année courante
    };
  }

  /**
   * Récupère les films populaires via JustWatch
   * @param {number} limit - Nombre de films à récupérer
   * @returns {Promise<Array>} - Liste des films populaires
   */
  /**
   * Récupère les films populaires via JustWatch en filtrant pour ne garder que les films asiatiques
   * @param {number} limit - Nombre de films à récupérer
   * @returns {Promise<Array>} - Liste des films populaires asiatiques
   */
  async getPopularFilms(limit = 15) {
    try {
      // Clé de cache pour les films populaires asiatiques
      const cacheKey = `justwatch_popular_asian_films_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Nous allons faire plusieurs requêtes pour augmenter nos chances de trouver des films asiatiques
      let allResults = [];
      
      // 1. Recherche par popularité avec mots-clés asiatiques
      const asianKeywords = ['japon', 'corée', 'chine', 'asie', 'tokyo', 'seoul', 'hong kong'];
      
      for (const keyword of asianKeywords) {
        try {
          const params = {
            ...this.asianSearchParams,
            query: keyword,
            sort_by: 'popularity',
            sort_asc: false
          };
          
          const url = `${this.baseUrl}/titles/${this.locale}/popular`;
          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
          });
          
          if (resp.ok) {
            const data = await resp.json();
            const results = this._normalizeResults(data.items || []);
            allResults = [...allResults, ...results];
            console.log(`[FilmApiService] Recherche "${keyword}": ${results.length} films trouvés`);
          }
        } catch (err) {
          console.log(`[FilmApiService] Erreur recherche "${keyword}": ${err.message}`);
        }
      }
      
      // 2. Recherche générale par popularité
      try {
        const params = {
          ...this.defaultParams,
          sort_by: 'popularity',
          sort_asc: false,
          page_size: 100
        };
        
        const url = `${this.baseUrl}/titles/${this.locale}/popular`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
        
        if (resp.ok) {
          const data = await resp.json();
          const results = this._normalizeResults(data.items || []);
          allResults = [...allResults, ...results];
          console.log(`[FilmApiService] Recherche générale: ${results.length} films trouvés`);
        }
      } catch (err) {
        console.log(`[FilmApiService] Erreur recherche générale: ${err.message}`);
      }
      
      // Déduplication des résultats par ID
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );
      
      // Filtrer pour ne garder que les films asiatiques
      const asianResults = this._filterAsianContent(uniqueResults);
      
      console.log(`[FilmApiService] Total: ${uniqueResults.length} films uniques, ${asianResults.length} films asiatiques`);
      
      // Trier par popularité
      const sortedResults = asianResults.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      
      // Mettre en cache les résultats (6 heures)
      if (sortedResults.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(sortedResults), 21600);
      }
      
      return sortedResults.slice(0, limit);
    } catch (error) {
      console.log('[FilmApiService] Erreur getPopularFilms:', error.message);
      return [];
    }
  }

  /**
   * Recherche des films via JustWatch
   * @param {Object} params - Paramètres de recherche (q: terme de recherche)
   * @returns {Promise<Array>} - Résultats de la recherche
   */
  /**
   * Recherche des films asiatiques via JustWatch
   * @param {Object} params - Paramètres de recherche (q: terme de recherche)
   * @returns {Promise<Array>} - Résultats de la recherche filtrés pour ne montrer que les films asiatiques
   */
  async searchFilms(params) {
    try {
      const query = params.q || '';
      if (!query) {
        return [];
      }
      
      // Clé de cache pour la recherche de films asiatiques
      const cacheKey = `justwatch_search_asian_films_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      let allResults = [];
      
      // 1. Recherche directe avec le terme de recherche
      try {
        const searchParams = {
          ...this.defaultParams,
          query: query,
          page_size: 100 // Augmenter pour avoir plus de résultats avant filtrage
        };
        
        const url = `${this.baseUrl}/titles/${this.locale}/popular`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchParams)
        });
        
        if (resp.ok) {
          const data = await resp.json();
          const results = this._normalizeResults(data.items || []);
          allResults = [...allResults, ...results];
          console.log(`[FilmApiService] Recherche directe "${query}": ${results.length} films trouvés`);
        }
      } catch (err) {
        console.log(`[FilmApiService] Erreur recherche directe "${query}": ${err.message}`);
      }
      
      // 2. Recherche combinée avec des mots-clés asiatiques
      const asianKeywords = ['japon', 'corée', 'asie', 'tokyo', 'drama'];
      
      // Sélectionner un mot-clé aléatoire pour enrichir la recherche
      const randomKeyword = asianKeywords[Math.floor(Math.random() * asianKeywords.length)];
      
      try {
        const combinedParams = {
          ...this.asianSearchParams,
          query: `${query} ${randomKeyword}`,
          page_size: 50
        };
        
        const url = `${this.baseUrl}/titles/${this.locale}/popular`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(combinedParams)
        });
        
        if (resp.ok) {
          const data = await resp.json();
          const results = this._normalizeResults(data.items || []);
          allResults = [...allResults, ...results];
          console.log(`[FilmApiService] Recherche combinée "${query} ${randomKeyword}": ${results.length} films trouvés`);
        }
      } catch (err) {
        console.log(`[FilmApiService] Erreur recherche combinée: ${err.message}`);
      }
      
      // Déduplication des résultats par ID
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );
      
      // Filtrer pour ne garder que les films asiatiques
      const asianResults = this._filterAsianContent(uniqueResults);
      
      console.log(`[FilmApiService] Recherche "${query}": ${uniqueResults.length} résultats uniques, ${asianResults.length} films asiatiques`);
      
      // Trier par pertinence (score de correspondance)
      const sortedResults = this._sortByRelevance(asianResults, query);
      
      // Mettre en cache les résultats (3 heures)
      if (sortedResults.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(sortedResults), 10800);
      }
      
      return sortedResults;
    } catch (error) {
      console.log('[FilmApiService] Erreur searchFilms:', error.message);
      return [];
    }
  }

  /**
   * Récupère les détails d'un film par son ID via JustWatch
   * @param {string|number} id - ID du film
   * @returns {Promise<Object|null>} - Détails du film ou null
   */
  /**
   * Récupère les détails d'un film asiatique par son ID via JustWatch
   * @param {string|number} id - ID du film
   * @returns {Promise<Object|null>} - Détails du film ou null
   */
  async getFilmById(id) {
    try {
      if (!id) {
        return null;
      }
      
      // Clé de cache pour les détails du film asiatique
      const cacheKey = `justwatch_asian_film_${id}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Appel à l'API JustWatch
      const url = `${this.baseUrl}/titles/movie/${id}/locale/${this.locale}`;
      const resp = await fetch(url);
      
      if (!resp.ok) {
        if (resp.status === 404) {
          return null; // Film non trouvé
        }
        throw new Error(`Erreur API JustWatch: ${resp.status} ${resp.statusText}`);
      }
      
      const data = await resp.json();
      const result = this._normalizeFilmDetails(data);
      
      // Vérifier si c'est un film asiatique
      if (result && !this._isAsianContent(result)) {
        console.log(`[FilmApiService] Film ${id} ignoré car non asiatique: ${result.title}`);
        return null; // Ignorer les films non asiatiques
      }
      
      // Mettre en cache les résultats (12 heures)
      if (result) {
        await this.cache.set(cacheKey, JSON.stringify(result), 43200);
      }
      
      return result;
    } catch (error) {
      console.log('[FilmApiService] Erreur getFilmById:', error.message);
      return null;
    }
  }
  
  /**
   * Normalise les résultats de JustWatch au format attendu par l'application
   * @private
   */
  _normalizeResults(items) {
    return items.map(item => ({
      id: item.id,
      title: item.title,
      original_title: item.original_title || item.title,
      poster_path: item.poster ? `https://images.justwatch.com${item.poster.replace('{profile}', 's592')}` : '',
      backdrop_path: item.backdrop ? `https://images.justwatch.com${item.backdrop.replace('{profile}', 's1920')}` : '',
      release_date: item.cinema_release_date || item.original_release_year,
      overview: item.short_description || '',
      vote_average: (item.scoring && item.scoring.length > 0) ? item.scoring[0].value : 0,
      genres: (item.genres || []).map(g => ({ id: g, name: this._getGenreName(g) })),
      source: 'justwatch'
    }));
  }
  
  /**
   * Normalise les détails d'un film JustWatch au format attendu par l'application
   * @private
   */
  _normalizeFilmDetails(item) {
    if (!item || !item.id) {
      return null;
    }
    
    return {
      id: item.id,
      title: item.title,
      original_title: item.original_title || item.title,
      poster_path: item.poster ? `https://images.justwatch.com${item.poster.replace('{profile}', 's592')}` : '',
      backdrop_path: item.backdrop ? `https://images.justwatch.com${item.backdrop.replace('{profile}', 's1920')}` : '',
      release_date: item.cinema_release_date || item.original_release_year,
      overview: item.short_description || item.long_description || '',
      vote_average: (item.scoring && item.scoring.length > 0) ? item.scoring[0].value : 0,
      runtime: item.runtime || 0,
      genres: (item.genres || []).map(g => ({ id: g, name: this._getGenreName(g) })),
      production_companies: (item.production_companies || []).map(c => ({ id: c.id, name: c.name })),
      credits: this._normalizeCredits(item.credits || []),
      offers: item.offers || [],
      clips: item.clips || [],
      source: 'justwatch'
    };
  }
  
  /**
   * Normalise les crédits d'un film
   * @private
   */
  _normalizeCredits(credits) {
    const cast = credits
      .filter(c => c.role === 'ACTOR')
      .map(c => ({
        id: c.id,
        name: c.name,
        character: c.character || '',
        profile_path: c.profile_path || ''
      }));
      
    const crew = credits
      .filter(c => c.role !== 'ACTOR')
      .map(c => ({
        id: c.id,
        name: c.name,
        job: c.role || '',
        department: this._getDepartmentFromRole(c.role),
        profile_path: c.profile_path || ''
      }));
      
    return { cast, crew };
  }
  
  /**
   * Obtient le nom d'un genre à partir de son ID
   * @private
   */
  _getGenreName(genreId) {
    const genres = {
      1: 'Action',
      2: 'Animation',
      3: 'Comédie',
      4: 'Drame',
      5: 'Fantastique',
      6: 'Horreur',
      7: 'Romance',
      8: 'Science-Fiction',
      9: 'Thriller',
      10: 'Western',
      11: 'Documentaire',
      12: 'Aventure',
      13: 'Crime',
      14: 'Famille',
      15: 'Historique',
      16: 'Mystère',
      17: 'Guerre',
      18: 'Musique',
      19: 'Sport'
    };
    
    return genres[genreId] || 'Autre';
  }
  
  /**
   * Obtient le département à partir du rôle
   * @private
   */
  _getDepartmentFromRole(role) {
    const departments = {
      'DIRECTOR': 'Réalisation',
      'PRODUCER': 'Production',
      'WRITER': 'Écriture',
      'COMPOSER': 'Musique',
      'CINEMATOGRAPHY': 'Photographie',
      'EDITOR': 'Montage'
    };
    
    return departments[role] || 'Autre';
  }
  
  /**
   * Filtre une liste de films pour ne garder que les contenus asiatiques
   * @param {Array} items - Liste de films à filtrer
   * @returns {Array} - Liste filtrée ne contenant que les films asiatiques
   * @private
   */
  _filterAsianContent(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    
    return items.filter(item => this._isAsianContent(item));
  }
  
  /**
   * Détermine si un film est asiatique en fonction de ses propriétés
   * @param {Object} item - Film à vérifier
   * @returns {boolean} - True si le film est asiatique, false sinon
   * @private
   */
  /**
   * Détermine si un film est asiatique en fonction de ses propriétés
   * @param {Object} item - Film à vérifier
   * @returns {boolean} - True si le film est asiatique, false sinon
   * @private
   */
  _isAsianContent(item) {
    if (!item) {
      return false;
    }
    
    // Vérifier les pays de production
    if (item.production_countries && Array.isArray(item.production_countries)) {
      const hasAsianCountry = item.production_countries.some(country => 
        this.asianCountries.includes(country.toLowerCase())
      );
      
      if (hasAsianCountry) {
        return true;
      }
    }
    
    // Vérifier le titre original (recherche de caractères asiatiques)
    if (item.original_title) {
      // Plages Unicode pour les caractères japonais, chinois et coréens
      const hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/.test(item.original_title); // Hiragana et Katakana
      const hasChineseChars = /[\u4E00-\u9FFF]/.test(item.original_title); // Hanzi
      const hasKoreanChars = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(item.original_title); // Hangul
      
      if (hasJapaneseChars || hasChineseChars || hasKoreanChars) {
        return true;
      }
    }
    
    // Vérifier les mots-clés asiatiques dans le titre ou la description
    const asianKeywords = [
      'japan', 'japon', 'japonais', 'japonaise',
      'korea', 'corée', 'coréen', 'coréenne', 
      'china', 'chine', 'chinois', 'chinoise',
      'hong kong', 'taiwan', 'thaïlande', 'vietnam',
      'bollywood', 'inde', 'indien', 'indienne',
      'asia', 'asie', 'asiatique',
      'manga', 'anime', 'drama', 'k-drama', 'j-drama', 'c-drama',
      'wuxia', 'kung fu', 'samurai', 'samouraï', 'ninja',
      'tokyo', 'seoul', 'beijing', 'shanghai', 'mumbai'
    ];
    
    const titleAndDesc = `${item.title || ''} ${item.original_title || ''} ${item.overview || ''}`.toLowerCase();
    
    return asianKeywords.some(keyword => titleAndDesc.includes(keyword.toLowerCase()));
  }
  
  /**
   * Trie les résultats par pertinence par rapport à la requête
   * @param {Array} items - Liste de films à trier
   * @param {string} query - Terme de recherche
   * @returns {Array} - Liste triée par pertinence
   * @private
   */
  _sortByRelevance(items, query) {
    if (!Array.isArray(items) || items.length === 0 || !query) {
      return items;
    }
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Calculer un score de pertinence pour chaque film
    return items.map(item => {
      let score = 0;
      const titleLower = (item.title || '').toLowerCase();
      const originalTitleLower = (item.original_title || '').toLowerCase();
      const overviewLower = (item.overview || '').toLowerCase();
      
      // Score de base pour la popularité
      score += (item.vote_average || 0) * 2;
      
      // Bonus pour les films récents
      if (item.release_date) {
        const year = parseInt(item.release_date.substring(0, 4), 10);
        const currentYear = new Date().getFullYear();
        if (year >= currentYear - 5) {
          score += 10; // Bonus pour les films des 5 dernières années
        }
      }
      
      // Bonus pour les correspondances exactes dans le titre
      if (titleLower.includes(query.toLowerCase())) {
        score += 50;
      }
      
      // Bonus pour les correspondances de termes individuels
      queryTerms.forEach(term => {
        if (term.length < 3) {
          return; // Ignorer les termes trop courts
        }
        
        if (titleLower.includes(term)) {
          score += 20;
        }
        
        if (originalTitleLower.includes(term)) {
          score += 15;
        }
        
        if (overviewLower.includes(term)) {
          score += 5;
        }
      });
      
      // Bonus pour les films avec des caractères asiatiques dans le titre original
      if (item.original_title) {
        const hasAsianChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u1100-\u11FF]/.test(item.original_title);
        if (hasAsianChars) {
          score += 30;
        }
      }
      
      return { ...item, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(item => {
      // Supprimer le score de pertinence avant de renvoyer les résultats
      const { relevanceScore, ...cleanItem } = item;
      return cleanItem;
    });
  }
  
  /**
   * Récupère les films tendance via JustWatch
   * @param {number} limit - Nombre de films à récupérer
   * @returns {Promise<Array>} - Liste des films tendance asiatiques
   */
  async getTrendingFilms(limit = 15) {
    try {
      // Clé de cache pour les films tendance asiatiques
      const cacheKey = `justwatch_trending_asian_films_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        console.log(`[FilmApiService] Utilisation du cache pour getTrendingFilms (${limit})`);
        return JSON.parse(cachedData);
      }
      
      console.log(`[FilmApiService] Récupération des films tendance (${limit})`);
      
      // Nous allons faire des requêtes pour les films récents et populaires
      const params = {
        ...this.defaultParams,
        sort_by: 'recency',
        sort_asc: false,
        page_size: 100,
        release_year_from: new Date().getFullYear() - 2, // Films des 2 dernières années
        release_year_until: new Date().getFullYear()
      };
      
      const url = `${this.baseUrl}/titles/${this.locale}/new`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!resp.ok) {
        throw new Error(`Erreur API JustWatch: ${resp.status} ${resp.statusText}`);
      }
      
      const data = await resp.json();
      let results = this._normalizeResults(data.items || []);
      
      // Filtrer pour ne garder que les films asiatiques
      results = this._filterAsianContent(results);
      console.log(`[FilmApiService] Films tendance filtrés: ${results.length} films asiatiques trouvés`);
      
      // Trier par popularité (score)
      results = results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      
      // Limiter le nombre de résultats
      results = results.slice(0, limit);
      
      // Mettre en cache les résultats (6 heures)
      if (results.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(results), 21600);
      }
      
      return results;
    } catch (error) {
      console.error(`[FilmApiService] Erreur getTrendingFilms: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films récents via JustWatch
   * @param {number} limit - Nombre de films à récupérer
   * @returns {Promise<Array>} - Liste des films récents asiatiques
   */
  async getRecentFilms(limit = 15) {
    try {
      // Clé de cache pour les films récents asiatiques
      const cacheKey = `justwatch_recent_asian_films_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        console.log(`[FilmApiService] Utilisation du cache pour getRecentFilms (${limit})`);
        return JSON.parse(cachedData);
      }
      
      console.log(`[FilmApiService] Récupération des films récents (${limit})`);
      
      // Paramètres pour les films récents
      const params = {
        ...this.defaultParams,
        sort_by: 'recency',
        sort_asc: false,
        page_size: 100,
        release_year_from: new Date().getFullYear() - 1, // Films de l'année dernière et cette année
        release_year_until: new Date().getFullYear()
      };
      
      const url = `${this.baseUrl}/titles/${this.locale}/new`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!resp.ok) {
        throw new Error(`Erreur API JustWatch: ${resp.status} ${resp.statusText}`);
      }
      
      const data = await resp.json();
      let results = this._normalizeResults(data.items || []);
      
      // Filtrer pour ne garder que les films asiatiques
      results = this._filterAsianContent(results);
      console.log(`[FilmApiService] Films récents filtrés: ${results.length} films asiatiques trouvés`);
      
      // Limiter le nombre de résultats
      results = results.slice(0, limit);
      
      // Mettre en cache les résultats (4 heures)
      if (results.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(results), 14400);
      }
      
      return results;
    } catch (error) {
      console.error(`[FilmApiService] Erreur getRecentFilms: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films par genre via JustWatch
   * @param {string} genre - Le genre des films à récupérer
   * @param {number} page - La page à récupérer
   * @param {number} limit - Le nombre de films par page
   * @returns {Promise<Array>} - Les films du genre spécifié
   */
  async getFilmsByGenre(genre, page = 1, limit = 20) {
    try {
      // Clé de cache pour les films par genre
      const cacheKey = `justwatch_genre_${genre}_p${page}_l${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        console.log(`[FilmApiService] Utilisation du cache pour getFilmsByGenre (${genre}, page ${page})`);
        return JSON.parse(cachedData);
      }
      
      console.log(`[FilmApiService] Récupération des films par genre: ${genre}, page ${page}`);
      
      // Convertir le nom du genre en ID
      const genreMap = {
        'action': 1,
        'animation': 2,
        'comedie': 3,
        'crime': 4,
        'documentaire': 5,
        'drame': 6,
        'fantastique': 7,
        'historique': 8,
        'horreur': 9,
        'famille': 10,
        'musique': 11,
        'mystere': 12,
        'romance': 13,
        'science-fiction': 14,
        'thriller': 15,
        'guerre': 16,
        'western': 17
      };
      
      const genreId = genreMap[genre.toLowerCase()] || null;
      
      if (!genreId) {
        console.log(`[FilmApiService] Genre non reconnu: ${genre}`);
        return [];
      }
      
      // Paramètres pour les films par genre
      const params = {
        ...this.defaultParams,
        genres: [genreId],
        page: page,
        page_size: limit * 2, // On récupère plus pour pouvoir filtrer ensuite
        sort_by: 'popularity',
        sort_asc: false
      };
      
      const url = `${this.baseUrl}/titles/${this.locale}/popular`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!resp.ok) {
        throw new Error(`Erreur API JustWatch: ${resp.status} ${resp.statusText}`);
      }
      
      const data = await resp.json();
      let results = this._normalizeResults(data.items || []);
      
      // Filtrer pour ne garder que les films asiatiques
      results = this._filterAsianContent(results);
      console.log(`[FilmApiService] Films par genre filtrés: ${results.length} films asiatiques trouvés pour le genre ${genre}`);
      
      // Limiter le nombre de résultats
      results = results.slice(0, limit);
      
      // Mettre en cache les résultats (12 heures)
      if (results.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(results), 43200);
      }
      
      return results;
    } catch (error) {
      console.error(`[FilmApiService] Erreur getFilmsByGenre: ${error.message}`);
      return [];
    }
  }
}

module.exports = FilmApiService;
