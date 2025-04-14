/**
 * SearchIndexService
 * 
 * Service d'indexation et de recherche optimisée pour FloDrama
 * Utilise Amazon OpenSearch Service pour des recherches en microsecondes
 * Avec fallback sur un mode dégradé si les services ne sont pas disponibles
 */

// Importer l'index en mémoire (fonctionne dans tous les environnements)
import { inMemoryIndex } from './InMemoryIndex.js';

// Importations conditionnelles pour éviter les erreurs dans le navigateur
let Client;
let Redis;
let AWS;
let createAwsElasticsearchConnector;

// Vérifier si nous sommes dans un environnement Node.js
const isNode = typeof process !== 'undefined' && 
  process.versions != null && 
  process.versions.node != null;

// Importer les modules uniquement si nous sommes dans un environnement Node.js
if (isNode) {
  try {
    // Importations dynamiques pour éviter les erreurs dans le navigateur
    const elasticsearch = require('@elastic/elasticsearch');
    Client = elasticsearch.Client;
    
    const ioredis = require('ioredis');
    Redis = ioredis.default || ioredis;
    
    const aws = require('aws-sdk');
    AWS = aws;
    
    const awsConnector = require('aws-elasticsearch-connector');
    createAwsElasticsearchConnector = awsConnector.default || awsConnector;
  } catch (error) {
    console.warn('[SearchIndexService] Certaines dépendances ne sont pas disponibles:', error.message);
  }
}

// Configuration Redis
let redis = null;
try {
  if (isNode && Redis && process.env.REDIS_HOST) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: times => {
        // Stratégie de reconnexion: 1s, 2s, 3s, etc. jusqu'à 30s max
        const delay = Math.min(times * 1000, 30000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true
    });
    
    redis.on('error', error => {
      console.error(`[SearchIndexService] Erreur Redis: ${error.message}`);
      redis = null;
    });
    
    redis.on('connect', () => {
      console.log('[SearchIndexService] Connexion Redis établie');
    });
  }
} catch (error) {
  console.error(`[SearchIndexService] Erreur d'initialisation Redis: ${error.message}`);
  redis = null;
}

// Configuration AWS
let region = 'eu-west-1'; // Région par défaut: Irlande
if (isNode && AWS && process.env.AWS_REGION) {
  region = process.env.AWS_REGION;
  
  try {
    AWS.config.update({
      region,
      credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      })
    });
  } catch (error) {
    console.error(`[SearchIndexService] Erreur de configuration AWS: ${error.message}`);
  }
}

// Client Elasticsearch
let elasticClient = null;

/**
 * Initialise le client Elasticsearch avec AWS OpenSearch Service
 * @returns {Promise<Client|null>} Client Elasticsearch ou null en cas d'erreur
 */
async function initializeElasticClient() {
  try {
    // Si nous ne sommes pas dans un environnement Node.js, retourner null
    if (!isNode) {
      console.log('[SearchIndexService] Environnement navigateur détecté, mode dégradé activé');
      return null;
    }
    
    // Vérifier si le client existe déjà
    if (elasticClient) {
      return elasticClient;
    }
    
    // Vérifier que la classe Client est correctement importée
    if (!Client || typeof Client !== 'function') {
      console.error('[SearchIndexService] La classe Client d\'Elasticsearch n\'est pas correctement importée');
      return null;
    }
    
    // Vérifier si AWS OpenSearch Service est configuré
    if (process.env.AWS_OPENSEARCH_ENDPOINT) {
      console.log('[SearchIndexService] Utilisation d\'AWS OpenSearch Service');
      
      // Configurer AWS SDK
      const awsConfig = {
        region: process.env.AWS_REGION || 'eu-west-1',
        credentials: new AWS.Credentials({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        })
      };
      
      try {
        // Vérifier que le connecteur AWS est disponible
        if (typeof createAwsElasticsearchConnector !== 'function') {
          throw new Error('Le connecteur AWS Elasticsearch n\'est pas disponible');
        }
        
        // Créer le client avec l'authentification AWS
        const awsConnector = createAwsElasticsearchConnector(awsConfig);
        
        elasticClient = new Client({
          ...awsConnector,
          node: process.env.AWS_OPENSEARCH_ENDPOINT
        });
        
        // Tester la connexion
        const pingResult = await elasticClient.ping();
        if (pingResult && pingResult.statusCode === 200) {
          console.log('[SearchIndexService] Connexion à AWS OpenSearch Service établie');
          return elasticClient;
        } else {
          throw new Error('Échec du ping vers AWS OpenSearch Service');
        }
      } catch (error) {
        console.error(`[SearchIndexService] Erreur de connexion à AWS OpenSearch Service: ${error.message}`);
        elasticClient = null;
      }
    }
    
    // Si AWS OpenSearch n'est pas configuré, essayer Elasticsearch local
    if (process.env.ELASTICSEARCH_URL) {
      console.log('[SearchIndexService] Utilisation d\'Elasticsearch local');
      
      try {
        elasticClient = new Client({
          node: process.env.ELASTICSEARCH_URL,
          maxRetries: 3,
          requestTimeout: 10000
        });
        
        // Tester la connexion
        const pingResult = await elasticClient.ping();
        if (pingResult && pingResult.statusCode === 200) {
          console.log('[SearchIndexService] Connexion à Elasticsearch établie');
          return elasticClient;
        } else {
          throw new Error('Échec du ping vers Elasticsearch');
        }
      } catch (error) {
        console.error(`[SearchIndexService] Erreur de connexion à Elasticsearch: ${error.message}`);
        elasticClient = null;
      }
    }
    
    // Si aucune configuration n'est disponible
    if (!elasticClient) {
      console.warn('[SearchIndexService] Aucune configuration Elasticsearch disponible, mode dégradé activé');
    }
    
    return elasticClient;
  } catch (error) {
    console.error(`[SearchIndexService] Erreur d'initialisation du client Elasticsearch: ${error.message}`);
    return null;
  }
}

// Tenter d'initialiser le client au démarrage, mais ne pas bloquer l'application
// si l'initialisation échoue
if (isNode) {
  try {
    initializeElasticClient().catch(error => {
      console.error(`[SearchIndexService] Erreur lors de l'initialisation automatique: ${error.message}`);
    });
  } catch (error) {
    console.error(`[SearchIndexService] Exception lors de l'initialisation automatique: ${error.message}`);
  }
} else {
  console.log('[SearchIndexService] Mode navigateur détecté, initialisation Elasticsearch ignorée');
}

// Cache en mémoire comme fallback si Redis n'est pas disponible
const memoryCache = new Map();

class SearchIndexService {
  constructor() {
    this.indexName = 'flodrama_content';
    this.initialized = false;
    this.lastUpdate = null;
    this.indexingInProgress = false;
    this.useElasticsearch = false;
    this.useRedis = !!redis;
    
    // Initialiser l'index au démarrage
    this._initializeSearchIndex();
  }
  
  /**
   * Initialise l'index de recherche
   * @private
   */
  async _initializeSearchIndex() {
    try {
      // Tenter d'initialiser le client Elasticsearch
      const client = await initializeElasticClient();
      this.useElasticsearch = !!client;
      
      if (!this.useElasticsearch) {
        console.warn('[SearchIndexService] Elasticsearch non disponible, utilisation du mode dégradé');
        return;
      }
      
      // Vérifier si l'index existe déjà
      const indexExists = await elasticClient.indices.exists({
        index: this.indexName
      });
      
      if (!indexExists) {
        // Créer l'index avec une configuration optimisée
        await elasticClient.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  french_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'french_stemmer', 'french_stop', 'asciifolding']
                  }
                },
                filter: {
                  french_stemmer: {
                    type: 'stemmer',
                    language: 'french'
                  },
                  french_stop: {
                    type: 'stop',
                    stopwords: '_french_'
                  }
                }
              }
            },
            mappings: {
              properties: {
                title: { 
                  type: 'text',
                  analyzer: 'french_analyzer',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256
                    },
                    completion: {
                      type: 'completion',
                      analyzer: 'french_analyzer'
                    }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'french_analyzer'
                },
                type: { type: 'keyword' },
                genres: { type: 'keyword' },
                country: { type: 'keyword' },
                year: { type: 'integer' },
                rating: { type: 'float' },
                image: { type: 'keyword' },
                url: { type: 'keyword' },
                source: { type: 'keyword' },
                episodes: { type: 'integer' },
                status: { type: 'keyword' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' }
              }
            }
          }
        });
        
        console.log(`[SearchIndexService] Index '${this.indexName}' créé avec succès`);
      }
      
      this.initialized = true;
      
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de l'initialisation de l'index: ${error.message}`);
      console.warn('[SearchIndexService] Utilisation du mode dégradé');
      this.useElasticsearch = false;
    }
  }
  
  /**
   * Vérifie si l'index existe
   * @returns {Promise<Boolean>} True si l'index existe
   */
  async checkIndexExists() {
    try {
      if (!this.useElasticsearch) {
        return inMemoryIndex.items.length > 0;
      }
      
      return await elasticClient.indices.exists({
        index: this.indexName
      });
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la vérification de l'index: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Crée l'index s'il n'existe pas
   * @returns {Promise<Boolean>} True si l'index a été créé ou existe déjà
   */
  async createIndex() {
    try {
      if (!this.useElasticsearch) {
        inMemoryIndex.clear();
        return true;
      }
      
      const indexExists = await this.checkIndexExists();
      
      if (!indexExists) {
        await this._initializeSearchIndex();
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la création de l'index: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Supprime l'index
   * @returns {Promise<Boolean>} True si l'index a été supprimé
   */
  async deleteIndex() {
    try {
      if (!this.useElasticsearch) {
        inMemoryIndex.clear();
        return true;
      }
      
      const indexExists = await this.checkIndexExists();
      
      if (indexExists) {
        await elasticClient.indices.delete({
          index: this.indexName
        });
        
        console.log(`[SearchIndexService] Index '${this.indexName}' supprimé avec succès`);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la suppression de l'index: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Récupère les statistiques de l'index
   * @returns {Promise<Object>} Statistiques de l'index
   */
  async getIndexStats() {
    try {
      if (!this.useElasticsearch) {
        const stats = inMemoryIndex.getStats();
        return { 
          success: true, 
          indexType: 'memory',
          totalItems: stats.documentCount,
          message: 'Statistiques de l\'index en mémoire récupérées avec succès'
        };
      }
      
      const indexExists = await this.checkIndexExists();
      
      if (!indexExists) {
        return { 
          success: false, 
          indexType: this.openSearchClient ? 'opensearch' : 'elasticsearch',
          totalItems: 0,
          message: 'L\'index n\'existe pas' 
        };
      }
      
      // Déterminer le type d'index utilisé
      const indexType = process.env.AWS_OPENSEARCH_ENDPOINT ? 'opensearch' : 'elasticsearch';
      
      // Récupérer le nombre de documents
      const count = await elasticClient.count({
        index: this.indexName
      });
      
      // Récupérer les statistiques détaillées de l'index
      const stats = await elasticClient.indices.stats({
        index: this.indexName
      });
      
      return {
        success: true, 
        indexType,
        totalItems: count.count,
        lastUpdate: this.lastUpdate,
        stats: stats.indices[this.indexName],
        message: `Statistiques de l'index ${indexType} récupérées avec succès`
      };
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la récupération des statistiques: ${error.message}`);
      return { 
        success: false, 
        indexType: 'unknown',
        totalItems: 0,
        error: error.message 
      };
    }
  }
  
  /**
   * Indexe une liste d'éléments
   * @param {Array} items - Liste d'éléments à indexer
   * @returns {Promise<Object>} Résultat de l'indexation
   */
  async indexItems(items) {
    if (this.indexingInProgress) {
      console.warn('[SearchIndexService] Une indexation est déjà en cours, opération ignorée');
      return { successful: 0, failed: items.length };
    }
    
    this.indexingInProgress = true;
    
    try {
      if (!this.useElasticsearch) {
        // Utiliser le mode dégradé
        for (const item of items) {
          inMemoryIndex.addItem(item);
        }
        
        this.lastUpdate = new Date();
        this.indexingInProgress = false;
        
        return { successful: items.length, failed: 0 };
      }
      
      if (!items || items.length === 0) {
        this.indexingInProgress = false;
        return { successful: 0, failed: 0 };
      }
      
      // Préparer les documents pour l'indexation en batch
      const operations = items.flatMap(item => [
        { index: { _index: this.indexName } },
        {
          ...item,
          created_at: item.created_at || new Date(),
          updated_at: new Date()
        }
      ]);
      
      // Indexer les documents en batch
      const result = await elasticClient.bulk({
        refresh: true,
        operations
      });
      
      // Compter les succès et les échecs
      const successful = result.items.filter(item => !item.index.error).length;
      const failed = result.items.filter(item => item.index.error).length;
      
      this.lastUpdate = new Date();
      this.indexingInProgress = false;
      
      return { successful, failed };
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de l'indexation: ${error.message}`);
      
      // En cas d'erreur, essayer d'utiliser le mode dégradé
      try {
        for (const item of items) {
          inMemoryIndex.addItem(item);
        }
        
        this.lastUpdate = new Date();
        console.warn('[SearchIndexService] Indexation effectuée en mode dégradé');
        
        return { successful: items.length, failed: 0 };
      } catch (fallbackError) {
        console.error(`[SearchIndexService] Erreur lors de l'indexation en mode dégradé: ${fallbackError.message}`);
      }
      
      this.indexingInProgress = false;
      return { successful: 0, failed: items.length };
    }
  }
  
  /**
   * Recherche rapide
   * @param {String} query - Terme de recherche
   * @param {String} type - Type de contenu (drama, anime, movie, all)
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async search(query, type = 'all', options = {}) {
    if (!query) {
      return [];
    }
    
    const cacheKey = `search:${query}:${type}:${JSON.stringify(options)}`;
    
    // Vérifier le cache
    if (this.useRedis) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      } catch (error) {
        console.error(`[SearchIndexService] Erreur lors de la récupération du cache: ${error.message}`);
      }
    } else if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }
    
    try {
      let results;
      
      if (!this.useElasticsearch) {
        // Utiliser le mode dégradé
        results = inMemoryIndex.search(query);
        
        // Filtrer par type si nécessaire
        if (type !== 'all') {
          results = results.filter(item => item.type === type);
        }
        
        // Appliquer les options de filtrage
        if (options.filters) {
          if (options.filters.genre && options.filters.genre.length > 0) {
            results = results.filter(item => {
              if (!item.genres) return false;
              return options.filters.genre.some(genre => 
                item.genres.includes(genre)
              );
            });
          }
          
          if (options.filters.country && options.filters.country.length > 0) {
            results = results.filter(item => 
              options.filters.country.includes(item.country)
            );
          }
          
          if (options.filters.year && options.filters.year.length > 0) {
            results = results.filter(item => 
              options.filters.year.includes(item.year?.toString())
            );
          }
          
          if (options.filters.minRating) {
            results = results.filter(item => 
              (item.rating || 0) >= options.filters.minRating
            );
          }
        }
        
        // Limiter les résultats
        const size = options.size || 20;
        results = results.slice(0, size);
      } else {
        // Construire la requête Elasticsearch
        const mustClauses = [
          {
            multi_match: {
              query,
              fields: ['title^3', 'description'],
              fuzziness: 'AUTO'
            }
          }
        ];
        
        // Filtrer par type
        if (type !== 'all') {
          mustClauses.push({
            term: { type }
          });
        }
        
        // Appliquer les options de filtrage
        const filterClauses = [];
        
        if (options.filters) {
          if (options.filters.genre && options.filters.genre.length > 0) {
            filterClauses.push({
              terms: { genres: options.filters.genre }
            });
          }
          
          if (options.filters.country && options.filters.country.length > 0) {
            filterClauses.push({
              terms: { country: options.filters.country }
            });
          }
          
          if (options.filters.year && options.filters.year.length > 0) {
            filterClauses.push({
              terms: { year: options.filters.year.map(y => parseInt(y, 10)) }
            });
          }
          
          if (options.filters.minRating) {
            filterClauses.push({
              range: {
                rating: { gte: options.filters.minRating }
              }
            });
          }
        }
        
        // Exécuter la recherche
        const response = await elasticClient.search({
          index: this.indexName,
          body: {
            query: {
              bool: {
                must: mustClauses,
                filter: filterClauses
              }
            },
            size: options.size || 20
          }
        });
        
        // Transformer les résultats
        results = response.hits.hits.map(hit => ({
          ...hit._source,
          _score: hit._score
        }));
      }
      
      // Mettre en cache les résultats
      if (this.useRedis) {
        try {
          await redis.set(cacheKey, JSON.stringify(results), 'EX', 3600); // Expire après 1 heure
        } catch (error) {
          console.error(`[SearchIndexService] Erreur lors de la mise en cache: ${error.message}`);
        }
      } else {
        memoryCache.set(cacheKey, results);
        
        // Limiter la taille du cache en mémoire
        if (memoryCache.size > 1000) {
          const oldestKey = memoryCache.keys().next().value;
          memoryCache.delete(oldestKey);
        }
      }
      
      return results;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la recherche: ${error.message}`);
      
      // En cas d'erreur, essayer d'utiliser le mode dégradé
      if (this.useElasticsearch) {
        console.warn('[SearchIndexService] Tentative de recherche en mode dégradé');
        this.useElasticsearch = false;
        return this.search(query, type, options);
      }
      
      return [];
    }
  }
  
  /**
   * Récupère des suggestions pour l'autocomplétion
   * @param {String} prefix - Préfixe pour l'autocomplétion
   * @param {Number} size - Nombre de suggestions à retourner
   * @returns {Promise<Array>} Suggestions d'autocomplétion
   */
  async getSuggestions(prefix, size = 10) {
    if (!prefix || prefix.length < 2) {
      return [];
    }
    
    const cacheKey = `suggestions:${prefix}:${size}`;
    
    // Vérifier le cache
    if (this.useRedis) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      } catch (error) {
        console.error(`[SearchIndexService] Erreur lors de la récupération du cache: ${error.message}`);
      }
    } else if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }
    
    try {
      let suggestions;
      
      if (!this.useElasticsearch) {
        // Utiliser le mode dégradé
        suggestions = inMemoryIndex.getSuggestions(prefix);
      } else {
        // Utiliser Elasticsearch
        const response = await elasticClient.search({
          index: this.indexName,
          body: {
            suggest: {
              title_suggestions: {
                prefix,
                completion: {
                  field: 'title.completion',
                  size
                }
              }
            },
            _source: false
          }
        });
        
        // Transformer les résultats
        suggestions = response.suggest.title_suggestions[0].options
          .map(option => option.text);
      }
      
      // Mettre en cache les résultats
      if (this.useRedis) {
        try {
          await redis.set(cacheKey, JSON.stringify(suggestions), 'EX', 3600); // Expire après 1 heure
        } catch (error) {
          console.error(`[SearchIndexService] Erreur lors de la mise en cache: ${error.message}`);
        }
      } else {
        memoryCache.set(cacheKey, suggestions);
        
        // Limiter la taille du cache en mémoire
        if (memoryCache.size > 1000) {
          const oldestKey = memoryCache.keys().next().value;
          memoryCache.delete(oldestKey);
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la récupération des suggestions: ${error.message}`);
      
      // En cas d'erreur, essayer d'utiliser le mode dégradé
      if (this.useElasticsearch) {
        console.warn('[SearchIndexService] Tentative de récupération des suggestions en mode dégradé');
        this.useElasticsearch = false;
        return this.getSuggestions(prefix, size);
      }
      
      return [];
    }
  }
  
  /**
   * Récupère tous les titres pour l'autocomplétion
   * @returns {Promise<Array>} Liste de tous les titres
   */
  async getAllTitlesForAutocomplete() {
    const cacheKey = 'all_titles';
    
    // Vérifier le cache
    if (this.useRedis) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          return JSON.parse(cachedResult);
        }
      } catch (error) {
        console.error(`[SearchIndexService] Erreur lors de la récupération du cache: ${error.message}`);
      }
    } else if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }
    
    try {
      let titles;
      
      if (!this.useElasticsearch) {
        // Utiliser le mode dégradé
        titles = inMemoryIndex.items.map(item => item.title).filter(Boolean);
      } else {
        // Utiliser Elasticsearch
        const response = await elasticClient.search({
          index: this.indexName,
          body: {
            query: { match_all: {} },
            _source: ['title'],
            size: 10000
          }
        });
        
        // Transformer les résultats
        titles = response.hits.hits
          .map(hit => hit._source.title)
          .filter(Boolean);
      }
      
      // Mettre en cache les résultats
      if (this.useRedis) {
        try {
          await redis.set(cacheKey, JSON.stringify(titles), 'EX', 86400); // Expire après 24 heures
        } catch (error) {
          console.error(`[SearchIndexService] Erreur lors de la mise en cache: ${error.message}`);
        }
      } else {
        memoryCache.set(cacheKey, titles);
      }
      
      return titles;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la récupération des titres: ${error.message}`);
      
      // En cas d'erreur, essayer d'utiliser le mode dégradé
      if (this.useElasticsearch) {
        console.warn('[SearchIndexService] Tentative de récupération des titres en mode dégradé');
        this.useElasticsearch = false;
        return this.getAllTitlesForAutocomplete();
      }
      
      return [];
    }
  }
  
  /**
   * Vérifie l'état du service
   * @returns {Promise<Object>} État du service
   */
  async healthCheck() {
    try {
      // Tenter d'initialiser le client Elasticsearch
      const client = await initializeElasticClient();
      this.useElasticsearch = !!client;
      
      const status = {
        elasticsearch: false,
        redis: false,
        indexSize: 0,
        lastUpdate: this.lastUpdate
      };
      
      // Vérifier l'état d'Elasticsearch
      if (this.useElasticsearch) {
        try {
          await elasticClient.ping();
          status.elasticsearch = true;
          
          const stats = await this.getIndexStats();
          status.indexSize = stats.totalItems;
        } catch (error) {
          console.error(`[SearchIndexService] Erreur Elasticsearch: ${error.message}`);
          this.useElasticsearch = false;
        }
      } else {
        // Mode dégradé
        status.indexSize = inMemoryIndex.items.length;
      }
      
      // Vérifier l'état de Redis
      if (this.useRedis) {
        try {
          await redis.ping();
          status.redis = true;
        } catch (error) {
          console.error(`[SearchIndexService] Erreur Redis: ${error.message}`);
          this.useRedis = false;
        }
      }
      
      return status;
    } catch (error) {
      console.error(`[SearchIndexService] Erreur lors de la vérification de l'état: ${error.message}`);
      
      return {
        elasticsearch: false,
        redis: false,
        indexSize: inMemoryIndex.items.length,
        lastUpdate: this.lastUpdate
      };
    }
  }
}

// Exporter la classe
export default SearchIndexService;
