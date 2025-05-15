/**
 * Configuration centralisée pour le pipeline de scraping FloDrama
 * 
 * Ce fichier contient toutes les configurations nécessaires pour
 * le scraping, l'enrichissement et la distribution des données
 */

const path = require('path');

const CONFIG = {
  // Répertoires
  OUTPUT_DIR: './Frontend/src/data/content',
  CACHE_DIR: './.cache',
  TEMP_DIR: './cloudflare/scraping/scraping-results',
  SCREENSHOTS_DIR: './cloudflare/scraping/screenshots',
  
  // Délais et timeouts
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures
  DEFAULT_TIMEOUT: 60000, // 60 secondes
  
  // Catégories de contenu
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  
  // Configuration du navigateur
  BROWSER_ARGS: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials'
  ],
  
  // Sources validées par catégorie
  SOURCES: {
    // Dramas
    drama: [
      {
        name: 'mydramalist',
        baseUrl: 'https://mydramalist.com',
        urls: [
          'https://mydramalist.com/shows/top',
          'https://mydramalist.com/shows/top_korean_dramas',
          'https://mydramalist.com/shows/top_chinese_dramas',
          'https://mydramalist.com/shows/top_japanese_dramas',
          'https://mydramalist.com/shows/top_taiwanese_dramas'
        ],
        selectors: {
          list: '.box-body.light-b',
          title: '.title a',
          link: '.title a',
          image: 'img.lazy',
          rating: '.score',
          year: '.year'
        },
        minItems: 100,
        priority: 1,
        enrichData: true
      },
      {
        name: 'dramacool',
        baseUrl: 'https://dramacool.com.pa',
        urls: [
          'https://dramacool.com.pa/drama-list',
          'https://dramacool.com.pa/most-popular-drama',
          'https://dramacool.sr/most-popular-drama',
          'https://dramacool.bid/most-popular-drama'
        ],
        selectors: {
          list: '.block',
          title: '.title a',
          link: '.title a',
          image: 'img.lazy',
          rating: '.score',
          year: '.year'
        },
        minItems: 50,
        priority: 2,
        enrichData: true
      },
      {
        name: 'voirdrama',
        baseUrl: 'https://voirdrama.org',
        urls: [
          'https://voirdrama.org/dramas/',
          'https://voirdrama.org/dramas/page/2/',
          'https://voirdrama.org/dramas/page/3/'
        ],
        selectors: {
          list: '.movies-list .ml-item',
          title: '.mli-info h2',
          link: 'a',
          image: 'img',
          rating: '.rating',
          year: '.mli-info .movies-date'
        },
        minItems: 50,
        priority: 3,
        enrichData: true
      },
      {
        name: 'asianwiki',
        baseUrl: 'https://asianwiki.com',
        urls: [
          'https://asianwiki.com/Category:Korean_Drama',
          'https://asianwiki.com/Category:Japanese_Drama',
          'https://asianwiki.com/Category:Chinese_Drama'
        ],
        selectors: {
          list: '.thumbborder',
          title: '.thumbborder + a',
          link: '.thumbborder + a',
          image: '.thumbborder',
          rating: null,
          year: null
        },
        minItems: 50,
        priority: 4,
        enrichData: true
      }
    ],
    
    // Animes
    anime: [
      {
        name: 'myanimelist',
        baseUrl: 'https://myanimelist.net',
        urls: [
          'https://myanimelist.net/topanime.php',
          'https://myanimelist.net/topanime.php?type=airing',
          'https://myanimelist.net/topanime.php?type=upcoming'
        ],
        selectors: {
          list: '.ranking-list',
          title: '.title a',
          link: '.title a',
          image: 'img',
          rating: '.score',
          year: '.information'
        },
        minItems: 100,
        priority: 1,
        enrichData: true
      },
      {
        name: 'voiranime',
        baseUrl: 'https://voiranime.com',
        urls: [
          'https://voiranime.com',
          'https://voiranime.to',
          'https://voiranime.cc'
        ],
        selectors: {
          list: '.items .item',
          title: '.data h3',
          link: 'a',
          image: 'img',
          rating: '.rating',
          year: '.meta'
        },
        minItems: 50,
        priority: 2,
        enrichData: true
      },
      {
        name: 'animesama',
        baseUrl: 'https://anime-sama.fr',
        urls: [
          'https://anime-sama.fr/catalogue/',
          'https://anime-sama.fr/catalogue/page/2/',
          'https://anime-sama.fr/catalogue/page/3/'
        ],
        selectors: {
          list: '.anime',
          title: '.title',
          link: 'a',
          image: 'img',
          rating: null,
          year: '.year'
        },
        minItems: 50,
        priority: 3,
        enrichData: true
      }
    ],
    
    // Films
    film: [
      {
        name: 'imdb',
        baseUrl: 'https://www.imdb.com',
        urls: [
          'https://www.imdb.com/chart/top/',
          'https://www.imdb.com/chart/moviemeter/'
        ],
        selectors: {
          list: '.ipc-metadata-list-summary-item',
          title: '.ipc-title__text',
          link: 'a',
          image: 'img',
          rating: '.ipc-rating-star',
          year: '.cli-title-metadata'
        },
        minItems: 100,
        priority: 1,
        enrichData: true
      },
      {
        name: 'vostfree',
        baseUrl: 'https://vostfree.cx',
        urls: [
          'https://vostfree.cx/films-vostfr',
          'https://vostfree.cx/films-vf'
        ],
        selectors: {
          list: '.movies-list .ml-item',
          title: '.mli-info h2',
          link: 'a',
          image: 'img',
          rating: null,
          year: '.mli-info .movies-date'
        },
        minItems: 50,
        priority: 2,
        enrichData: true
      }
    ],
    
    // Bollywood
    bollywood: [
      {
        name: 'bollyplay',
        baseUrl: 'https://bollyplay.net',
        urls: [
          'https://bollyplay.net',
          'https://bollyplay.cc'
        ],
        selectors: {
          list: '.movie-box',
          title: '.movie-title',
          link: 'a',
          image: 'img',
          rating: null,
          year: '.movie-date'
        },
        minItems: 50,
        priority: 1,
        enrichData: true
      },
      {
        name: 'hindilinks4u',
        baseUrl: 'https://hindilinks4u.to',
        urls: [
          'https://hindilinks4u.to',
          'https://hindilinks4u.cc'
        ],
        selectors: {
          list: '.post',
          title: '.title',
          link: 'a',
          image: 'img',
          rating: null,
          year: '.date'
        },
        minItems: 50,
        priority: 2,
        enrichData: true
      }
    ]
  },
  
  // APIs d'enrichissement
  ENRICHMENT_APIS: {
    // API TMDB pour enrichir les données
    TMDB: {
      baseUrl: 'https://api.themoviedb.org/3',
      apiKey: process.env.TMDB_API_KEY || '3e1dd3d6f4b49c1f4a4b3418adb6ec71', // Clé publique pour les tests
      imageBaseUrl: 'https://image.tmdb.org/t/p',
      posterSize: 'w500',
      backdropSize: 'w1280',
      endpoints: {
        searchMovie: '/search/movie',
        searchTv: '/search/tv',
        movieDetails: '/movie/',
        tvDetails: '/tv/',
        movieVideos: '/movie/{id}/videos',
        tvVideos: '/tv/{id}/videos'
      }
    },
    
    // API YouTube pour les trailers
    YOUTUBE: {
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      apiKey: process.env.YOUTUBE_API_KEY,
      endpoints: {
        search: '/search'
      }
    }
  },
  
  // Configuration de l'interface utilisateur
  UI_CONFIG: {
    // Configuration des bannières
    HERO_BANNER: {
      count: 5,
      requireBackdrop: true,
      requirePoster: true,
      requireTrailer: true
    },
    
    // Configuration des sections de la page d'accueil
    HOME_SECTIONS: [
      {
        title: 'Trending',
        count: 20,
        sortBy: ['year', 'rating']
      },
      {
        title: 'Popular',
        count: 20,
        sortBy: ['rating']
      },
      {
        title: 'Recent',
        count: 20,
        sortBy: ['year']
      }
    ]
  },
  
  // Configuration du monitoring
  MONITORING: {
    discordWebhook: process.env.DISCORD_WEBHOOK,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    emailNotifications: {
      enabled: false,
      from: 'scraping@flodrama.com',
      to: 'admin@flodrama.com'
    }
  }
};

module.exports = CONFIG;
