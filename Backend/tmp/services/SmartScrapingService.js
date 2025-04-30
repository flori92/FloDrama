import { EventEmitter } from 'events';

/**
 * Service proxy pour les requêtes HTTP avec gestion des erreurs et retries
 */
class ProxyService {
  constructor() {
    this.defaultConfig = {
      maxRetries: 3,
      timeout: 10000,
      proxyUrl: 'https://proxy.flodrama.com'
    };
    this.config = { ...this.defaultConfig };
  }

  /**
   * Configure le service proxy
   * @param {Object} config - Configuration du proxy
   */
  async configure(config = {}) {
    this.config = { ...this.defaultConfig, ...config };
    console.log('ProxyService configuré');
  }

  /**
   * Effectue une requête HTTP avec gestion des retries
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Résultat de la requête
   */
  async fetchWithRetry(options) {
    const { url, maxRetries = this.config.maxRetries, timeout = this.config.timeout } = options;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Ajouter un délai entre les tentatives
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        // Effectuer la requête
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
          },
          timeout
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.text();
      } catch (error) {
        console.error(`Tentative ${attempt + 1}/${maxRetries} échouée pour ${url}:`, error.message);
        
        // Si c'est la dernière tentative, propager l'erreur
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
  }
}

/**
 * Service de catégorisation de contenu
 */
class ContentCategorizer {
  constructor() {
    this.categories = {
      drama: ['korean', 'chinese', 'japanese', 'thai'],
      movie: ['action', 'romance', 'comedy', 'thriller'],
      anime: ['shonen', 'seinen', 'shojo', 'mecha'],
      kshow: ['variety', 'reality', 'talk', 'documentary'],
      bollywood: ['romance', 'musical', 'action', 'comedy'],
      tvshow: ['drama', 'scifi', 'fantasy', 'crime']
    };
    this.config = {};
  }

  /**
   * Configure le service de catégorisation
   * @param {Object} config - Configuration du service
   */
  async configure(config = {}) {
    this.config = config;
    console.log('ContentCategorizer configuré');
  }

  /**
   * Catégorise une liste de contenus
   * @param {Array} contents - Liste des contenus à catégoriser
   * @returns {Promise<Array>} - Contenus catégorisés
   */
  async categorize(contents) {
    return contents.map(content => {
      // Déterminer le type de contenu
      const type = this.determineContentType(content);
      
      // Déterminer la catégorie
      const category = this.determineCategory(content, type);
      
      return {
        ...content,
        type,
        category
      };
    });
  }

  /**
   * Détermine le type de contenu
   * @param {Object} content - Contenu à analyser
   * @returns {string} - Type de contenu
   */
  determineContentType(content) {
    // Logique de détermination du type basée sur le titre, la description, etc.
    const title = content.title?.toLowerCase() || '';
    const description = content.description?.toLowerCase() || '';
    
    if (title.includes('episode') || title.includes('ep.') || content.episodesAvailable > 1) {
      if (title.includes('anime') || description.includes('anime') || content.source?.includes('anime')) {
        return 'anime';
      } else if (title.includes('bollywood') || description.includes('bollywood') || description.includes('inde')) {
        return 'bollywood';
      } else if (title.includes('variety') || title.includes('reality') || title.includes('show')) {
        if (description.includes('korea') || description.includes('corée')) {
          return 'kshow';
        }
        return 'tvshow';
      }
      return 'drama';
    } else if (title.includes('movie') || content.duration?.includes('h')) {
      if (title.includes('bollywood') || description.includes('bollywood') || description.includes('inde')) {
        return 'bollywood';
      }
      return 'movie';
    } else if (title.includes('anime') || content.source?.includes('anime')) {
      return 'anime';
    } else if (title.includes('show') || title.includes('variety')) {
      if (description.includes('korea') || description.includes('corée')) {
        return 'kshow';
      }
      return 'tvshow';
    } else if (title.includes('bollywood') || description.includes('bollywood') || description.includes('inde')) {
      return 'bollywood';
    }
    
    // Par défaut, considérer comme un drama
    return 'drama';
  }

  /**
   * Détermine la catégorie du contenu
   * @param {Object} content - Contenu à analyser
   * @param {string} type - Type de contenu
   * @returns {string} - Catégorie
   */
  determineCategory(content, type) {
    // Logique de détermination de la catégorie
    const description = content.description?.toLowerCase() || '';
    
    // Parcourir les catégories possibles pour ce type
    const possibleCategories = this.categories[type] || [];
    
    for (const category of possibleCategories) {
      if (description.includes(category)) {
        return category;
      }
    }
    
    // Catégorie par défaut selon le type
    return type;
  }
}

/**
 * Service de scraping intelligent pour FloDrama
 */
export class SmartScrapingService {
    constructor() {
        this.sources = [
            'dramacool',
            'myasiantv',
            'dramanice',
            'kissasian',
            'viki',
            'wetv',
            'iqiyi',
            'kocowa',
            'viu'
        ];
        this.events = new EventEmitter();
        this.proxyService = new ProxyService();
        this.contentCategorizer = new ContentCategorizer();
        this.config = {};
        
        // Cache pour stocker les identifiants des contenus déjà récupérés
        this.contentCache = {
            lastUpdate: null,
            contentIds: new Set(),
            episodeIds: new Map(), // Map des épisodes par série
            updatedSeries: new Set() // Séries mises à jour lors de cette session
        };
    }
    
    /**
     * Configure le service de scraping avec les paramètres spécifiés
     */
    async configure(config) {
        this.config = config;
        await this.proxyService.configure(config.proxy);
        await this.contentCategorizer.configure(config.categorization);
        
        // Charger le cache précédent si disponible
        if (config.useCache !== false && config.cacheFile) {
            try {
                const fs = await import('fs/promises');
                try {
                    const cacheData = await fs.readFile(config.cacheFile, 'utf8');
                    const parsedCache = JSON.parse(cacheData);
                    
                    this.contentCache.lastUpdate = parsedCache.lastUpdate || null;
                    this.contentCache.contentIds = new Set(parsedCache.contentIds || []);
                    
                    // Reconstruire la Map des épisodes
                    this.contentCache.episodeIds = new Map();
                    if (parsedCache.episodeIds) {
                        Object.entries(parsedCache.episodeIds).forEach(([seriesId, episodes]) => {
                            this.contentCache.episodeIds.set(seriesId, new Set(episodes));
                        });
                    }
                    
                    console.log(`📂 Cache chargé: ${this.contentCache.contentIds.size} contenus et ${this.contentCache.episodeIds.size} séries en cache`);
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        console.warn(`⚠️ Erreur lors du chargement du cache:`, error.message);
                    } else {
                        console.log(`📂 Aucun cache existant trouvé, création d'un nouveau cache`);
                    }
                    // Initialiser un cache vide
                    this.contentCache.lastUpdate = null;
                    this.contentCache.contentIds = new Set();
                    this.contentCache.episodeIds = new Map();
                }
            } catch (error) {
                console.warn(`⚠️ Module fs non disponible, fonctionnement sans cache persistant`);
            }
        }
    }
    
    /**
     * Lance une recherche intelligente sur toutes les sources configurées
     */
    async searchContent(query, options = {}) {
        const results = await Promise.all(this.sources.map(source => this.scrapeSource(source, query, options)));
        const uniqueResults = this.deduplicateResults(results.flat());
        const categorizedResults = await this.contentCategorizer.categorize(uniqueResults);
        return this.rankResults(categorizedResults, query);
    }
    
    /**
     * Récupère les informations détaillées d'un contenu spécifique
     */
    async getContentDetails(contentId, source) {
        try {
            const details = await this.proxyService.fetchWithRetry({
                url: this.buildDetailUrl(contentId, source),
                maxRetries: 3,
                timeout: 10000
            });
            
            // Implémentation de l'analyse des détails
            const parsedDetails = {
                id: contentId,
                source,
                title: `Contenu ${contentId} de ${source}`,
                description: 'Description détaillée du contenu',
                // Autres propriétés
            };
            
            return parsedDetails;
        } catch (error) {
            console.error(`Erreur lors de la récupération des détails pour ${contentId} sur ${source}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Récupère les liens de streaming pour un épisode spécifique
     */
    async getStreamingLinks(episodeId, source) {
        try {
            const links = await this.proxyService.fetchWithRetry({
                url: this.buildStreamingUrl(episodeId, source),
                maxRetries: 3,
                timeout: 10000
            });
            
            // Implémentation de l'analyse des liens de streaming
            const parsedLinks = [
                {
                    quality: '720p',
                    url: `https://stream.flodrama.com/${source}/${episodeId}/720p`,
                    format: 'mp4'
                },
                {
                    quality: '1080p',
                    url: `https://stream.flodrama.com/${source}/${episodeId}/1080p`,
                    format: 'mp4'
                }
            ];
            
            return parsedLinks;
        } catch (error) {
            console.error(`Erreur lors de la récupération des liens de streaming pour ${episodeId} sur ${source}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Met à jour la base de données de contenu en arrière-plan
     */
    async updateContentDatabase() {
        this.events.emit('updateStart');
        const allResults = [];
        
        try {
            // Nombre d'éléments à récupérer par source (minimum 150 par source)
            const minItemsPerSource = 150;
            
            for (const source of this.sources) {
                console.log(`🔍 Mise à jour de la source: ${source}...`);
                
                // Récupérer le contenu existant pour cette source
                const existingCount = this.getExistingContentCount(source);
                console.log(`📊 ${existingCount} éléments déjà en cache pour ${source}`);
                
                // Calculer combien d'éléments supplémentaires nous devons récupérer
                const targetCount = Math.max(minItemsPerSource, existingCount + 50);
                
                // Récupérer le contenu pour cette source
                const results = await this.updateSourceContent(source, targetCount);
                
                if (results && results.length > 0) {
                    // Filtrer les résultats pour ne garder que les nouveaux éléments ou les mises à jour
                    const newResults = this.filterNewContent(results, source);
                    
                    console.log(`✅ ${newResults.length} nouveaux éléments récupérés pour ${source}`);
                    allResults.push(...newResults);
                    
                    // Mettre à jour le cache avec les nouveaux éléments
                    this.updateContentCache(newResults);
                }
            }
            
            // Sauvegarder le cache
            await this.saveContentCache();
            
            console.log(`✅ Base de données mise à jour avec ${allResults.length} éléments`);
            this.events.emit('updateComplete', { count: allResults.length });
            return allResults;
        }
        catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la base de données:', error);
            this.events.emit('updateError', error);
            throw error;
        }
    }
    
    /**
     * Compte le nombre d'éléments existants pour une source
     * @param {string} source - Source à vérifier
     * @returns {number} - Nombre d'éléments
     */
    getExistingContentCount(source) {
        // Compter les éléments dont l'ID commence par la source
        let count = 0;
        for (const contentId of this.contentCache.contentIds) {
            if (contentId.startsWith(`${source}-`)) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Filtre les nouveaux contenus ou les mises à jour
     * @param {Array} results - Résultats à filtrer
     * @param {string} _source - Source des résultats
     * @returns {Array} - Nouveaux résultats filtrés
     */
    filterNewContent(results, _source) {
        return results.filter(item => {
            // Si c'est un nouvel élément, on le garde
            if (!this.contentCache.contentIds.has(item.id)) {
                return true;
            }
            
            // Si c'est une série et qu'elle a de nouveaux épisodes, on la garde
            if (item.type === 'drama' || item.type === 'anime' || item.type === 'tvshow') {
                const seriesId = item.id;
                const currentEpisodes = this.contentCache.episodeIds.get(seriesId) || new Set();
                
                // Vérifier si de nouveaux épisodes sont disponibles
                if (item.episodesAvailable > currentEpisodes.size) {
                    // Marquer cette série comme mise à jour
                    this.contentCache.updatedSeries.add(seriesId);
                    return true;
                }
            }
            
            return false;
        });
    }
    
    /**
     * Met à jour le cache de contenu avec les nouveaux éléments
     * @param {Array} newResults - Nouveaux résultats à ajouter au cache
     */
    updateContentCache(newResults) {
        for (const item of newResults) {
            // Ajouter l'ID au cache
            this.contentCache.contentIds.add(item.id);
            
            // Si c'est une série, mettre à jour les épisodes
            if ((item.type === 'drama' || item.type === 'anime' || item.type === 'tvshow') && item.episodesAvailable > 0) {
                const seriesId = item.id;
                let episodeSet = this.contentCache.episodeIds.get(seriesId);
                
                if (!episodeSet) {
                    episodeSet = new Set();
                    this.contentCache.episodeIds.set(seriesId, episodeSet);
                }
                
                // Ajouter les épisodes au cache
                for (let i = 1; i <= item.episodesAvailable; i++) {
                    episodeSet.add(`${seriesId}-ep${i}`);
                }
            }
        }
        
        // Mettre à jour la date de dernière mise à jour
        this.contentCache.lastUpdate = new Date().toISOString();
    }
    
    /**
     * Sauvegarde le cache de contenu dans un fichier
     */
    async saveContentCache() {
        if (!this.config.cacheFile) {
            return;
        }
        
        try {
            const fs = await import('fs/promises');
            
            // Convertir le cache en format JSON-compatible
            const cacheToSave = {
                lastUpdate: this.contentCache.lastUpdate,
                contentIds: Array.from(this.contentCache.contentIds),
                episodeIds: {}
            };
            
            // Convertir la Map des épisodes en objet
            for (const [seriesId, episodes] of this.contentCache.episodeIds.entries()) {
                cacheToSave.episodeIds[seriesId] = Array.from(episodes);
            }
            
            await fs.writeFile(this.config.cacheFile, JSON.stringify(cacheToSave, null, 2), 'utf8');
            console.log(`📂 Cache sauvegardé: ${this.contentCache.contentIds.size} contenus et ${this.contentCache.episodeIds.size} séries`);
        } catch (error) {
            console.warn(`⚠️ Erreur lors de la sauvegarde du cache:`, error.message);
        }
    }
    
    /**
     * Scrape une source spécifique
     */
    async scrapeSource(source, query, _options) {
        try {
            const response = await this.proxyService.fetchWithRetry({
                url: this.buildSearchUrl(query, source),
                maxRetries: 3,
                timeout: 10000
            });
            
            // Simuler l'analyse des résultats de recherche
            console.log(`Analyse des résultats de recherche pour "${query}" sur ${source} (${response.substring(0, 50)}...)`);
            
            // Simuler les résultats de recherche
            const results = [
                {
                    id: `${source}-1`,
                    title: `${query} - Résultat 1`,
                    source,
                    year: '2023',
                    rating: 8.5,
                    episodesAvailable: 16
                },
                {
                    id: `${source}-2`,
                    title: `${query} - Résultat 2`,
                    source,
                    year: '2022',
                    rating: 7.8,
                    episodesAvailable: 12
                }
            ];
            
            return results;
        }
        catch (error) {
            this.events.emit('scrapeError', { source, error });
            return [];
        }
    }
    
    /**
     * Déduplique les résultats
     */
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = `${result.title}-${result.year}-${result.source}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    
    /**
     * Trie les résultats par pertinence
     */
    rankResults(results, query) {
        return results.sort((a, b) => {
            // Algorithme de ranking basé sur :
            // - Pertinence par rapport à la recherche
            // - Qualité de la source
            // - Disponibilité des épisodes
            // - Notes des utilisateurs
            const scoreA = this.calculateRelevanceScore(a, query);
            const scoreB = this.calculateRelevanceScore(b, query);
            return scoreB - scoreA;
        });
    }
    
    /**
     * Calcule le score de pertinence d'un contenu
     */
    calculateRelevanceScore(content, query) {
        let score = 0;
        
        // Score basé sur la correspondance du titre
        if (content.title && query) {
            const titleLower = content.title.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (titleLower === queryLower) {
                score += 10;
            } else if (titleLower.includes(queryLower)) {
                score += 5;
            } else if (queryLower.split(' ').some(word => titleLower.includes(word))) {
                score += 2;
            }
        }
        
        // Score basé sur la qualité de la source
        const sourceQuality = {
            'viki': 5,
            'iqiyi': 4.5,
            'wetv': 4,
            'kocowa': 4,
            'dramacool': 3.5,
            'myasiantv': 3,
            'kissasian': 3,
            'dramanice': 2.5,
            'viu': 4
        };
        
        score += sourceQuality[content.source] || 1;
        
        // Score basé sur la disponibilité
        score += content.episodesAvailable ? content.episodesAvailable * 0.1 : 0;
        
        // Score basé sur les notes
        score += content.rating ? content.rating * 0.5 : 0;
        
        return score;
    }
    
    /**
     * Met à jour le contenu d'une source spécifique
     */
    async updateSourceContent(_source, _targetCount) {
        // Simuler la récupération de contenu populaire pour cette source
        const results = [];
        
        // Types de contenu à générer
        const contentTypes = ['drama', 'movie', 'anime', 'kshow', 'bollywood', 'tvshow'];
        
        // Nombre d'éléments par type
        const itemsPerType = Math.floor(_targetCount / contentTypes.length); // Répartir les éléments par type
        
        // Générer des données pour chaque type de contenu
        for (const type of contentTypes) {
            for (let i = 1; i <= itemsPerType; i++) {
                // Générer un ID unique
                const uniqueId = `${_source}-${type}-${i}`;
                
                // Déterminer l'année de sortie (entre 2018 et 2025)
                const year = 2018 + Math.floor(Math.random() * 8);
                
                // Déterminer le nombre d'épisodes selon le type
                let episodesAvailable = 1;
                if (type === 'drama') {
                    episodesAvailable = Math.floor(Math.random() * 20) + 1; // 1-20 épisodes
                } else if (type === 'anime') {
                    episodesAvailable = Math.floor(Math.random() * 24) + 1; // 1-24 épisodes
                } else if (type === 'kshow') {
                    episodesAvailable = Math.floor(Math.random() * 100) + 1; // 1-100 épisodes
                } else if (type === 'tvshow') {
                    episodesAvailable = Math.floor(Math.random() * 50) + 1; // 1-50 épisodes
                }
                
                // Générer un titre selon le type
                let title = '';
                if (type === 'drama') {
                    const dramaNames = ['Love in Seoul', 'Secret Garden', 'Flower of Evil', 'Crash Landing', 'Business Proposal', 'Vincenzo'];
                    title = `${dramaNames[Math.floor(Math.random() * dramaNames.length)]} ${i}`;
                } else if (type === 'movie') {
                    const movieNames = ['The King', 'Parasite', 'Train to Busan', 'Peninsula', 'The Handmaiden', 'Burning'];
                    title = `${movieNames[Math.floor(Math.random() * movieNames.length)]} ${i}`;
                } else if (type === 'anime') {
                    const animeNames = ['Attack on Titan', 'Demon Slayer', 'My Hero Academia', 'Jujutsu Kaisen', 'One Piece', 'Naruto'];
                    title = `${animeNames[Math.floor(Math.random() * animeNames.length)]} ${i}`;
                } else if (type === 'kshow') {
                    const kshowNames = ['Running Man', 'Knowing Bros', 'Return of Superman', 'I Live Alone', 'Master in the House', '2 Days 1 Night'];
                    title = `${kshowNames[Math.floor(Math.random() * kshowNames.length)]} ${i}`;
                } else if (type === 'bollywood') {
                    const bollywoodNames = ['Dilwale Dulhania Le Jayenge', 'Kuch Kuch Hota Hai', 'Dil To Pagal Hai', 'Kabhi Khushi Kabhie Gham', 'Lagaan', 'Taare Zameen Par'];
                    title = `${bollywoodNames[Math.floor(Math.random() * bollywoodNames.length)]} ${i}`;
                } else if (type === 'tvshow') {
                    const tvshowNames = ['Game of Thrones', 'Breaking Bad', 'The Crown', 'Stranger Things', 'Money Heist', 'The Witcher'];
                    title = `${tvshowNames[Math.floor(Math.random() * tvshowNames.length)]} ${i}`;
                }
                
                // Générer des acteurs
                const actors = [];
                const actorPool = ['Kim Soo Hyun', 'Song Joong Ki', 'Lee Min Ho', 'Hyun Bin', 'Park Seo Joon', 'Ji Chang Wook', 
                                   'Son Ye Jin', 'IU', 'Park Min Young', 'Jun Ji Hyun', 'Kim Go Eun', 'Bae Suzy'];
                
                // Ajouter 3-5 acteurs aléatoires
                const actorCount = 3 + Math.floor(Math.random() * 3);
                for (let j = 0; j < actorCount; j++) {
                    const randomActor = actorPool[Math.floor(Math.random() * actorPool.length)];
                    if (!actors.includes(randomActor)) {
                        actors.push(randomActor);
                    }
                }
                
                // Générer des genres
                const genres = [];
                const genrePool = {
                    drama: ['Romance', 'Mélodrame', 'Historique', 'Action', 'Thriller', 'Comédie'],
                    movie: ['Action', 'Thriller', 'Horreur', 'Romance', 'Comédie', 'Drame'],
                    anime: ['Shonen', 'Seinen', 'Shojo', 'Action', 'Aventure', 'Fantasy'],
                    kshow: ['Variété', 'Réalité', 'Talk-show', 'Jeu', 'Documentaire', 'Cuisine'],
                    bollywood: ['Romance', 'Comédie', 'Drame', 'Action', 'Thriller', 'Musical'],
                    tvshow: ['Drame', 'Science-fiction', 'Fantasy', 'Horreur', 'Comédie', 'Action']
                };
                
                // Ajouter 2-3 genres aléatoires
                const genreCount = 2 + Math.floor(Math.random() * 2);
                const typeGenres = genrePool[type] || genrePool.drama;
                for (let j = 0; j < genreCount; j++) {
                    const randomGenre = typeGenres[Math.floor(Math.random() * typeGenres.length)];
                    if (!genres.includes(randomGenre)) {
                        genres.push(randomGenre);
                    }
                }
                
                // Générer une note (entre 7.0 et 9.8)
                const rating = (7 + Math.random() * 2.8).toFixed(1);
                
                // Ajouter l'élément à la liste des résultats
                results.push({
                    id: uniqueId,
                    title: title,
                    type: type,
                    source: _source,
                    year: year.toString(),
                    rating: parseFloat(rating),
                    episodesAvailable: episodesAvailable,
                    description: `${title} est un ${type} ${genres.join(', ')} de ${year} avec ${actors.join(', ')}. Une production populaire sur ${_source}.`,
                    image: `https://flodrama.com/images/${_source}/${type}/${i}.jpg`,
                    actors: actors,
                    genres: genres,
                    duration: type === 'movie' ? `${Math.floor(90 + Math.random() * 60)}min` : `${Math.floor(40 + Math.random() * 20)}min`,
                    country: type === 'anime' ? 'Japon' : type === 'bollywood' ? 'Inde' : 'Corée du Sud',
                    status: Math.random() > 0.3 ? 'Terminé' : 'En cours'
                });
            }
        }
        
        return results;
    }
    
    /**
     * Construit l'URL de recherche pour une source
     */
    buildSearchUrl(_query, _source) {
        // Construction des URLs de recherche spécifiques à chaque source
        const urls = {
            'dramacool': `https://dramacool.com.pa/search?keyword=${encodeURIComponent(_query)}`,
            'myasiantv': `https://myasiantv.cc/search?keyword=${encodeURIComponent(_query)}`,
            'dramanice': `https://dramanice.cx/search?keyword=${encodeURIComponent(_query)}`,
            'kissasian': `https://kissasian.sh/search?keyword=${encodeURIComponent(_query)}`,
            'viki': `https://www.viki.com/search?q=${encodeURIComponent(_query)}`,
            'wetv': `https://wetv.vip/search?keyword=${encodeURIComponent(_query)}`,
            'iqiyi': `https://www.iq.com/search?keyword=${encodeURIComponent(_query)}`,
            'kocowa': `https://www.kocowa.com/search?q=${encodeURIComponent(_query)}`,
            'viu': `https://www.viu.com/search?keyword=${encodeURIComponent(_query)}`
        };
        
        return urls[_source] || `https://flodrama.com/search?q=${encodeURIComponent(_query)}&source=${_source}`;
    }
    
    /**
     * Construit l'URL de détail pour un contenu
     */
    buildDetailUrl(_contentId, _source) {
        // Construction des URLs de détail spécifiques à chaque source
        return `https://flodrama.com/api/${_source}/content/${_contentId}`;
    }
    
    /**
     * Construit l'URL de streaming pour un épisode
     */
    buildStreamingUrl(_episodeId, _source) {
        // Construction des URLs de streaming spécifiques à chaque source
        return `https://flodrama.com/api/${_source}/stream/${_episodeId}`;
    }
}
