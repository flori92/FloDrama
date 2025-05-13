/**
 * Service pour interagir avec les APIs externes pour récupérer des films Bollywood
 * Utilise OMDb API (gratuite) et d'autres sources ouvertes
 */

const Cache = require('../../core/cache/Cache');
const Bollywood = require('../../core/models/Bollywood');
const fetch = require('node-fetch');

class BollywoodApiService {
  constructor() {
    this.cache = new Cache();
    this.omdbBaseUrl = 'https://www.omdbapi.com';
    this.omdbApiKey = 'a9a76b01'; // Clé gratuite OMDb (limitée à 1000 requêtes/jour)
    this.source = 'omdb-bollywood';
    
    // Liste de mots-clés pour identifier les films Bollywood
    this.bollywoodKeywords = [
      'bollywood', 'hindi', 'india', 'indian', 'mumbai', 'delhi',
      'bengali', 'tamil', 'telugu', 'punjabi', 'marathi'
    ];
  }

  /**
   * Effectue une requête à l'API OMDb avec gestion du cache
   * @param {Object} params - Les paramètres de la requête
   * @returns {Promise<Object>} - La réponse de l'API
   * @private
   */
  async _fetchFromOMDb(params = {}) {
    // Construire l'URL avec les paramètres
    const url = new URL(this.omdbBaseUrl);
    
    // Ajouter la clé API et les paramètres de base
    url.searchParams.append('apikey', this.omdbApiKey);
    url.searchParams.append('r', 'json'); // Format JSON
    
    // Ajouter les paramètres spécifiques
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    // Créer une clé de cache
    const cacheKey = `bollywood_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    try {
      // Effectuer la requête
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Erreur API OMDb: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Vérifier si la réponse contient une erreur
      if (data.Response === 'False') {
        throw new Error(`Erreur API OMDb: ${data.Error}`);
      }
      
      // Mettre en cache les résultats (24 heures)
      await this.cache.set(cacheKey, JSON.stringify(data), 86400);
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la requête à OMDb: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Vérifie si un film est probablement un film Bollywood
   * @param {Object} movie - Le film à vérifier
   * @returns {boolean} - True si c'est probablement un film Bollywood
   * @private
   */
  _isBollywoodMovie(movie) {
    // Vérifier le pays
    if (movie.Country && movie.Country.includes('India')) {
      return true;
    }
    
    // Vérifier la langue
    if (movie.Language && (
      movie.Language.includes('Hindi') ||
      movie.Language.includes('Tamil') ||
      movie.Language.includes('Telugu') ||
      movie.Language.includes('Bengali')
    )) {
      return true;
    }
    
    // Vérifier le titre et le résumé
    const textToCheck = `${movie.Title} ${movie.Plot || ''} ${movie.Genre || ''}`.toLowerCase();
    return this.bollywoodKeywords.some(keyword => textToCheck.includes(keyword));
  }

  /**
   * Convertit un film OMDb en objet Bollywood
   * @param {Object} omdbMovie - Le film OMDb
   * @returns {Bollywood} - L'objet Bollywood
   * @private
   */
  _convertToBollywood(omdbMovie) {
    // Générer un ID unique si nécessaire
    const movieId = omdbMovie.imdbID || `omdb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Extraire l'année
    const year = omdbMovie.Year ? parseInt(omdbMovie.Year.split('–')[0]) : null;
    
    // Extraire les genres
    const genres = omdbMovie.Genre ? 
      omdbMovie.Genre.split(',').map(g => ({ id: 0, name: g.trim() })) : [];
    
    // Extraire le casting
    const cast = omdbMovie.Actors ? 
      omdbMovie.Actors.split(',').map(actor => ({
        id: 0,
        name: actor.trim(),
        role: 'Actor',
        character: ''
      })) : [];
    
    // Déterminer si c'est un film Bollywood
    const isBollywood = this._isBollywoodMovie(omdbMovie);
    
    // Score de pertinence
    const relevanceScore = isBollywood ? 100 : 50;
    
    return new Bollywood({
      id: movieId,
      title: omdbMovie.Title || '',
      original_title: omdbMovie.Title || '',
      overview: omdbMovie.Plot || '',
      poster_path: omdbMovie.Poster && omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
      backdrop_path: null, // OMDb ne fournit pas de backdrop
      release_date: omdbMovie.Released && omdbMovie.Released !== 'N/A' ? omdbMovie.Released : '',
      year: year,
      vote_average: omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A' ? 
        parseFloat(omdbMovie.imdbRating) : 0,
      vote_count: omdbMovie.imdbVotes && omdbMovie.imdbVotes !== 'N/A' ? 
        parseInt(omdbMovie.imdbVotes.replace(/,/g, '')) : 0,
      popularity: omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A' ? 
        parseFloat(omdbMovie.imdbRating) * 10 : 0,
      adult: omdbMovie.Rated === 'R' || omdbMovie.Rated === 'NC-17',
      genres: genres,
      production_company: omdbMovie.Production || '',
      language: omdbMovie.Language || '',
      cast: cast,
      director: omdbMovie.Director || '',
      music_director: '',
      is_trending: false,
      is_featured: false,
      relevance_score: relevanceScore,
      runtime: omdbMovie.Runtime || '',
      awards: omdbMovie.Awards || ''
    }, this.source);
  }

  /**
   * Récupère un film Bollywood par son ID
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Bollywood>} - Le film récupéré
   */
  async getMovie(id) {
    try {
      // Si l'ID est un ID IMDb (commence par 'tt')
      if (typeof id === 'string' && id.startsWith('tt')) {
        const data = await this._fetchFromOMDb({ i: id });
        return this._convertToBollywood(data);
      }
      
      // Si c'est un ID généré par notre service (commence par 'omdb-')
      if (typeof id === 'string' && id.startsWith('omdb-')) {
        // Essayer de récupérer depuis le cache
        const cacheKey = `bollywood_movie_${id}`;
        const cachedData = await this.cache.get(cacheKey);
        
        if (cachedData) {
          return JSON.parse(cachedData);
        }
        
        throw new Error(`Film non trouvé dans le cache: ${id}`);
      }
      
      // Sinon, essayer de rechercher par titre (en supposant que l'ID est un titre)
      const searchResults = await this.searchMovies(id.toString(), 1, 1);
      
      if (searchResults.data && searchResults.data.length > 0) {
        return searchResults.data[0];
      }
      
      throw new Error(`Film non trouvé: ${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération du film ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recherche des films Bollywood
   * @param {string} query - Le terme de recherche
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchMovies(query, page = 1, limit = 20) {
    try {
      // Ajouter des mots-clés Bollywood pour améliorer les résultats
      const bollywoodQuery = `${query} bollywood`;
      
      // Paramètres de recherche pour OMDb
      const searchParams = {
        s: bollywoodQuery,
        page: page,
        type: 'movie' // Uniquement les films
      };
      
      const data = await this._fetchFromOMDb(searchParams);
      
      // Vérifier si nous avons des résultats
      if (!data.Search || !Array.isArray(data.Search)) {
        // Essayer sans le mot-clé "bollywood"
        const fallbackParams = {
          s: query,
          page: page,
          type: 'movie'
        };
        
        const fallbackData = await this._fetchFromOMDb(fallbackParams);
        
        if (!fallbackData.Search || !Array.isArray(fallbackData.Search)) {
          return { data: [], page: page, total_pages: 0, total_results: 0 };
        }
        
        data.Search = fallbackData.Search;
        data.totalResults = fallbackData.totalResults;
      }
      
      // Récupérer les détails complets pour chaque film
      const detailedMovies = [];
      
      for (const movie of data.Search.slice(0, limit)) {
        try {
          if (movie.imdbID) {
            const movieDetails = await this._fetchFromOMDb({ i: movie.imdbID });
            
            // Vérifier si c'est un film Bollywood
            if (this._isBollywoodMovie(movieDetails)) {
              const bollywoodMovie = this._convertToBollywood(movieDetails);
              detailedMovies.push(bollywoodMovie);
              
              // Mettre en cache le film pour les futures requêtes
              const cacheKey = `bollywood_movie_${bollywoodMovie.id}`;
              await this.cache.set(cacheKey, JSON.stringify(bollywoodMovie), 86400);
            }
          }
        } catch (detailError) {
          console.error(`Erreur lors de la récupération des détails du film ${movie.imdbID}: ${detailError.message}`);
          // Continuer avec le film suivant
        }
      }
      
      // Trier par pertinence
      detailedMovies.sort((a, b) => b.relevance_score - a.relevance_score);
      
      // Calculer le nombre total de pages
      const totalResults = parseInt(data.totalResults) || 0;
      const totalPages = Math.ceil(totalResults / limit);
      
      return {
        data: detailedMovies,
        page: page,
        total_pages: totalPages,
        total_results: detailedMovies.length
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche de films: ${error.message}`);
      return { data: [], page: 1, total_pages: 0, total_results: 0 };
    }
  }

  /**
   * Récupère les films Bollywood en tendance
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films en tendance
   */
  async getTrendingMovies(limit = 15) {
    try {
      // Utiliser une liste de films Bollywood populaires prédéfinis
      const popularBollywoodMovies = [
        'Pathaan',
        'Jawan',
        'Animal',
        'Kalki 2898 AD',
        'Dunki',
        'Stree 2',
        'Tiger 3',
        'Brahmastra',
        'RRR',
        'Gadar 2',
        'The Kerala Story',
        'Pushpa',
        'KGF Chapter 2',
        'Kantara',
        'Adipurush',
        'Singham Again',
        'Baahubali',
        'Dangal',
        'PK',
        '3 Idiots'
      ];
      
      // Récupérer les détails pour chaque film
      const trendingMovies = [];
      
      for (const title of popularBollywoodMovies.slice(0, limit)) {
        try {
          // Rechercher le film par titre
          const searchParams = {
            t: title,
            y: '' // Année non spécifiée pour avoir plus de chances de trouver
          };
          
          const movieData = await this._fetchFromOMDb(searchParams);
          
          if (movieData) {
            const movie = this._convertToBollywood(movieData);
            movie.is_trending = true;
            trendingMovies.push(movie);
            
            // Mettre en cache le film
            const cacheKey = `bollywood_movie_${movie.id}`;
            await this.cache.set(cacheKey, JSON.stringify(movie), 86400);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du film ${title}: ${error.message}`);
          // Continuer avec le film suivant
        }
      }
      
      return trendingMovies;
    } catch (error) {
      console.error(`Erreur lors de la récupération des films en tendance: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films récents
   */
  async getRecentMovies(limit = 15) {
    try {
      // Obtenir l'année actuelle et l'année précédente
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      // Liste des films Bollywood récents (2024-2025)
      const recentBollywoodMovies = [
        { title: 'Kalki 2898 AD', year: currentYear },
        { title: 'Stree 2', year: currentYear },
        { title: 'Singham Again', year: currentYear },
        { title: 'Pushpa 2', year: currentYear },
        { title: 'Jawan', year: lastYear },
        { title: 'Animal', year: lastYear },
        { title: 'Dunki', year: lastYear },
        { title: 'Tiger 3', year: lastYear },
        { title: 'Pathaan', year: lastYear },
        { title: 'Gadar 2', year: lastYear },
        { title: 'The Kerala Story', year: lastYear },
        { title: 'Rocky Aur Rani Kii Prem Kahaani', year: lastYear },
        { title: 'Tu Jhoothi Main Makkaar', year: lastYear },
        { title: 'Adipurush', year: lastYear },
        { title: 'Bholaa', year: lastYear }
      ];
      
      // Récupérer les détails pour chaque film
      const recentMovies = [];
      
      for (const movie of recentBollywoodMovies.slice(0, limit)) {
        try {
          // Rechercher le film par titre et année
          const searchParams = {
            t: movie.title,
            y: movie.year.toString()
          };
          
          const movieData = await this._fetchFromOMDb(searchParams);
          
          if (movieData) {
            const bollywoodMovie = this._convertToBollywood(movieData);
            bollywoodMovie.is_trending = false;
            bollywoodMovie.is_featured = true;
            recentMovies.push(bollywoodMovie);
            
            // Mettre en cache le film
            const cacheKey = `bollywood_movie_${bollywoodMovie.id}`;
            await this.cache.set(cacheKey, JSON.stringify(bollywoodMovie), 86400);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du film ${movie.title}: ${error.message}`);
          // Continuer avec le film suivant
        }
      }
      
      return recentMovies;
    } catch (error) {
      console.error(`Erreur lors de la récupération des films récents: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films populaires
   */
  async getPopularMovies(limit = 15) {
    try {
      // Liste des films Bollywood populaires de tous les temps
      const popularBollywoodMovies = [
        'Dangal',
        'Baahubali 2: The Conclusion',
        'Secret Superstar',
        'Bajrangi Bhaijaan',
        'PK',
        '3 Idiots',
        'Dhoom 3',
        'Sultan',
        'Padmaavat',
        'Sanju',
        'Tiger Zinda Hai',
        'War',
        'Kabir Singh',
        'Uri: The Surgical Strike',
        'Tanhaji',
        'Dilwale',
        'Chennai Express',
        'Krrish 3',
        'Kick',
        'Race 3'
      ];
      
      // Récupérer les détails pour chaque film
      const popularMovies = [];
      
      for (const title of popularBollywoodMovies.slice(0, limit)) {
        try {
          // Rechercher le film par titre
          const searchParams = {
            t: title,
            y: '' // Année non spécifiée pour avoir plus de chances de trouver
          };
          
          const movieData = await this._fetchFromOMDb(searchParams);
          
          if (movieData) {
            const movie = this._convertToBollywood(movieData);
            movie.is_featured = true;
            popularMovies.push(movie);
            
            // Mettre en cache le film
            const cacheKey = `bollywood_movie_${movie.id}`;
            await this.cache.set(cacheKey, JSON.stringify(movie), 86400);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du film ${title}: ${error.message}`);
          // Continuer avec le film suivant
        }
      }
      
      return popularMovies;
    } catch (error) {
      console.error(`Erreur lors de la récupération des films populaires: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood par genre
   * @param {string} genre - Le genre
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du genre
   */
  async getMoviesByGenre(genre, page = 1, limit = 20) {
    try {
      // Normaliser le genre pour la recherche
      const normalizedGenre = genre.toLowerCase().trim();
      
      // Mapper les genres Bollywood courants
      const genreMap = {
        'action': 'Action',
        'aventure': 'Adventure',
        'comedie': 'Comedy',
        'comédie': 'Comedy',
        'drame': 'Drama',
        'romance': 'Romance',
        'thriller': 'Thriller',
        'horreur': 'Horror',
        'famille': 'Family',
        'musical': 'Musical',
        'biographie': 'Biography',
        'historique': 'History',
        'guerre': 'War',
        'crime': 'Crime',
        'fantastique': 'Fantasy',
        'sci-fi': 'Sci-Fi',
        'science-fiction': 'Sci-Fi'
      };
      
      // Obtenir le genre en anglais pour la recherche
      const searchGenre = genreMap[normalizedGenre] || normalizedGenre;
      
      // Utiliser la recherche par mot-clé pour trouver des films du genre spécifié
      // Nous ajoutons "bollywood" pour améliorer les résultats
      const searchQuery = `bollywood ${searchGenre}`;
      
      // Effectuer la recherche
      const searchResults = await this.searchMovies(searchQuery, page, limit * 2);
      
      // Filtrer les résultats pour ne garder que ceux qui correspondent au genre
      const filteredResults = searchResults.data.filter(movie => {
        if (!movie.genres || !Array.isArray(movie.genres)) {
          return false;
        }
        
        // Vérifier si le film a le genre recherché
        return movie.genres.some(g => {
          const genreName = typeof g === 'string' ? g : (g.name || '');
          return genreName.toLowerCase().includes(searchGenre.toLowerCase());
        });
      }).slice(0, limit);
      
      return {
        data: filteredResults,
        page: page,
        total_pages: Math.ceil(filteredResults.length / limit),
        total_results: filteredResults.length
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des films par genre: ${error.message}`);
      return { data: [], page: 1, total_pages: 0, total_results: 0 };
    }
  }

  /**
   * Récupère les films Bollywood par acteur
   * @param {string} actor - L'acteur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films de l'acteur
   */
  async getMoviesByActor(actor, page = 1, limit = 20) {
    try {
      // Utiliser la recherche par mot-clé pour trouver des films avec l'acteur spécifié
      const searchQuery = `${actor} bollywood`;
      
      // Effectuer la recherche
      const searchResults = await this.searchMovies(searchQuery, page, limit * 2);
      
      // Filtrer les résultats pour ne garder que ceux qui ont l'acteur dans le casting
      const filteredResults = searchResults.data.filter(movie => {
        if (!movie.cast || !Array.isArray(movie.cast)) {
          return false;
        }
        
        // Vérifier si l'acteur est dans le casting
        return movie.cast.some(castMember => {
          if (typeof castMember === 'string') {
            return castMember.toLowerCase().includes(actor.toLowerCase());
          }
          return castMember.name && castMember.name.toLowerCase().includes(actor.toLowerCase());
        });
      }).slice(0, limit);
      
      // Si nous n'avons pas assez de résultats, essayer avec des acteurs populaires de Bollywood
      if (filteredResults.length === 0) {
        // Mapper les noms d'acteurs courants en hindi/anglais
        const actorMap = {
          'shahrukh': 'Shah Rukh Khan',
          'shah rukh': 'Shah Rukh Khan',
          'srk': 'Shah Rukh Khan',
          'aamir': 'Aamir Khan',
          'salman': 'Salman Khan',
          'akshay': 'Akshay Kumar',
          'amitabh': 'Amitabh Bachchan',
          'hrithik': 'Hrithik Roshan',
          'deepika': 'Deepika Padukone',
          'priyanka': 'Priyanka Chopra',
          'katrina': 'Katrina Kaif',
          'alia': 'Alia Bhatt',
          'ranveer': 'Ranveer Singh',
          'ranbir': 'Ranbir Kapoor'
        };
        
        // Vérifier si l'acteur est dans notre mapping
        const normalizedActor = actor.toLowerCase();
        const mappedActor = Object.keys(actorMap).find(key => normalizedActor.includes(key));
        
        if (mappedActor) {
          // Utiliser le nom complet pour la recherche
          const fullName = actorMap[mappedActor];
          const newSearchQuery = `${fullName} bollywood`;
          
          // Effectuer une nouvelle recherche
          const newSearchResults = await this.searchMovies(newSearchQuery, page, limit);
          return {
            data: newSearchResults.data,
            page: page,
            total_pages: Math.ceil(newSearchResults.data.length / limit),
            total_results: newSearchResults.data.length
          };
        }
      }
      
      return {
        data: filteredResults,
        page: page,
        total_pages: Math.ceil(filteredResults.length / limit),
        total_results: filteredResults.length
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des films par acteur: ${error.message}`);
      return { data: [], page: 1, total_pages: 0, total_results: 0 };
    }
  }

  /**
   * Récupère les films Bollywood par réalisateur
   * @param {string} director - Le réalisateur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du réalisateur
   */
  async getMoviesByDirector(director, page = 1, limit = 20) {
    try {
      // Utiliser la recherche par mot-clé pour trouver des films avec le réalisateur spécifié
      const searchQuery = `${director} bollywood director`;
      
      // Effectuer la recherche
      const searchResults = await this.searchMovies(searchQuery, page, limit * 2);
      
      // Filtrer les résultats pour ne garder que ceux qui ont le réalisateur
      const filteredResults = searchResults.data.filter(movie => {
        if (!movie.director) {
          return false;
        }
        
        // Vérifier si le réalisateur correspond
        return movie.director.toLowerCase().includes(director.toLowerCase());
      }).slice(0, limit);
      
      // Si nous n'avons pas assez de résultats, essayer avec des réalisateurs populaires de Bollywood
      if (filteredResults.length === 0) {
        // Mapper les noms de réalisateurs courants en hindi/anglais
        const directorMap = {
          'karan': 'Karan Johar',
          'johar': 'Karan Johar',
          'sanjay': 'Sanjay Leela Bhansali',
          'bhansali': 'Sanjay Leela Bhansali',
          'rohit': 'Rohit Shetty',
          'shetty': 'Rohit Shetty',
          'rajkumar': 'Rajkumar Hirani',
          'hirani': 'Rajkumar Hirani',
          'imtiaz': 'Imtiaz Ali',
          'ali': 'Imtiaz Ali',
          'zoya': 'Zoya Akhtar',
          'akhtar': 'Zoya Akhtar',
          'anurag': 'Anurag Kashyap',
          'kashyap': 'Anurag Kashyap',
          'yash': 'Yash Chopra',
          'chopra': 'Yash Chopra'
        };
        
        // Vérifier si le réalisateur est dans notre mapping
        const normalizedDirector = director.toLowerCase();
        const mappedDirector = Object.keys(directorMap).find(key => normalizedDirector.includes(key));
        
        if (mappedDirector) {
          // Utiliser le nom complet pour la recherche
          const fullName = directorMap[mappedDirector];
          const newSearchQuery = `${fullName} bollywood`;
          
          // Effectuer une nouvelle recherche
          const newSearchResults = await this.searchMovies(newSearchQuery, page, limit);
          
          // Filtrer pour ne garder que les films où le réalisateur correspond
          const newFilteredResults = newSearchResults.data.filter(movie => {
            if (!movie.director) {
              return false;
            }
            return movie.director.toLowerCase().includes(fullName.toLowerCase());
          }).slice(0, limit);
          
          return {
            data: newFilteredResults,
            page: page,
            total_pages: Math.ceil(newFilteredResults.length / limit),
            total_results: newFilteredResults.length
          };
        }
      }
      
      return {
        data: filteredResults,
        page: page,
        total_pages: Math.ceil(filteredResults.length / limit),
        total_results: filteredResults.length
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des films par réalisateur: ${error.message}`);
      return { data: [], page: 1, total_pages: 0, total_results: 0 };
    }
  }
}

module.exports = BollywoodApiService;
