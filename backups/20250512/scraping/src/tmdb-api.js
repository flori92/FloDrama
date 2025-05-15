/**
 * Module d'intégration avec l'API TMDB pour FloDrama
 * 
 * Ce module remplace le scraping direct par l'utilisation de l'API TMDB
 * qui fournit des données structurées sur les films, séries, etc.
 */

/**
 * Classe pour interagir avec l'API TMDB
 */
class TMDBApi {
  constructor(env) {
    this.apiKey = env.TMDB_API_KEY || 'DÉFINIR_VOTRE_CLÉ_API_TMDB';
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p';
    this.db = env.DB;
    this.storage = env.STORAGE;
    this.isDebug = false;
  }

  /**
   * Active le mode debug
   */
  enableDebug() {
    this.isDebug = true;
  }

  /**
   * Log pour le debug
   */
  debugLog(message, data = null) {
    if (this.isDebug) {
      console.log(`[DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Effectue une requête à l'API TMDB
   */
  async request(endpoint, params = {}) {
    const queryParams = new URLSearchParams({ api_key: this.apiKey, ...params });
    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    this.debugLog(`Requête TMDB: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur API TMDB: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Récupère un flux complet de données (gère la pagination)
   */
  async getPaginatedResults(endpoint, params = {}, maxPages = 5) {
    let allResults = [];
    let currentPage = 1;
    let totalPages = 1;
    
    while (currentPage <= totalPages && currentPage <= maxPages) {
      const data = await this.request(endpoint, { ...params, page: currentPage });
      
      allResults = [...allResults, ...data.results];
      totalPages = data.total_pages;
      currentPage++;
      
      // Pause entre les requêtes pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    return allResults;
  }

  /**
   * Télécharge une image et la stocke dans R2
   */
  async downloadAndStoreImage(path, size, key) {
    if (!path) return null;
    
    const url = `${this.imageBaseUrl}/${size}${path}`;
    this.debugLog(`Téléchargement de l'image: ${url} -> ${key}`);
    
    try {
      // Télécharger l'image
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      this.debugLog(`Image téléchargée: ${arrayBuffer.byteLength} octets, type: ${contentType}`);
      
      // Stocker dans R2
      await this.storage.put(key, arrayBuffer, {
        httpMetadata: { contentType }
      });
      
      // Retourner l'URL de l'image dans R2
      const imageUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3'}.r2.dev/flodrama-storage/${key}`;
      this.debugLog(`Image stockée dans R2: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      this.debugLog(`Erreur lors du téléchargement/stockage de l'image: ${error.message}`);
      return null;
    }
  }

  /**
   * Enregistre les données dans D1
   */
  async saveToDatabase(data, table) {
    // Préparation des champs pour l'insertion
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(data);
    
    // Requête SQL d'insertion
    const query = `
      INSERT INTO ${table} (${fields})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET
      ${Object.keys(data).map((field, i) => `${field} = $${i + 1}`).join(', ')}
    `;
    
    // Exécution de la requête
    try {
      this.debugLog(`Sauvegarde dans la table ${table}`, data);
      await this.db.prepare(query).bind(...values).run();
      return true;
    } catch (error) {
      this.debugLog(`Erreur lors de l'insertion dans ${table}: ${error.message}`);
      return false;
    }
  }

  /**
   * Enregistre un log de l'importation
   */
  async logImport(contentType, status, itemsCount, success, errorsCount, duration, details) {
    const logData = {
      id: crypto.randomUUID(),
      source: 'tmdb',
      content_type: contentType,
      status,
      items_count: itemsCount,
      errors_count: errorsCount || 0,
      duration,
      success,
      details: details ? JSON.stringify(details) : null,
      created_at: new Date().toISOString()
    };
    
    await this.saveToDatabase(logData, 'scraping_logs');
  }
}

/**
 * Classe pour importer des drames asiatiques
 */
class AsianDramaImporter extends TMDBApi {
  constructor(env) {
    super(env);
    this.contentType = 'drama';
    this.regions = ['KR', 'CN', 'JP', 'TW', 'TH']; // Corée du Sud, Chine, Japon, Taiwan, Thaïlande
  }

  /**
   * Convertit les données TMDB au format FloDrama
   */
  mapToFloDramaFormat(item) {
    const originCountry = item.origin_country && item.origin_country.length > 0 
      ? item.origin_country[0] 
      : null;
    
    return {
      id: crypto.randomUUID(),
      title: item.name,
      original_title: item.original_name,
      year: new Date(item.first_air_date).getFullYear(),
      status: item.status || 'Released',
      country: originCountry,
      genres: item.genres ? JSON.stringify(item.genres.map(g => g.name)) : null,
      rating: item.vote_average,
      synopsis: item.overview,
      episodes_count: item.number_of_episodes || null,
      duration: item.episode_run_time && item.episode_run_time.length > 0 
        ? `${item.episode_run_time[0]} min` 
        : null,
      poster: item.poster_path,
      backdrop: item.backdrop_path,
      actors: null, // À remplir avec les crédits
      directors: null, // À remplir avec les crédits
      source: 'tmdb',
      source_id: item.id.toString(),
      source_url: `https://www.themoviedb.org/tv/${item.id}`,
      scraped_at: new Date().toISOString()
    };
  }

  /**
   * Récupère les détails d'une série TV
   */
  async getShowDetails(id) {
    return await this.request(`/tv/${id}`, { 
      append_to_response: 'credits,content_ratings',
      language: 'fr-FR'
    });
  }

  /**
   * Récupère les crédits (acteurs, réalisateurs) d'une série
   */
  async getCredits(tvId) {
    const data = await this.request(`/tv/${tvId}/credits`);
    
    const actors = data.cast
      .slice(0, 10)
      .map(person => person.name);
    
    const directors = data.crew
      .filter(person => person.job === 'Director' || person.department === 'Directing')
      .map(person => person.name);
    
    return {
      actors: actors.length > 0 ? JSON.stringify(actors) : null,
      directors: directors.length > 0 ? JSON.stringify(directors) : null
    };
  }

  /**
   * Importe un drama spécifique
   */
  async importDrama(id) {
    try {
      this.debugLog(`Importation du drama TMDB ID: ${id}`);
      
      // Récupération des détails
      const details = await this.getShowDetails(id);
      this.debugLog(`Détails récupérés pour: ${details.name}`);
      
      // Récupération des crédits
      const credits = await this.getCredits(id);
      
      // Conversion au format FloDrama
      const data = this.mapToFloDramaFormat(details);
      
      // Ajout des crédits
      data.actors = credits.actors;
      data.directors = credits.directors;
      
      // Téléchargement et stockage des images
      if (data.poster) {
        const posterKey = `posters/dramas/${data.id}_poster.jpg`;
        data.poster = await this.downloadAndStoreImage(data.poster, 'original', posterKey);
      }
      
      if (data.backdrop) {
        const backdropKey = `backdrops/dramas/${data.id}_backdrop.jpg`;
        data.backdrop = await this.downloadAndStoreImage(data.backdrop, 'original', backdropKey);
      }
      
      // Enregistrement dans la base de données
      const success = await this.saveToDatabase(data, 'dramas');
      
      return { success, data };
    } catch (error) {
      this.debugLog(`Erreur lors de l'importation du drama ${id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Recherche des dramas asiatiques populaires
   */
  async searchAsianDramas(limit = 20) {
    const results = [];
    
    for (const region of this.regions) {
      const dramas = await this.getPaginatedResults('/discover/tv', {
        with_origin_country: region,
        sort_by: 'popularity.desc',
        language: 'fr-FR'
      });
      
      results.push(...dramas);
    }
    
    // Tri par popularité
    results.sort((a, b) => b.popularity - a.popularity);
    
    return results.slice(0, limit);
  }

  /**
   * Lance l'importation complète
   */
  async import(limit = 20) {
    const startTime = Date.now();
    let itemsImported = 0;
    let errors = 0;
    const details = [];
    
    try {
      // Recherche des dramas asiatiques
      const dramas = await this.searchAsianDramas(limit);
      
      if (dramas.length === 0) {
        throw new Error("Aucun drama trouvé");
      }
      
      this.debugLog(`${dramas.length} dramas trouvés pour importation`);
      
      // Importation de chaque drama
      for (const drama of dramas) {
        try {
          const result = await this.importDrama(drama.id);
          if (result.success) {
            itemsImported++;
          } else {
            errors++;
            details.push({ id: drama.id, title: drama.name, error: result.error });
          }
          
          // Délai entre les importations pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors++;
          details.push({ id: drama.id, title: drama.name, error: error.message });
        }
      }
      
      // Calcul de la durée
      const duration = (Date.now() - startTime) / 1000;
      
      // Enregistrement du log
      await this.logImport(
        this.contentType,
        'completed',
        itemsImported,
        errors === 0,
        errors,
        duration,
        details
      );
      
      return {
        success: itemsImported > 0,
        source: 'tmdb',
        content_type: this.contentType,
        items_count: itemsImported,
        errors_count: errors,
        duration_ms: duration * 1000
      };
    } catch (error) {
      // Calcul de la durée en cas d'erreur
      const duration = (Date.now() - startTime) / 1000;
      
      // Enregistrement du log d'erreur
      await this.logImport(
        this.contentType,
        'error',
        itemsImported,
        false,
        errors + 1,
        duration,
        [...details, { error: error.message }]
      );
      
      throw error;
    }
  }
}

// Export des classes
export { TMDBApi, AsianDramaImporter };
