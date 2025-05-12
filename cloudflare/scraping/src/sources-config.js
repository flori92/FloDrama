/**
 * Configuration des sources pour l'extracteur de streaming
 * Ce fichier définit les paramètres optimisés pour chaque source
 * Dernière mise à jour : 2025-05-12
 */

module.exports = {
  // Sites de dramas asiatiques
  'dramacool': {
    baseUrl: 'https://dramacool.com.tr',
    alternativeDomains: ['dramacool9.io', 'dramacool.cr', 'dramacool.sr'],
    selectors: {
      iframeContainer: '.watch-drama .episode',
      videoContainer: 'iframe',
      videoSource: 'iframe[src*="embed"]',
      qualitySelector: '.Quality',
      waitSelector: '.list-episode-item',
      itemSelector: '.list-drama-item'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://dramacool.com.tr/'
    },
    testUrl: 'https://dramacool.com.tr/watch-my-lovable-girl-episode-1-online.html',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'drama'
  },
  
  'viewasian': {
    baseUrl: 'https://viewasian.lol',
    alternativeDomains: ['viewasian.tv', 'viewasian.cc'],
    selectors: {
      iframeContainer: '.video-content',
      videoContainer: '.play-video',
      videoSource: 'iframe',
      qualitySelector: '.vjs-resolution-button',
      waitSelector: '.video-content',
      itemSelector: '.play-video'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://viewasian.lol/'
    },
    testUrl: 'https://viewasian.lol/watch/descendants-of-the-sun-episode-01.html',
    requireCloudflareBypass: true,
    expiryHours: 6,
    category: 'drama'
  },
  
  'kissasian': {
    baseUrl: 'https://kissasian.com.lv',
    alternativeDomains: ['kissasian.sh', 'kissasian.io', 'kissasian.cx'],
    selectors: {
      iframeContainer: '#centerDivVideo',
      videoContainer: '#divContentVideo',
      videoSource: 'iframe',
      qualitySelector: '.resolution',
      waitSelector: '#centerDivVideo',
      itemSelector: '#divContentVideo'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://kissasian.com.lv/'
    },
    testUrl: 'https://kissasian.com.lv/watch/crash-landing-on-you-episode-1',
    requireCloudflareBypass: true,
    expiryHours: 8,
    category: 'drama'
  },
  
  'voirdrama': {
    baseUrl: 'https://voirdrama.org',
    alternativeDomains: ['voirdrama.cc', 'voirdrama.tv'],
    selectors: {
      iframeContainer: '.watch-drama',
      videoContainer: '.player-embed',
      videoSource: 'iframe',
      qualitySelector: '.jw-quality-labels',
      waitSelector: 'div.site-content', // Sélecteur d'attente découvert par l'analyse
      itemSelector: 'div.wrap' // Sélecteur principal découvert par l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://voirdrama.org/'
    },
    testUrl: 'https://voirdrama.org/goblin-episode-1-vostfr/',
    requireCloudflareBypass: true,
    expiryHours: 10,
    category: 'drama'
  },
  
  // Sites d'animes
  'gogoanime': {
    baseUrl: 'https://gogoanime.cl',
    alternativeDomains: ['gogoanime.tel', 'gogoanime.run', 'gogoanime.bid'],
    selectors: {
      iframeContainer: '.anime_muti_link',
      videoContainer: '.play-video',
      videoSource: 'iframe',
      qualitySelector: '.quality-select',
      waitSelector: '.anime_video_body', // Sélecteur d'attente adapté
      itemSelector: '.anime_muti_link' // Sélecteur principal adapté
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://gogoanime.cl/'
    },
    testUrl: 'https://gogoanime.cl/attack-on-titan-episode-1',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'anime'
  },
  
  'nekosama': {
    baseUrl: 'https://neko-sama.fr',
    alternativeDomains: ['neko-sama.io', 'neko-sama.org'],
    selectors: {
      iframeContainer: '.lecteur_video',
      videoContainer: '.player-video',
      videoSource: 'iframe',
      qualitySelector: '.jw-settings-submenu-quality',
      waitSelector: '#blocEntier', // Sélecteur d'attente découvert par l'analyse
      itemSelector: '#list_catalog' // Sélecteur principal découvert par l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://neko-sama.fr/'
    },
    testUrl: 'https://neko-sama.fr/anime/info/1-one-piece',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'anime'
  },
  
  'voiranime': {
    baseUrl: 'https://voiranime.com',
    alternativeDomains: ['v6.voiranime.com', 'voiranime.tv', 'voiranime.cc'],
    selectors: {
      iframeContainer: '.video-player',
      videoContainer: '.player-embed',
      videoSource: 'iframe',
      qualitySelector: '.jw-settings-menu',
      waitSelector: '.movies-list', // Sélecteur d'attente générique basé sur l'analyse
      itemSelector: '.ml-item' // Sélecteur principal générique basé sur l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://voiranime.com/'
    },
    testUrl: 'https://voiranime.com/demon-slayer-saison-1-episode-1-vostfr/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'anime'
  },
  
  // Sites de films
  'vostfree': {
    baseUrl: 'https://vostfree.cx',
    alternativeDomains: ['vostfree.tv', 'vostfree.ws', 'vostfree.io'],
    selectors: {
      iframeContainer: '.lecteur_video',
      videoContainer: '#video_container',
      videoSource: 'iframe',
      qualitySelector: '.qualityx',
      waitSelector: '.movies-list', // Sélecteur d'attente découvert par l'analyse
      itemSelector: '.ml-item' // Sélecteur principal découvert par l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://vostfree.cx/'
    },
    testUrl: 'https://vostfree.cx/your-name-1/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'film'
  },
  
  'streamingdivx': {
    baseUrl: 'https://streaming-films.net',
    alternativeDomains: ['streamingdivx.co', 'streaming-films.cc', 'streaming-divx.com'],
    selectors: {
      iframeContainer: '.player-container',
      videoContainer: '.player-embed',
      videoSource: 'iframe',
      qualitySelector: '.server-item',
      waitSelector: '.film-list', // Sélecteur d'attente générique basé sur l'analyse
      itemSelector: '.film-item' // Sélecteur principal générique basé sur l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://streaming-films.net/'
    },
    testUrl: 'https://streaming-films.net/joker-2019/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'film'
  },
  
  'filmcomplet': {
    baseUrl: 'https://www.film-complet.cc',
    alternativeDomains: ['film-complet.tv', 'films-complet.com', 'film-complet.co'],
    selectors: {
      iframeContainer: '.player-video',
      videoContainer: '.player-embed',
      videoSource: 'iframe',
      qualitySelector: '.quality-selector',
      waitSelector: '.movies-list', // Sélecteur d'attente générique basé sur l'analyse
      itemSelector: '.ml-item' // Sélecteur principal générique basé sur l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://www.film-complet.cc/'
    },
    testUrl: 'https://www.film-complet.cc/film/parasite-2019/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'film'
  },
  
  // Sites de Bollywood
  'bollyplay': {
    baseUrl: 'https://bollyplay.app',
    alternativeDomains: ['bollyplay.tv', 'bollyplay.cc', 'bollyplay.film'],
    selectors: {
      iframeContainer: '.video-player',
      videoContainer: '.video-embed',
      videoSource: 'iframe',
      qualitySelector: '.quality-options',
      waitSelector: '.movies-list', // Sélecteur d'attente découvert par l'analyse
      itemSelector: '.ml-item' // Sélecteur principal découvert par l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://bollyplay.app/'
    },
    testUrl: 'https://bollyplay.app/movies/pathaan-2023/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'bollywood'
  },
  
  'hindilinks4u': {
    baseUrl: 'https://hindilinks4u.skin',
    alternativeDomains: ['hindilinks4u.to', 'hindilinks4u.co', 'hindilinks4u.app'],
    selectors: {
      iframeContainer: '.video-content',
      videoContainer: '.video-embed',
      videoSource: 'iframe',
      qualitySelector: '.quality-selector',
      waitSelector: '.film-list', // Sélecteur d'attente générique basé sur l'analyse
      itemSelector: '.film-item' // Sélecteur principal générique basé sur l'analyse
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': 'https://hindilinks4u.skin/'
    },
    testUrl: 'https://hindilinks4u.skin/jawan-2023-hindi-movie/',
    requireCloudflareBypass: true,
    expiryHours: 12,
    category: 'bollywood'
  }
};
