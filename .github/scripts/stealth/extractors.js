/**
 * Extracteurs pour le scraper furtif de FloDrama
 * 
 * Ce module contient des fonctions d'extraction spécifiques à chaque source
 */

const cheerio = require('cheerio');
const { cleanText, extractYear, extractRating, generateUniqueId } = require('./utils');

/**
 * Extrait les données de MyDramaList
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractMyDramaList(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les dramas
  $(options.selector || '.box-body.light-b').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $title = $item.find('h6.text-primary a');
      const title = $title.text().trim();
      const url = 'https://mydramalist.com' + $title.attr('href');
      
      // Extraire l'image
      const $image = $item.find('a.block img');
      const poster = $image.data('src') || $image.attr('src') || '';
      
      // Extraire l'année
      const $year = $item.find('.text-muted');
      const year = extractYear($year.text());
      
      // Extraire la note
      const $rating = $item.find('.score');
      const rating = parseFloat($rating.text().trim()) || 0;
      
      // Extraire les genres
      const genres = [];
      $item.find('.text-muted a[href*="/genre/"]').each((i, el) => {
        genres.push($(el).text().trim());
      });
      
      // Extraire les pays
      const countries = [];
      $item.find('.text-muted a[href*="/country/"]').each((i, el) => {
        countries.push($(el).text().trim());
      });
      
      // Déterminer la langue
      let language = 'ko';
      if (countries.includes('China') || countries.includes('Taiwan') || countries.includes('Hong Kong')) {
        language = 'zh';
      } else if (countries.includes('Japan')) {
        language = 'ja';
      } else if (countries.includes('Thailand')) {
        language = 'th';
      }
      
      // Créer l'objet item
      const item = {
        id: `mydramalist_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: rating,
        genres: genres,
        countries: countries,
        source: 'mydramalist',
        type: 'drama',
        language: language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[MyDramaList] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de DramaCool
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractDramaCool(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les dramas
  $(options.selector || '.block').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $title = $item.find('.title a');
      const title = $title.text().trim();
      const url = $title.attr('href');
      
      // Extraire l'image
      const $image = $item.find('.img img');
      const poster = $image.data('original') || $image.attr('src') || '';
      
      // Extraire l'année
      const infoText = $item.find('.meta').text();
      const year = extractYear(infoText);
      
      // Déterminer la langue
      let language = 'ko';
      if (title.toLowerCase().includes('chinese') || 
          infoText.toLowerCase().includes('chinese') ||
          infoText.toLowerCase().includes('china')) {
        language = 'zh';
      } else if (title.toLowerCase().includes('japanese') || 
                infoText.toLowerCase().includes('japanese') ||
                infoText.toLowerCase().includes('japan')) {
        language = 'ja';
      } else if (title.toLowerCase().includes('thai') || 
                infoText.toLowerCase().includes('thai') ||
                infoText.toLowerCase().includes('thailand')) {
        language = 'th';
      }
      
      // Créer l'objet item
      const item = {
        id: `dramacool_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // DramaCool n'affiche pas de notes
        source: 'dramacool',
        type: 'drama',
        language: language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[DramaCool] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de VoirDrama
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractVoirDrama(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les dramas
  $(options.selector || '.movies-list .ml-item').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.ml-mask');
      const title = $item.find('.mli-info h2').text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const posterStyle = $link.attr('style') || '';
      const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
      const poster = $link.data('original') || (posterMatch ? posterMatch[1] : '');
      
      // Extraire l'année
      const infoText = $item.find('.mli-info').text();
      const year = extractYear(infoText);
      
      // Extraire la note
      const $rating = $item.find('.rating');
      const rating = extractRating($rating.text().trim());
      
      // Déterminer la langue
      let language = 'ko';
      if (title.toLowerCase().includes('chinois') || 
          infoText.toLowerCase().includes('chinois')) {
        language = 'zh';
      } else if (title.toLowerCase().includes('japonais') || 
                infoText.toLowerCase().includes('japonais')) {
        language = 'ja';
      } else if (title.toLowerCase().includes('thai') || 
                infoText.toLowerCase().includes('thai')) {
        language = 'th';
      }
      
      // Créer l'objet item
      const item = {
        id: `voirdrama_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: rating,
        source: 'voirdrama',
        type: 'drama',
        language: language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[VoirDrama] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de MyAsianTV
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractMyAsianTV(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les dramas
  $(options.selector || '.video-block').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.name a');
      const title = $link.text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const $image = $item.find('img');
      const poster = $image.data('src') || $image.attr('src') || '';
      
      // Extraire l'année
      const infoText = $item.find('.video-info').text();
      const year = extractYear(infoText);
      
      // Déterminer la langue
      let language = 'ko';
      if (url.includes('/chinese/') || 
          title.toLowerCase().includes('chinese') || 
          infoText.toLowerCase().includes('chinese')) {
        language = 'zh';
      } else if (url.includes('/japanese/') || 
                title.toLowerCase().includes('japanese') || 
                infoText.toLowerCase().includes('japanese')) {
        language = 'ja';
      } else if (url.includes('/thai/') || 
                title.toLowerCase().includes('thai') || 
                infoText.toLowerCase().includes('thai')) {
        language = 'th';
      }
      
      // Créer l'objet item
      const item = {
        id: `myasiantv_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // MyAsianTV n'affiche pas de notes
        source: 'myasiantv',
        type: 'drama',
        language: language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[MyAsianTV] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de VoirAnime
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractVoirAnime(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les animes
  $(options.selector || '.film-poster').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('a');
      const title = $link.attr('title') || '';
      const url = $link.attr('href');
      
      // Extraire l'image
      const $image = $item.find('img');
      const poster = $image.data('src') || $image.attr('src') || '';
      
      // Extraire l'année
      const $year = $item.find('.film-detail .fd-infor .fdi-item:contains("Date")');
      const year = extractYear($year.text());
      
      // Créer l'objet item
      const item = {
        id: `voiranime_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // VoirAnime n'affiche pas de notes
        source: 'voiranime',
        type: 'anime',
        language: 'ja', // La plupart des animes sont japonais
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[VoirAnime] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de NekoSama
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractNekoSama(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les animes
  $(options.selector || '.anime').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('a.title');
      const title = $link.text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const $image = $item.find('img');
      const poster = $image.attr('src') || '';
      
      // Extraire l'année
      const $info = $item.find('.date');
      const year = extractYear($info.text());
      
      // Créer l'objet item
      const item = {
        id: `nekosama_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // NekoSama n'affiche pas de notes
        source: 'nekosama',
        type: 'anime',
        language: 'ja', // La plupart des animes sont japonais
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[NekoSama] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de GoGoAnime
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractGoGoAnime(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les animes
  $(options.selector || '.items .item').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.name a');
      const title = $link.text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const $image = $item.find('.img img');
      const poster = $image.attr('src') || '';
      
      // Extraire l'année
      const $released = $item.find('.released');
      const year = extractYear($released.text());
      
      // Créer l'objet item
      const item = {
        id: `gogoanime_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // GoGoAnime n'affiche pas de notes
        source: 'gogoanime',
        type: 'anime',
        language: 'ja', // La plupart des animes sont japonais
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[GoGoAnime] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de Filmapik
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractFilmapik(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les films
  $(options.selector || '.movies-list .ml-item').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.ml-mask');
      const title = $item.find('.mli-info h2').text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const posterStyle = $link.attr('style') || '';
      const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
      const poster = $link.data('original') || (posterMatch ? posterMatch[1] : '');
      
      // Extraire l'année
      const infoText = $item.find('.mli-info').text();
      const year = extractYear(infoText);
      
      // Extraire la note
      const $rating = $item.find('.rating');
      const rating = extractRating($rating.text().trim());
      
      // Créer l'objet item
      const item = {
        id: `filmapik_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: rating,
        source: 'filmapik',
        type: 'film',
        language: 'multi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[Filmapik] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de VostFree
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractVostFree(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les films
  $(options.selector || '.movies-list .ml-item').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.ml-mask');
      const title = $item.find('.mli-info h2').text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const posterStyle = $link.attr('style') || '';
      const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
      const poster = $link.data('original') || (posterMatch ? posterMatch[1] : '');
      
      // Extraire l'année
      const infoText = $item.find('.mli-info').text();
      const year = extractYear(infoText);
      
      // Extraire la note
      const $rating = $item.find('.rating');
      const rating = extractRating($rating.text().trim());
      
      // Créer l'objet item
      const item = {
        id: `vostfree_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: rating,
        source: 'vostfree',
        type: 'film',
        language: 'multi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[VostFree] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Extrait les données de BollywoodMDB
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractBollywoodMDB(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les films
  $(options.selector || '.card').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $link = $item.find('.card-title a');
      const title = $link.text().trim();
      const url = $link.attr('href');
      
      // Extraire l'image
      const $image = $item.find('img.card-img-top');
      const poster = $image.attr('src') || '';
      
      // Extraire l'année
      const $date = $item.find('.card-text small');
      const year = extractYear($date.text());
      
      // Créer l'objet item
      const item = {
        id: `bollywoodmdb_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: 0, // BollywoodMDB n'affiche pas de notes
        source: 'bollywoodmdb',
        type: 'bollywood',
        language: 'hi', // Hindi
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[BollywoodMDB] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Sélectionne l'extracteur approprié en fonction de la source
 * @param {string} source - Nom de la source
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractData(source, html, options = {}) {
  switch (source.toLowerCase()) {
    case 'mydramalist':
      return extractMyDramaList(html, options);
    case 'dramacool':
      return extractDramaCool(html, options);
    case 'voirdrama':
      return extractVoirDrama(html, options);
    case 'myasiantv':
      return extractMyAsianTV(html, options);
    case 'voiranime':
      return extractVoirAnime(html, options);
    case 'nekosama':
      return extractNekoSama(html, options);
    case 'gogoanime':
      return extractGoGoAnime(html, options);
    case 'filmapik':
      return extractFilmapik(html, options);
    case 'vostfree':
      return extractVostFree(html, options);
    case 'bollywoodmdb':
      return extractBollywoodMDB(html, options);
    default:
      console.warn(`[Extracteur] Pas d'extracteur spécifique pour ${source}, utilisation d'une méthode générique`);
      return [];
  }
}

module.exports = {
  extractMyDramaList,
  extractDramaCool,
  extractVoirDrama,
  extractMyAsianTV,
  extractVoirAnime,
  extractNekoSama,
  extractGoGoAnime,
  extractFilmapik,
  extractVostFree,
  extractBollywoodMDB,
  extractData
};
