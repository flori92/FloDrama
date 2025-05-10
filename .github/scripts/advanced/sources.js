/**
 * Configuration des sources pour le scraping de FloDrama
 * 
 * Ce module contient la définition des sources à scraper
 * avec leurs URLs et paramètres spécifiques
 */

// Sources principales pour les dramas
const DRAMA_SOURCES = [
  {
    name: 'mydramalist',
    urls: [
      'https://mydramalist.com/shows/top_korean_dramas',
      'https://mydramalist.com/shows/top_chinese_dramas',
      'https://mydramalist.com/shows/top_japanese_dramas',
      'https://mydramalist.com/shows/top_taiwanese_dramas',
      'https://mydramalist.com/shows/top_thai_dramas'
    ],
    type: 'drama',
    selector: '.box-body.light-b',
    usePlaywright: true,
    waitForSelector: '.box-body.light-b',
    minItems: 100
  },
  {
    name: 'dramacool',
    urls: [
      'https://dramacool.cr/most-popular-drama',
      'https://dramacool.cr/most-popular-korean-drama',
      'https://dramacool.cr/most-popular-chinese-drama',
      'https://dramacool.cr/most-popular-japanese-drama',
      'https://dramacool.cr/most-popular-thailand-drama'
    ],
    type: 'drama',
    selector: '.block',
    usePlaywright: true,
    waitForSelector: '.block',
    minItems: 100
  },
  {
    name: 'voirdrama',
    urls: [
      'https://voirdrama.org/drama-vostfr/',
      'https://voirdrama.org/drama-coreen-vostfr/',
      'https://voirdrama.org/drama-chinois-vostfr/',
      'https://voirdrama.org/drama-japonais-vostfr/',
      'https://voirdrama.org/drama-thailandais-vostfr/'
    ],
    type: 'drama',
    selector: '.movies-list .ml-item',
    usePlaywright: true,
    waitForSelector: '.movies-list',
    minItems: 100
  },
  {
    name: 'myasiantv',
    urls: [
      'https://myasiantv.cc/drama/',
      'https://myasiantv.cc/country/korean/',
      'https://myasiantv.cc/country/chinese/',
      'https://myasiantv.cc/country/japanese/',
      'https://myasiantv.cc/country/thai/'
    ],
    type: 'drama',
    selector: '.video-block',
    usePlaywright: true,
    waitForSelector: '.video-block',
    minItems: 100
  }
];

// Sources principales pour les animes
const ANIME_SOURCES = [
  {
    name: 'voiranime',
    urls: [
      'https://v5.voiranime.com/anime-vostfr/',
      'https://v5.voiranime.com/films-anime-vostfr/',
      'https://v5.voiranime.com/oav-vostfr/'
    ],
    type: 'anime',
    selector: '.film-poster',
    usePlaywright: true,
    waitForSelector: '.film-poster',
    minItems: 100
  },
  {
    name: 'nekosama',
    urls: [
      'https://neko-sama.fr/anime',
      'https://neko-sama.fr/anime/vostfr',
      'https://neko-sama.fr/anime/vf'
    ],
    type: 'anime',
    selector: '.anime',
    usePlaywright: true,
    waitForSelector: '.anime',
    minItems: 100
  },
  {
    name: 'gogoanime',
    urls: [
      'https://gogoanime3.net/anime-list',
      'https://gogoanime3.net/popular.html',
      'https://gogoanime3.net/new-season.html'
    ],
    type: 'anime',
    selector: '.items .item',
    usePlaywright: true,
    waitForSelector: '.items',
    minItems: 100
  }
];

// Sources principales pour les films
const FILM_SOURCES = [
  {
    name: 'filmapik',
    urls: [
      'https://filmapik21.us/populer',
      'https://filmapik21.us/rating',
      'https://filmapik21.us/most-viewed'
    ],
    type: 'film',
    selector: '.movies-list .ml-item',
    usePlaywright: true,
    waitForSelector: '.movies-list',
    minItems: 100
  },
  {
    name: 'vostfree',
    urls: [
      'https://vostfree.cx/films-vostfr',
      'https://vostfree.cx/films-vf',
      'https://vostfree.cx/films-vostfr/page/2',
      'https://vostfree.cx/films-vf/page/2'
    ],
    type: 'film',
    selector: '.movies-list .ml-item',
    usePlaywright: true,
    waitForSelector: '.movies-list',
    minItems: 100
  }
];

// Sources principales pour Bollywood
const BOLLYWOOD_SOURCES = [
  {
    name: 'bollywoodmdb',
    urls: [
      'https://www.bollywoodmdb.com/movies',
      'https://www.bollywoodmdb.com/movies/bollywood-movies',
      'https://www.bollywoodmdb.com/movies/top-rated-hindi-movies'
    ],
    type: 'bollywood',
    selector: '.card',
    usePlaywright: true,
    waitForSelector: '.card',
    minItems: 100
  }
];

// Sources alternatives (URLs de secours)
const BACKUP_SOURCES = [
  {
    name: 'dramacool_alt',
    urls: [
      'https://www1.dramacool.cr/most-popular-drama',
      'https://www3.dramacool.cr/most-popular-drama',
      'https://www5.dramacool.cr/most-popular-drama'
    ],
    type: 'drama',
    selector: '.block',
    usePlaywright: true,
    waitForSelector: '.block',
    minItems: 100
  },
  {
    name: 'myasiantv_alt',
    urls: [
      'https://myasiantv.cx/drama/',
      'https://myasiantv.io/drama/'
    ],
    type: 'drama',
    selector: '.video-block',
    usePlaywright: true,
    waitForSelector: '.video-block',
    minItems: 100
  },
  {
    name: 'gogoanime_alt',
    urls: [
      'https://gogoanime.vc/anime-list',
      'https://gogoanime.film/anime-list'
    ],
    type: 'anime',
    selector: '.items .item',
    usePlaywright: true,
    waitForSelector: '.items',
    minItems: 100
  }
];

// Combiner toutes les sources
const ALL_SOURCES = [
  ...DRAMA_SOURCES,
  ...ANIME_SOURCES,
  ...FILM_SOURCES,
  ...BOLLYWOOD_SOURCES
];

// Exporter les sources
module.exports = {
  DRAMA_SOURCES,
  ANIME_SOURCES,
  FILM_SOURCES,
  BOLLYWOOD_SOURCES,
  BACKUP_SOURCES,
  ALL_SOURCES
};
