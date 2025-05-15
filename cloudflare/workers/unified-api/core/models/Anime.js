const Content = require('./Content');

/**
 * Modèle spécifique pour les animes
 * Étend le modèle Content avec des propriétés spécifiques aux animes
 */
class Anime extends Content {
  constructor(data, source) {
    super(data, source);
    
    // Propriétés spécifiques aux animes
    this.episodes = parseInt(data.episodes || data.episode_count || 0);
    this.duration = data.duration || data.episode_duration || '';
    this.aired = this.normalizeAiredDates(data.aired || data.release_date || {});
    this.season = data.season || '';
    this.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
    this.studios = this.normalizeStudios(data.studios || data.production || []);
    this.source_material = data.source || '';
    this.rating = data.rating || data.age_rating || '';
    this.is_trending = data.is_trending || false;
    this.is_featured = data.is_featured || false;
    
    // Informations de streaming si disponibles
    this.streaming_info = data.streaming_info || data.streaming || [];
  }

  /**
   * Normalise les dates de diffusion
   * @param {Object|string} aired - Les dates de diffusion originales
   * @returns {Object} - Les dates normalisées
   */
  normalizeAiredDates(aired) {
    if (typeof aired === 'string') {
      return {
        from: aired,
        to: aired,
        string: aired
      };
    }
    
    return {
      from: aired.from || aired.start_date || null,
      to: aired.to || aired.end_date || null,
      string: aired.string || `${aired.from || ''} to ${aired.to || 'now'}`
    };
  }

  /**
   * Normalise les studios
   * @param {Array} studios - Le tableau de studios original
   * @returns {Array} - Le tableau de studios normalisé
   */
  normalizeStudios(studios) {
    if (!studios || !Array.isArray(studios)) return [];
    
    return studios.map(studio => {
      if (typeof studio === 'string') {
        return {
          id: 0,
          name: studio
        };
      }
      
      return {
        id: studio.id || studio.mal_id || 0,
        name: studio.name || ''
      };
    });
  }
}

module.exports = Anime;
