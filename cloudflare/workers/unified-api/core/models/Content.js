/**
 * Modèle de base pour tous les types de contenu (anime, drama, film, etc.)
 * Permet de normaliser les données provenant de différentes APIs
 */
class Content {
  constructor(data, source) {
    this.id = data.id || data.mal_id || data._id || '';
    this.title = {
      default: data.title || data.name || '',
      english: data.title_english || data.english_title || data.title || '',
      native: data.title_japanese || data.native_title || data.original_title || ''
    };
    this.type = data.type || data.content_type || 'unknown';
    this.status = this.normalizeStatus(data.status || '');
    this.image = this.normalizeImage(data.images || data.image || data.picture || {});
    this.synopsis = data.synopsis || data.description || data.plot_summary || '';
    this.score = parseFloat(data.score || data.rating || 0);
    this.genres = this.normalizeGenres(data.genres || data.categories || []);
    this.source = source; // 'jikan', 'anime-api', 'kdramas', etc.
    this.url = data.url || data.link || '';
    this.created_at = new Date().toISOString();
  }

  /**
   * Normalise les différents formats de statut
   * @param {string} status - Le statut original
   * @returns {string} - Le statut normalisé
   */
  normalizeStatus(status) {
    status = status.toLowerCase();
    
    if (status.includes('airing') || status.includes('en cours') || status.includes('ongoing')) {
      return 'ongoing';
    } else if (status.includes('finished') || status.includes('completed') || status.includes('terminé')) {
      return 'completed';
    } else if (status.includes('upcoming') || status.includes('à venir') || status.includes('not yet aired')) {
      return 'upcoming';
    } else if (status.includes('canceled') || status.includes('annulé')) {
      return 'canceled';
    }
    
    return 'unknown';
  }

  /**
   * Normalise les différents formats d'image
   * @param {Object} image - L'objet image original
   * @returns {Object} - L'objet image normalisé
   */
  normalizeImage(image) {
    // Format Jikan API
    if (image.jpg && image.webp) {
      return {
        small: image.jpg?.small_image_url || image.jpg?.image_url || '',
        medium: image.jpg?.medium_image_url || image.jpg?.image_url || '',
        large: image.jpg?.large_image_url || image.jpg?.image_url || '',
        original: image.jpg?.image_url || ''
      };
    }
    
    // Format simple URL
    if (typeof image === 'string') {
      return {
        small: image,
        medium: image,
        large: image,
        original: image
      };
    }
    
    // Format avec différentes tailles
    return {
      small: image.small || image.thumbnail || image.poster_path || '',
      medium: image.medium || image.poster_path || '',
      large: image.large || image.backdrop_path || '',
      original: image.original || image.poster_path || image.backdrop_path || ''
    };
  }

  /**
   * Normalise les différents formats de genres
   * @param {Array} genres - Le tableau de genres original
   * @returns {Array} - Le tableau de genres normalisé
   */
  normalizeGenres(genres) {
    if (!genres || !Array.isArray(genres)) return [];
    
    return genres.map(genre => {
      if (typeof genre === 'string') {
        return {
          id: 0,
          name: genre
        };
      }
      
      return {
        id: genre.id || genre.mal_id || 0,
        name: genre.name || genre.type || ''
      };
    });
  }
}

module.exports = Content;
