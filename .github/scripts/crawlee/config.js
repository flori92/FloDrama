/**
 * Configuration pour le système de scraping Crawlee de FloDrama
 * Ce fichier centralise toutes les configurations des sources à scraper
 */

const path = require('path');

// Configuration générale
const CONFIG = {
  MIN_ITEMS_PER_SOURCE: parseInt(process.env.MIN_ITEMS_PER_SOURCE || '200'),
  OUTPUT_DIR: process.env.OUTPUT_DIR || './Frontend/src/data/content',
  CACHE_DIR: process.env.CACHE_DIR || './.cache',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '43200000'), // 12 heures par défaut
  SOURCES: (process.env.SOURCES || 'filmapik,mydramalist,voiranime,nekosama,bollywoodmdb,vostfree,dramacool,myasiantv,voirdrama,gogoanime').split(','),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  PARALLEL_SCRAPING: process.env.PARALLEL_SCRAPING === 'true',
  MAX_CONCURRENT_SOURCES: parseInt(process.env.MAX_CONCURRENT_SOURCES || '3'),
  BROWSER_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

// Configuration des sources
const SOURCE_CONFIG = {
  // Films
  filmapik: {
    name: 'Filmapik',
    url: 'https://filmapik.bio/populer',
    selector: '.movies-list .ml-item',
    type: 'film',
    language: 'multi',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 10,
      baseUrl: 'https://filmapik.bio/populer/page/'
    },
    waitForSelector: '.movies-list',
    extractorType: 'cheerio'
  },
  
  // Dramas
  mydramalist: {
    name: 'MyDramaList',
    url: 'https://mydramalist.com/shows/top_korean_dramas',
    selector: '.box:not(.ad-box)',
    type: 'drama',
    language: 'ko',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://mydramalist.com/shows/top_korean_dramas?page='
    },
    waitForSelector: '.box',
    extractorType: 'playwright'
  },
  dramacool: {
    name: 'DramaCool',
    url: 'https://dramacool.hr/most-popular-drama',
    selector: '.block-wrapper .block',
    type: 'drama',
    language: 'multi',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://dramacool.hr/most-popular-drama/page/'
    },
    waitForSelector: '.block-wrapper',
    extractorType: 'cheerio'
  },
  myasiantv: {
    name: 'MyAsianTV',
    url: 'https://myasiantv.cc/drama/',
    selector: '.movies-list .ml-item',
    type: 'drama',
    language: 'multi',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://myasiantv.cc/drama/page/'
    },
    waitForSelector: '.movies-list',
    extractorType: 'cheerio'
  },
  vostfree: {
    name: 'VostFree',
    url: 'https://vostfree.cx/dramas-en-streaming/',
    selector: '.movies-list .ml-item',
    type: 'drama',
    language: 'fr',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://vostfree.cx/dramas-en-streaming/page/'
    },
    waitForSelector: '.movies-list',
    extractorType: 'cheerio'
  },
  voirdrama: {
    name: 'VoirDrama',
    url: 'https://voirdrama.org/drama/',
    selector: '.movies-list .ml-item',
    type: 'drama',
    language: 'fr',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://voirdrama.org/drama/page/'
    },
    waitForSelector: '.movies-list',
    extractorType: 'cheerio'
  },
  
  // Animes
  gogoanime: {
    name: 'GoGoAnime',
    url: 'https://gogoanime.tel/',
    selector: '.items li',
    type: 'anime',
    language: 'multi',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://gogoanime.tel/page-'
    },
    waitForSelector: '.items',
    extractorType: 'playwright'
  },
  voiranime: {
    name: 'VoirAnime',
    url: 'https://voiranime.com/animes/',
    selector: '.film-poster',
    type: 'anime',
    language: 'fr',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://voiranime.com/animes/page/'
    },
    waitForSelector: '.film-poster',
    extractorType: 'cheerio'
  },
  nekosama: {
    name: 'NekoSama',
    url: 'https://neko-sama.fr/anime',
    selector: '.anime-card',
    type: 'anime',
    language: 'fr',
    pagination: {
      enabled: false
    },
    waitForSelector: '.anime-card',
    extractorType: 'playwright'
  },
  
  // Bollywood
  bollywoodmdb: {
    name: 'BollywoodMDB',
    url: 'https://www.bollywoodmdb.com/movies',
    selector: '.card',
    type: 'bollywood',
    language: 'hi',
    pagination: {
      enabled: true,
      param: 'page',
      maxPages: 5,
      baseUrl: 'https://www.bollywoodmdb.com/movies/page/'
    },
    waitForSelector: '.card',
    extractorType: 'cheerio'
  }
};

module.exports = {
  CONFIG,
  SOURCE_CONFIG
};
