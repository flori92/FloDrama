/**
 * Extracteurs pour le système de scraping Crawlee de FloDrama
 * Ce fichier contient les fonctions d'extraction spécifiques à chaque source
 */

const { generateUniqueId, cleanUrl, extractYear, extractRating, normalizeTitle } = require('./utils');

/**
 * Extracteur pour Filmapik
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractFilmapik($, element, sourceName, config) {
  try {
    const $item = $(element);
    const $link = $item.find('.ml-mask');
    const $title = $item.find('.mli-info h2');
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $title.text().trim();
    
    // Extraire l'image
    const posterStyle = $link.attr('style') || '';
    const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
    const poster = $link.data('original') || (posterMatch ? posterMatch[1] : '');
    
    // Extraire l'année
    const yearMatch = $item.find('.mli-info').text().match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Extraire la note
    const ratingText = $item.find('.rating').text().trim();
    const ratingMatch = ratingText.match(/([0-9.]+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    
    // Créer l'objet film
    return {
      id: generateUniqueId(sourceName, id),
      title: normalizeTitle(title),
      original_title: title,
      url: cleanUrl(url, config.url),
      poster: cleanUrl(poster, config.url),
      backdrop: cleanUrl(poster, config.url),
      year: year,
      rating: rating,
      source: sourceName,
      type: 'film',
      language: config.language || 'multi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de l'extraction: ${error.message}`);
    return null;
  }
}

/**
 * Extracteur pour MyDramaList
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractMyDramaList($, element, sourceName, config) {
  try {
    const $item = $(element);
    const $link = $item.find('.box-header a');
    const $image = $item.find('img.img-responsive');
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $link.text().trim();
    
    // Extraire l'image
    const poster = $image.attr('src') || $image.data('src') || '';
    
    // Extraire l'année
    const infoText = $item.find('.text-muted').text();
    const yearMatch = infoText.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    
    // Extraire la note
    const ratingText = $item.find('.score').text().trim();
    const rating = parseFloat(ratingText) || 0;
    
    // Extraire la description
    const description = $item.find('.box-body .content').text().trim();
    
    // Créer l'objet drama
    return {
      id: generateUniqueId(sourceName, id),
      title: normalizeTitle(title),
      original_title: title,
      description: description,
      url: cleanUrl(url, config.url),
      poster: cleanUrl(poster, config.url),
      backdrop: cleanUrl(poster, config.url),
      year: year,
      rating: rating,
      source: sourceName,
      type: 'drama',
      language: config.language || 'ko',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de l'extraction: ${error.message}`);
    return null;
  }
}

/**
 * Extracteur pour DramaCool
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractDramaCool($, element, sourceName, config) {
  try {
    const $item = $(element);
    const $link = $item.find('.block-wrapper-a');
    const $image = $item.find('img.img-responsive');
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $item.find('.title-in-block').text().trim();
    
    // Extraire l'image
    const poster = $image.attr('src') || $image.data('src') || '';
    
    // Extraire l'année
    const infoText = $item.find('.ep').text();
    const yearMatch = infoText.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Créer l'objet drama
    return {
      id: generateUniqueId(sourceName, id),
      title: normalizeTitle(title),
      original_title: title,
      url: cleanUrl(url, config.url),
      poster: cleanUrl(poster, config.url),
      backdrop: cleanUrl(poster, config.url),
      year: year,
      rating: 0,
      source: sourceName,
      type: 'drama',
      language: config.language || 'multi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de l'extraction: ${error.message}`);
    return null;
  }
}

/**
 * Extracteur pour GoGoAnime
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractGoGoAnime($, element, sourceName, config) {
  try {
    const $item = $(element);
    const $link = $item.find('.name a');
    const $image = $item.find('.img img');
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $link.text().trim();
    
    // Extraire l'image
    const poster = $image.attr('src') || $image.data('src') || '';
    
    // Extraire l'année (si disponible)
    const infoText = $item.find('.released').text();
    const yearMatch = infoText.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Créer l'objet anime
    return {
      id: generateUniqueId(sourceName, id),
      title: normalizeTitle(title),
      original_title: title,
      url: cleanUrl(url, config.url),
      poster: cleanUrl(poster, config.url),
      backdrop: cleanUrl(poster, config.url),
      year: year,
      rating: 0,
      source: sourceName,
      type: 'anime',
      language: config.language || 'multi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de l'extraction: ${error.message}`);
    return null;
  }
}

/**
 * Extracteur générique pour les sites avec structure commune
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractGeneric($, element, sourceName, config) {
  try {
    const $item = $(element);
    const $link = $item.find('a').first();
    const $image = $item.find('img').first();
    const $title = $item.find('h2, h3, .title, .name').first();
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $title.text().trim() || $link.attr('title') || '';
    
    // Extraire l'image
    const poster = $image.attr('src') || $image.data('src') || $image.data('original') || '';
    
    // Extraire l'année et la note
    const fullText = $item.text();
    const year = extractYear(fullText) || new Date().getFullYear();
    const rating = extractRating(fullText) || 0;
    
    // Créer l'objet générique
    return {
      id: generateUniqueId(sourceName, id),
      title: normalizeTitle(title),
      original_title: title,
      url: cleanUrl(url, config.url),
      poster: cleanUrl(poster, config.url),
      backdrop: cleanUrl(poster, config.url),
      year: year,
      rating: rating,
      source: sourceName,
      type: config.type || 'unknown',
      language: config.language || 'multi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de l'extraction générique: ${error.message}`);
    return null;
  }
}

/**
 * Sélectionne l'extracteur approprié pour une source
 * @param {string} sourceName - Nom de la source
 * @returns {Function} - Fonction d'extraction
 */
function getExtractor(sourceName) {
  const extractors = {
    filmapik: extractFilmapik,
    mydramalist: extractMyDramaList,
    dramacool: extractDramaCool,
    gogoanime: extractGoGoAnime
  };
  
  return extractors[sourceName] || extractGeneric;
}

module.exports = {
  getExtractor,
  extractFilmapik,
  extractMyDramaList,
  extractDramaCool,
  extractGoGoAnime,
  extractGeneric
};
