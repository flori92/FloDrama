const Content = require('./Content');

/**
 * Modèle spécifique pour les dramas
 * Étend le modèle Content avec des propriétés spécifiques aux dramas
 */
class Drama extends Content {
  constructor(data, source) {
    super(data, source);
    
    // Propriétés spécifiques aux dramas
    this.episodes = parseInt(data.episodes || data.episode_count || 0);
    this.duration = data.duration || data.episode_duration || '';
    this.aired = this.normalizeAiredDates(data.aired || data.release_date || {});
    this.year = data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : null);
    this.country = data.country || data.origin || '';
    this.network = data.network || data.broadcaster || '';
    this.cast = this.normalizeCast(data.cast || data.actors || []);
    this.is_trending = data.is_trending || false;
    this.is_featured = data.is_featured || false;
    
    // Informations spécifiques aux dramas
    this.original_language = data.original_language || '';
    this.subtitles = data.subtitles || [];
    this.director = data.director || '';
    this.screenwriter = data.screenwriter || '';
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
   * Normalise le casting
   * @param {Array} cast - Le tableau de casting original
   * @returns {Array} - Le tableau de casting normalisé
   */
  normalizeCast(cast) {
    if (!cast || !Array.isArray(cast)) return [];
    
    return cast.map(actor => {
      if (typeof actor === 'string') {
        return {
          id: 0,
          name: actor,
          role: 'Actor',
          character: ''
        };
      }
      
      return {
        id: actor.id || actor.person_id || 0,
        name: actor.name || actor.person_name || '',
        role: actor.role || 'Actor',
        character: actor.character || actor.character_name || ''
      };
    });
  }
}

module.exports = Drama;
