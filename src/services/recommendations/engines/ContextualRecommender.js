/**
 * Moteur de recommandations contextuelles pour FloDrama
 * Génère des recommandations basées sur le contexte utilisateur (heure, appareil, saison, etc.)
 */

import { searchContent } from '../../api/ContentService';
import { getUserDeviceInfo } from '../../api/UserService';
import { CONTEXTUAL_FACTORS, CONTENT_TYPES, CONTENT_GENRES } from '../constants';

class ContextualRecommender {
  constructor() {
    // Cache pour les recommandations contextuelles
    this.contextCache = new Map();
    
    console.log('Moteur de recommandations contextuelles FloDrama initialisé');
  }
  
  /**
   * Récupère le contexte actuel de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Contexte utilisateur
   */
  async getUserContext(userId) {
    try {
      // Récupérer les informations sur l'appareil de l'utilisateur
      const deviceInfo = await getUserDeviceInfo(userId);
      
      // Déterminer l'heure de la journée
      const timeOfDay = this._determineTimeOfDay();
      
      // Déterminer le jour de la semaine
      const dayOfWeek = this._determineDayOfWeek();
      
      // Déterminer la saison
      const season = this._determineSeason();
      
      return {
        userId,
        timeOfDay,
        dayOfWeek,
        season,
        deviceType: deviceInfo?.deviceType || 'desktop',
        screenSize: deviceInfo?.screenSize || 'medium',
        connectionType: deviceInfo?.connectionType || 'wifi',
        location: deviceInfo?.location || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du contexte utilisateur:', error);
      
      // Retourner un contexte par défaut en cas d'erreur
      return {
        userId,
        timeOfDay: this._determineTimeOfDay(),
        dayOfWeek: this._determineDayOfWeek(),
        season: this._determineSeason(),
        deviceType: 'desktop',
        screenSize: 'medium',
        connectionType: 'wifi',
        location: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Récupère des recommandations basées sur l'heure de la journée
   * @param {string} timeOfDay - Moment de la journée (morning, noon, afternoon, evening, night)
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus recommandés
   */
  async getRecommendationsByTime(timeOfDay, limit = 10) {
    try {
      // Construire la clé de cache
      const cacheKey = `time:${timeOfDay}:${limit}`;
      
      // Vérifier le cache
      if (this.contextCache.has(cacheKey)) {
        const cachedData = this.contextCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          return cachedData.content;
        }
      }
      
      // Définir les genres adaptés selon l'heure
      let genres = [];
      let contentType = null;
      let maxDuration = null;
      
      switch (timeOfDay) {
        case 'morning':
          // Le matin : contenus courts, légers, informatifs
          genres = [CONTENT_GENRES.COMEDY, CONTENT_GENRES.SLICE_OF_LIFE];
          maxDuration = 30; // 30 minutes max
          break;
          
        case 'noon':
          // À midi : contenus courts et divertissants
          genres = [CONTENT_GENRES.COMEDY, CONTENT_GENRES.VARIETY];
          maxDuration = 30; // 30 minutes max
          break;
          
        case 'afternoon':
          // L'après-midi : contenus variés
          genres = [CONTENT_GENRES.ACTION, CONTENT_GENRES.COMEDY, CONTENT_GENRES.SCHOOL];
          break;
          
        case 'evening':
          // Le soir : contenus plus longs et immersifs
          genres = [CONTENT_GENRES.DRAMA, CONTENT_GENRES.ROMANCE, CONTENT_GENRES.THRILLER];
          contentType = CONTENT_TYPES.DRAMA;
          break;
          
        case 'night':
          // La nuit : contenus plus intenses ou relaxants
          genres = [CONTENT_GENRES.THRILLER, CONTENT_GENRES.HORROR, CONTENT_GENRES.ROMANCE];
          break;
          
        default:
          genres = [CONTENT_GENRES.COMEDY, CONTENT_GENRES.DRAMA, CONTENT_GENRES.ACTION];
      }
      
      // Rechercher le contenu adapté
      const searchParams = {
        genres,
        limit: limit * 2 // Récupérer plus pour le filtrage
      };
      
      if (contentType) {
        searchParams.type = contentType;
      }
      
      if (maxDuration) {
        searchParams.maxDuration = maxDuration;
      }
      
      const content = await searchContent(searchParams);
      
      // Filtrer et trier les résultats
      const filteredContent = this._filterAndSortByTimeOfDay(content, timeOfDay);
      
      // Limiter le nombre de résultats
      const limitedContent = filteredContent.slice(0, limit);
      
      // Mettre en cache
      this.contextCache.set(cacheKey, {
        content: limitedContent,
        timestamp: Date.now()
      });
      
      return limitedContent;
    } catch (error) {
      console.error('Erreur lors de la recherche par heure de la journée:', error);
      return [];
    }
  }
  
  /**
   * Récupère des recommandations basées sur l'appareil utilisé
   * @param {string} deviceType - Type d'appareil (desktop, mobile, tablet, tv)
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus recommandés
   */
  async getRecommendationsByDevice(deviceType, limit = 10) {
    try {
      // Construire la clé de cache
      const cacheKey = `device:${deviceType}:${limit}`;
      
      // Vérifier le cache
      if (this.contextCache.has(cacheKey)) {
        const cachedData = this.contextCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          return cachedData.content;
        }
      }
      
      // Définir les paramètres adaptés selon l'appareil
      let contentType = null;
      let maxDuration = null;
      let minQuality = null;
      
      switch (deviceType) {
        case 'mobile':
          // Sur mobile : contenus courts, optimisés pour petit écran
          maxDuration = 30; // 30 minutes max
          contentType = CONTENT_TYPES.VARIETY; // Préférence pour les émissions de variété
          break;
          
        case 'tablet':
          // Sur tablette : contenus moyens
          maxDuration = 60; // 60 minutes max
          break;
          
        case 'tv':
          // Sur TV : contenus longs, haute qualité
          minQuality = 'HD';
          contentType = CONTENT_TYPES.DRAMA; // Préférence pour les dramas
          break;
          
        case 'desktop':
        default:
          // Sur desktop : pas de restrictions particulières
          break;
      }
      
      // Rechercher le contenu adapté
      const searchParams = {
        limit: limit * 2 // Récupérer plus pour le filtrage
      };
      
      if (contentType) {
        searchParams.type = contentType;
      }
      
      if (maxDuration) {
        searchParams.maxDuration = maxDuration;
      }
      
      if (minQuality) {
        searchParams.minQuality = minQuality;
      }
      
      const content = await searchContent(searchParams);
      
      // Filtrer et trier les résultats
      const filteredContent = this._filterAndSortByDevice(content, deviceType);
      
      // Limiter le nombre de résultats
      const limitedContent = filteredContent.slice(0, limit);
      
      // Mettre en cache
      this.contextCache.set(cacheKey, {
        content: limitedContent,
        timestamp: Date.now()
      });
      
      return limitedContent;
    } catch (error) {
      console.error('Erreur lors de la recherche par appareil:', error);
      return [];
    }
  }
  
  /**
   * Récupère des recommandations basées sur la saison
   * @param {string} season - Saison (spring, summer, autumn, winter)
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus recommandés
   */
  async getRecommendationsBySeason(season, limit = 10) {
    try {
      // Construire la clé de cache
      const cacheKey = `season:${season}:${limit}`;
      
      // Vérifier le cache
      if (this.contextCache.has(cacheKey)) {
        const cachedData = this.contextCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 86400000) { // Cache valide pour 24 heures
          return cachedData.content;
        }
      }
      
      // Définir les genres adaptés selon la saison
      let genres = [];
      let keywords = [];
      
      switch (season) {
        case 'spring':
          // Printemps : romance, renouveau
          genres = [CONTENT_GENRES.ROMANCE, CONTENT_GENRES.SLICE_OF_LIFE, CONTENT_GENRES.SCHOOL];
          keywords = ['printemps', 'fleurs', 'école', 'jeunesse'];
          break;
          
        case 'summer':
          // Été : action, aventure
          genres = [CONTENT_GENRES.ACTION, CONTENT_GENRES.COMEDY, CONTENT_GENRES.SPORTS];
          keywords = ['été', 'plage', 'vacances', 'aventure'];
          break;
          
        case 'autumn':
          // Automne : mystère, introspection
          genres = [CONTENT_GENRES.MYSTERY, CONTENT_GENRES.PSYCHOLOGICAL, CONTENT_GENRES.THRILLER];
          keywords = ['automne', 'mystère', 'école'];
          break;
          
        case 'winter':
          // Hiver : émotions fortes, confort
          genres = [CONTENT_GENRES.ROMANCE, CONTENT_GENRES.FANTASY, CONTENT_GENRES.SLICE_OF_LIFE];
          keywords = ['hiver', 'neige', 'noël', 'nouvel an'];
          break;
          
        default:
          genres = [CONTENT_GENRES.COMEDY, CONTENT_GENRES.DRAMA, CONTENT_GENRES.ACTION];
      }
      
      // Rechercher le contenu adapté
      const content = await searchContent({
        genres,
        keywords,
        limit: limit * 2 // Récupérer plus pour le filtrage
      });
      
      // Filtrer et trier les résultats
      const filteredContent = this._filterAndSortBySeason(content, season);
      
      // Limiter le nombre de résultats
      const limitedContent = filteredContent.slice(0, limit);
      
      // Mettre en cache
      this.contextCache.set(cacheKey, {
        content: limitedContent,
        timestamp: Date.now()
      });
      
      return limitedContent;
    } catch (error) {
      console.error('Erreur lors de la recherche par saison:', error);
      return [];
    }
  }
  
  /**
   * Détermine l'heure de la journée actuelle
   * @returns {string} Moment de la journée (morning, noon, afternoon, evening, night)
   * @private
   */
  _determineTimeOfDay() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 9) {
      return 'morning';
    } else if (hour >= 9 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 14) {
      return 'noon';
    } else if (hour >= 14 && hour < 18) {
      return 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }
  
  /**
   * Détermine le jour de la semaine actuel
   * @returns {string} Jour de la semaine (monday, tuesday, etc.)
   * @private
   */
  _determineDayOfWeek() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }
  
  /**
   * Détermine la saison actuelle
   * @returns {string} Saison (spring, summer, autumn, winter)
   * @private
   */
  _determineSeason() {
    const month = new Date().getMonth(); // 0-11
    
    if (month >= 2 && month < 5) {
      return 'spring';
    } else if (month >= 5 && month < 8) {
      return 'summer';
    } else if (month >= 8 && month < 11) {
      return 'autumn';
    } else {
      return 'winter';
    }
  }
  
  /**
   * Filtre et trie le contenu en fonction de l'heure de la journée
   * @param {Array} content - Liste des contenus à filtrer
   * @param {string} timeOfDay - Moment de la journée
   * @returns {Array} Liste filtrée et triée
   * @private
   */
  _filterAndSortByTimeOfDay(content, timeOfDay) {
    // Attribuer un score à chaque contenu
    const scoredContent = content.map(item => {
      let score = 0.5; // Score de base
      
      // Durée adaptée à l'heure de la journée
      const duration = item.duration || 0;
      
      if (timeOfDay === 'morning' || timeOfDay === 'noon') {
        // Préférer les contenus courts le matin et à midi
        score += duration <= 30 ? 0.3 : duration <= 60 ? 0.1 : -0.1;
      } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
        // Préférer les contenus plus longs le soir et la nuit
        score += duration >= 45 ? 0.2 : 0;
      }
      
      // Genres adaptés à l'heure de la journée
      const genres = item.genres || [];
      
      if (timeOfDay === 'morning') {
        if (genres.includes(CONTENT_GENRES.COMEDY) || genres.includes(CONTENT_GENRES.SLICE_OF_LIFE)) {
          score += 0.2;
        }
      } else if (timeOfDay === 'evening') {
        if (genres.includes(CONTENT_GENRES.DRAMA) || genres.includes(CONTENT_GENRES.ROMANCE)) {
          score += 0.2;
        }
      } else if (timeOfDay === 'night') {
        if (genres.includes(CONTENT_GENRES.THRILLER) || genres.includes(CONTENT_GENRES.HORROR)) {
          score += 0.2;
        }
      }
      
      return {
        ...item,
        contextScore: score
      };
    });
    
    // Trier par score contextuel
    return scoredContent
      .sort((a, b) => b.contextScore - a.contextScore);
  }
  
  /**
   * Filtre et trie le contenu en fonction de l'appareil
   * @param {Array} content - Liste des contenus à filtrer
   * @param {string} deviceType - Type d'appareil
   * @returns {Array} Liste filtrée et triée
   * @private
   */
  _filterAndSortByDevice(content, deviceType) {
    // Attribuer un score à chaque contenu
    const scoredContent = content.map(item => {
      let score = 0.5; // Score de base
      
      // Durée adaptée à l'appareil
      const duration = item.duration || 0;
      
      if (deviceType === 'mobile') {
        // Préférer les contenus courts sur mobile
        score += duration <= 30 ? 0.3 : duration <= 45 ? 0.1 : -0.1;
        
        // Préférer les contenus optimisés pour mobile
        if (item.mobileOptimized) {
          score += 0.2;
        }
      } else if (deviceType === 'tv') {
        // Préférer les contenus plus longs et haute qualité sur TV
        score += duration >= 45 ? 0.2 : 0;
        
        // Préférer la haute qualité
        if (item.quality === 'HD' || item.quality === '4K') {
          score += 0.2;
        }
      }
      
      return {
        ...item,
        contextScore: score
      };
    });
    
    // Trier par score contextuel
    return scoredContent
      .sort((a, b) => b.contextScore - a.contextScore);
  }
  
  /**
   * Filtre et trie le contenu en fonction de la saison
   * @param {Array} content - Liste des contenus à filtrer
   * @param {string} season - Saison
   * @returns {Array} Liste filtrée et triée
   * @private
   */
  _filterAndSortBySeason(content, season) {
    // Attribuer un score à chaque contenu
    const scoredContent = content.map(item => {
      let score = 0.5; // Score de base
      
      // Genres adaptés à la saison
      const genres = item.genres || [];
      
      if (season === 'spring') {
        if (genres.includes(CONTENT_GENRES.ROMANCE) || genres.includes(CONTENT_GENRES.SCHOOL)) {
          score += 0.2;
        }
      } else if (season === 'summer') {
        if (genres.includes(CONTENT_GENRES.ACTION) || genres.includes(CONTENT_GENRES.SPORTS)) {
          score += 0.2;
        }
      } else if (season === 'autumn') {
        if (genres.includes(CONTENT_GENRES.MYSTERY) || genres.includes(CONTENT_GENRES.THRILLER)) {
          score += 0.2;
        }
      } else if (season === 'winter') {
        if (genres.includes(CONTENT_GENRES.FANTASY) || genres.includes(CONTENT_GENRES.ROMANCE)) {
          score += 0.2;
        }
      }
      
      // Vérifier les mots-clés dans le titre ou la description
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      let keywords = [];
      
      switch (season) {
        case 'spring':
          keywords = ['printemps', 'fleurs', 'école', 'jeunesse'];
          break;
        case 'summer':
          keywords = ['été', 'plage', 'vacances', 'aventure'];
          break;
        case 'autumn':
          keywords = ['automne', 'mystère', 'école'];
          break;
        case 'winter':
          keywords = ['hiver', 'neige', 'noël', 'nouvel an'];
          break;
      }
      
      for (const keyword of keywords) {
        if (title.includes(keyword) || description.includes(keyword)) {
          score += 0.1;
        }
      }
      
      return {
        ...item,
        contextScore: score
      };
    });
    
    // Trier par score contextuel
    return scoredContent
      .sort((a, b) => b.contextScore - a.contextScore);
  }
  
  /**
   * Invalide le cache pour un type de contexte spécifique
   * @param {string} contextType - Type de contexte (time, device, season)
   */
  invalidateContextCache(contextType) {
    // Supprimer toutes les entrées de cache pour ce type de contexte
    for (const key of this.contextCache.keys()) {
      if (key.startsWith(`${contextType}:`)) {
        this.contextCache.delete(key);
      }
    }
    console.log(`Cache de recommandations contextuelles invalidé pour ${contextType}`);
  }
  
  /**
   * Invalide tout le cache
   */
  clearCache() {
    this.contextCache.clear();
    console.log('Cache du moteur de recommandations contextuelles vidé');
  }
}

export default ContextualRecommender;
