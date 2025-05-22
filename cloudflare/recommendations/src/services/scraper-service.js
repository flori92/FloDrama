/**
 * Service de scraping pour FloDrama
 * Gère l'extraction des données à partir des différentes sources configurées
 */

import { getDatabase, toJson, fromJson } from './database.js';
import { getActiveSources, getSourceById } from '../config/sources.js';

export class ScraperService {
  constructor(options = {}) {
    this.db = options.db;
    this.kv = options.kv;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.options = {
      maxRetries: 3,
      concurrency: 2,
      timeout: 30000,
      ...options
    };
  }

  /**
   * Initialise le navigateur pour le scraping
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Dans un environnement Cloudflare Workers, nous utiliserons une approche différente
      // Cette méthode sera remplacée par une implémentation compatible avec Cloudflare
      console.log('Initialisation du service de scraping...');
      
      // Simuler l'initialisation pour le moment
      this.initialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du scraper:', error);
      throw error;
    }
  }

  /**
   * Ferme le navigateur et libère les ressources
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
    this.initialized = false;
  }

  /**
   * Scrape toutes les sources actives
   * @returns {Promise<Object>} Résultats du scraping par source
   */
  async scrapeAllSources() {
    if (!this.initialized) {
      await this.initialize();
    }

    const sources = getActiveSources();
    const results = {};
    const errors = [];

    console.log(`Début du scraping pour ${sources.length} sources...`);

    // Traiter les sources par lots pour limiter la concurrence
    const batches = this.createBatches(sources, this.options.concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(source => this.scrapeSourceWithRetry(source));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const source = batch[index];
        if (result.status === 'fulfilled') {
          results[source.id] = {
            success: true,
            count: result.value.length,
            data: result.value
          };
        } else {
          results[source.id] = {
            success: false,
            error: result.reason.message
          };
          errors.push({
            source: source.id,
            error: result.reason
          });
        }
      });
    }

    // Journaliser les résultats
    console.log(`Scraping terminé. ${Object.keys(results).length} sources traitées.`);
    if (errors.length > 0) {
      console.error(`${errors.length} erreurs rencontrées:`, errors);
    }

    return {
      timestamp: new Date().toISOString(),
      results,
      stats: {
        total: sources.length,
        success: sources.length - errors.length,
        failed: errors.length
      }
    };
  }

  /**
   * Scrape une source spécifique avec mécanisme de retry
   * @param {Object} source - Configuration de la source
   * @returns {Promise<Array>} Données extraites
   */
  async scrapeSourceWithRetry(source) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        console.log(`Scraping de ${source.name} (tentative ${attempt}/${this.options.maxRetries})...`);
        const data = await this.scrapeSource(source);
        
        // Enregistrer les données dans Supabase
        await this.storeScrapedData(source.id, data);
        
        console.log(`Scraping de ${source.name} réussi: ${data.length} éléments extraits.`);
        return data;
      } catch (error) {
        lastError = error;
        console.error(`Erreur lors du scraping de ${source.name} (tentative ${attempt}/${this.options.maxRetries}):`, error);
        
        // Attendre avant de réessayer
        if (attempt < this.options.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Échec du scraping de ${source.name} après ${this.options.maxRetries} tentatives: ${lastError.message}`);
  }

  /**
   * Scrape une source spécifique
   * @param {Object} source - Configuration de la source
   * @returns {Promise<Array>} Données extraites
   */
  async scrapeSource(source) {
    // Cette méthode sera implémentée avec une logique spécifique à chaque source
    // Pour le moment, nous simulons des données
    console.log(`Simulation du scraping pour ${source.name}...`);
    
    // Générer des données fictives pour les tests
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${source.id}_${i}`,
      title: `${source.name} Item ${i}`,
      description: `Description pour l'élément ${i} de ${source.name}`,
      poster: `https://example.com/posters/${source.id}_${i}.jpg`,
      year: 2020 + Math.floor(Math.random() * 5),
      rating: 3 + Math.random() * 2,
      url: `${source.baseUrl}/item-${i}`
    }));
  }

  /**
   * Stocke les données scrapées dans Cloudflare D1
   * @param {string} sourceId - Identifiant de la source
   * @param {Array} data - Données à stocker
   * @returns {Promise<void>}
   */
  async storeScrapedData(sourceId, data) {
    try {
      const source = getSourceById(sourceId);
      if (!source) {
        throw new Error(`Source inconnue: ${sourceId}`);
      }
      
      console.log(`Stockage de ${data.length} éléments pour ${source.name}...`);
      
      // Préparer les données pour l'insertion
      const contentsToInsert = data.map(item => {
        const id = `${sourceId}_${item.id || this.generateId(item)}`;
        const metadata = toJson({
          original_url: item.url,
          scraped_at: new Date().toISOString()
        });
        
        return {
          id,
          source_id: sourceId,
          title: item.title,
          description: item.description || null,
          poster_url: item.poster || null,
          backdrop_url: item.backdrop || item.poster || null,
          release_year: item.year || null,
          rating: item.rating || null,
          type: source.type,
          status: item.status || 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata
        };
      });
      
      // Insérer les données par lots pour éviter les limitations de taille
      const batchSize = 50;
      const batches = this.createBatches(contentsToInsert, batchSize);
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO contents 
        (id, source_id, title, description, poster_url, backdrop_url, release_year, rating, type, status, created_at, updated_at, metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const batch of batches) {
        const batchStmt = this.db.batch(batch.map(() => stmt));
        
        const batchParams = batch.flatMap(item => [
          item.id,
          item.source_id,
          item.title,
          item.description,
          item.poster_url,
          item.backdrop_url,
          item.release_year,
          item.rating,
          item.type,
          item.status,
          item.created_at,
          item.updated_at,
          item.metadata
        ]);
        
        await batchStmt.run(...batchParams);
      }
      
      // Mettre à jour la date de dernier scraping de la source
      await this.db.prepare(`
        UPDATE sources 
        SET last_scraped_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        new Date().toISOString(),
        new Date().toISOString(),
        sourceId
      ).run();
      
      // Mettre en cache les données dans KV pour un accès rapide
      if (this.kv) {
        await this.kv.put(
          `source:${sourceId}:last_scraped`, 
          new Date().toISOString(),
          { expirationTtl: 86400 } // 24 heures
        );
      }
      
      console.log(`Stockage réussi pour ${source.name}.`);
    } catch (error) {
      console.error(`Erreur lors du stockage des données pour ${sourceId}:`, error);
      throw error;
    }
  }

  /**
   * Génère un identifiant unique pour un élément
   * @param {Object} item - Élément à identifier
   * @returns {string} Identifiant unique
   */
  generateId(item) {
    // Générer un ID basé sur le titre et l'URL
    const baseString = `${item.title || ''}${item.url || ''}`;
    return this.hashString(baseString);
  }

  /**
   * Crée des lots à partir d'un tableau
   * @param {Array} array - Tableau à diviser
   * @param {number} size - Taille des lots
   * @returns {Array} Tableau de lots
   */
  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Génère un hash simple pour une chaîne
   * @param {string} str - Chaîne à hasher
   * @returns {string} Hash généré
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Conversion en entier 32 bits
    }
    return Math.abs(hash).toString(16);
  }
}
