/**
 * ScrapingService
 * 
 * Service de scraping pour l'application React de FloDrama
 * Permet de récupérer les métadonnées des dramas depuis les sources externes
 */

import { Network, Cache } from '../adapters/lynx-core';
import { AppConfig } from '../app.config';
import axios from 'axios';

// Définition des variables manquantes
const CACHE_DURATION_MINUTES = 30;

// Configuration des sources de scraping
const SOURCES = [
  {
    name: 'VoirDrama',
    baseUrl: 'https://voirdrama.org',
    fallbackUrls: ['https://voirdrama.cc', 'https://voirdrama.tv', 'https://vdrama.org', 'https://voirdrama.me'],
    enabled: true,
    priority: 1,
    transform(item) {
      return {
        ...item,
        source: 'VoirDrama'
      };
    }
  },
  {
    name: 'DramaCool',
    baseUrl: 'https://dramacool.cr',
    fallbackUrls: ['https://dramacool.so', 'https://dramacool.sr', 'https://dramacool.cy'],
    enabled: true,
    priority: 2,
    transform(item) {
      return {
        ...item,
        source: 'DramaCool'
      };
    }
  }
];

// Service de proxy pour contourner les limitations CORS
class ProxyService {
  constructor() {
    this.proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  }

  async fetch(url, options = {}) {
    try {
      const response = await axios.get(this.proxyUrl + url, options);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la requête proxy:', error);
      throw error;
    }
  }

  async post(url, data, options = {}) {
    try {
      const response = await axios.post(this.proxyUrl + url, data, options);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la requête proxy POST:', error);
      throw error;
    }
  }
}

// Service de traduction
class TranslationService {
  async translate(text, targetLanguage = 'fr') {
    // Simulation d'un service de traduction
    return text;
  }
}

// Fonction pour parser le HTML
function parseHTML(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

// Fonction pour parser les sous-titres
function parseSubtitle(subtitleContent) {
  // Implémentation simple pour parser les sous-titres
  const lines = subtitleContent.split('\n');
  const subtitles = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      const timeCode = lines[i];
      const text = lines[i + 1] || '';
      subtitles.push({ timeCode, text });
      i++; // Sauter la ligne de texte
    }
  }
  
  return subtitles;
}

class ScrapingService {
  constructor() {
    this.baseUrl = AppConfig.services.scraping.baseUrl;
    this.timeout = AppConfig.services.scraping.timeout;
    this.retryAttempts = AppConfig.services.scraping.retryAttempts;
    
    // Initialisation du cache natif Lynx
    this.cache = new Cache({
      namespace: 'scraping',
      duration: AppConfig.performance.cache.duration
    });
    
    // Configuration du client réseau natif Lynx
    this.client = new Network({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      retries: this.retryAttempts,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Dictionnaire de titres alternatifs pour améliorer la recherche
    this.titleMappings = new Map();
    
    // Suivi des URLs actives pour chaque source
    this.activeUrls = {};
    SOURCES.forEach(source => {
      this.activeUrls[source.name] = source.baseUrl;
    });
  }

  /**
   * Vérifie si le cache est valide pour une clé donnée
   * @param {string} cacheKey - Clé de cache
   * @returns {boolean} True si le cache est valide
   */
  _isCacheValid(cacheKey) {
    if (!this.cache[cacheKey] || !this.cacheTimestamps[cacheKey]) {
      return false;
    }

    const now = new Date();
    const timestamp = this.cacheTimestamps[cacheKey];
    const diffMinutes = (now - timestamp) / (1000 * 60);

    return diffMinutes < CACHE_DURATION_MINUTES;
  }

  /**
   * Récupère l'URL active pour une source donnée
   * @param {string} sourceName - Nom de la source
   * @returns {string} URL active de la source
   */
  getActiveUrl(sourceName) {
    return this.activeUrls[sourceName] || SOURCES.find(s => s.name === sourceName)?.baseUrl;
  }

  /**
   * Essaie des URLs alternatives si l'URL principale échoue
   * @param {string} sourceName - Nom de la source
   * @param {Function} testFunction - Fonction pour tester l'URL
   * @returns {Promise<string>} URL fonctionnelle ou null si aucune URL ne fonctionne
   */
  async tryAlternativeUrls(sourceName, testFunction) {
    const source = SOURCES.find(s => s.name === sourceName);
    if (!source) return null;

    // Essayer d'abord l'URL active actuelle
    const currentUrl = this.getActiveUrl(sourceName);
    try {
      if (await testFunction(currentUrl)) {
        return currentUrl;
      }
    } catch (error) {
      console.warn(`L'URL active actuelle pour ${sourceName} a échoué: ${currentUrl}`);
    }

    // Essayer l'URL de base si différente de l'URL active
    if (source.baseUrl !== currentUrl) {
      try {
        if (await testFunction(source.baseUrl)) {
          this.activeUrls[sourceName] = source.baseUrl;
          return source.baseUrl;
        }
      } catch (error) {
        console.warn(`L'URL de base pour ${sourceName} a échoué: ${source.baseUrl}`);
      }
    }

    // Essayer les URLs alternatives
    if (source.fallbackUrls && source.fallbackUrls.length > 0) {
      for (const fallbackUrl of source.fallbackUrls) {
        try {
          if (await testFunction(fallbackUrl)) {
            this.activeUrls[sourceName] = fallbackUrl;
            console.log(`URL alternative trouvée pour ${sourceName}: ${fallbackUrl}`);
            return fallbackUrl;
          }
        } catch (error) {
          console.warn(`URL alternative pour ${sourceName} a échoué: ${fallbackUrl}`);
        }
      }
    }

    console.error(`Aucune URL fonctionnelle trouvée pour ${sourceName}`);
    return null;
  }

  /**
   * Normalise un titre pour la recherche
   * @param {string} title - Titre à normaliser
   * @returns {string} Titre normalisé
   */
  normalizeTitle(title) {
    if (!title) return '';
    
    // Convertir en minuscules
    let normalized = title.toLowerCase();
    
    // Supprimer les caractères spéciaux et les accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Supprimer les caractères non alphanumériques (sauf les espaces)
    normalized = normalized.replace(/[^\w\s]/g, '');
    
    // Remplacer les espaces multiples par un seul espace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  /**
   * Ajoute un mappage de titre alternatif
   * @param {string} mainTitle - Titre principal
   * @param {string|Array<string>} alternativeTitles - Titre(s) alternatif(s)
   */
  addTitleMapping(mainTitle, alternativeTitles) {
    if (!mainTitle) return;
    
    const normalizedMain = this.normalizeTitle(mainTitle);
    
    if (!this.titleMappings.has(normalizedMain)) {
      this.titleMappings.set(normalizedMain, new Set());
    }
    
    const titleSet = this.titleMappings.get(normalizedMain);
    
    if (Array.isArray(alternativeTitles)) {
      alternativeTitles.forEach(title => {
        if (title) titleSet.add(this.normalizeTitle(title));
      });
    } else if (alternativeTitles) {
      titleSet.add(this.normalizeTitle(alternativeTitles));
    }
  }

  /**
   * Vérifie si un titre correspond à une requête
   * @param {string} title - Titre à vérifier
   * @param {string} query - Requête de recherche
   * @returns {boolean} True si le titre correspond à la requête
   */
  titleMatchesQuery(title, query) {
    if (!title || !query) return false;
    
    const normalizedTitle = this.normalizeTitle(title);
    const normalizedQuery = this.normalizeTitle(query);
    
    // Vérification directe
    if (normalizedTitle.includes(normalizedQuery)) {
      return true;
    }
    
    // Vérification des titres alternatifs
    if (this.titleMappings.has(normalizedTitle)) {
      const alternativeTitles = this.titleMappings.get(normalizedTitle);
      for (const altTitle of alternativeTitles) {
        if (altTitle.includes(normalizedQuery)) {
          return true;
        }
      }
    }
    
    // Vérification inverse (si la requête est un titre alternatif)
    for (const [mainTitle, altTitles] of this.titleMappings.entries()) {
      if (altTitles.has(normalizedQuery) && mainTitle.includes(normalizedTitle)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extrait les titres alternatifs d'un contenu HTML
   * @param {Object} root - Élément racine HTML parsé
   * @returns {Array<string>} Liste des titres alternatifs
   */
  _extractAlternativeTitles(root) {
    const altTitles = [];
    
    // Recherche dans les métadonnées
    const metaTags = root.querySelectorAll('meta[property="og:title"], meta[name="title"], meta[name="keywords"]');
    metaTags.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) altTitles.push(content);
    });
    
    // Recherche dans les éléments avec des classes spécifiques
    const altTitleElements = root.querySelectorAll('.alternative-title, .alt-title, .other-names, .alias');
    altTitleElements.forEach(element => {
      const text = element.textContent.trim();
      if (text) {
        // Diviser par des séparateurs courants
        text.split(/[,;|/]/).forEach(part => {
          const trimmed = part.trim();
          if (trimmed) altTitles.push(trimmed);
        });
      }
    });
    
    return [...new Set(altTitles)]; // Éliminer les doublons
  }

  /**
   * Récupère le contenu depuis VoirDrama par scraping
   * @param {Object} options - Options de recherche
   * @param {string} options.query - Requête de recherche (optionnel)
   * @returns {Promise<Array>} Liste des éléments trouvés
   */
  async fetchFromVoirDrama(options = {}) {
    const cacheKey = `voirdrama_${JSON.stringify(options)}`;
    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      let url;
      const baseUrl = await this.tryAlternativeUrls('VoirDrama', async (testUrl) => {
        try {
          const testResponse = await ProxyService.get(`${testUrl}/drama-list`);
          return testResponse && testResponse.includes('drama-list');
        } catch (error) {
          return false;
        }
      });

      if (!baseUrl) {
        console.error('Aucune URL fonctionnelle trouvée pour VoirDrama');
        return [];
      }

      if (options.query) {
        url = `${baseUrl}/search.html?keyword=${encodeURIComponent(options.query)}`;
      } else {
        url = `${baseUrl}/drama-list`;
      }

      const html = await ProxyService.get(url);
      // Analyse du HTML
      const results = this._extractDataFromVoirDramaHtml(html);
      
      // Mise en cache des résultats
      this.cache[cacheKey] = results;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis VoirDrama:', error);
      return [];
    }
  }

  /**
   * Extrait les données depuis le HTML de VoirDrama
   * @param {string} html - Contenu HTML
   * @returns {Array} Liste des éléments trouvés
   */
  _extractDataFromVoirDramaHtml(html) {
    try {
      const root = parseHTML(html);
      // Nouvelle stratégie de sélection adaptive
      const selectors = [
        '.film-list .item', // Structure de recherche
        '.film-poster', // Structure liste
        '.items .item', // Structure alternative
        '[class*="film-item"]', // Sélecteur générique
        '[id^="movie"]' // Fallback ID
      ];
      
      const results = this._adaptiveSelectorSearch(root, selectors, 'VoirDrama');
      return this._removeDuplicates(results, 'link');
    } catch (error) {
      console.error('Erreur extraction VoirDrama :', error);
      return [];
    }
  }

  /**
   * Recherche adaptative avec fallback pour extraire les données
   * @param {Object} root - Élément racine HTML parsé
   * @param {Array<string>} selectors - Sélecteurs à essayer
   * @param {string} sourceName - Nom de la source
   * @returns {Array} Liste des éléments trouvés
   */
  _adaptiveSelectorSearch(root, selectors, sourceName) {
    const mediaItems = [];
    
    // Essayer chaque sélecteur
    for (const selector of selectors) {
      const elements = root.querySelectorAll(selector);
      
      if (elements.length > 0) {
        elements.forEach(element => {
          try {
            const linkElement = element.querySelector('a');
            const titleElement = element.querySelector('.title');
            const imageElement = element.querySelector('img');
            
            if (linkElement && titleElement) {
              const link = linkElement.getAttribute('href');
              const title = titleElement.textContent.trim();
              const image = imageElement ? imageElement.getAttribute('data-src') || imageElement.getAttribute('src') : '';
              
              // Extraction des titres alternatifs spécifiques à cet élément
              const elementAltTitles = [];
              const altTitleElement = element.querySelector('.other-name');
              if (altTitleElement) {
                const altTitleText = altTitleElement.textContent.trim();
                if (altTitleText) {
                  altTitleText.split(/[,;|/]/).forEach(part => {
                    const trimmed = part.trim();
                    if (trimmed) elementAltTitles.push(trimmed);
                  });
                }
              }
              
              // Combiner avec les titres alternatifs de la page
              const alternativeTitles = [...new Set([...elementAltTitles, ...this._extractAlternativeTitles(root)])];
              
              // Ajouter le mappage des titres alternatifs
              this.addTitleMapping(title, alternativeTitles);
              
              mediaItems.push({
                id: `${sourceName}-${Math.random().toString(36).substring(2, 10)}`,
                title,
                alternativeTitles,
                link: link.startsWith('http') ? link : `https://${sourceName}.org${link}`,
                image: image.startsWith('http') ? image : `https://${sourceName}.org${image}`,
                source: sourceName,
                type: 'drama',
              });
            }
          } catch (innerError) {
            console.warn(`Erreur lors de l'extraction d'un élément ${sourceName}:`, innerError);
          }
        });
        
        // Arrêter la recherche si des éléments ont été trouvés
        if (mediaItems.length > 0) {
          break;
        }
      }
    }
    
    return mediaItems;
  }

  /**
   * Récupère le contenu depuis DramaCool par scraping
   * @param {Object} options - Options de recherche
   * @param {string} options.query - Requête de recherche (optionnel)
   * @returns {Promise<Array>} Liste des éléments trouvés
   */
  async fetchFromDramaCool(options = {}) {
    const cacheKey = `dramacool_${JSON.stringify(options)}`;
    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      let url;
      const baseUrl = await this.tryAlternativeUrls('DramaCool', async (testUrl) => {
        try {
          const testResponse = await ProxyService.get(`${testUrl}`);
          return testResponse && testResponse.length > 0;
        } catch (error) {
          return false;
        }
      });

      if (!baseUrl) {
        console.error('Aucune URL fonctionnelle trouvée pour DramaCool');
        return [];
      }

      if (options.query) {
        url = `${baseUrl}/search?keyword=${encodeURIComponent(options.query)}`;
      } else {
        url = `${baseUrl}/drama-list`;
      }

      const html = await ProxyService.get(url);
      // Analyse du HTML
      const results = this._extractDataFromDramaCoolHtml(html);
      
      // Mise en cache des résultats
      this.cache[cacheKey] = results;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis DramaCool:', error);
      return [];
    }
  }

  /**
   * Extrait les données depuis le HTML de DramaCool
   * @param {string} html - Contenu HTML
   * @returns {Array} Liste des éléments trouvés
   */
  _extractDataFromDramaCoolHtml(html) {
    try {
      const root = parseHTML(html);
      const mediaItems = [];
      
      // Extraction des titres alternatifs de la page
      const pageTitles = this._extractAlternativeTitles(root);
      
      // Méthode 1: page de recherche standard
      const dramaElements = root.querySelectorAll('.block');
      
      if (dramaElements.length > 0) {
        dramaElements.forEach(element => {
          try {
            const linkElement = element.querySelector('a');
            const titleElement = element.querySelector('.title');
            const imageElement = element.querySelector('img');
            
            if (linkElement && titleElement) {
              const link = linkElement.getAttribute('href');
              const title = titleElement.textContent.trim();
              const image = imageElement ? imageElement.getAttribute('data-src') || imageElement.getAttribute('src') : '';
              
              // Extraction des titres alternatifs spécifiques à cet élément
              const elementAltTitles = [];
              const altTitleElement = element.querySelector('.other-name');
              if (altTitleElement) {
                const altTitleText = altTitleElement.textContent.trim();
                if (altTitleText) {
                  altTitleText.split(/[,;|/]/).forEach(part => {
                    const trimmed = part.trim();
                    if (trimmed) elementAltTitles.push(trimmed);
                  });
                }
              }
              
              // Combiner avec les titres alternatifs de la page
              const alternativeTitles = [...new Set([...elementAltTitles, ...pageTitles])];
              
              // Ajouter le mappage des titres alternatifs
              this.addTitleMapping(title, alternativeTitles);
              
              mediaItems.push({
                id: `dramacool-${Math.random().toString(36).substring(2, 10)}`,
                title,
                alternativeTitles,
                link: link.startsWith('http') ? link : `https://dramacool.com.tr${link}`,
                image: image.startsWith('http') ? image : `https://dramacool.com.tr${image}`,
                source: 'DramaCool',
                type: 'drama',
              });
            }
          } catch (innerError) {
            console.warn('Erreur lors de l\'extraction d\'un élément DramaCool (block):', innerError);
          }
        });
      }
      
      // Méthode 2: structure alternative (items)
      if (mediaItems.length === 0) {
        const itemElements = root.querySelectorAll('.items .item');
        itemElements.forEach(element => {
          try {
            const linkElement = element.querySelector('a');
            const titleElement = element.querySelector('.name') || element.querySelector('.title');
            const imageElement = element.querySelector('img');
            
            if (linkElement && titleElement) {
              const link = linkElement.getAttribute('href');
              const title = titleElement.textContent.trim();
              const image = imageElement ? imageElement.getAttribute('data-src') || imageElement.getAttribute('src') : '';
              
              mediaItems.push({
                id: `dramacool-${Math.random().toString(36).substring(2, 10)}`,
                title,
                alternativeTitles: pageTitles,
                link: link.startsWith('http') ? link : `https://dramacool.com.tr${link}`,
                image: image.startsWith('http') ? image : `https://dramacool.com.tr${image}`,
                source: 'DramaCool',
                type: 'drama',
              });
            }
          } catch (innerError) {
            console.warn('Erreur lors de l\'extraction d\'un élément DramaCool (item):', innerError);
          }
        });
      }
      
      // Méthode 3: structure avec ul/li
      if (mediaItems.length === 0) {
        const listElements = root.querySelectorAll('ul.list-episode-item li');
        listElements.forEach(element => {
          try {
            const linkElement = element.querySelector('a');
            const titleElement = element.querySelector('h3') || element.querySelector('.title') || linkElement;
            const imageElement = element.querySelector('img');
            
            if (linkElement && titleElement) {
              const link = linkElement.getAttribute('href');
              const title = titleElement.textContent.trim();
              const image = imageElement ? imageElement.getAttribute('data-src') || imageElement.getAttribute('src') : '';
              
              mediaItems.push({
                id: `dramacool-${Math.random().toString(36).substring(2, 10)}`,
                title,
                alternativeTitles: pageTitles,
                link: link.startsWith('http') ? link : `https://dramacool.com.tr${link}`,
                image: image.startsWith('http') ? image : `https://dramacool.com.tr${image}`,
                source: 'DramaCool',
                type: 'drama',
              });
            }
          } catch (innerError) {
            console.warn('Erreur lors de l\'extraction d\'un élément DramaCool (list):', innerError);
          }
        });
      }
      
      return mediaItems;
    } catch (error) {
      console.error('Erreur lors de l\'extraction des données DramaCool:', error);
      return [];
    }
  }

  /**
   * Récupère les contenus populaires
   * @returns {Promise<Array>} Liste des contenus populaires
   */
  async getPopular() {
    const cacheKey = 'popular_all';

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      // Récupérer les contenus populaires de chaque catégorie
      const [dramas, animes, movies] = await Promise.all([
        this.getPopularDramas(),
        this.getPopularAnimes(),
        this.getPopularMovies()
      ]);

      // Combiner les résultats
      const results = [...dramas, ...animes, ...movies];

      // Supprimer les doublons
      const uniqueResults = this._removeDuplicates(results, 'title');

      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueResults;
      this.cacheTimestamps[cacheKey] = new Date();

      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus populaires:', error);
      return [];
    }
  }

  /**
   * Récupère les dramas populaires
   * @returns {Promise<Array>} Liste des dramas populaires
   */
  async getPopularDramas() {
    const cacheKey = 'popular_dramas';

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      // Récupérer les dramas depuis VoirDrama (page d'accueil)
      const voirDramaResults = await this.fetchFromVoirDrama({});
      
      // Récupérer les dramas depuis DramaCool (page d'accueil)
      const dramaCoolResults = await this.fetchFromDramaCool({});
      
      // Combiner les résultats
      const results = [...voirDramaResults, ...dramaCoolResults];
      
      // Supprimer les doublons
      const uniqueResults = this._removeDuplicates(results, 'title');
      
      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueResults;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la récupération des dramas populaires:', error);
      return [];
    }
  }

  /**
   * Récupère les animés populaires
   * @returns {Promise<Array>} Liste des animés populaires
   */
  async getPopularAnimes() {
    const cacheKey = 'popular_animes';

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      let results = [];
      
      // Récupérer les animés depuis VoirAnime
      try {
        const baseUrl = await this.tryAlternativeUrls('VoirAnime', async (testUrl) => {
          try {
            const testResponse = await ProxyService.get(`${testUrl}/anime-list`);
            return testResponse && testResponse.includes('anime-list');
          } catch (error) {
            return false;
          }
        });
        
        if (baseUrl) {
          const html = await ProxyService.get(`${baseUrl}/home`);
          const voirAnimeResults = this._extractDataFromVoirAnimeHtml(html);
          results.push(...voirAnimeResults);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des animés depuis VoirAnime:', error);
      }
      
      // Récupérer les animés depuis GogoAnime
      try {
        const baseUrl = await this.tryAlternativeUrls('GogoAnime', async (testUrl) => {
          try {
            const testResponse = await ProxyService.get(`${testUrl}`);
            return testResponse && testResponse.includes('GogoAnime');
          } catch (error) {
            return false;
          }
        });
        
        if (baseUrl) {
          const html = await ProxyService.get(`${baseUrl}/home`);
          const gogoAnimeResults = this._extractDataFromGogoAnimeHtml(html);
          results.push(...gogoAnimeResults);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des animés depuis GogoAnime:', error);
      }
      
      // Récupérer les animés depuis les APIs
      const apiSources = SOURCES.filter(s => 
        s.enabled && 
        (s.type === 'anime' || s.name === 'VoirAnime')
      );
      
      for (const source of apiSources) {
        try {
          const baseUrl = await this.tryAlternativeUrls(source.name, async (testUrl) => {
            try {
              const response = await fetch(`${testUrl}/ping`);
              return response.ok;
            } catch (error) {
              return false;
            }
          });
          
          if (!baseUrl) {
            continue;
          }
          
          // Pour Jikan (MyAnimeList), utiliser l'endpoint top
          if (source.name === 'Jikan') {
            const url = `${baseUrl}/top/anime?limit=20`;
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extraire les données avec gestion de MAX_LENGTH
            const extractedData = ProxyService.extractDataFromResponse(data.data);
            
            // Transformer les résultats
            if (source.transform && typeof source.transform === 'function') {
              const transformedResults = Array.isArray(extractedData.data) 
                ? extractedData.data.map(source.transform)
                : [];
              
              results.push(...transformedResults);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des animés depuis ${source.name}:`, error);
        }
      }
      
      // Supprimer les doublons
      const uniqueResults = this._removeDuplicates(results, 'title');
      
      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueResults;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la récupération des animés populaires:', error);
      return [];
    }
  }

  /**
   * Récupère les films populaires
   * @returns {Promise<Array>} Liste des films populaires
   */
  async getPopularMovies() {
    const cacheKey = 'popular_movies';

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      let results = [];
      
      // Récupérer les films depuis TMDB
      const tmdbSource = SOURCES.find(s => s.name === 'TMDB' && s.enabled);
      
      if (tmdbSource && tmdbSource.apiKey) {
        try {
          const url = `${tmdbSource.baseUrl}/movie/popular?api_key=${tmdbSource.apiKey}&language=fr-FR`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Extraire les données avec gestion de MAX_LENGTH
          const extractedData = ProxyService.extractDataFromResponse(data.results);
          
          // Transformer les résultats
          if (tmdbSource.transform && typeof tmdbSource.transform === 'function') {
            const transformedResults = Array.isArray(extractedData.data) 
              ? extractedData.data.map(item => tmdbSource.transform({...item, media_type: 'movie'}))
              : [];
            
            results.push(...transformedResults);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des films depuis TMDB:', error);
        }
      }
      
      // Récupérer les films depuis les sources de Bollywood
      const bollywoodSources = SOURCES.filter(s => 
        s.enabled && 
        (s.name === 'Zee5Bollywood' || s.name === 'HotstarBollywood')
      );
      
      for (const source of bollywoodSources) {
        try {
          const baseUrl = source.baseUrl;
          const url = `${baseUrl}${source.apiPath}`;
          
          const html = await ProxyService.get(url);
          const bollywoodResults = this._extractBollywoodContent(html, source.name);
          
          results.push(...bollywoodResults);
        } catch (error) {
          console.error(`Erreur lors de la récupération des films depuis ${source.name}:`, error);
        }
      }
      
      // Supprimer les doublons
      const uniqueResults = this._removeDuplicates(results, 'title');
      
      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueResults;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la récupération des films populaires:', error);
      return [];
    }
  }

  /**
   * Récupère les K-shows populaires
   * @returns {Promise<Array>} Liste des K-shows populaires
   */
  async getPopularKshows() {
    const cacheKey = 'popular_kshows';

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      let results = [];
      
      // Récupérer les K-shows depuis DramaCool
      try {
        const baseUrl = await this.tryAlternativeUrls('DramaCool', async (testUrl) => {
          try {
            const testResponse = await ProxyService.get(`${testUrl}/kshow`);
            return testResponse && testResponse.includes('kshow');
          } catch (error) {
            return false;
          }
        });
        
        if (baseUrl) {
          const html = await ProxyService.get(`${baseUrl}/kshow`);
          const kshowResults = this._extractDataFromDramaCoolHtml(html);
          
          // Filtrer pour ne garder que les K-shows
          const filteredResults = kshowResults.filter(item => 
            item.title.toLowerCase().includes('show') || 
            item.title.toLowerCase().includes('variety') ||
            item.title.toLowerCase().includes('episode')
          );
          
          results.push(...filteredResults);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des K-shows depuis DramaCool:', error);
      }
      
      // Supprimer les doublons
      const uniqueResults = this._removeDuplicates(results, 'title');
      
      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueResults;
      this.cacheTimestamps[cacheKey] = new Date();
      
      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la récupération des K-shows populaires:', error);
      return [];
    }
  }

  /**
   * Recherche des dramas en fonction d'une requête
   * @param {string} query - Requête de recherche
   * @returns {Promise<Array>} Liste des dramas trouvés
   */
  async searchDramas(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    console.log(`[ScrapingService] Recherche de dramas pour: ${query}`);
    const normalizedQuery = this.normalizeTitle(query);
    const cacheKey = `search_dramas_${normalizedQuery}`;

    // Vérifier si les résultats sont en cache
    if (this._isCacheValid(cacheKey)) {
      console.log(`[ScrapingService] Utilisation du cache pour la recherche de dramas: ${normalizedQuery}`);
      return this.cache[cacheKey];
    }

    try {
      // Lancer les requêtes en parallèle pour toutes les sources
      const sources = SOURCES.filter(source => source.enabled && (!source.type || source.type === 'drama'));
      
      // Trier les sources par priorité
      sources.sort((a, b) => a.priority - b.priority);
      
      const results = await Promise.all(
        sources.map(async (source) => {
          try {
            let items = [];
            
            switch (source.name) {
              case 'VoirDrama':
                items = await this.fetchFromVoirDrama({ query });
                break;
              case 'DramaCool':
                items = await this.fetchFromDramaCool({ query });
                break;
              case 'AsianC':
                items = await this.fetchFromAsianC({ query });
                break;
              case 'DramaDay':
                items = await this.fetchFromDramaDay({ query });
                break;
              case 'MyDramaList':
                items = await this.fetchFromMyDramaList({ query });
                break;
              // Autres sources...
              default:
                console.warn(`[ScrapingService] Source non prise en charge: ${source.name}`);
                return [];
            }
            
            // Appliquer la transformation spécifique à la source
            if (source.transform && typeof source.transform === 'function') {
              items = items.map(source.transform);
            }
            
            return items;
          } catch (error) {
            console.error(`[ScrapingService] Erreur lors de la recherche sur ${source.name}:`, error);
            return [];
          }
        })
      );
      
      // Fusionner tous les résultats
      let allItems = results.flat();
      
      // Filtrer les résultats en fonction de la requête
      allItems = allItems.filter(item => this.titleMatchesQuery(item.title, normalizedQuery));
      
      // Supprimer les doublons
      allItems = this._removeDuplicates(allItems);
      
      // Mettre en cache les résultats
      this.cache[cacheKey] = allItems;
      this.cacheTimestamps[cacheKey] = Date.now();
      
      console.log(`[ScrapingService] Résultats de recherche pour ${query}:`, allItems.length);
      return allItems;
    } catch (error) {
      console.error(`[ScrapingService] Erreur lors de la recherche de dramas:`, error);
      return [];
    }
  }

  /**
   * Recherche des animés en fonction d'une requête
   * @param {string} query - Requête de recherche
   * @returns {Promise<Array>} Liste des animés trouvés
   */
  async searchAnime(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = this.normalizeTitle(query);
    const cacheKey = `search_anime_${normalizedQuery}`;

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      const sources = SOURCES.filter(s => s.enabled && (s.type === 'anime' || s.name === 'VoirAnime'));
      const results = [];

      // Recherche parallèle dans toutes les sources actives
      const searchPromises = sources.map(async (source) => {
        try {
          let sourceResults = [];
          
          if (source.isApi) {
            // Recherche via API
            const baseUrl = await this.tryAlternativeUrls(source.name, async (testUrl) => {
              try {
                const response = await fetch(`${testUrl}/ping`);
                return response.ok;
              } catch (error) {
                return false;
              }
            });
            
            if (!baseUrl) {
              console.warn(`API ${source.name} non disponible`);
              return [];
            }
            
            const url = `${baseUrl}${source.apiPath}?q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Transformer les résultats selon le format de l'API
            if (source.transform && typeof source.transform === 'function') {
              sourceResults = Array.isArray(data.results || data) 
                ? (data.results || data).map(source.transform)
                : [];
            } else {
              sourceResults = data.results || data || [];
            }
          } else if (source.name === 'VoirAnime') {
            // Recherche via scraping
            const baseUrl = await this.tryAlternativeUrls(source.name, async (testUrl) => {
              try {
                const testResponse = await ProxyService.get(`${testUrl}/anime-list`);
                return testResponse && testResponse.includes('anime-list');
              } catch (error) {
                return false;
              }
            });
            
            if (!baseUrl) {
              console.warn('VoirAnime non disponible');
              return [];
            }
            
            const url = `${baseUrl}/search?keyword=${encodeURIComponent(query)}`;
            const html = await ProxyService.get(url);
            
            // Extraction des données
            sourceResults = this._extractDataFromVoirAnimeHtml(html);
          } else if (source.name === 'GogoAnime') {
            // Recherche via scraping
            const baseUrl = await this.tryAlternativeUrls(source.name, async (testUrl) => {
              try {
                const testResponse = await ProxyService.get(`${testUrl}`);
                return testResponse && testResponse.includes('GogoAnime');
              } catch (error) {
                return false;
              }
            });
            
            if (!baseUrl) {
              console.warn('GogoAnime non disponible');
              return [];
            }
            
            const url = `${baseUrl}/search.html?keyword=${encodeURIComponent(query)}`;
            const html = await ProxyService.get(url);
            
            // Extraction des données
            sourceResults = this._extractDataFromGogoAnimeHtml(html);
          }
          
          return sourceResults.map(item => ({
            ...item,
            source: source.name,
            type: 'anime'
          }));
        } catch (error) {
          console.error(`Erreur lors de la recherche dans ${source.name}:`, error);
          return [];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      searchResults.forEach(sourceResults => {
        results.push(...sourceResults);
      });

      // Filtrer les résultats qui correspondent à la requête
      const filteredResults = results.filter(item => 
        this.titleMatchesQuery(item.title, query) || 
        (item.alternativeTitles && item.alternativeTitles.some(alt => this.titleMatchesQuery(alt, query)))
      );

      // Supprimer les doublons
      const uniqueAnimes = this._removeDuplicates(filteredResults, 'title');

      // Mise en cache des résultats
      this.cache[cacheKey] = uniqueAnimes;
      this.cacheTimestamps[cacheKey] = new Date();

      return uniqueAnimes;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'animés:', error);
      return [];
    }
  }

  /**
   * Recherche multi-source (dramas, animés, films)
   * @param {string} query - Requête de recherche
   * @returns {Promise<Object>} Résultats de recherche par catégorie
   */
  async searchAll(query) {
    if (!query || query.trim().length === 0) {
      return {
        dramas: [],
        animes: [],
        movies: []
      };
    }

    const normalizedQuery = this.normalizeTitle(query);
    const cacheKey = `search_all_${normalizedQuery}`;

    if (this._isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      // Recherche parallèle dans toutes les catégories
      const [dramas, animes] = await Promise.all([
        this.searchDramas(query),
        this.searchAnime(query)
      ]);

      // Extraire les films des résultats de dramas (à améliorer plus tard)
      const movies = dramas.filter(item => item.type === 'movie');
      const puredramas = dramas.filter(item => item.type !== 'movie');

      const results = {
        dramas: puredramas,
        animes,
        movies
      };

      // Mise en cache des résultats
      this.cache[cacheKey] = results;
      this.cacheTimestamps[cacheKey] = new Date();

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche multi-source:', error);
      return {
        dramas: [],
        animes: [],
        movies: []
      };
    }
  }

  /**
   * Résout le défi Cloudflare
   * @param {string} url - URL à résoudre
   * @returns {Promise<Object>} Objet contenant les cookies et les entêtes nécessaires
   */
  async _solveCloudflareChallenge(url) {
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Récupération des cookies et entêtes post-challenge
    const cookies = await page.cookies();
    const userAgent = await page.evaluate(() => navigator.userAgent);
    
    await browser.close();
    
    return {
      cookies: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'fr-FR,fr;q=0.9'
      }
    };
  }

  /**
   * Extrait le contenu de Bollywood
   * @param {string} html - Contenu HTML
   * @param {string} source - Source du contenu
   * @returns {Array} Liste des éléments extraits
   */
  async _extractBollywoodContent(html, source) {
    const isHotstar = source === 'hotstar';
    const baseSelector = isHotstar ? '.tile-container' : '.movie-card';
    
    return this._adaptiveSelectorSearch(html, [
      `${baseSelector} .title`, 
      `${baseSelector} [data-testid='title']`,
      'h3.movieTitle'
    ]);
  }

  /**
   * Extrait les liens de sous-titres
   * @param {string} videoUrl - URL de la vidéo
   * @param {string} source - Source de la vidéo
   * @returns {Promise<Array>} Liste des liens de sous-titres
   */
  async _extractSubtitleLinks(videoUrl, source) {
    try {
      const html = await this._fetchHtml(videoUrl);
      const root = parseHTML(html);
      
      // Sélecteurs adaptatifs pour les liens de sous-titres
      const subtitleElements = root.querySelectorAll('.subtitle-item, .sub-item, [data-type="subtitle"]');
      
      return Array.from(subtitleElements).map(element => {
        const url = element.getAttribute('data-src') || element.getAttribute('src');
        const lang = element.getAttribute('data-lang') || element.getAttribute('lang') || 'en';
        return { url, lang };
      });
    } catch (error) {
      console.error(`Erreur lors de l'extraction des sous-titres: ${error.message}`);
      return [];
    }
  }

  /**
   * Traduit un sous-titre
   * @param {string} text - Texte à traduire
   * @param {string} targetLang - Langue cible
   * @returns {Promise<string>} Texte traduit
   */
  async _translateSubtitle(text, targetLang = 'fr') {
    return TranslationService.translate(text, targetLang);
  }

  /**
   * Traite les sous-titres
   * @param {string} videoId - ID de la vidéo
   * @param {Array} subtitles - Liste des sous-titres
   * @returns {Promise<Array>} Liste des sous-titres traités
   */
  async _processSubtitles(videoId, subtitles) {
    // Traitement par lots pour éviter les limitations d'API
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize);
      const batchPromises = batch.map(async (subtitleItem) => {
        try {
          // Téléchargement du sous-titre
          const response = await axios.get(subtitleItem.url);
          const subtitleContent = response.data;
          
          // Parsing du format (SRT, VTT, etc.)
          const parsed = parseSubtitle(subtitleContent);
          
          // Utilisation du service de traduction pour traduire tous les segments
          const translatedCues = await TranslationService.translateSubtitles(parsed, 'fr');
          
          // Reconstruction du sous-titre
          const translatedContent = parseSubtitle.stringify(translatedCues);
          
          // Stockage du résultat
          results.push({
            lang: subtitleItem.lang,
            targetLang: 'fr',
            content: translatedContent
          });
          
        } catch (error) {
          console.error(`Erreur de traitement du sous-titre: ${error.message}`);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Pause entre les lots pour éviter le rate limiting
      if (i + batchSize < subtitles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }
}

// Exporter une instance unique du service
const scrapingService = new ScrapingService();
export default scrapingService;
