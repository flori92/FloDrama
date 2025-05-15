const Cache = require('../../core/cache/Cache');

/**
 * Service pour accéder aux données de dramas asiatiques
 * Utilise diverses API gratuites et techniques de scraping
 */
class DramaApiService {
  constructor() {
    this.cache = new Cache();
    
    // Base URL pour l'API MDL (MyDramaList)
    this.mdlBaseUrl = 'https://mydramalist.com/api/v1';
    
    // Base URL pour Kisskh API (non-officielle)
    this.kisskhBaseUrl = 'https://kisskh.co/api';
    
    // Base URL pour DramaDay API (non-officielle)
    this.dramadayBaseUrl = 'https://dramaday.net/api';
    
    // Limites de l'API (pour éviter le rate limiting)
    this.rateLimit = {
      perMinute: 20,
      perSecond: 2,
      lastRequest: 0
    };
    
    // Pays asiatiques à inclure dans les recherches
    this.asianCountries = [
      'kr', // Corée du Sud
      'jp', // Japon
      'cn', // Chine
      'hk', // Hong Kong
      'tw', // Taiwan
      'th', // Thaïlande
      'sg', // Singapour
      'id', // Indonésie
      'ph', // Philippines
      'my', // Malaisie
      'vn'  // Vietnam
    ];
    
    // Genres populaires pour les dramas
    this.popularGenres = [
      'romance', 'comedy', 'action', 'thriller', 
      'melodrama', 'historical', 'medical', 'crime',
      'fantasy', 'school', 'youth', 'family'
    ];
  }

  /**
   * Gère la limitation de débit de l'API
   * @returns {Promise<void>}
   */
  async handleRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequest;
    
    // Si moins de 500ms se sont écoulées depuis la dernière requête (~ 2 requêtes par seconde)
    if (timeSinceLastRequest < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - timeSinceLastRequest));
    }
    
    this.rateLimit.lastRequest = Date.now();
  }

  /**
   * Effectue une requête à une API avec gestion du cache et des limites de débit
   * @param {string} baseUrl - L'URL de base de l'API
   * @param {string} endpoint - L'endpoint à appeler
   * @param {Object} params - Les paramètres de la requête
   * @param {number} cacheTTL - Durée de vie du cache en secondes
   * @returns {Promise<Object>} - La réponse de l'API
   */
  async fetchFromAPI(baseUrl, endpoint, params = {}, cacheTTL = 86400) {
    // Construire l'URL avec les paramètres
    const url = new URL(`${baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const cacheKey = `drama_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Gérer la limitation de débit
    await this.handleRateLimit();
    
    try {
      // Effectuer la requête
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FloDrama/1.0'
        }
      });
      
      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status} ${response.statusText}`);
      }
      
      // Parser la réponse
      const data = await response.json();
      
      // Mettre en cache
      await this.cache.set(cacheKey, JSON.stringify(data), cacheTTL);
      
      return data;
    } catch (error) {
      console.error(`[DramaApiService] Erreur lors de la requête à ${url.toString()}: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère les dramas populaires
   * @param {number} limit - Nombre de dramas à récupérer
   * @returns {Promise<Array>} - Liste des dramas populaires
   */
  async getPopularDramas(limit = 15) {
    try {
      // Clé de cache pour les dramas populaires
      const cacheKey = `popular_dramas_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Essayer d'abord KissKH (plus riche en contenu asiatique)
      let results = await this.fetchFromAPI(
        this.kisskhBaseUrl,
        '/drama/trending',
        { limit: Math.min(limit * 2, 50) }, // Demander plus pour filtrer après
        43200 // 12 heures de cache
      );
      
      // Si KissKH échoue, essayer DramaDay
      if (!results || !results.data || results.data.length === 0) {
        results = await this.fetchFromAPI(
          this.dramadayBaseUrl,
          '/dramas/popular',
          { limit: Math.min(limit * 2, 50) },
          43200
        );
      }
      
      // Si les deux échouent, essayer MyDramaList
      if (!results || !results.data || results.data.length === 0) {
        results = await this.fetchFromAPI(
          this.mdlBaseUrl,
          '/charts/top',
          { page: 1, limit: Math.min(limit * 2, 50), type: 'drama' },
          43200
        );
      }
      
      // Normaliser et filtrer les résultats
      let dramas = [];
      if (results && (results.data || results.items)) {
        dramas = this._normalizeResults(results.data || results.items);
        dramas = this._filterAsianContent(dramas);
        dramas = dramas.slice(0, limit); // Limiter au nombre demandé
      }
      
      // Mettre en cache les résultats
      if (dramas.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(dramas), 43200); // 12 heures
      }
      
      return dramas;
    } catch (error) {
      console.error(`[DramaApiService] Erreur getPopularDramas: ${error.message}`);
      return [];
    }
  }

  /**
   * Recherche des dramas
   * @param {Object} params - Paramètres de recherche (q: terme de recherche)
   * @returns {Promise<Array>} - Résultats de la recherche
   */
  async searchDramas(params) {
    try {
      const query = params.q || '';
      if (!query) {
        return [];
      }
      
      // Clé de cache pour la recherche
      const cacheKey = `search_dramas_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Essayer d'abord KissKH
      let results = await this.fetchFromAPI(
        this.kisskhBaseUrl,
        '/drama/search',
        { q: query, limit: 30 },
        21600 // 6 heures de cache
      );
      
      // Si KissKH échoue, essayer DramaDay
      if (!results || !results.data || results.data.length === 0) {
        results = await this.fetchFromAPI(
          this.dramadayBaseUrl,
          '/dramas/search',
          { q: query, limit: 30 },
          21600
        );
      }
      
      // Si les deux échouent, essayer MyDramaList
      if (!results || !results.data || results.data.length === 0) {
        results = await this.fetchFromAPI(
          this.mdlBaseUrl,
          '/search',
          { q: query, page: 1, limit: 30, type: 'drama' },
          21600
        );
      }
      
      // Normaliser et filtrer les résultats
      let dramas = [];
      if (results && (results.data || results.items)) {
        dramas = this._normalizeResults(results.data || results.items);
        dramas = this._filterAsianContent(dramas);
        
        // Trier par pertinence
        dramas = this._sortByRelevance(dramas, query);
      }
      
      // Mettre en cache les résultats
      if (dramas.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(dramas), 21600); // 6 heures
      }
      
      return dramas;
    } catch (error) {
      console.error(`[DramaApiService] Erreur searchDramas: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les détails d'un drama par son ID
   * @param {string|number} id - ID du drama
   * @returns {Promise<Object|null>} - Détails du drama ou null
   */
  async getDramaById(id) {
    try {
      if (!id) {
        return null;
      }
      
      // Clé de cache pour les détails du drama
      const cacheKey = `drama_details_${id}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Essayer d'abord KissKH
      let result = await this.fetchFromAPI(
        this.kisskhBaseUrl,
        `/drama/${id}`,
        {},
        86400 // 24 heures de cache
      );
      
      // Si KissKH échoue, essayer DramaDay
      if (!result || !result.data) {
        result = await this.fetchFromAPI(
          this.dramadayBaseUrl,
          `/dramas/${id}`,
          {},
          86400
        );
      }
      
      // Si les deux échouent, essayer MyDramaList
      if (!result || !result.data) {
        result = await this.fetchFromAPI(
          this.mdlBaseUrl,
          `/dramas/${id}`,
          {},
          86400
        );
      }
      
      // Normaliser le résultat
      let drama = null;
      if (result && result.data) {
        drama = this._normalizeDramaDetails(result.data);
      }
      
      // Mettre en cache le résultat
      if (drama) {
        await this.cache.set(cacheKey, JSON.stringify(drama), 86400); // 24 heures
      }
      
      return drama;
    } catch (error) {
      console.error(`[DramaApiService] Erreur getDramaById: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalise les résultats des différentes API au format attendu par l'application
   * @param {Array} items - Liste de dramas à normaliser
   * @returns {Array} - Liste normalisée
   * @private
   */
  _normalizeResults(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    return items.map(item => {
      // Déterminer la source de l'item pour adapter la normalisation
      const hasKissKHFormat = item.drama_id !== undefined;
      const hasDramaDayFormat = item.dramaId !== undefined;
      const hasMDLFormat = item.id !== undefined && item.slug !== undefined;
      
      // Normaliser selon le format détecté
      return {
        id: hasKissKHFormat ? item.drama_id : 
            hasDramaDayFormat ? item.dramaId : 
            hasMDLFormat ? item.id : item.id || '',
        title: item.title || item.name || '',
        original_title: item.original_title || item.originalName || '',
        poster_path: item.poster || item.posterUrl || item.poster_path || item.cover_url || '',
        backdrop_path: item.backdrop || item.backdropUrl || item.backdrop_path || '',
        overview: item.synopsis || item.description || item.overview || '',
        release_date: item.release_date || item.year || (item.aired && item.aired.from) || '',
        vote_average: item.rating || item.score || item.vote_average || 0,
        genres: Array.isArray(item.genres) 
          ? item.genres.map(g => typeof g === 'string' ? g : g.name || '') 
          : [],
        country: item.country || item.origin_country || '',
        episodes: item.episodes_count || item.episodes || 0,
        status: item.status || 'Released',
        type: 'drama'
      };
    });
  }

  /**
   * Normalise les détails d'un drama au format attendu par l'application
   * @param {Object} item - Drama à normaliser
   * @returns {Object} - Drama normalisé
   * @private
   */
  _normalizeDramaDetails(item) {
    if (!item) {
      return null;
    }
    
    // Déterminer la source de l'item pour adapter la normalisation
    const hasKissKHFormat = item.drama_id !== undefined;
    const hasDramaDayFormat = item.dramaId !== undefined;
    const hasMDLFormat = item.id !== undefined && item.slug !== undefined;
    
    return {
      id: hasKissKHFormat ? item.drama_id : 
          hasDramaDayFormat ? item.dramaId : 
          hasMDLFormat ? item.id : item.id || '',
      title: item.title || item.name || '',
      original_title: item.original_title || item.originalName || '',
      poster_path: item.poster || item.posterUrl || item.poster_path || item.cover_url || '',
      backdrop_path: item.backdrop || item.backdropUrl || item.backdrop_path || '',
      overview: item.synopsis || item.description || item.overview || '',
      release_date: item.release_date || item.year || (item.aired && item.aired.from) || '',
      vote_average: item.rating || item.score || item.vote_average || 0,
      genres: Array.isArray(item.genres) 
        ? item.genres.map(g => typeof g === 'string' ? g : g.name || '') 
        : [],
      country: item.country || item.origin_country || '',
      episodes: item.episodes_count || item.episodes || 0,
      status: item.status || 'Released',
      type: 'drama',
      cast: this._normalizeCast(item.cast || item.actors || []),
      similar: this._normalizeResults(item.similar || item.related || []),
      streaming_links: this._normalizeStreamingLinks(item.streaming_links || item.streams || []),
      trailer: item.trailer_url || item.trailer || '',
      aired_date: item.aired_date || item.aired_on || item.release_date || '',
      ended_date: item.ended_date || item.ended_on || '',
      duration: item.duration || item.episode_length || '',
      network: item.network || item.broadcaster || ''
    };
  }

  /**
   * Normalise les informations du casting
   * @param {Array} cast - Liste des acteurs
   * @returns {Array} - Liste normalisée
   * @private
   */
  _normalizeCast(cast) {
    if (!Array.isArray(cast) || cast.length === 0) {
      return [];
    }
    
    return cast.map(actor => ({
      id: actor.id || actor.actor_id || '',
      name: actor.name || '',
      character: actor.character || actor.role || '',
      profile_path: actor.profile || actor.photo || actor.profile_path || '',
      order: actor.order || 0
    }));
  }

  /**
   * Normalise les liens de streaming
   * @param {Array} links - Liste des liens de streaming
   * @returns {Array} - Liste normalisée
   * @private
   */
  _normalizeStreamingLinks(links) {
    if (!Array.isArray(links) || links.length === 0) {
      return [];
    }
    
    return links.map(link => ({
      id: link.id || '',
      name: link.name || link.provider || '',
      url: link.url || link.link || '',
      quality: link.quality || 'HD',
      subtitles: link.subtitles || 'VOSTFR'
    }));
  }

  /**
   * Filtre une liste de dramas pour ne garder que les contenus asiatiques
   * @param {Array} items - Liste de dramas à filtrer
   * @returns {Array} - Liste filtrée
   * @private
   */
  _filterAsianContent(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    return items.filter(item => this._isAsianContent(item));
  }

  /**
   * Détermine si un drama est asiatique en fonction de ses propriétés
   * @param {Object} item - Drama à vérifier
   * @returns {boolean} - True si le drama est asiatique, false sinon
   * @private
   */
  _isAsianContent(item) {
    if (!item) {
      return false;
    }
    
    // Vérifier le pays d'origine
    if (item.country) {
      const country = item.country.toLowerCase();
      const isAsianCountry = this.asianCountries.some(code => 
        country.includes(code) || 
        country.includes(this._getCountryName(code))
      );
      
      if (isAsianCountry) {
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
      'korea', 'korean', 'corée', 'coréen', 'coréenne',
      'japan', 'japanese', 'japon', 'japonais', 'japonaise',
      'china', 'chinese', 'chine', 'chinois', 'chinoise',
      'taiwan', 'taiwanese', 'taïwan', 'taïwanais', 'taïwanaise',
      'hong kong', 'hongkongais',
      'thailand', 'thai', 'thaïlande', 'thaï', 'thaïlandais',
      'singapore', 'singapour', 'singapourien',
      'vietnam', 'vietnamese', 'vietnamien',
      'k-drama', 'kdrama', 'j-drama', 'jdrama', 'c-drama', 'cdrama', 'tw-drama',
      'hallyu', 'dorama', 'lakorn'
    ];
    
    const titleAndDesc = `${item.title || ''} ${item.original_title || ''} ${item.overview || ''}`.toLowerCase();
    
    return asianKeywords.some(keyword => titleAndDesc.includes(keyword.toLowerCase()));
  }

  /**
   * Obtient le nom complet d'un pays à partir de son code
   * @param {string} code - Code du pays
   * @returns {string} - Nom du pays
   * @private
   */
  _getCountryName(code) {
    const countryMap = {
      'kr': 'korea',
      'jp': 'japan',
      'cn': 'china',
      'hk': 'hong kong',
      'tw': 'taiwan',
      'th': 'thailand',
      'sg': 'singapore',
      'id': 'indonesia',
      'ph': 'philippines',
      'my': 'malaysia',
      'vn': 'vietnam'
    };
    
    return countryMap[code.toLowerCase()] || code;
  }

  /**
   * Trie les résultats par pertinence par rapport à la requête
   * @param {Array} items - Liste de dramas à trier
   * @param {string} query - Terme de recherche
   * @returns {Array} - Liste triée
   * @private
   */
  _sortByRelevance(items, query) {
    if (!Array.isArray(items) || items.length === 0 || !query) {
      return items;
    }
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Calculer un score de pertinence pour chaque drama
    return items.map(item => {
      let score = 0;
      const titleLower = (item.title || '').toLowerCase();
      const originalTitleLower = (item.original_title || '').toLowerCase();
      const overviewLower = (item.overview || '').toLowerCase();
      
      // Score de base pour la popularité
      score += (item.vote_average || 0) * 2;
      
      // Bonus pour les dramas récents
      if (item.release_date) {
        const year = parseInt(item.release_date.substring(0, 4), 10);
        const currentYear = new Date().getFullYear();
        if (year >= currentYear - 3) {
          score += 15; // Bonus pour les dramas des 3 dernières années
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
      
      // Bonus pour les dramas avec des caractères asiatiques dans le titre original
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
}

module.exports = DramaApiService;
