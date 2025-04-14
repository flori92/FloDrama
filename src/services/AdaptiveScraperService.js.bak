/**
 * AdaptiveScraperService
 * 
 * Service d'analyse structurelle adaptative pour le scraping
 * Permet de détecter automatiquement les éléments importants sur n'importe quel site
 */

import { parse as parseHTML } from 'node-html-parser';
import ProxyService from './ProxyService.js';
import BrowserFingerprintService from './BrowserFingerprintService.js';
import HumanBehaviorService from './HumanBehaviorService.js';

class AdaptiveScraperService {
  constructor() {
    this.proxyService = ProxyService;
    this.fingerprintService = BrowserFingerprintService;
    this.behaviorService = HumanBehaviorService;
    
    // Modèles de structure connus pour différents types de sites
    this.knownStructures = {
      // Modèles pour les sites de streaming de dramas
      dramaStreaming: [
        {
          name: 'VoirDrama',
          domain: 'voirdrama.org',
          selectors: {
            popularItems: '.movies-list .movie-item',
            itemTitle: '.movie-item .movie-title h2 a',
            itemPoster: '.movie-item .movie-poster img',
            itemLink: '.movie-item .movie-title h2 a',
            itemMeta: '.movie-item .movie-details',
            pagination: '.pagination'
          }
        },
        {
          name: 'DramaCool',
          domain: 'dramacool.com',
          selectors: {
            popularItems: '.list-episode-item',
            itemTitle: '.title a',
            itemPoster: '.img img',
            itemLink: '.title a',
            itemMeta: '.meta',
            pagination: '.pagination'
          }
        }
      ],
      
      // Modèles génériques pour différents types de sites
      generic: {
        // Sélecteurs génériques pour les grilles de contenu
        contentGrids: [
          '.grid', '.list', '.items', '.row', '.container',
          '[class*="grid"]', '[class*="list"]', '[class*="items"]', 
          '[class*="row"]', '[class*="container"]'
        ],
        
        // Sélecteurs génériques pour les éléments individuels
        contentItems: [
          '.item', '.card', '.box', '.post', '.article', '.movie', '.drama',
          '[class*="item"]', '[class*="card"]', '[class*="box"]', 
          '[class*="post"]', '[class*="article"]', '[class*="movie"]', 
          '[class*="drama"]'
        ],
        
        // Sélecteurs génériques pour les titres
        titles: [
          'h1', 'h2', 'h3', '.title', '.name', '.heading',
          '[class*="title"]', '[class*="name"]', '[class*="heading"]'
        ],
        
        // Sélecteurs génériques pour les images
        images: [
          'img', '.image', '.poster', '.thumbnail', '.cover',
          '[class*="image"]', '[class*="poster"]', '[class*="thumbnail"]', 
          '[class*="cover"]'
        ],
        
        // Sélecteurs génériques pour les liens
        links: [
          'a', '.link', '.url', '.more',
          '[class*="link"]', '[class*="url"]', '[class*="more"]'
        ],
        
        // Sélecteurs génériques pour les métadonnées
        metadata: [
          '.meta', '.info', '.details', '.description', '.summary',
          '[class*="meta"]', '[class*="info"]', '[class*="details"]', 
          '[class*="description"]', '[class*="summary"]'
        ],
        
        // Sélecteurs génériques pour la pagination
        pagination: [
          '.pagination', '.pager', '.pages', '.nav', '.navigation',
          '[class*="pagination"]', '[class*="pager"]', '[class*="pages"]', 
          '[class*="nav"]', '[class*="navigation"]'
        ]
      }
    };
    
    // Statistiques d'efficacité des sélecteurs
    this.selectorStats = new Map();
    
    // Cache des structures détectées par domaine
    this.detectedStructures = new Map();
  }
  
  /**
   * Détecte la structure d'une page web
   * @param {String} html - Contenu HTML de la page
   * @param {String} url - URL de la page
   * @returns {Object} Structure détectée
   */
  detectPageStructure(html, url) {
    const domain = this.extractDomain(url);
    
    // Vérifier si nous avons déjà une structure détectée pour ce domaine
    if (this.detectedStructures.has(domain)) {
      return this.detectedStructures.get(domain);
    }
    
    // Vérifier si nous avons un modèle connu pour ce domaine
    const knownStructure = this.findKnownStructure(domain);
    if (knownStructure) {
      this.detectedStructures.set(domain, knownStructure);
      return knownStructure;
    }
    
    // Analyser la structure de la page
    const root = parseHTML(html);
    
    // Détecter les grilles de contenu
    const contentGrids = this.detectContentGrids(root);
    
    // Détecter les éléments de contenu
    const contentItems = this.detectContentItems(root, contentGrids);
    
    // Détecter les sélecteurs pour les différents éléments
    const structure = {
      domain,
      selectors: {
        popularItems: this.findBestSelector(contentItems),
        itemTitle: this.detectTitleSelector(contentItems),
        itemPoster: this.detectImageSelector(contentItems),
        itemLink: this.detectLinkSelector(contentItems),
        itemMeta: this.detectMetaSelector(contentItems),
        pagination: this.detectPaginationSelector(root)
      }
    };
    
    // Enregistrer la structure détectée
    this.detectedStructures.set(domain, structure);
    
    return structure;
  }
  
  /**
   * Extrait le domaine d'une URL
   * @param {String} url - URL à analyser
   * @returns {String} Domaine
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // Fallback si l'URL est invalide
      const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\n]+?)(?:\/|$)/i);
      return match ? match[1] : '';
    }
  }
  
  /**
   * Recherche un modèle de structure connu pour un domaine
   * @param {String} domain - Domaine à rechercher
   * @returns {Object|null} Modèle de structure ou null
   */
  findKnownStructure(domain) {
    // Rechercher dans les modèles de sites de streaming de dramas
    for (const structure of this.knownStructures.dramaStreaming) {
      if (domain.includes(structure.domain)) {
        return structure;
      }
    }
    
    return null;
  }
  
  /**
   * Détecte les grilles de contenu dans une page
   * @param {Object} root - Racine du document HTML
   * @returns {Array} Éléments de grille détectés
   */
  detectContentGrids(root) {
    const grids = [];
    
    // Essayer les sélecteurs génériques
    for (const selector of this.knownStructures.generic.contentGrids) {
      const elements = root.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // Filtrer les éléments qui contiennent probablement du contenu
        for (const element of elements) {
          // Vérifier si l'élément contient des enfants qui ressemblent à des éléments de contenu
          const hasContentChildren = this.hasContentChildren(element);
          if (hasContentChildren) {
            grids.push(element);
          }
        }
      }
    }
    
    // Si aucune grille n'a été trouvée, essayer de détecter les listes
    if (grids.length === 0) {
      const lists = root.querySelectorAll('ul, ol, div > div');
      for (const list of lists) {
        if (list.childNodes.length >= 3) { // Au moins 3 enfants
          const hasContentChildren = this.hasContentChildren(list);
          if (hasContentChildren) {
            grids.push(list);
          }
        }
      }
    }
    
    return grids;
  }
  
  /**
   * Vérifie si un élément contient des enfants qui ressemblent à du contenu
   * @param {Object} element - Élément à vérifier
   * @returns {Boolean} True si l'élément contient du contenu
   */
  hasContentChildren(element) {
    // Vérifier si l'élément a des enfants
    if (!element.childNodes || element.childNodes.length === 0) {
      return false;
    }
    
    // Vérifier si les enfants contiennent des images ou des liens
    const hasImages = element.querySelectorAll('img').length > 0;
    const hasLinks = element.querySelectorAll('a').length > 0;
    
    // Vérifier si les enfants ont une structure similaire (indice de liste de contenu)
    const childrenClasses = new Set();
    let similarChildren = 0;
    
    for (const child of element.childNodes) {
      if (child.classList && child.classList.value) {
        childrenClasses.add(child.classList.value);
      }
    }
    
    // Si tous les enfants ont la même classe, c'est probablement une liste de contenu
    if (childrenClasses.size === 1 && element.childNodes.length >= 3) {
      similarChildren = element.childNodes.length;
    }
    
    return (hasImages || hasLinks) && similarChildren >= 3;
  }
  
  /**
   * Détecte les éléments de contenu dans une page
   * @param {Object} root - Racine du document HTML
   * @param {Array} contentGrids - Grilles de contenu détectées
   * @returns {Array} Éléments de contenu détectés
   */
  detectContentItems(root, contentGrids) {
    const items = [];
    
    // Rechercher dans les grilles détectées
    for (const grid of contentGrids) {
      // Essayer les sélecteurs génériques
      for (const selector of this.knownStructures.generic.contentItems) {
        const elements = grid.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          items.push(...elements);
        }
      }
      
      // Si aucun élément n'a été trouvé, utiliser les enfants directs
      if (items.length === 0) {
        const children = grid.childNodes;
        for (const child of children) {
          if (child.tagName && this.looksLikeContentItem(child)) {
            items.push(child);
          }
        }
      }
    }
    
    // Si aucun élément n'a été trouvé dans les grilles, rechercher dans toute la page
    if (items.length === 0) {
      for (const selector of this.knownStructures.generic.contentItems) {
        const elements = root.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          items.push(...elements);
        }
      }
    }
    
    return items;
  }
  
  /**
   * Vérifie si un élément ressemble à un élément de contenu
   * @param {Object} element - Élément à vérifier
   * @returns {Boolean} True si l'élément ressemble à du contenu
   */
  looksLikeContentItem(element) {
    // Vérifier si l'élément contient une image
    const hasImage = element.querySelector('img') !== null;
    
    // Vérifier si l'élément contient un lien
    const hasLink = element.querySelector('a') !== null;
    
    // Vérifier si l'élément contient un titre
    const hasTitle = element.querySelector('h1, h2, h3, h4, .title, [class*="title"]') !== null;
    
    // Vérifier la taille de l'élément (les éléments de contenu ont généralement une taille significative)
    const hasSize = element.getAttribute('style') && 
                   (element.getAttribute('style').includes('width') || 
                    element.getAttribute('style').includes('height'));
    
    return (hasImage || hasLink) && (hasTitle || hasSize);
  }
  
  /**
   * Trouve le meilleur sélecteur pour un ensemble d'éléments
   * @param {Array} elements - Éléments à analyser
   * @returns {String} Sélecteur CSS
   */
  findBestSelector(elements) {
    if (!elements || elements.length === 0) {
      return '';
    }
    
    // Collecter les classes communes
    const classesCount = new Map();
    
    for (const element of elements) {
      if (element.classList) {
        for (const className of element.classList.value.split(' ')) {
          if (className) {
            classesCount.set(className, (classesCount.get(className) || 0) + 1);
          }
        }
      }
    }
    
    // Trouver la classe la plus commune
    let bestClass = '';
    let bestCount = 0;
    
    for (const [className, count] of classesCount.entries()) {
      if (count > bestCount) {
        bestClass = className;
        bestCount = count;
      }
    }
    
    // Si une classe commune a été trouvée et est présente dans au moins la moitié des éléments
    if (bestClass && bestCount >= elements.length / 2) {
      return `.${bestClass}`;
    }
    
    // Sinon, utiliser le tag name
    const tagName = elements[0].tagName.toLowerCase();
    return tagName;
  }
  
  /**
   * Détecte le sélecteur pour les titres
   * @param {Array} contentItems - Éléments de contenu
   * @returns {String} Sélecteur CSS
   */
  detectTitleSelector(contentItems) {
    if (!contentItems || contentItems.length === 0) {
      return '';
    }
    
    const titleElements = [];
    
    // Rechercher les éléments de titre dans chaque élément de contenu
    for (const item of contentItems) {
      // Essayer les sélecteurs génériques
      for (const selector of this.knownStructures.generic.titles) {
        const elements = item.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          titleElements.push(...elements);
        }
      }
    }
    
    return this.findBestSelector(titleElements);
  }
  
  /**
   * Détecte le sélecteur pour les images
   * @param {Array} contentItems - Éléments de contenu
   * @returns {String} Sélecteur CSS
   */
  detectImageSelector(contentItems) {
    if (!contentItems || contentItems.length === 0) {
      return '';
    }
    
    const imageElements = [];
    
    // Rechercher les éléments d'image dans chaque élément de contenu
    for (const item of contentItems) {
      // Essayer les sélecteurs génériques
      for (const selector of this.knownStructures.generic.images) {
        const elements = item.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          imageElements.push(...elements);
        }
      }
    }
    
    return this.findBestSelector(imageElements);
  }
  
  /**
   * Détecte le sélecteur pour les liens
   * @param {Array} contentItems - Éléments de contenu
   * @returns {String} Sélecteur CSS
   */
  detectLinkSelector(contentItems) {
    if (!contentItems || contentItems.length === 0) {
      return '';
    }
    
    const linkElements = [];
    
    // Rechercher les éléments de lien dans chaque élément de contenu
    for (const item of contentItems) {
      // Essayer les sélecteurs génériques
      for (const selector of this.knownStructures.generic.links) {
        const elements = item.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          linkElements.push(...elements);
        }
      }
    }
    
    return this.findBestSelector(linkElements);
  }
  
  /**
   * Détecte le sélecteur pour les métadonnées
   * @param {Array} contentItems - Éléments de contenu
   * @returns {String} Sélecteur CSS
   */
  detectMetaSelector(contentItems) {
    if (!contentItems || contentItems.length === 0) {
      return '';
    }
    
    const metaElements = [];
    
    // Rechercher les éléments de métadonnées dans chaque élément de contenu
    for (const item of contentItems) {
      // Essayer les sélecteurs génériques
      for (const selector of this.knownStructures.generic.metadata) {
        const elements = item.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          metaElements.push(...elements);
        }
      }
    }
    
    return this.findBestSelector(metaElements);
  }
  
  /**
   * Détecte le sélecteur pour la pagination
   * @param {Object} root - Racine du document HTML
   * @returns {String} Sélecteur CSS
   */
  detectPaginationSelector(root) {
    const paginationElements = [];
    
    // Essayer les sélecteurs génériques
    for (const selector of this.knownStructures.generic.pagination) {
      const elements = root.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        paginationElements.push(...elements);
      }
    }
    
    return this.findBestSelector(paginationElements);
  }
  
  /**
   * Extrait les données d'une page en utilisant la structure détectée
   * @param {String} html - Contenu HTML de la page
   * @param {Object} structure - Structure détectée
   * @returns {Array} Données extraites
   */
  extractData(html, structure) {
    const root = parseHTML(html);
    const items = [];
    
    // Extraire les éléments de contenu
    const contentItems = root.querySelectorAll(structure.selectors.popularItems);
    
    for (const item of contentItems) {
      try {
        // Extraire le titre
        const titleElement = item.querySelector(structure.selectors.itemTitle);
        const title = titleElement ? titleElement.text.trim() : '';
        
        // Extraire l'image
        const imageElement = item.querySelector(structure.selectors.itemPoster);
        const imageUrl = imageElement ? imageElement.getAttribute('src') : '';
        
        // Extraire le lien
        const linkElement = item.querySelector(structure.selectors.itemLink);
        const link = linkElement ? linkElement.getAttribute('href') : '';
        
        // Extraire les métadonnées
        const metaElement = item.querySelector(structure.selectors.itemMeta);
        const meta = metaElement ? metaElement.text.trim() : '';
        
        // Créer l'objet d'élément
        const itemData = {
          title,
          imageUrl,
          link,
          meta
        };
        
        // Ajouter l'élément à la liste
        items.push(itemData);
      } catch (error) {
        console.error('Erreur lors de l\'extraction des données:', error);
      }
    }
    
    return items;
  }
  
  /**
   * Scrape une URL en utilisant la détection automatique de structure
   * @param {String} url - URL à scraper
   * @returns {Promise<Array>} Données extraites
   */
  async scrapeUrl(url) {
    try {
      // Générer une empreinte digitale de navigateur
      const fingerprint = this.fingerprintService.generateRandomFingerprint();
      
      // Générer des en-têtes HTTP basés sur l'empreinte
      const headers = this.fingerprintService.generateHeaders(fingerprint);
      
      // Ajouter un referer réaliste
      headers['Referer'] = this.behaviorService.generateReferer(url);
      
      // Ajouter des cookies réalistes
      const domain = this.extractDomain(url);
      headers['Cookie'] = this.fingerprintService.generateCookies(domain, fingerprint);
      
      // Effectuer la requête HTTP
      const response = await this.proxyService.get(url, headers);
      
      // Détecter la structure de la page
      const structure = this.detectPageStructure(response.data, url);
      
      // Extraire les données
      const items = this.extractData(response.data, structure);
      
      return items;
    } catch (error) {
      console.error('Erreur lors du scraping de l\'URL:', error);
      throw error;
    }
  }
  
  /**
   * Scrape une URL avec pagination
   * @param {String} baseUrl - URL de base
   * @param {Number} pageCount - Nombre de pages à scraper
   * @returns {Promise<Array>} Données extraites
   */
  async scrapeWithPagination(baseUrl, pageCount = 1) {
    const allItems = [];
    
    for (let page = 1; page <= pageCount; page++) {
      try {
        // Construire l'URL de la page
        const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
        
        // Scraper la page
        const items = await this.scrapeUrl(url);
        
        // Ajouter les éléments à la liste
        allItems.push(...items);
        
        // Ajouter un délai aléatoire pour simuler un comportement humain
        if (page < pageCount) {
          const delay = this.behaviorService.generateThinkingDelay(2000, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Erreur lors du scraping de la page ${page}:`, error);
      }
    }
    
    return allItems;
  }
}

// Exporter une instance unique du service
const adaptiveScraperService = new AdaptiveScraperService();
export default adaptiveScraperService;
