/**
 * Parser HTML léger et optimisé pour Cloudflare Workers
 * Inspiré de cheerio mais sans dépendances externes
 */

class HTMLParser {
  constructor(html) {
    this.html = html;
  }

  /**
   * Extrait le contenu d'un élément qui correspond à un sélecteur CSS simple
   * @param {string} selector - Sélecteur au format tag[attribut=valeur] ou tag.class ou tag#id
   * @returns {string|null} - Le contenu textuel de l'élément
   */
  querySelector(selector) {
    // Transformation du sélecteur CSS en expression régulière
    const regex = this._selectorToRegex(selector);
    const match = this.html.match(regex);
    
    if (!match) return null;
    
    // Extraire le contenu entre les balises
    const openTagEnd = match[0].indexOf('>');
    const closeTagStart = match[0].lastIndexOf('<');
    
    if (openTagEnd === -1 || closeTagStart === -1 || closeTagStart < openTagEnd) {
      return null;
    }
    
    const content = match[0].substring(openTagEnd + 1, closeTagStart);
    return this._decodeHTML(content.trim());
  }

  /**
   * Extrait tous les éléments qui correspondent à un sélecteur CSS simple
   * @param {string} selector - Sélecteur au format tag[attribut=valeur] ou tag.class ou tag#id
   * @returns {string[]} - Les contenus textuels des éléments
   */
  querySelectorAll(selector) {
    const results = [];
    const regex = this._selectorToRegex(selector, 'g');
    
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      const fullMatch = match[0];
      const openTagEnd = fullMatch.indexOf('>');
      const closeTagStart = fullMatch.lastIndexOf('<');
      
      if (openTagEnd !== -1 && closeTagStart !== -1 && closeTagStart > openTagEnd) {
        const content = fullMatch.substring(openTagEnd + 1, closeTagStart);
        results.push(this._decodeHTML(content.trim()));
      }
    }
    
    return results;
  }

  /**
   * Extrait la valeur d'un attribut d'un élément
   * @param {string} selector - Sélecteur CSS simple
   * @param {string} attribute - Nom de l'attribut à extraire
   * @returns {string|null} - Valeur de l'attribut
   */
  getAttributeValue(selector, attribute) {
    // Transformation du sélecteur sans l'attribut cible
    const tag = selector.split('[')[0].split('.')[0].split('#')[0];
    const attrRegex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*)["'][^>]*>`, 'i');
    const match = this.html.match(attrRegex);
    
    return match ? match[1] : null;
  }

  /**
   * Extrait toutes les valeurs d'un attribut pour un sélecteur donné
   * @param {string} selector - Sélecteur CSS simple
   * @param {string} attribute - Nom de l'attribut à extraire
   * @returns {string[]} - Valeurs de l'attribut
   */
  getAllAttributeValues(selector, attribute) {
    const results = [];
    const tag = selector.split('[')[0].split('.')[0].split('#')[0];
    const attrRegex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*)["'][^>]*>`, 'gi');
    
    let match;
    while ((match = attrRegex.exec(this.html)) !== null) {
      results.push(match[1]);
    }
    
    return results;
  }

  /**
   * Extrait du texte correspondant à un pattern entre deux balises
   * @param {string} startTag - Balise ou texte de début
   * @param {string} endTag - Balise ou texte de fin
   * @returns {string|null} - Contenu entre les balises
   */
  extractBetween(startTag, endTag) {
    const startIndex = this.html.indexOf(startTag);
    if (startIndex === -1) return null;
    
    const startPos = startIndex + startTag.length;
    const endPos = this.html.indexOf(endTag, startPos);
    
    if (endPos === -1) return null;
    
    return this._decodeHTML(this.html.substring(startPos, endPos).trim());
  }

  /**
   * Transforme un sélecteur CSS simple en expression régulière
   * @private
   * @param {string} selector - Sélecteur CSS 
   * @param {string} flags - Flags pour la regex (ex: 'g' pour global)
   * @returns {RegExp} - Expression régulière correspondante
   */
  _selectorToRegex(selector, flags = '') {
    // Extraction du nom de la balise (tag)
    let tag = selector.split(/[.#[]/)[0] || '[a-zA-Z0-9]+';
    
    // Construction de l'expression pour les attributs et classes
    let attributes = '';
    
    // Traitement des classes (.class)
    if (selector.includes('.')) {
      const className = selector.match(/\.([a-zA-Z0-9_-]+)/);
      if (className) {
        attributes += `(?:[^>]*class=["'][^"']*${className[1]}[^"']*["'])?`;
      }
    }
    
    // Traitement des IDs (#id)
    if (selector.includes('#')) {
      const id = selector.match(/#([a-zA-Z0-9_-]+)/);
      if (id) {
        attributes += `(?:[^>]*id=["']${id[1]}["'])?`;
      }
    }
    
    // Traitement des attributs ([attr=value])
    const attrMatches = selector.match(/\[([^\]]+)\]/g);
    if (attrMatches) {
      attrMatches.forEach(attrMatch => {
        const [attr, value] = attrMatch.slice(1, -1).split('=');
        const cleanValue = value ? value.replace(/["']/g, '') : '';
        
        if (value) {
          attributes += `(?:[^>]*${attr}=["']${cleanValue}["'])?`;
        } else {
          attributes += `(?:[^>]*${attr}(?:=["'][^"']*["'])?)?`;
        }
      });
    }
    
    // Construction de la regex complète
    return new RegExp(`<${tag}${attributes}[^>]*>.*?<\/${tag}>`, flags + 's');
  }

  /**
   * Décode les entités HTML communes
   * @private
   * @param {string} text - Texte à décoder
   * @returns {string} - Texte décodé
   */
  _decodeHTML(text) {
    if (!text) return '';
    
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}

/**
 * Fonction pour parser du HTML et fournir une API similaire à cheerio/jQuery
 * @param {string} html - Le code HTML à parser
 * @returns {Object} - Un objet avec des méthodes de sélection similaires à jQuery
 */
function parseHTML(html) {
  const parser = new HTMLParser(html);
  
  return {
    find: (selector) => {
      return {
        text: () => {
          const result = parser.querySelector(selector);
          return result || '';
        },
        attr: (attribute) => {
          return parser.getAttributeValue(selector, attribute);
        },
        each: (callback) => {
          const elements = parser.querySelectorAll(selector);
          elements.forEach((element, index) => {
            callback(index, { 
              text: () => element,
              attr: (attr) => parser.getAttributeValue(`${selector}:eq(${index})`, attr)
            });
          });
        }
      };
    },
    text: () => {
      // Retourne tout le texte sans balises HTML
      return html.replace(/<[^>]*>/g, '').trim();
    },
    attr: (attribute) => {
      // Cherche l'attribut dans la première balise
      const match = html.match(new RegExp(`<[^>]*${attribute}=["']([^"']*)["'][^>]*>`));
      return match ? match[1] : null;
    },
    each: (callback) => {
      // Pour chaque élément racine
      const rootElements = html.match(/<([a-z0-9]+)[^>]*>.*?<\/\1>/gis) || [];
      rootElements.forEach((element, index) => {
        callback(index, parseHTML(element));
      });
    }
  };
}

export { HTMLParser, parseHTML };
export default HTMLParser;
