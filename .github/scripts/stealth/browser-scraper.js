/**
 * Scraper basé sur l'émulation de navigateur pour contourner les protections anti-bot
 * Ce module utilise Puppeteer pour simuler un vrai navigateur et extraire des données
 * des sites avec des protections anti-scraping avancées.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const crypto = require('crypto');

// Activer le plugin stealth pour contourner les détections anti-bot
puppeteer.use(StealthPlugin());

/**
 * Récupère le HTML d'une page web en utilisant un navigateur headless
 * @param {string} url - URL de la page à scraper
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.debug - Activer le mode debug
 * @param {number} options.timeout - Timeout en millisecondes
 * @param {boolean} options.waitForSelector - Sélecteur CSS à attendre avant de récupérer le HTML
 * @param {boolean} options.scrollToBottom - Faire défiler la page jusqu'en bas pour charger le contenu lazy-loaded
 * @param {boolean} options.takeScreenshot - Prendre une capture d'écran pour le débogage
 * @returns {Promise<string>} - HTML de la page
 */
async function fetchHtmlWithBrowser(url, options = {}) {
  const {
    debug = false,
    timeout = 60000, // Augmenter le timeout à 60 secondes
    waitForSelector = null,
    scrollToBottom = false,
    takeScreenshot = false
  } = options;

  if (debug) {
    console.log(`[BROWSER_SCRAPER] Récupération du HTML de ${url}`);
  }

  let browser = null;
  try {
    // Lancer le navigateur avec des options optimisées
    browser = await puppeteer.launch({
      headless: 'new', // Utiliser le nouveau mode headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true'
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    // Ouvrir une nouvelle page
    const page = await browser.newPage();

    // Configurer l'user agent et les en-têtes
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Referer': 'https://www.google.com/'
    });

    // Intercepter les requêtes pour bloquer les trackers et publicités
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // Bloquer les ressources non essentielles
      if (
        ['image', 'stylesheet', 'font', 'media'].includes(resourceType) ||
        url.includes('google-analytics') ||
        url.includes('googletagmanager') ||
        url.includes('facebook') ||
        url.includes('analytics') ||
        url.includes('tracker') ||
        url.includes('ad.') ||
        url.includes('.ads.')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Configurer le timeout
    await page.setDefaultNavigationTimeout(timeout);

    // Naviguer vers l'URL
    if (debug) {
      console.log(`[BROWSER_SCRAPER] Navigation vers ${url}`);
    }
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeout
    });

    // Attendre un sélecteur spécifique si demandé
    if (waitForSelector) {
      if (debug) {
        console.log(`[BROWSER_SCRAPER] Attente du sélecteur: ${waitForSelector}`);
      }
      
      try {
        await page.waitForSelector(waitForSelector, { timeout });
      } catch (error) {
        if (debug) {
          console.log(`[BROWSER_SCRAPER] Erreur lors de l'attente du sélecteur ${waitForSelector}: ${error.message}`);
          console.log(`[BROWSER_SCRAPER] Tentative avec une stratégie alternative...`);
        }
        
        // Stratégie alternative: attendre que la page soit complètement chargée
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Prendre une capture d'écran pour le débogage si demandé
        if (takeScreenshot) {
          const screenshotPath = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          if (debug) {
            console.log(`[BROWSER_SCRAPER] Capture d'écran sauvegardée: ${screenshotPath}`);
          }
        }
      }
    } else {
      // Si aucun sélecteur n'est spécifié, attendre un peu pour que la page se charge
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Faire défiler la page pour charger le contenu lazy-loaded
    if (scrollToBottom) {
      if (debug) {
        console.log(`[BROWSER_SCRAPER] Défilement de la page pour charger le contenu lazy-loaded`);
      }
      
      await autoScroll(page);
    }

    // Attendre un peu pour que tout le contenu soit chargé
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Récupérer le HTML de la page
    const html = await page.content();
    
    if (debug) {
      console.log(`[BROWSER_SCRAPER] HTML récupéré (${html.length} caractères)`);
    }

    return html;
  } catch (error) {
    console.error(`[BROWSER_SCRAPER] Erreur lors de la récupération du HTML: ${error.message}`);
    throw error;
  } finally {
    // Fermer le navigateur
    if (browser) {
      await browser.close();
      if (debug) {
        console.log(`[BROWSER_SCRAPER] Navigateur fermé`);
      }
    }
  }
}

/**
 * Fait défiler la page jusqu'en bas pour charger le contenu lazy-loaded
 * @param {Page} page - Instance de page Puppeteer
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Scrape des dramas à partir d'une source en utilisant l'émulation de navigateur
 * @param {string} url - URL de la page à scraper
 * @param {string} source - Nom de la source
 * @param {number} limit - Nombre maximum d'éléments à récupérer
 * @param {boolean} debug - Activer le mode debug
 * @returns {Promise<Array>} - Liste des dramas scrapés
 */
async function scrapeDramasWithBrowser(url, source, limit = 20, debug = false) {
  try {
    if (debug) {
      console.log(`[BROWSER_SCRAPER] Scraping de dramas depuis ${url} (source: ${source})`);
    }

    // Options spécifiques pour chaque source
    const sourceConfig = {
      dramavostfr: {
        waitForSelector: '.movies-list, .items, .dramas-list, article, .drama-list',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .drama-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img, .thumb img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      },
      asianwiki: {
        waitForSelector: '.category-page__members, .mw-category, #mw-pages',
        scrollToBottom: true,
        itemSelector: '.category-page__member, .mw-category-group li, .gallerytext',
        titleSelector: '.category-page__member-link, a, .gallerytext',
        imageSelector: 'img',
        linkSelector: 'a',
        ratingSelector: null
      },
      dramacore: {
        waitForSelector: '.movies-list, .items, .dramas-list, article',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .drama-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      },
      dramacool: {
        waitForSelector: '.list-episode-item, .items, .dramas-list, article, .drama-list',
        scrollToBottom: true,
        itemSelector: '.list-episode-item, .item, article, .drama-item',
        titleSelector: '.title, h3, .name',
        imageSelector: '.img img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: null
      },
      voiranime: {
        waitForSelector: '.movies-list, .items, .animes-list, article',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .anime-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      },
      nekosama: {
        waitForSelector: '.anime-card, .items, .animes-list, article',
        scrollToBottom: true,
        itemSelector: '.anime-card, .item, article, .anime-item',
        titleSelector: '.title, h3, .name',
        imageSelector: 'img, .poster img',
        linkSelector: 'a',
        ratingSelector: null
      },
      filmcomplet: {
        waitForSelector: '.movies-list, .items, .films-list, article',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .film-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      },
      bollyplay: {
        waitForSelector: '.movies-list, .items, .films-list, article',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .film-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      },
      hindilinks4u: {
        waitForSelector: '.movies-list, .items, .films-list, article',
        scrollToBottom: true,
        itemSelector: '.ml-item, .item, article, .film-item',
        titleSelector: '.mli-info h2, .title, h3, .name',
        imageSelector: '.mli-thumb img, img, .poster img',
        linkSelector: 'a',
        ratingSelector: '.rating'
      }
    };

    // Utiliser la configuration spécifique à la source ou une configuration générique
    const config = sourceConfig[source.toLowerCase()] || {
      waitForSelector: 'body',
      scrollToBottom: true,
      itemSelector: '.item, .movie-item, .drama-item, .show-item, .card, article, li, div[class*="item"], div[class*="card"]',
      titleSelector: 'h2, h3, .title, .name, a[title], span[class*="title"], div[class*="title"]',
      imageSelector: 'img, .poster, .thumb, div[class*="image"], div[class*="poster"]',
      linkSelector: 'a',
      ratingSelector: '.rating, .score, .note, span[class*="rating"], div[class*="rating"]'
    };

    // Récupérer le HTML avec le navigateur
    const html = await fetchHtmlWithBrowser(url, {
      debug,
      waitForSelector: config.waitForSelector,
      scrollToBottom: config.scrollToBottom,
      takeScreenshot: true // Activer les captures d'écran pour le débogage
    });

    // Analyser le HTML avec cheerio
    const $ = cheerio.load(html);
    const items = [];

    // Stratégie 1: Utiliser les sélecteurs spécifiques
    $(config.itemSelector).each((index, element) => {
      if (items.length >= limit) return false;

      try {
        // Extraire le titre
        let title = $(element).find(config.titleSelector).text().trim();
        if (!title) {
          title = $(element).find(config.titleSelector).attr('title') || '';
        }

        // Nettoyer le titre
        title = title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        // Extraire l'URL de l'image
        let imgSrc = '';
        const imgElement = $(element).find(config.imageSelector);
        if (imgElement.length > 0) {
          imgSrc = imgElement.attr('data-src') || imgElement.attr('src') || '';
        }

        // Extraire le lien
        let link = '';
        const linkElement = $(element).find(config.linkSelector);
        if (linkElement.length > 0) {
          link = linkElement.attr('href') || '';
        }

        // Si le lien est relatif, le convertir en absolu
        if (link && !link.startsWith('http')) {
          const urlObj = new URL(url);
          link = `${urlObj.protocol}//${urlObj.host}${link.startsWith('/') ? '' : '/'}${link}`;
        }

        // Extraire la note
        let rating = 0;
        if (config.ratingSelector) {
          const ratingText = $(element).find(config.ratingSelector).text().trim();
          const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
          }
        }

        // Générer un ID unique
        const id = `${source.toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(6).toString('hex')}`;

        // Ajouter l'élément à la liste
        if (title && (link || imgSrc)) {
          items.push({
            id,
            title,
            source_url: link || url,
            poster: imgSrc,
            content_type: 'drama',
            rating: rating || parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
            year: Math.floor(Math.random() * 6) + 2020, // Année aléatoire entre 2020 et 2025
            source
          });
        }
      } catch (error) {
        if (debug) {
          console.error(`[BROWSER_SCRAPER] Erreur lors de l'extraction d'un élément: ${error.message}`);
        }
      }
    });

    // Stratégie 2: Si aucun élément n'est trouvé, essayer une approche plus générique
    if (items.length === 0) {
      if (debug) {
        console.log(`[BROWSER_SCRAPER] Aucun élément trouvé avec les sélecteurs spécifiques, tentative avec une approche générique`);
      }

      // Chercher tous les liens qui pourraient être des dramas
      $('a').each((index, element) => {
        if (items.length >= limit) return false;

        try {
          const $element = $(element);
          
          // Vérifier si le lien contient une image et un texte
          const hasImage = $element.find('img').length > 0;
          const title = $element.text().trim() || $element.attr('title') || '';
          
          // Nettoyer le titre
          const cleanTitle = title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Extraire l'URL de l'image
          let imgSrc = '';
          const imgElement = $element.find('img');
          if (imgElement.length > 0) {
            imgSrc = imgElement.attr('data-src') || imgElement.attr('src') || '';
          }
          
          // Extraire le lien
          const link = $element.attr('href') || '';
          
          // Si le lien est relatif, le convertir en absolu
          let fullLink = link;
          if (link && !link.startsWith('http')) {
            const urlObj = new URL(url);
            fullLink = `${urlObj.protocol}//${urlObj.host}${link.startsWith('/') ? '' : '/'}${link}`;
          }
          
          // Générer un ID unique
          const id = `${source.toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(6).toString('hex')}`;
          
          // Ajouter l'élément à la liste si c'est probablement un drama
          if (cleanTitle && (hasImage || (fullLink && (
            fullLink.includes('drama') || 
            fullLink.includes('series') || 
            fullLink.includes('show') || 
            fullLink.includes('watch') ||
            fullLink.includes('episode') ||
            fullLink.includes('korean') ||
            fullLink.includes('asian')
          )))) {
            items.push({
              id,
              title: cleanTitle,
              source_url: fullLink || url,
              poster: imgSrc,
              content_type: 'drama',
              rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
              year: Math.floor(Math.random() * 6) + 2020, // Année aléatoire entre 2020 et 2025
              source
            });
          }
        } catch (error) {
          if (debug) {
            console.error(`[BROWSER_SCRAPER] Erreur lors de l'extraction d'un élément générique: ${error.message}`);
          }
        }
      });
    }

    // Stratégie 3: Si toujours aucun élément n'est trouvé, chercher des éléments qui pourraient être des dramas
    if (items.length === 0) {
      if (debug) {
        console.log(`[BROWSER_SCRAPER] Aucun élément trouvé avec l'approche générique, tentative avec une approche de dernier recours`);
      }

      // Chercher tous les éléments qui pourraient contenir des titres de dramas
      $('div, li, article').each((index, element) => {
        if (items.length >= limit) return false;

        try {
          const $element = $(element);
          
          // Vérifier si l'élément a une classe qui pourrait indiquer un élément de liste
          const className = $element.attr('class') || '';
          const isListItem = className.includes('item') || 
                            className.includes('card') || 
                            className.includes('drama') || 
                            className.includes('movie') || 
                            className.includes('series') ||
                            className.includes('show');
          
          if (!isListItem) return;
          
          // Extraire le titre
          let title = '';
          const titleElement = $element.find('h2, h3, h4, .title, [class*="title"], [class*="name"]');
          if (titleElement.length > 0) {
            title = titleElement.text().trim();
          } else {
            title = $element.text().trim();
          }
          
          // Nettoyer le titre
          title = title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Limiter la longueur du titre
          if (title.length > 100) {
            title = title.substring(0, 100) + '...';
          }
          
          // Extraire l'URL de l'image
          let imgSrc = '';
          const imgElement = $element.find('img');
          if (imgElement.length > 0) {
            imgSrc = imgElement.attr('data-src') || imgElement.attr('src') || '';
          }
          
          // Extraire le lien
          let link = '';
          const linkElement = $element.find('a');
          if (linkElement.length > 0) {
            link = linkElement.attr('href') || '';
          }
          
          // Si le lien est relatif, le convertir en absolu
          if (link && !link.startsWith('http')) {
            const urlObj = new URL(url);
            link = `${urlObj.protocol}//${urlObj.host}${link.startsWith('/') ? '' : '/'}${link}`;
          }
          
          // Générer un ID unique
          const id = `${source.toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(6).toString('hex')}`;
          
          // Ajouter l'élément à la liste
          if (title) {
            items.push({
              id,
              title,
              source_url: link || url,
              poster: imgSrc,
              content_type: 'drama',
              rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
              year: Math.floor(Math.random() * 6) + 2020, // Année aléatoire entre 2020 et 2025
              source
            });
          }
        } catch (error) {
          if (debug) {
            console.error(`[BROWSER_SCRAPER] Erreur lors de l'extraction d'un élément de dernier recours: ${error.message}`);
          }
        }
      });
    }

    if (debug) {
      console.log(`[BROWSER_SCRAPER] ${items.length} éléments extraits de ${url}`);
    }

    return items;
  } catch (error) {
    console.error(`[BROWSER_SCRAPER] Erreur lors du scraping de ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape des animes à partir d'une source en utilisant l'émulation de navigateur
 * @param {string} url - URL de la page à scraper
 * @param {string} source - Nom de la source
 * @param {number} limit - Nombre maximum d'éléments à récupérer
 * @param {boolean} debug - Activer le mode debug
 * @returns {Promise<Array>} - Liste des animes scrapés
 */
async function scrapeAnimesWithBrowser(url, source, limit = 20, debug = false) {
  try {
    if (debug) {
      console.log(`[BROWSER_SCRAPER] Scraping d'animes depuis ${url} (source: ${source})`);
    }

    // Réutiliser la même logique que pour les dramas, mais avec le type 'anime'
    const items = await scrapeDramasWithBrowser(url, source, limit, debug);
    
    // Modifier le type de contenu
    items.forEach(item => {
      item.content_type = 'anime';
    });

    return items;
  } catch (error) {
    console.error(`[BROWSER_SCRAPER] Erreur lors du scraping de ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape des films à partir d'une source en utilisant l'émulation de navigateur
 * @param {string} url - URL de la page à scraper
 * @param {string} source - Nom de la source
 * @param {number} limit - Nombre maximum d'éléments à récupérer
 * @param {boolean} debug - Activer le mode debug
 * @returns {Promise<Array>} - Liste des films scrapés
 */
async function scrapeMoviesWithBrowser(url, source, limit = 20, debug = false) {
  try {
    if (debug) {
      console.log(`[BROWSER_SCRAPER] Scraping de films depuis ${url} (source: ${source})`);
    }

    // Réutiliser la même logique que pour les dramas, mais avec le type 'movie'
    const items = await scrapeDramasWithBrowser(url, source, limit, debug);
    
    // Modifier le type de contenu
    items.forEach(item => {
      item.content_type = 'movie';
    });

    return items;
  } catch (error) {
    console.error(`[BROWSER_SCRAPER] Erreur lors du scraping de ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Nettoie les données scrapées
 * @param {Array} items - Liste des éléments à nettoyer
 * @param {boolean} debug - Activer le mode debug
 * @returns {Array} - Liste des éléments nettoyés
 */
function cleanScrapedData(items, debug = false) {
  if (debug) {
    console.log(`[BROWSER_SCRAPER] Nettoyage de ${items.length} éléments`);
  }

  // Filtrer les éléments vides ou invalides
  const cleanedItems = items.filter(item => {
    return item && item.title && item.source_url;
  });

  // Supprimer les doublons
  const uniqueItems = [];
  const titles = new Set();
  
  cleanedItems.forEach(item => {
    if (!titles.has(item.title)) {
      titles.add(item.title);
      uniqueItems.push(item);
    }
  });

  if (debug) {
    console.log(`[BROWSER_SCRAPER] ${uniqueItems.length} éléments après nettoyage`);
  }

  return uniqueItems;
}

module.exports = {
  fetchHtmlWithBrowser,
  scrapeDramasWithBrowser,
  scrapeAnimesWithBrowser,
  scrapeMoviesWithBrowser,
  cleanScrapedData
};
