/**
 * Configuration des sources de streaming pour FloDrama
 * Ce fichier centralise toutes les sources disponibles pour le scraping et les recommandations
 */

export const SOURCE_TYPES = {
  DRAMA: 'drama',
  ANIME: 'anime',
  MOVIE: 'movie',
  BOLLYWOOD: 'bollywood'
};

export const SOURCES = {
  // ===== DRAMAS ASIATIQUES =====
  DRAMACOOL: {
    id: 'dramacool',
    name: 'DramaCool',
    type: SOURCE_TYPES.DRAMA,
    baseUrl: 'https://dramacool.com.tr',
    alternativeDomains: ['dramacool9.io', 'dramacool.cr', 'dramacool.sr'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://dramacool.com.tr/watch-my-lovable-girl-episode-1-online.html',
    selectors: {
      wait: '.list-episode-item',
      main: '.list-drama-item',
      title: 'h1.detail .name',
      poster: '.img-responsive',
      description: '.description',
      episodes: '.list-episode-item',
      episodeTitle: '.episode',
      episodeUrl: 'a',
      episodeNumber: '.episode',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.list-movie .item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.score'
    }
  },
  
  VIEWASIAN: {
    id: 'viewasian',
    name: 'ViewAsian',
    type: SOURCE_TYPES.DRAMA,
    baseUrl: 'https://viewasian.lol',
    alternativeDomains: ['viewasian.tv', 'viewasian.cc'],
    requiresCloudflareBypass: true,
    expirationHours: 6,
    testUrl: 'https://viewasian.lol/watch/descendants-of-the-sun-episode-01.html',
    selectors: {
      wait: '.video-content',
      main: '.play-video',
      title: '.video-details .title',
      poster: '.thumb img',
      description: '.description',
      episodes: '.list-episode-item',
      episodeTitle: '.name',
      episodeUrl: 'a',
      episodeNumber: '.episode-number',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.listing .video-block',
      itemTitle: '.name',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.date',
      itemRating: '.rating'
    }
  },
  
  KISSASIAN: {
    id: 'kissasian',
    name: 'KissAsian',
    type: SOURCE_TYPES.DRAMA,
    baseUrl: 'https://kissasian.com.lv',
    alternativeDomains: ['kissasian.sh', 'kissasian.io', 'kissasian.cx'],
    requiresCloudflareBypass: true,
    expirationHours: 8,
    testUrl: 'https://kissasian.com.lv/watch/crash-landing-on-you-episode-1',
    selectors: {
      wait: '#centerDivVideo',
      main: '#divContentVideo',
      title: '.barContent .bigChar',
      poster: '.rightBox img',
      description: '.summary',
      episodes: '#selectEpisode option',
      episodeTitle: 'option',
      episodeUrl: 'option',
      episodeNumber: 'option',
      itemsList: '.listing .item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  VOIRDRAMA: {
    id: 'voirdrama',
    name: 'VoirDrama',
    type: SOURCE_TYPES.DRAMA,
    baseUrl: 'https://voirdrama.org',
    alternativeDomains: ['voirdrama.cc', 'voirdrama.tv'],
    requiresCloudflareBypass: true,
    expirationHours: 10,
    testUrl: 'https://voirdrama.org/goblin-episode-1-vostfr/',
    selectors: {
      wait: 'div.site-content',
      main: 'div.wrap',
      title: '.entry-title',
      poster: '.poster img',
      description: '.entry-content',
      episodes: '.episodes-list li',
      episodeTitle: 'a',
      episodeUrl: 'a',
      episodeNumber: 'a',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.movies-list .movie-item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  // ===== ANIMES =====
  GOGOANIME: {
    id: 'gogoanime',
    name: 'GoGoAnime',
    type: SOURCE_TYPES.ANIME,
    baseUrl: 'https://gogoanime.by',
    alternativeDomains: ['gogoanime.lu', 'gogoanime.la', 'gogoanime.sh'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://gogoanime.by/attack-on-titan-episode-1',
    selectors: {
      wait: '.anime_video_body',
      main: '.anime_muti_link',
      title: '.anime-info .anime_info_body h1',
      poster: '.anime_info_body_bg img',
      description: '.anime_info_body .type:last-child',
      episodes: '#episode_page li',
      episodeTitle: 'a',
      episodeUrl: 'a',
      episodeNumber: 'a',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.items li',
      itemTitle: '.name',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.released',
      itemRating: '.score'
    }
  },
  
  NEKOSAMA: {
    id: 'nekosama',
    name: 'NekoSama',
    type: SOURCE_TYPES.ANIME,
    baseUrl: 'https://neko-sama.fr',
    alternativeDomains: ['neko-sama.io', 'neko-sama.org'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://neko-sama.fr/anime/info/1-one-piece',
    selectors: {
      wait: '#blocEntier',
      main: '#list_catalog',
      title: '.title',
      poster: '.cover img',
      description: '.synopsis',
      episodes: '.episode',
      episodeTitle: '.title',
      episodeUrl: 'a',
      episodeNumber: '.num',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.anime',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  VOIRANIME: {
    id: 'voiranime',
    name: 'VoirAnime',
    type: SOURCE_TYPES.ANIME,
    baseUrl: 'https://voiranime.com',
    alternativeDomains: ['v6.voiranime.com', 'voiranime.tv', 'voiranime.cc'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://voiranime.com/demon-slayer-saison-1-episode-1-vostfr/',
    selectors: {
      wait: '.movies-list',
      main: '.ml-item',
      title: '.entry-title',
      poster: '.poster img',
      description: '.entry-content',
      episodes: '.episodes-list li',
      episodeTitle: 'a',
      episodeUrl: 'a',
      episodeNumber: 'a',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.movies-list .movie-item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  // ===== FILMS =====
  FILMAPIK: {
    id: 'filmapik',
    name: 'FilmApik',
    type: SOURCE_TYPES.MOVIE,
    baseUrl: 'https://filmapik.cyou',
    alternativeDomains: ['filmapik.io', 'filmapik.net', 'filmapik.org'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://filmapik.cyou/movie/parasite-2019/',
    selectors: {
      wait: '.film-list',
      main: '.film-detail',
      title: '.name',
      poster: '.film-poster img',
      description: '.description',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.film-list .flw-item',
      itemTitle: '.film-name a',
      itemUrl: 'a',
      itemImage: '.film-poster-img',
      itemYear: '.fdi-item',
      itemRating: '.fdi-rating'
    }
  },
  
  VOSTFREE: {
    id: 'vostfree',
    name: 'VostFree',
    type: SOURCE_TYPES.MOVIE,
    baseUrl: 'https://vostfree.cx',
    alternativeDomains: ['vostfree.tv', 'vostfree.ws', 'vostfree.io'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://vostfree.cx/your-name-1/',
    selectors: {
      wait: '.movies-list',
      main: '.ml-item',
      title: '.entry-title',
      poster: '.poster img',
      description: '.entry-content',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.movies-list .ml-item',
      itemTitle: '.mli-info h2',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  STREAMINGDIVX: {
    id: 'streamingdivx',
    name: 'StreamingDivx',
    type: SOURCE_TYPES.MOVIE,
    baseUrl: 'https://streaming-films.net',
    alternativeDomains: ['streamingdivx.co', 'streaming-films.cc', 'streaming-divx.com'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://streaming-films.net/joker-2019/',
    selectors: {
      wait: '.film-list',
      main: '.film-item',
      title: '.title',
      poster: '.poster img',
      description: '.description',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.film-list .film-item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  },
  
  // Ancienne source 'filmcomplet' supprimée et remplacée par 'filmapik'
  
  // ===== BOLLYWOOD =====
  HINDILINKS4U: {
    id: 'hindilinks4u',
    name: 'HindiLinks4U',
    type: SOURCE_TYPES.BOLLYWOOD,
    baseUrl: 'https://hindilinks4u.yoga',
    alternativeDomains: ['hindilinks4u.to', 'hindilinks4u.yoga', 'hindilinks4u.app'],
    requiresCloudflareBypass: true,
    expirationHours: 12,
    testUrl: 'https://hindilinks4u.yoga/jawan-2023-hindi-movie/',
    selectors: {
      wait: '.film-list',
      main: '.film-item',
      title: '.title',
      poster: '.poster img',
      description: '.description',
      pagination: '.pagination',
      nextPage: '.next',
      itemsList: '.film-list .film-item',
      itemTitle: '.title',
      itemUrl: 'a',
      itemImage: 'img',
      itemYear: '.year',
      itemRating: '.rating'
    }
  }
};

/**
 * Récupère toutes les sources actives
 * @returns {Array} Liste des sources actives
 */
export const getActiveSources = () => {
  return Object.values(SOURCES).filter(source => source.isActive !== false);
};

/**
 * Récupère les sources par type
 * @param {string} type - Type de source (drama, anime, movie, bollywood)
 * @returns {Array} Liste des sources du type spécifié
 */
export const getSourcesByType = (type) => {
  return Object.values(SOURCES).filter(source => source.type === type && source.isActive !== false);
};

/**
 * Récupère une source par son ID
 * @param {string} id - Identifiant de la source
 * @returns {Object|null} La source correspondante ou null si non trouvée
 */
export const getSourceById = (id) => {
  return Object.values(SOURCES).find(source => source.id === id) || null;
};
