const Content = require('./Content');

/**
 * Modèle spécifique pour les films Bollywood
 * Étend le modèle Content avec des propriétés spécifiques aux films indiens
 */
class Bollywood extends Content {
  constructor(data, source) {
    super(data, source);
    
    // Propriétés spécifiques aux films Bollywood
    this.duration = data.duration || data.runtime || '';
    this.release_date = data.release_date || data.aired?.from || '';
    this.year = data.year || (data.release_date ? new Date(data.release_date).getFullYear() : null);
    this.box_office = data.box_office || '';
    this.language = data.language || 'Hindi';
    this.production_company = data.production_company || data.production || '';
    this.cast = this.normalizeCast(data.cast || data.actors || []);
    this.director = data.director || '';
    this.music_director = data.music_director || '';
    this.is_trending = data.is_trending || false;
    this.is_featured = data.is_featured || false;
    
    // Caractéristiques spécifiques aux films Bollywood
    this.songs = data.songs || [];
    this.awards = data.awards || [];
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
        id: actor.id || 0,
        name: actor.name || '',
        role: actor.role || 'Actor',
        character: actor.character || ''
      };
    });
  }
}

module.exports = Bollywood;
