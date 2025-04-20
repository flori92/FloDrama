/**
 * FloDrama - Validateur de routes
 * Ce script vérifie toutes les routes, endpoints et URLs de la plateforme
 * pour s'assurer que tous les boutons et pages existent et renvoient les données attendues
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    // Activer le mode débogage
    DEBUG: true,
    
    // Routes principales à vérifier
    MAIN_ROUTES: [
      { path: '/', name: 'Accueil' },
      { path: '/index.html', name: 'Accueil' },
      { path: '/detail.html', name: 'Détail', params: ['id'] },
      { path: '/index.html?category=drama', name: 'Dramas' },
      { path: '/index.html?category=movie', name: 'Films' },
      { path: '/index.html?category=anime', name: 'Animés' },
      { path: '/index.html?category=tvshow', name: 'TV Shows' },
      { path: '/index.html?category=bollywood', name: 'Bollywood' },
      { path: '/profile.html', name: 'Profil' },
      { path: '/404.html', name: 'Page 404' }
    ],
    
    // Endpoints API à vérifier
    API_ENDPOINTS: [
      { path: '/data/content.json', method: 'GET', name: 'Données de contenu' }
    ],
    
    // Vérifier les liens dans le DOM
    CHECK_DOM_LINKS: true,
    
    // Vérifier les redirections
    CHECK_REDIRECTS: true,
    
    // Vérifier les données de contenu
    CHECK_CONTENT_DATA: true,
    
    // Afficher un rapport visuel
    SHOW_VISUAL_REPORT: true,
    
    // Catégories attendues
    EXPECTED_CATEGORIES: ['drama', 'movie', 'anime', 'tvshow', 'bollywood'],
    
    // Nombre minimum d'éléments attendus par catégorie
    MIN_ITEMS_PER_CATEGORY: 200
  };
  
  // Résultats des vérifications
  const results = {
    routes: [],
    endpoints: [],
    links: [],
    redirects: [],
    contentData: [],
    
    // Ajouter un résultat
    addResult: function(category, path, status, message, data = null) {
      this[category].push({
        path,
        status,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    },
    
    // Obtenir un rapport
    getReport: function() {
      return {
        timestamp: new Date().toISOString(),
        summary: {
          routes: {
            total: this.routes.length,
            success: this.routes.filter(r => r.status === 'success').length,
            warning: this.routes.filter(r => r.status === 'warning').length,
            error: this.routes.filter(r => r.status === 'error').length
          },
          endpoints: {
            total: this.endpoints.length,
            success: this.endpoints.filter(r => r.status === 'success').length,
            warning: this.endpoints.filter(r => r.status === 'warning').length,
            error: this.endpoints.filter(r => r.status === 'error').length
          },
          links: {
            total: this.links.length,
            success: this.links.filter(r => r.status === 'success').length,
            warning: this.links.filter(r => r.status === 'warning').length,
            error: this.links.filter(r => r.status === 'error').length
          },
          redirects: {
            total: this.redirects.length,
            success: this.redirects.filter(r => r.status === 'success').length,
            warning: this.redirects.filter(r => r.status === 'warning').length,
            error: this.redirects.filter(r => r.status === 'error').length
          },
          contentData: {
            total: this.contentData.length,
            success: this.contentData.filter(r => r.status === 'success').length,
            warning: this.contentData.filter(r => r.status === 'warning').length,
            error: this.contentData.filter(r => r.status === 'error').length
          }
        },
        details: {
          routes: this.routes,
          endpoints: this.endpoints,
          links: this.links,
          redirects: this.redirects,
          contentData: this.contentData
        }
      };
    }
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Route Validator] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Route Validator] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Route Validator] ${message}`, error);
    },
    
    debug: function(message) {
      if (CONFIG.DEBUG) {
        console.debug(`[FloDrama Route Validator] ${message}`);
      }
    },
    
    group: function(title) {
      console.group(`[FloDrama Route Validator] ${title}`);
    },
    
    groupEnd: function() {
      console.groupEnd();
    },
    
    table: function(data) {
      console.table(data);
    }
  };
  
  /**
   * Vérifie une route
   * @param {Object} route - Route à vérifier
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async function checkRoute(route) {
    logger.debug(`Vérification de la route: ${route.path}`);
    
    try {
      // Construire l'URL complète
      const baseUrl = window.location.origin;
      const url = new URL(route.path, baseUrl);
      
      // Ajouter des paramètres fictifs si nécessaire
      if (route.params && route.params.includes('id')) {
        url.searchParams.set('id', 'drama001');
      }
      
      // Effectuer la requête
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        results.addResult('routes', route.path, 'success', `Route ${route.name} accessible`);
        return { route, status: 'success' };
      } else {
        results.addResult('routes', route.path, 'error', `Route ${route.name} inaccessible: ${response.status} ${response.statusText}`);
        return { route, status: 'error', error: `${response.status} ${response.statusText}` };
      }
    } catch (error) {
      results.addResult('routes', route.path, 'error', `Erreur lors de la vérification de la route ${route.name}: ${error.message}`);
      return { route, status: 'error', error: error.message };
    }
  }
  
  /**
   * Vérifie un endpoint API
   * @param {Object} endpoint - Endpoint à vérifier
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async function checkEndpoint(endpoint) {
    logger.debug(`Vérification de l'endpoint: ${endpoint.path}`);
    
    try {
      // Construire l'URL complète
      const baseUrl = window.location.origin;
      const url = new URL(endpoint.path, baseUrl);
      
      // Effectuer la requête
      const response = await fetch(url, { method: endpoint.method });
      
      if (response.ok) {
        // Vérifier que la réponse est du JSON valide
        try {
          const data = await response.json();
          results.addResult('endpoints', endpoint.path, 'success', `Endpoint ${endpoint.name} accessible et renvoie des données valides`, {
            contentType: response.headers.get('content-type'),
            dataSize: JSON.stringify(data).length
          });
          return { endpoint, status: 'success', data };
        } catch (jsonError) {
          results.addResult('endpoints', endpoint.path, 'warning', `Endpoint ${endpoint.name} accessible mais ne renvoie pas du JSON valide: ${jsonError.message}`);
          return { endpoint, status: 'warning', error: jsonError.message };
        }
      } else {
        results.addResult('endpoints', endpoint.path, 'error', `Endpoint ${endpoint.name} inaccessible: ${response.status} ${response.statusText}`);
        return { endpoint, status: 'error', error: `${response.status} ${response.statusText}` };
      }
    } catch (error) {
      results.addResult('endpoints', endpoint.path, 'error', `Erreur lors de la vérification de l'endpoint ${endpoint.name}: ${error.message}`);
      return { endpoint, status: 'error', error: error.message };
    }
  }
  
  /**
   * Vérifie les liens dans le DOM
   * @returns {Promise<Array>} - Résultats des vérifications
   */
  async function checkDomLinks() {
    logger.debug('Vérification des liens dans le DOM');
    
    // Récupérer tous les liens
    const links = document.querySelectorAll('a[href]');
    
    if (links.length === 0) {
      results.addResult('links', 'DOM', 'warning', 'Aucun lien trouvé dans le DOM');
      return [];
    }
    
    logger.debug(`${links.length} liens trouvés dans le DOM`);
    
    // Vérifier chaque lien
    const linkPromises = Array.from(links).map(async (link) => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      
      // Ignorer les liens externes et les ancres
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
        results.addResult('links', href, 'warning', `Lien ${text || href} ignoré (externe ou ancre)`);
        return { href, text, status: 'warning', message: 'Lien externe ou ancre' };
      }
      
      try {
        // Construire l'URL complète
        const baseUrl = window.location.origin;
        const url = new URL(href, baseUrl);
        
        // Effectuer la requête
        const response = await fetch(url, { method: 'HEAD' });
        
        if (response.ok) {
          results.addResult('links', href, 'success', `Lien ${text || href} accessible`);
          return { href, text, status: 'success' };
        } else {
          results.addResult('links', href, 'error', `Lien ${text || href} inaccessible: ${response.status} ${response.statusText}`);
          return { href, text, status: 'error', error: `${response.status} ${response.statusText}` };
        }
      } catch (error) {
        results.addResult('links', href, 'error', `Erreur lors de la vérification du lien ${text || href}: ${error.message}`);
        return { href, text, status: 'error', error: error.message };
      }
    });
    
    return Promise.all(linkPromises);
  }
  
  /**
   * Vérifie les redirections
   * @returns {Promise<Array>} - Résultats des vérifications
   */
  async function checkRedirects() {
    logger.debug('Vérification des redirections');
    
    // Liste des redirections à vérifier
    const redirects = [
      { from: '/', to: '/?enhanced=true' },
      { from: '/index.html', to: '/index.html?enhanced=true' }
    ];
    
    // Vérifier chaque redirection
    const redirectPromises = redirects.map(async (redirect) => {
      try {
        // Construire les URLs complètes
        const baseUrl = window.location.origin;
        const fromUrl = new URL(redirect.from, baseUrl);
        const expectedToUrl = new URL(redirect.to, baseUrl);
        
        // Effectuer la requête
        const response = await fetch(fromUrl, { redirect: 'manual' });
        
        // Vérifier la redirection
        if (response.type === 'opaqueredirect' || response.redirected) {
          const actualToUrl = response.url;
          
          if (actualToUrl === expectedToUrl.toString()) {
            results.addResult('redirects', redirect.from, 'success', `Redirection de ${redirect.from} vers ${redirect.to} correcte`);
            return { redirect, status: 'success' };
          } else {
            results.addResult('redirects', redirect.from, 'warning', `Redirection de ${redirect.from} vers ${actualToUrl} au lieu de ${redirect.to}`);
            return { redirect, status: 'warning', actual: actualToUrl };
          }
        } else {
          results.addResult('redirects', redirect.from, 'error', `Pas de redirection pour ${redirect.from}`);
          return { redirect, status: 'error', error: 'Pas de redirection' };
        }
      } catch (error) {
        results.addResult('redirects', redirect.from, 'error', `Erreur lors de la vérification de la redirection de ${redirect.from}: ${error.message}`);
        return { redirect, status: 'error', error: error.message };
      }
    });
    
    return Promise.all(redirectPromises);
  }
  
  /**
   * Vérifie les données de contenu
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async function checkContentData() {
    logger.info("Vérification des données de contenu...");
    
    try {
      // Récupérer les données de contenu
      const response = await fetch('/data/content.json');
      
      if (!response.ok) {
        results.addResult('contentData', '/data/content.json', 'error', `Erreur HTTP: ${response.status} ${response.statusText}`);
        return { status: 'error', error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      // Vérifier la structure des données
      if (!data.items || !Array.isArray(data.items)) {
        results.addResult('contentData', '/data/content.json', 'error', 'Structure de données invalide: propriété "items" manquante ou non valide');
        return { status: 'error', error: 'Invalid structure' };
      }
      
      // Vérifier les éléments de contenu
      const invalidItems = [];
      const categories = {};
      
      data.items.forEach(item => {
        // Vérifier les propriétés requises
        const requiredProps = ['id', 'title', 'category'];
        const missingProps = requiredProps.filter(prop => !item[prop]);
        
        if (missingProps.length > 0) {
          invalidItems.push({
            id: item.id || 'unknown',
            missingProps
          });
        }
        
        // Compter les éléments par catégorie
        if (item.category) {
          categories[item.category] = (categories[item.category] || 0) + 1;
        }
      });
      
      if (invalidItems.length > 0) {
        results.addResult('contentData', '/data/content.json', 'warning', `${invalidItems.length} éléments de contenu invalides`, { invalidItems });
      }
      
      // Vérifier que toutes les catégories attendues sont présentes
      const missingCategories = CONFIG.EXPECTED_CATEGORIES.filter(category => !categories[category]);
      
      if (missingCategories.length > 0) {
        results.addResult('contentData', '/data/content.json', 'error', `Catégories manquantes: ${missingCategories.join(', ')}`);
        
        // Vérifier si le SmartScrapingService est disponible pour compléter les données manquantes
        if (window.SmartScrapingService) {
          results.addResult('contentData', '/data/content.json', 'warning', `Tentative de récupération des catégories manquantes via SmartScrapingService...`);
          
          try {
            // Lancer la mise à jour de la base de données pour récupérer les catégories manquantes
            await window.SmartScrapingService.updateContentDatabase();
            results.addResult('contentData', '/data/content.json', 'success', `Mise à jour de la base de données lancée pour récupérer les catégories manquantes`);
          } catch (error) {
            results.addResult('contentData', '/data/content.json', 'error', `Erreur lors de la mise à jour de la base de données: ${error.message}`);
          }
        } else {
          results.addResult('contentData', '/data/content.json', 'error', `SmartScrapingService non disponible pour récupérer les catégories manquantes`);
        }
        
        return { status: 'error', missingCategories };
      }
      
      // Vérifier le nombre minimum d'éléments par catégorie
      const categoriesWithLessThanMinItems = CONFIG.EXPECTED_CATEGORIES.filter(category => {
        return !categories[category] || categories[category] < CONFIG.MIN_ITEMS_PER_CATEGORY;
      });
      
      if (categoriesWithLessThanMinItems.length > 0) {
        results.addResult('contentData', '/data/content.json', 'warning', `Certaines catégories ont moins de ${CONFIG.MIN_ITEMS_PER_CATEGORY} éléments: ${categoriesWithLessThanMinItems.join(', ')}`);
        
        // Vérifier si le SmartScrapingService est disponible pour compléter les données manquantes
        if (window.SmartScrapingService) {
          results.addResult('contentData', '/data/content.json', 'warning', `Tentative de récupération de contenu supplémentaire via SmartScrapingService...`);
          
          try {
            // Lancer la mise à jour de la base de données pour récupérer plus de contenu
            await window.SmartScrapingService.updateContentDatabase();
            results.addResult('contentData', '/data/content.json', 'success', `Mise à jour de la base de données lancée pour récupérer plus de contenu`);
          } catch (error) {
            results.addResult('contentData', '/data/content.json', 'error', `Erreur lors de la mise à jour de la base de données: ${error.message}`);
          }
        } else {
          results.addResult('contentData', '/data/content.json', 'error', `SmartScrapingService non disponible pour récupérer plus de contenu`);
        }
        
        return { status: 'warning', categoriesWithLessThanMinItems };
      }
      
      results.addResult('contentData', '/data/content.json', 'success', `${data.items.length} éléments de contenu trouvés`, { categories });
      return { status: 'success', data };
    } catch (error) {
      logger.error("Erreur lors de la vérification des données de contenu", error);
      results.addResult('contentData', '/data/content.json', 'error', `Erreur: ${error.message}`);
      return { status: 'error', error };
    }
  }
  
  /**
   * Affiche un rapport visuel
   * @param {Object} report - Rapport à afficher
   */
  function showVisualReport(report) {
    logger.info("Affichage du rapport visuel...");
    
    // Créer l'élément de rapport
    const reportElement = document.createElement('div');
    reportElement.id = 'flodrama-route-report';
    reportElement.style.position = 'fixed';
    reportElement.style.top = '20px';
    reportElement.style.right = '20px';
    reportElement.style.width = '400px';
    reportElement.style.maxHeight = 'calc(100vh - 40px)';
    reportElement.style.overflowY = 'auto';
    reportElement.style.backgroundColor = '#1A1926';
    reportElement.style.color = '#fff';
    reportElement.style.padding = '20px';
    reportElement.style.borderRadius = '8px';
    reportElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    reportElement.style.zIndex = '9999';
    reportElement.style.fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
    
    // Ajouter le titre
    const title = document.createElement('h2');
    title.textContent = 'Rapport de validation des routes';
    title.style.margin = '0 0 15px 0';
    title.style.padding = '0 0 10px 0';
    title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    title.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
    title.style.WebkitBackgroundClip = 'text';
    title.style.backgroundClip = 'text';
    title.style.WebkitTextFillColor = 'transparent';
    title.style.color = 'transparent';
    title.style.fontSize = '1.5rem';
    title.style.fontWeight = 'bold';
    reportElement.appendChild(title);
    
    // Ajouter le résumé
    const summary = document.createElement('div');
    summary.style.marginBottom = '20px';
    
    // Fonction pour créer une ligne de résumé
    function createSummaryLine(label, data) {
      const line = document.createElement('div');
      line.style.display = 'flex';
      line.style.justifyContent = 'space-between';
      line.style.alignItems = 'center';
      line.style.marginBottom = '8px';
      line.style.padding = '8px 12px';
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      line.style.borderRadius = '4px';
      
      const labelElement = document.createElement('span');
      labelElement.textContent = label;
      labelElement.style.fontWeight = 'bold';
      
      const dataElement = document.createElement('div');
      dataElement.style.display = 'flex';
      dataElement.style.gap = '10px';
      
      const createBadge = (count, type) => {
        if (count === 0) return null;
        
        const badge = document.createElement('span');
        badge.textContent = count;
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '12px';
        badge.style.fontSize = '0.8rem';
        badge.style.fontWeight = 'bold';
        
        if (type === 'success') {
          badge.style.backgroundColor = '#10B981';
          badge.style.color = '#fff';
        } else if (type === 'warning') {
          badge.style.backgroundColor = '#F59E0B';
          badge.style.color = '#fff';
        } else if (type === 'error') {
          badge.style.backgroundColor = '#EF4444';
          badge.style.color = '#fff';
        } else {
          badge.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          badge.style.color = '#fff';
        }
        
        return badge;
      };
      
      const successBadge = createBadge(data.success, 'success');
      const warningBadge = createBadge(data.warning, 'warning');
      const errorBadge = createBadge(data.error, 'error');
      
      if (successBadge) dataElement.appendChild(successBadge);
      if (warningBadge) dataElement.appendChild(warningBadge);
      if (errorBadge) dataElement.appendChild(errorBadge);
      
      line.appendChild(labelElement);
      line.appendChild(dataElement);
      
      return line;
    }
    
    // Ajouter les lignes de résumé
    summary.appendChild(createSummaryLine('Routes', report.summary.routes));
    summary.appendChild(createSummaryLine('Endpoints API', report.summary.endpoints));
    summary.appendChild(createSummaryLine('Liens DOM', report.summary.links));
    summary.appendChild(createSummaryLine('Redirections', report.summary.redirects));
    summary.appendChild(createSummaryLine('Données de contenu', report.summary.contentData));
    
    reportElement.appendChild(summary);
    
    // Ajouter les détails
    const details = document.createElement('div');
    
    // Fonction pour créer une section de détails
    function createDetailsSection(title, items, getItemHTML) {
      if (items.length === 0) return null;
      
      const section = document.createElement('div');
      section.style.marginBottom = '20px';
      
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = title;
      sectionTitle.style.margin = '0 0 10px 0';
      sectionTitle.style.fontSize = '1.1rem';
      sectionTitle.style.fontWeight = 'bold';
      section.appendChild(sectionTitle);
      
      const itemsList = document.createElement('div');
      itemsList.style.display = 'flex';
      itemsList.style.flexDirection = 'column';
      itemsList.style.gap = '8px';
      
      items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.style.padding = '10px';
        itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        itemElement.style.borderRadius = '4px';
        itemElement.style.fontSize = '0.9rem';
        
        if (item.status === 'success') {
          itemElement.style.borderLeft = '3px solid #10B981';
        } else if (item.status === 'warning') {
          itemElement.style.borderLeft = '3px solid #F59E0B';
        } else if (item.status === 'error') {
          itemElement.style.borderLeft = '3px solid #EF4444';
        }
        
        itemElement.innerHTML = getItemHTML(item);
        itemsList.appendChild(itemElement);
      });
      
      section.appendChild(itemsList);
      return section;
    }
    
    // Créer les sections de détails
    const routesSection = createDetailsSection('Détails des routes', report.details.routes, item => {
      return `<strong>${item.path}</strong><br>${item.message}`;
    });
    
    const endpointsSection = createDetailsSection('Détails des endpoints API', report.details.endpoints, item => {
      return `<strong>${item.path}</strong><br>${item.message}`;
    });
    
    const linksSection = createDetailsSection('Détails des liens DOM', report.details.links, item => {
      return `<strong>${item.path}</strong><br>${item.message}`;
    });
    
    const redirectsSection = createDetailsSection('Détails des redirections', report.details.redirects, item => {
      return `<strong>${item.path}</strong><br>${item.message}`;
    });
    
    const contentDataSection = createDetailsSection('Détails des données de contenu', report.details.contentData, item => {
      let html = `<strong>${item.path}</strong><br>${item.message}`;
      
      if (item.data && item.data.categories) {
        html += '<br><br><strong>Répartition par catégorie:</strong><ul style="margin: 5px 0 0 20px; padding: 0;">';
        
        // Afficher d'abord les catégories attendues dans l'ordre
        CONFIG.EXPECTED_CATEGORIES.forEach(category => {
          const count = item.data.categories[category] || 0;
          const style = count < CONFIG.MIN_ITEMS_PER_CATEGORY ? 'color: #EF4444;' : '';
          html += `<li style="${style}">${category}: ${count} éléments</li>`;
        });
        
        // Afficher les autres catégories non attendues
        Object.keys(item.data.categories)
          .filter(category => !CONFIG.EXPECTED_CATEGORIES.includes(category))
          .forEach(category => {
            html += `<li style="color: #F59E0B;">${category}: ${item.data.categories[category]} éléments (catégorie non attendue)</li>`;
          });
        
        html += '</ul>';
      }
      
      if (item.data && item.data.invalidItems) {
        html += `<br><strong>Éléments invalides:</strong> ${item.data.invalidItems.length}`;
      }
      
      if (item.data && item.data.missingCategories) {
        html += `<br><strong>Catégories manquantes:</strong> ${item.data.missingCategories.join(', ')}`;
      }
      
      if (item.data && item.data.categoriesWithLessThanMinItems) {
        html += `<br><strong>Catégories avec moins de ${CONFIG.MIN_ITEMS_PER_CATEGORY} éléments:</strong> ${item.data.categoriesWithLessThanMinItems.join(', ')}`;
      }
      
      return html;
    });
    
    if (routesSection) details.appendChild(routesSection);
    if (endpointsSection) details.appendChild(endpointsSection);
    if (linksSection) details.appendChild(linksSection);
    if (redirectsSection) details.appendChild(redirectsSection);
    if (contentDataSection) details.appendChild(contentDataSection);
    
    reportElement.appendChild(details);
    
    // Ajouter les actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.marginTop = '20px';
    
    // Bouton pour mettre à jour le contenu via SmartScrapingService
    const updateButton = document.createElement('button');
    updateButton.textContent = 'Mettre à jour le contenu';
    updateButton.style.flex = '1';
    updateButton.style.padding = '10px';
    updateButton.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
    updateButton.style.color = '#fff';
    updateButton.style.border = 'none';
    updateButton.style.borderRadius = '6px';
    updateButton.style.cursor = 'pointer';
    updateButton.style.fontWeight = 'bold';
    updateButton.style.transition = '0.3s ease';
    
    updateButton.addEventListener('mouseover', function() {
      this.style.opacity = '0.9';
    });
    
    updateButton.addEventListener('mouseout', function() {
      this.style.opacity = '1';
    });
    
    updateButton.addEventListener('click', function() {
      if (window.SmartScrapingService) {
        // Créer un élément de notification
        const notification = document.createElement('div');
        notification.textContent = 'Mise à jour du contenu en cours...';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '20px';
        notification.style.padding = '15px 20px';
        notification.style.background = 'linear-gradient(to right, #3b82f6, #d946ef)';
        notification.style.color = '#fff';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        notification.style.zIndex = '10000';
        notification.style.fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
        notification.style.fontWeight = 'bold';
        document.body.appendChild(notification);
        
        // Lancer la mise à jour
        window.SmartScrapingService.updateContentDatabase()
          .then(results => {
            notification.textContent = `✅ Contenu mis à jour avec ${results.length} éléments`;
            setTimeout(() => {
              notification.remove();
              // Relancer la validation des routes
              window.FloDramaRouteValidator.runValidation();
            }, 3000);
          })
          .catch(error => {
            notification.textContent = `❌ Erreur: ${error.message}`;
            notification.style.background = '#EF4444';
            setTimeout(() => notification.remove(), 5000);
          });
      } else {
        alert('Le service SmartScrapingService n\'est pas disponible. Veuillez charger le script correspondant.');
      }
    });
    
    // Bouton pour fermer le rapport
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fermer';
    closeButton.style.flex = '1';
    closeButton.style.padding = '10px';
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '6px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.transition = '0.3s ease';
    
    closeButton.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    });
    
    closeButton.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    closeButton.addEventListener('click', function() {
      reportElement.remove();
    });
    
    actions.appendChild(updateButton);
    actions.appendChild(closeButton);
    
    reportElement.appendChild(actions);
    
    // Ajouter le rapport au document
    document.body.appendChild(reportElement);
  }
  
  /**
   * Exécute la validation des routes
   */
  async function runValidation() {
    logger.info("Démarrage de la validation des routes...");
    
    // Vérifier les routes principales
    const routePromises = CONFIG.MAIN_ROUTES.map(route => checkRoute(route));
    await Promise.all(routePromises);
    
    // Vérifier les endpoints API
    const endpointPromises = CONFIG.API_ENDPOINTS.map(endpoint => checkEndpoint(endpoint));
    await Promise.all(endpointPromises);
    
    // Vérifier les liens dans le DOM
    if (CONFIG.CHECK_DOM_LINKS) {
      await checkDomLinks();
    }
    
    // Vérifier les redirections
    if (CONFIG.CHECK_REDIRECTS) {
      await checkRedirects();
    }
    
    // Vérifier les données de contenu
    if (CONFIG.CHECK_CONTENT_DATA) {
      await checkContentData();
    }
    
    // Générer le rapport
    const report = results.getReport();
    
    // Afficher le rapport dans la console
    logger.group("Rapport de validation des routes");
    logger.info(`Routes: ${report.summary.routes.success} succès, ${report.summary.routes.warning} avertissements, ${report.summary.routes.error} erreurs`);
    logger.info(`Endpoints: ${report.summary.endpoints.success} succès, ${report.summary.endpoints.warning} avertissements, ${report.summary.endpoints.error} erreurs`);
    logger.info(`Liens: ${report.summary.links.success} succès, ${report.summary.links.warning} avertissements, ${report.summary.links.error} erreurs`);
    logger.info(`Redirections: ${report.summary.redirects.success} succès, ${report.summary.redirects.warning} avertissements, ${report.summary.redirects.error} erreurs`);
    logger.info(`Données de contenu: ${report.summary.contentData.success} succès, ${report.summary.contentData.warning} avertissements, ${report.summary.contentData.error} erreurs`);
    logger.groupEnd();
    
    // Afficher un rapport visuel
    if (CONFIG.SHOW_VISUAL_REPORT) {
      showVisualReport(report);
    }
    
    logger.info("Validation des routes terminée");
    
    return report;
  }
  
  /**
   * Initialise le validateur de routes
   */
  function initRouteValidator() {
    logger.info("Initialisation du validateur de routes...");
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runValidation);
    } else {
      runValidation();
    }
  }
  
  // Initialiser le validateur de routes
  initRouteValidator();
  
  // Exposer l'API publique
  window.FloDramaRouteValidator = {
    runValidation,
    getResults: () => results.getReport()
  };
})();
