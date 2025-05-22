/**
 * FloDrama Scraper
 * 
 * Ce Worker effectue le scraping de toutes les sources de streaming validées
 * et alimente la base de données FloDrama dans Cloudflare KV et R2.
 * 
 * Configuration:
 * - Exécution programmée via cron trigger (toutes les 6 heures)
 * - Stockage des métadonnées dans FLODRAMA_METADATA
 * - Stockage des métriques dans FLODRAMA_METRICS
 * - Stockage des images dans R2_BUCKET
 */

// Configuration des sources de streaming
const SOURCES = {
  // Dramas asiatiques
  DRAMA: [
    {
      id: 'dramacool',
      name: 'DramaCool',
      baseUrl: 'https://dramacool.com.tr',
      alternativeDomains: ['dramacool9.io', 'dramacool.cr', 'dramacool.sr'],
      testUrl: 'https://dramacool.com.tr/watch-my-lovable-girl-episode-1-online.html',
      waitSelector: '.list-episode-item',
      mainSelector: '.list-drama-item',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'viewasian',
      name: 'ViewAsian',
      baseUrl: 'https://viewasian.lol',
      alternativeDomains: ['viewasian.tv', 'viewasian.cc'],
      testUrl: 'https://viewasian.lol/watch/descendants-of-the-sun-episode-01.html',
      waitSelector: '.video-content',
      mainSelector: '.play-video',
      bypassCloudflare: true,
      expirationHours: 6
    },
    {
      id: 'kissasian',
      name: 'KissAsian',
      baseUrl: 'https://kissasian.com.lv',
      alternativeDomains: ['kissasian.sh', 'kissasian.io', 'kissasian.cx'],
      testUrl: 'https://kissasian.com.lv/watch/crash-landing-on-you-episode-1',
      waitSelector: '#centerDivVideo',
      mainSelector: '#divContentVideo',
      bypassCloudflare: true,
      expirationHours: 8
    },
    {
      id: 'voirdrama',
      name: 'VoirDrama',
      baseUrl: 'https://voirdrama.org',
      alternativeDomains: ['voirdrama.cc', 'voirdrama.tv'],
      testUrl: 'https://voirdrama.org/goblin-episode-1-vostfr/',
      waitSelector: 'div.site-content',
      mainSelector: 'div.wrap',
      bypassCloudflare: true,
      expirationHours: 10
    }
  ],
  
  // Animes
  ANIME: [
    {
      id: 'gogoanime',
      name: 'GogoAnime',
      baseUrl: 'https://gogoanime.cl',
      alternativeDomains: ['gogoanime.tel', 'gogoanime.run', 'gogoanime.bid'],
      testUrl: 'https://gogoanime.cl/attack-on-titan-episode-1',
      waitSelector: '.anime_video_body',
      mainSelector: '.anime_muti_link',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'nekosama',
      name: 'NekoSama',
      baseUrl: 'https://neko-sama.fr',
      alternativeDomains: ['neko-sama.io', 'neko-sama.org'],
      testUrl: 'https://neko-sama.fr/anime/info/1-one-piece',
      waitSelector: '#blocEntier',
      mainSelector: '#list_catalog',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'voiranime',
      name: 'VoirAnime',
      baseUrl: 'https://voiranime.com',
      alternativeDomains: ['v6.voiranime.com', 'voiranime.tv', 'voiranime.cc'],
      testUrl: 'https://voiranime.com/demon-slayer-saison-1-episode-1-vostfr/',
      waitSelector: '.movies-list',
      mainSelector: '.ml-item',
      bypassCloudflare: true,
      expirationHours: 12
    }
  ],
  
  // Films
  FILM: [
    {
      id: 'vostfree',
      name: 'VostFree',
      baseUrl: 'https://vostfree.cx',
      alternativeDomains: ['vostfree.tv', 'vostfree.ws', 'vostfree.io'],
      testUrl: 'https://vostfree.cx/your-name-1/',
      waitSelector: '.movies-list',
      mainSelector: '.ml-item',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'streamingdivx',
      name: 'StreamingDivx',
      baseUrl: 'https://streaming-films.net',
      alternativeDomains: ['streamingdivx.co', 'streaming-films.cc', 'streaming-divx.com'],
      testUrl: 'https://streaming-films.net/joker-2019/',
      waitSelector: '.film-list',
      mainSelector: '.film-item',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'filmcomplet',
      name: 'FilmComplet',
      baseUrl: 'https://www.film-complet.cc',
      alternativeDomains: ['film-complet.tv', 'films-complet.com', 'film-complet.co'],
      testUrl: 'https://www.film-complet.cc/film/parasite-2019/',
      waitSelector: '.movies-list',
      mainSelector: '.ml-item',
      bypassCloudflare: true,
      expirationHours: 12
    }
  ],
  
  // Bollywood
  BOLLYWOOD: [
    {
      id: 'bollyplay',
      name: 'BollyPlay',
      baseUrl: 'https://bollyplay.app',
      alternativeDomains: ['bollyplay.tv', 'bollyplay.cc', 'bollyplay.film'],
      testUrl: 'https://bollyplay.app/movies/pathaan-2023/',
      waitSelector: '.movies-list',
      mainSelector: '.ml-item',
      bypassCloudflare: true,
      expirationHours: 12
    },
    {
      id: 'hindilinks4u',
      name: 'HindiLinks4U',
      baseUrl: 'https://hindilinks4u.skin',
      alternativeDomains: ['hindilinks4u.to', 'hindilinks4u.co', 'hindilinks4u.app'],
      testUrl: 'https://hindilinks4u.skin/jawan-2023-hindi-movie/',
      waitSelector: '.film-list',
      mainSelector: '.film-item',
      bypassCloudflare: true,
      expirationHours: 12
    }
  ]
};

// Configuration des métriques et du suivi
const METRIC_KEYS = {
  SCRAPING_SUCCESS: 'scraping:success',
  SCRAPING_FAILURE: 'scraping:failure',
  CONTENT_COUNT: 'content:count',
  LAST_UPDATE: 'last_update',
  HEALTH_STATUS: 'health:status'
};

// Formats de JSON à générer
const JSON_FORMATS = {
  FULL: 'full',           // Toutes les données complètes
  PREVIEW: 'preview',     // Liste avec métadonnées minimales pour l'affichage rapide
  CATEGORY: 'category'    // Données regroupées par catégorie
};

/**
 * Point d'entrée principal
 */
export default {
  // Déclenché par une tâche programmée
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.handleScheduled(event, env));
  },
  
  // Déclenché par une requête HTTP
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Activer CORS pour toutes les requêtes
    if (request.method === 'OPTIONS') {
      return handleCorsOptions();
    }
    
    // Endpoint pour déclencher manuellement le scraping complet
    if (path === '/run-all') {
      ctx.waitUntil(this.handleScheduled(null, env));
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Scraping démarré pour toutes les sources',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Endpoint pour déclencher le scraping d'une catégorie spécifique
    if (path.startsWith('/run-category/')) {
      const category = path.split('/').pop().toUpperCase();
      if (!SOURCES[category]) {
        return new Response(JSON.stringify({
          status: 'error',
          message: `Catégorie inconnue: ${category}`,
          valid_categories: Object.keys(SOURCES)
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      ctx.waitUntil(this.scrapCategory(category, env));
      return new Response(JSON.stringify({
        status: 'ok',
        message: `Scraping démarré pour la catégorie: ${category}`,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Endpoint pour vérifier l'état du scraping
    if (path === '/status') {
      const status = await getScrapingStatus(env);
      return new Response(JSON.stringify(status), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Endpoint pour initialiser les structures KV (endpoint d'administration)
    if (path === '/admin/init-kv') {
      try {
        const results = await initializeKVStructures(env);
        return new Response(JSON.stringify({
          status: 'success',
          message: 'Structures KV initialisées avec succès',
          details: results,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          status: 'error',
          message: `Erreur lors de l'initialisation des structures KV: ${error.message}`,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Endpoint pour le tableau de bord de monitoring
    if (path === '/dashboard') {
      try {
        // Récupérer toutes les données de monitoring
        const [scrapingStatus, healthStatus, contentStats, metricsSuccess, metricsFailure] = await Promise.all([
          getScrapingStatus(env),
          env.FLODRAMA_METADATA.get('health:status', { type: 'json' }),
          env.FLODRAMA_METADATA.get('metrics:content:stats', { type: 'json' }),
          env.FLODRAMA_METRICS.get(METRIC_KEYS.SCRAPING_SUCCESS, { type: 'json' }),
          env.FLODRAMA_METRICS.get(METRIC_KEYS.SCRAPING_FAILURE, { type: 'json' })
        ]);
        
        // Générer le HTML du tableau de bord
        const html = generateDashboardHtml({
          scrapingStatus,
          healthStatus,
          contentStats,
          metricsSuccess,
          metricsFailure
        });
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(`Erreur lors de la génération du tableau de bord: ${error.message}`, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Route par défaut
    return new Response(JSON.stringify({
      name: 'FloDrama Scraper',
      endpoints: ['/run-all', '/run-category/{category}', '/status', '/admin/init-kv', '/dashboard'],
      valid_categories: Object.keys(SOURCES)
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  },
  
  /**
   * Gère l'exécution programmée du scraping
   */
  async handleScheduled(event, env) {
    console.log('Démarrage du scraping programmé pour toutes les sources');
    
    try {
      // Marquer le début du scraping
      await env.FLODRAMA_METRICS.put(METRIC_KEYS.LAST_UPDATE, JSON.stringify({
        status: 'scraping',
        startTime: Date.now(),
        timestamp: new Date().toISOString()
      }));
      
      // Scraper chaque catégorie
      const categories = Object.keys(SOURCES);
      const results = {
        startTime: Date.now(),
        endTime: null,
        totalSuccess: 0,
        totalFailure: 0,
        categories: {}
      };
      
      for (const category of categories) {
        console.log(`Scraping de la catégorie: ${category}`);
        try {
          const categoryResults = await this.scrapCategory(category, env);
          results.totalSuccess += categoryResults.success;
          results.totalFailure += categoryResults.failure;
          results.categories[category] = categoryResults;
        } catch (error) {
          console.error(`Erreur lors du scraping de la catégorie ${category}:`, error);
          results.totalFailure++;
          results.categories[category] = {
            success: 0,
            failure: 1,
            error: error.message
          };
        }
      }
      
      // Générer les fichiers JSON combinés
      await generateJsonFiles(env);
      
      // Marquer la fin du scraping
      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;
      
      await env.FLODRAMA_METRICS.put(METRIC_KEYS.LAST_UPDATE, JSON.stringify({
        status: 'completed',
        startTime: results.startTime,
        endTime: results.endTime,
        duration: results.duration,
        timestamp: new Date().toISOString()
      }));
      
      // Mettre à jour les métriques de succès/échec
      await updateMetricCounter(METRIC_KEYS.SCRAPING_SUCCESS, results.totalSuccess, env);
      await updateMetricCounter(METRIC_KEYS.SCRAPING_FAILURE, results.totalFailure, env);
      
      // Envoyer une notification Discord avec le résumé
      await sendDiscordNotification(
        `✅ Scraping terminé avec succès en ${Math.round(results.duration / 1000)}s\n` +
        `• Total des sources traitées: ${results.totalSuccess + results.totalFailure}\n` +
        `• Succès: ${results.totalSuccess}\n` +
        `• Échecs: ${results.totalFailure}\n` +
        `• Contenu généré dans Cloudflare KV\n\n` +
        Object.entries(results.categories)
          .map(([cat, data]) => `${cat}: ${data.success} succès, ${data.failure} échecs`)
          .join('\n'),
        results.totalFailure === 0 ? 'success' : (results.totalSuccess > results.totalFailure ? 'warning' : 'error')
      );
      
      // Mettre à jour le statut de santé
      const healthStatus = results.totalFailure === 0 ? 'healthy' : 
                          (results.totalSuccess > results.totalFailure ? 'warning' : 'critical');
      
      await env.FLODRAMA_METRICS.put(METRIC_KEYS.HEALTH_STATUS, JSON.stringify({
        status: healthStatus,
        success: results.totalSuccess,
        failure: results.totalFailure,
        details: results,
        lastUpdate: new Date().toISOString()
      }));
      
      console.log('Scraping terminé avec succès', results);
      return results;
    } catch (error) {
      console.error('Erreur lors du scraping complet:', error);
      
      // Marquer l'échec du scraping
      await env.FLODRAMA_METRICS.put(METRIC_KEYS.LAST_UPDATE, JSON.stringify({
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
      
      // Mettre à jour le statut de santé en critique
      await env.FLODRAMA_METRICS.put(METRIC_KEYS.HEALTH_STATUS, JSON.stringify({
        status: 'critical',
        error: error.message,
        lastUpdate: new Date().toISOString()
      }));
      
      // Envoyer une alerte d'erreur critique à Discord
      await sendDiscordNotification(
        `❌ ERREUR CRITIQUE - Échec du scraping FloDrama\n` +
        `\n` +
        `Erreur: ${error.message}\n` +
        `Heure: ${new Date().toISOString()}\n` +
        `\n` +
        `Une intervention manuelle est requise.`,
        'error'
      );
      
      throw error;
    }
  },
  
  /**
   * Scrape une catégorie spécifique
   */
  async scrapCategory(category, env) {
    const sources = SOURCES[category];
    if (!sources) {
      throw new Error(`Catégorie inconnue: ${category}`);
    }
    
    console.log(`Scraping de ${sources.length} sources pour la catégorie ${category}`);
    
    const results = {
      category,
      startTime: Date.now(),
      endTime: null,
      success: 0,
      failure: 0,
      sources: {}
    };
    
    for (const source of sources) {
      console.log(`Scraping de la source: ${source.name} (${source.id})`);
      
      try {
        // Tenter d'abord l'URL principale
        let sourceResults = await scrapSource(source, env);
        
        // Si ça échoue, essayer les domaines alternatifs
        if (!sourceResults.success && source.alternativeDomains.length > 0) {
          for (const altDomain of source.alternativeDomains) {
            console.log(`Tentative avec domaine alternatif: ${altDomain}`);
            
            const altSource = {
              ...source,
              baseUrl: `https://${altDomain}`
            };
            
            try {
              sourceResults = await scrapSource(altSource, env);
              if (sourceResults.success) {
                // Domaine alternatif réussi
                console.log(`Succès avec le domaine alternatif: ${altDomain}`);
                // Mettre à jour le domaine principal pour les prochaines extractions
                await env.FLODRAMA_METRICS.put(`source:primary_domain:${source.id}`, altDomain);
                break;
              }
            } catch (error) {
              console.error(`Erreur lors du scraping du domaine alternatif ${altDomain}:`, error);
              // Continuer avec le prochain domaine alternatif
            }
          }
        }
        
        // Mettre à jour les résultats
        if (sourceResults.success) {
          results.success++;
        } else {
          results.failure++;
        }
        
        results.sources[source.id] = sourceResults;
      } catch (error) {
        console.error(`Erreur lors du scraping de ${source.name}:`, error);
        results.failure++;
        results.sources[source.id] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    
    console.log(`Scraping de la catégorie ${category} terminé:`, results);
    return results;
  }
};

/**
 * Scrape une source spécifique
 */
// Scrape une source spécifique avec mécanisme de reprise sur erreur
async function scrapSource(source, env, retryCount = 0, maxRetries = 3, delayMs = 5000) {
  console.log(`Début du scraping de la source: ${source.name}${retryCount > 0 ? ` (tentative ${retryCount+1}/${maxRetries+1})` : ''}`);
  
  try {
    // Vérifier si la source est accessible
    const response = await fetch(source.testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Source inaccessible: ${response.status} ${response.statusText}`);
    }
    
    // Simuler le scraping (dans une version réelle, implémenter le scraping réel ici)
    const contentList = await extractContentList(source, env);
    
    // Enrichir les contenus avec des métadonnées supplémentaires
    const enrichedContent = [];
    for (const content of contentList) {
      const enriched = await enrichContent(content, source, env);
      enrichedContent.push(enriched);
    }
    
    // Enregistrer les résultats dans Cloudflare KV
    const sourceKey = `source:${source.id}:content`;
    await env.FLODRAMA_METADATA.put(sourceKey, JSON.stringify(enrichedContent), {
      expirationTtl: source.expirationHours * 3600 // Convertir les heures en secondes
    });
    
    // Mettre à jour les métriques
    await updateMetricCounter(METRIC_KEYS.SCRAPING_SUCCESS, 1, env);
    
    // Mettre à jour le statut de santé
    const healthStatus = await env.FLODRAMA_METADATA.get('health:status', { type: 'json' }) || {
      status: 'operational',
      services: {
        scraping: { status: 'operational', lastRun: null, errors: [] }
      }
    };
    
    healthStatus.services.scraping.lastRun = new Date().toISOString();
    healthStatus.services.scraping.status = 'operational';
    
    // Limiter la taille du tableau d'erreurs
    if (healthStatus.services.scraping.errors.length > 10) {
      healthStatus.services.scraping.errors = healthStatus.services.scraping.errors.slice(-10);
    }
    
    await env.FLODRAMA_METADATA.put('health:status', JSON.stringify(healthStatus));
    
    console.log(`Scraping de la source ${source.name} terminé avec succès. ${enrichedContent.length} contenus récupérés.`);
    return {
      success: true,
      source: source.id,
      contentCount: enrichedContent.length,
      retries: retryCount
    };
  } catch (error) {
    console.error(`Erreur lors du scraping de ${source.name}: ${error.message}`);
    
    // Mécanisme de reprise sur erreur
    if (retryCount < maxRetries) {
      // Types d'erreurs qui justifient une nouvelle tentative
      const retryableErrors = [
        'Source inaccessible', 
        'timeout', 
        'network', 
        'connection', 
        'ECONNRESET',
        'ETIMEDOUT',
        '429',  // Too Many Requests
        '500',  // Internal Server Error
        '502',  // Bad Gateway
        '503',  // Service Unavailable
        '504'   // Gateway Timeout
      ];
      
      // Vérifier si l'erreur justifie une nouvelle tentative
      const shouldRetry = retryableErrors.some(errType => error.message.toLowerCase().includes(errType.toLowerCase()));
      
      if (shouldRetry) {
        console.log(`Reprise du scraping de ${source.name} dans ${delayMs/1000} secondes...`);
        
        // Attendre avant de réessayer (avec backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Réessayer avec un délai plus long
        return await scrapSource(source, env, retryCount + 1, maxRetries, delayMs * 2);
      }
    }
    
    // Si toutes les tentatives ont échoué ou erreur non récupérable, mettre à jour les métriques d'échec
    await updateMetricCounter(METRIC_KEYS.SCRAPING_FAILURE, 1, env);
    
    // Mettre à jour le statut de santé
    const healthStatus = await env.FLODRAMA_METADATA.get('health:status', { type: 'json' }) || {
      status: 'operational',
      services: {
        scraping: { status: 'operational', lastRun: null, errors: [] }
      }
    };
    
    // Ajouter l'erreur à la liste
    healthStatus.services.scraping.errors.unshift({
      source: source.id,
      timestamp: new Date().toISOString(),
      message: error.message,
      retries: retryCount
    });
    
    // Si trop d'erreurs récentes, marquer le service comme dégradé
    const recentErrors = healthStatus.services.scraping.errors.filter(err => {
      const errTime = new Date(err.timestamp).getTime();
      const hourAgo = Date.now() - (60 * 60 * 1000);
      return errTime > hourAgo;
    });
    
    if (recentErrors.length >= 3) {
      healthStatus.services.scraping.status = 'degraded';
    }
    
    await env.FLODRAMA_METADATA.put('health:status', JSON.stringify(healthStatus));
    
    // Notification Discord en cas d'échec après plusieurs tentatives
    if (retryCount > 0) {
      await sendDiscordNotification(`Échec du scraping de ${source.name} après ${retryCount+1} tentatives: ${error.message}`, 'error');
    }
    
    return {
      success: false,
      source: source.id,
      error: error.message,
      retries: retryCount
    };
  }
}

/**
 * Enrichit un contenu avec des métadonnées supplémentaires
 */
async function enrichContent(content, source, env) {
  // Dans un vrai scraper, cette fonction extrairait d'autres métadonnées
  // Pour ce prototype, nous ajoutons quelques champs supplémentaires
  return {
    ...content,
    description: `Description pour ${content.title}`,
    releaseYear: 2020 + Math.floor(Math.random() * 6),
    rating: (Math.random() * 5 + 5).toFixed(1), // Note entre 5 et 10
    poster: `https://images.flodrama.com/w500/poster_${content.id}`,
    backdrop: `https://images.flodrama.com/w1000/backdrop_${content.id}`,
    source: source.id,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Génère les fichiers JSON combinés pour l'application frontend
 */
async function generateJsonFiles(env) {
  // 1. Récupérer tous les contenus par catégorie
  const categories = Object.keys(SOURCES);
  const allContent = {};
  
  for (const category of categories) {
    allContent[category] = [];
    const sources = SOURCES[category];
    
    for (const source of sources) {
      const sourceListKey = `source_list:${source.id}`;
      try {
        const sourceContent = await env.FLODRAMA_METADATA.get(sourceListKey, { type: 'json' });
        if (sourceContent && Array.isArray(sourceContent)) {
          allContent[category] = allContent[category].concat(sourceContent);
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération du contenu de ${source.id}:`, error);
      }
    }
  }
  
  // 2. Générer les fichiers JSON par catégorie
  for (const category of categories) {
    const contents = allContent[category];
    
    // JSON complet
    const fullJsonKey = `json:${category.toLowerCase()}:full`;
    await env.FLODRAMA_METADATA.put(fullJsonKey, JSON.stringify(contents), {
      expirationTtl: 24 * 3600 // 24 heures
    });
    
    // JSON preview (moins de champs)
    const previewContents = contents.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      releaseYear: item.releaseYear,
      rating: item.rating,
      poster: item.poster,
      source: item.source
    }));
    
    const previewJsonKey = `json:${category.toLowerCase()}:preview`;
    await env.FLODRAMA_METADATA.put(previewJsonKey, JSON.stringify(previewContents), {
      expirationTtl: 24 * 3600 // 24 heures
    });
  }
  
  // 3. Générer un fichier JSON global
  const allContents = Object.values(allContent).flat();
  const globalJsonKey = 'json:all:preview';
  
  // Version preview seulement pour le global (pour limiter la taille)
  const globalPreviewContents = allContents.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    releaseYear: item.releaseYear,
    rating: item.rating,
    poster: item.poster,
    source: item.source
  }));
  
  await env.FLODRAMA_METADATA.put(globalJsonKey, JSON.stringify(globalPreviewContents), {
    expirationTtl: 24 * 3600 // 24 heures
  });
  
  // 4. Mettre à jour les métriques de contenu
  await env.FLODRAMA_METRICS.put(METRIC_KEYS.CONTENT_COUNT, JSON.stringify({
    total: allContents.length,
    byCategoryCount: Object.fromEntries(
      Object.entries(allContent).map(([key, value]) => [key, value.length])
    ),
    timestamp: new Date().toISOString()
  }));
  
  return {
    totalCount: allContents.length,
    categoryCounts: Object.fromEntries(
      Object.entries(allContent).map(([key, value]) => [key, value.length])
    )
  };
}

/**
 * Récupère le statut actuel du scraping
 */
async function getScrapingStatus(env) {
  const [lastUpdate, healthStatus, contentCount] = await Promise.all([
    env.FLODRAMA_METRICS.get(METRIC_KEYS.LAST_UPDATE, { type: 'json' }),
    env.FLODRAMA_METRICS.get(METRIC_KEYS.HEALTH_STATUS, { type: 'json' }),
    env.FLODRAMA_METRICS.get(METRIC_KEYS.CONTENT_COUNT, { type: 'json' })
  ]);
  
  return {
    lastUpdate: lastUpdate || { status: 'unknown' },
    healthStatus: healthStatus || { status: 'unknown' },
    contentCount: contentCount || { total: 0 },
    sources: Object.entries(SOURCES).reduce((acc, [category, sources]) => {
      acc[category] = sources.length;
      return acc;
    }, {}),
    timestamp: new Date().toISOString()
  };
}

/**
 * Met à jour un compteur de métriques
 */
async function updateMetricCounter(key, increment, env) {
  try {
    const currentValue = await env.FLODRAMA_METRICS.get(key, { type: 'json' }) || { count: 0 };
    currentValue.count = (currentValue.count || 0) + increment;
    currentValue.lastUpdated = new Date().toISOString();
    
    await env.FLODRAMA_METRICS.put(key, JSON.stringify(currentValue));
    return currentValue.count;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du compteur ${key}:`, error);
    return null;
  }
}

/**
 * Gère les requêtes CORS OPTIONS
 */
function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Envoie une notification à Discord
 */
/**
 * Initialise les structures KV nécessaires pour FloDrama
 * @param {Object} env - L'environnement contenant les namespaces KV
 * @returns {Object} Résultat de l'initialisation
 */
async function initializeKVStructures(env) {
  console.log('Début de l\'initialisation des structures KV');
  const results = {
    metadata: [],
    metrics: []
  };
  
  // 1. Initialiser les structures métriques de base
  try {
    // Métriques de contenu
    const contentStats = {
      lastUpdate: new Date().toISOString(),
      totalContentCount: 0,
      categoryCounts: Object.keys(SOURCES).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {}),
      sourceCounts: {},
      popularContent: []
    };
    
    await env.FLODRAMA_METADATA.put('metrics:content:stats', JSON.stringify(contentStats));
    results.metadata.push('metrics:content:stats');
    
    // Statut de santé
    const healthStatus = {
      lastCheck: new Date().toISOString(),
      status: 'operational',
      services: {
        scraping: {
          status: 'operational',
          lastRun: null,
          errors: []
        },
        media: {
          status: 'operational',
          errors: []
        }
      }
    };
    
    await env.FLODRAMA_METADATA.put('health:status', JSON.stringify(healthStatus));
    results.metadata.push('health:status');
    
    // 2. Initialiser les compteurs de métriques
    const metricsKeys = Object.values(METRIC_KEYS);
    for (const key of metricsKeys) {
      await env.FLODRAMA_METRICS.put(key, JSON.stringify({
        count: 0,
        lastUpdated: new Date().toISOString()
      }));
      results.metrics.push(key);
    }
    
    // 3. Initialiser les structures de contenu vides pour chaque catégorie
    for (const category of Object.keys(SOURCES)) {
      // JSON complet (vide pour l'instant)
      await env.FLODRAMA_METADATA.put(`json:${category.toLowerCase()}:full`, JSON.stringify([]));
      results.metadata.push(`json:${category.toLowerCase()}:full`);
      
      // JSON preview (vide pour l'instant)
      await env.FLODRAMA_METADATA.put(`json:${category.toLowerCase()}:preview`, JSON.stringify([]));
      results.metadata.push(`json:${category.toLowerCase()}:preview`);
    }
    
    // JSON global (vide pour l'instant)
    await env.FLODRAMA_METADATA.put('json:all:preview', JSON.stringify([]));
    results.metadata.push('json:all:preview');
    
    // 4. Envoyer une notification Discord
    await sendDiscordNotification('Initialisation des structures KV pour FloDrama terminée avec succès', 'success');
    
    console.log('Initialisation des structures KV terminée avec succès');
    return results;
  } catch (error) {
    console.error(`Erreur lors de l'initialisation des structures KV: ${error.message}`);
    await sendDiscordNotification(`Erreur lors de l'initialisation des structures KV: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Envoie une notification à Discord
 */
/**
 * Génère le HTML du tableau de bord de monitoring
 * @param {Object} data - Données de monitoring
 * @returns {string} HTML du tableau de bord
 */
function generateDashboardHtml(data) {
  const { scrapingStatus, healthStatus, contentStats, metricsSuccess, metricsFailure } = data;
  
  // Formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Calculer le taux de réussite
  const successCount = metricsSuccess?.count || 0;
  const failureCount = metricsFailure?.count || 0;
  const totalAttempts = successCount + failureCount;
  const successRate = totalAttempts > 0 ? ((successCount / totalAttempts) * 100).toFixed(1) : 0;
  
  // Générer le HTML
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Tableau de bord de monitoring</title>
  <style>
    :root {
      --primary: #3b82f6;
      --secondary: #d946ef;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --dark: #1f2937;
      --light: #f3f4f6;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    h1 {
      color: var(--primary);
      margin: 0;
      font-size: 1.8rem;
    }
    .logo {
      font-weight: bold;
      font-size: 2rem;
      color: var(--primary);
    }
    .logo span {
      color: var(--secondary);
    }
    .status-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      background-color: white;
      border-left: 4px solid var(--primary);
    }
    .card.success {
      border-left-color: var(--success);
    }
    .card.warning {
      border-left-color: var(--warning);
    }
    .card.danger {
      border-left-color: var(--danger);
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--dark);
      margin-top: 0;
      margin-bottom: 15px;
    }
    .card-value {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
    }
    .card-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 5px 0 0;
    }
    .progress-container {
      margin-top: 15px;
      background-color: #e5e7eb;
      border-radius: 9999px;
      height: 8px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      border-radius: 9999px;
    }
    .progress-success {
      background-color: var(--success);
    }
    .progress-warning {
      background-color: var(--warning);
    }
    .progress-danger {
      background-color: var(--danger);
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 1.2rem;
      color: var(--dark);
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success {
      background-color: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    .badge-danger {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.2s;
      border: none;
    }
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      background-color: #2563eb;
    }
    .btn-secondary {
      background-color: #e5e7eb;
      color: #1f2937;
    }
    .btn-secondary:hover {
      background-color: #d1d5db;
    }
    .refresh-time {
      font-size: 0.9rem;
      color: #6b7280;
      text-align: right;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.9rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Flo<span>Drama</span> Monitoring</div>
      <div>
        <button class="btn btn-secondary" onclick="window.location.reload()">Actualiser</button>
      </div>
    </header>
    
    <div class="status-cards">
      <div class="card ${healthStatus?.status === 'operational' ? 'success' : 'warning'}">
        <h3 class="card-title">Statut du système</h3>
        <p class="card-value">${healthStatus?.status === 'operational' ? 'Opérationnel' : 'Dégradé'}</p>
        <p class="card-subtitle">Dernière vérification: ${formatDate(healthStatus?.lastCheck)}</p>
      </div>
      
      <div class="card">
        <h3 class="card-title">Contenu total</h3>
        <p class="card-value">${contentStats?.totalContentCount || 0}</p>
        <p class="card-subtitle">Dernière mise à jour: ${formatDate(contentStats?.lastUpdate)}</p>
      </div>
      
      <div class="card ${successRate > 90 ? 'success' : successRate > 70 ? 'warning' : 'danger'}">
        <h3 class="card-title">Taux de réussite du scraping</h3>
        <p class="card-value">${successRate}%</p>
        <p class="card-subtitle">${successCount} réussites / ${failureCount} échecs</p>
        <div class="progress-container">
          <div class="progress-bar ${successRate > 90 ? 'progress-success' : successRate > 70 ? 'progress-warning' : 'progress-danger'}" style="width: ${successRate}%"></div>
        </div>
      </div>
      
      <div class="card">
        <h3 class="card-title">Dernier scraping</h3>
        <p class="card-value">${formatDate(scrapingStatus?.lastUpdate?.timestamp)}</p>
        <p class="card-subtitle">Prochain scraping prévu: ${new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleString('fr-FR')}</p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Statistiques par catégorie</h2>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Nombre de contenus</th>
            <th>Sources</th>
            <th>Dernière mise à jour</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(SOURCES).map(category => `
            <tr>
              <td>${category}</td>
              <td>${contentStats?.categoryCounts?.[category] || 0}</td>
              <td>${SOURCES[category].length}</td>
              <td>${formatDate(contentStats?.lastUpdate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2 class="section-title">Statut des services</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Statut</th>
            <th>Dernière exécution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scraping</td>
            <td>
              <span class="badge ${healthStatus?.services?.scraping?.status === 'operational' ? 'badge-success' : 'badge-warning'}">
                ${healthStatus?.services?.scraping?.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
              </span>
            </td>
            <td>${formatDate(healthStatus?.services?.scraping?.lastRun)}</td>
          </tr>
          <tr>
            <td>Média</td>
            <td>
              <span class="badge ${healthStatus?.services?.media?.status === 'operational' ? 'badge-success' : 'badge-warning'}">
                ${healthStatus?.services?.media?.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
              </span>
            </td>
            <td>Service continu</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="actions">
      <a href="/run-all" class="btn btn-primary" onclick="return confirm('Êtes-vous sûr de vouloir déclencher un scraping complet?')">
        Lancer un scraping complet
      </a>
      <a href="/status" class="btn btn-secondary">
        Voir les détails techniques
      </a>
    </div>
    
    <p class="refresh-time">Dernière actualisation: ${formatDate(new Date().toISOString())}</p>
    
    <div class="footer">
      <p>FloDrama Monitoring Dashboard v1.0 | &copy; ${new Date().getFullYear()} FloDrama</p>
    </div>
  </div>
  
  <script>
    // Actualisation automatique toutes les 5 minutes
    setTimeout(() => {
      window.location.reload();
    }, 5 * 60 * 1000);
  </script>
</body>
</html>`;
}

/**
 * Envoie une notification à Discord
 */
async function sendDiscordNotification(message, type = 'info') {
  // Webhook FloDrama Discord - URL réelle du webhook
  const webhookUrl = 'https://discord.com/api/webhooks/1371477359219314718/iZeNW9CWAnKV5VZwfcvRcqzrDiLmOIzYjLbh7H4pt2baO3-CfJ6gLwGECiWkTXXOeRSG';
  
  const colors = {
    'info': 3447003,    // Bleu - couleur primaire FloDrama (#3b82f6)
    'success': 5763719, // Vert
    'warning': 16776960,// Jaune
    'error': 15548997,  // Rouge
    'system': 14381203  // Fuchsia - couleur secondaire FloDrama (#d946ef)
  };
  
  const payload = {
    embeds: [{
      title: `FloDrama Scraping ${type.toUpperCase()}`,
      description: message,
      color: colors[type] || colors.info,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'FloDrama Cloudflare Monitoring'
      }
    }]
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`Notification Discord envoyée: ${type} - ${message.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de notification Discord: ${error.message}`);
    return false;
  }
}
