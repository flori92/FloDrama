/**
 * Moteur de similarité de contenu pour FloDrama
 * Permet de trouver des contenus similaires basés sur différents critères
 */

import { getContentDetails, searchContent } from '../../api/ContentService';
import { THRESHOLDS, CONTENT_TYPES } from '../constants';

class ContentSimilarityEngine {
  constructor() {
    // Cache pour les résultats de recherche fréquents
    this.contentCache = new Map();
    
    console.log('Moteur de similarité de contenu FloDrama initialisé');
  }
  
  /**
   * Trouve du contenu similaire à un contenu de référence
   * @param {string|Object} reference - ID du contenu ou objet contenu de référence
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} Liste des contenus similaires
   */
  async findSimilarContent(reference, options = {}) {
    try {
      // Si reference est un ID, récupérer les détails du contenu
      const referenceContent = typeof reference === 'string'
        ? await this._getContentWithCache(reference)
        : reference;
      
      if (!referenceContent) {
        throw new Error(`Contenu de référence non trouvé: ${reference}`);
      }
      
      // Extraire les caractéristiques du contenu de référence
      const { genres, actors, director, country, year } = referenceContent;
      
      // Construire les critères de recherche
      const searchCriteria = {
        genres: genres || [],
        actors: actors || [],
        director: director,
        country: country,
        yearRange: year ? [year - 3, year + 3] : null,
        excludeIds: [referenceContent.id], // Exclure le contenu de référence
        limit: options.limit || 10
      };
      
      // Rechercher du contenu similaire
      const similarContent = await this._searchSimilarContent(searchCriteria);
      
      // Calculer les scores de similarité
      const scoredContent = this._calculateSimilarityScores(similarContent, referenceContent);
      
      // Filtrer par seuil de similarité
      const filteredContent = scoredContent.filter(item => 
        item.similarityScore >= THRESHOLDS.SIMILARITY
      );
      
      // Trier par score de similarité
      return filteredContent
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, options.limit || 10);
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu similaire:', error);
      throw error;
    }
  }
  
  /**
   * Récupère du contenu par genres
   * @param {Array} genres - Liste des genres
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus correspondants
   */
  async getContentByGenres(genres, limit = 10) {
    if (!genres || genres.length === 0) {
      return [];
    }
    
    try {
      // Construire la clé de cache
      const cacheKey = `genres:${genres.sort().join(',')}:${limit}`;
      
      // Vérifier le cache
      if (this.contentCache.has(cacheKey)) {
        const cachedData = this.contentCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          return cachedData.content;
        }
      }
      
      // Rechercher le contenu
      const content = await searchContent({
        genres,
        limit: limit * 2 // Récupérer plus pour le filtrage
      });
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error('Erreur lors de la recherche par genres:', error);
      return [];
    }
  }
  
  /**
   * Récupère du contenu par acteurs
   * @param {Array} actors - Liste des acteurs
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus correspondants
   */
  async getContentByActors(actors, limit = 10) {
    if (!actors || actors.length === 0) {
      return [];
    }
    
    try {
      // Construire la clé de cache
      const cacheKey = `actors:${actors.sort().join(',')}:${limit}`;
      
      // Vérifier le cache
      if (this.contentCache.has(cacheKey)) {
        const cachedData = this.contentCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          return cachedData.content;
        }
      }
      
      // Rechercher le contenu pour chaque acteur
      const contentPromises = actors.map(actor => 
        searchContent({
          actors: [actor],
          limit: Math.ceil(limit / actors.length) + 2
        })
      );
      
      const contentResults = await Promise.all(contentPromises);
      
      // Fusionner et dédupliquer les résultats
      const mergedContent = this._mergeAndDeduplicate(contentResults.flat());
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content: mergedContent,
        timestamp: Date.now()
      });
      
      return mergedContent.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche par acteurs:', error);
      return [];
    }
  }
  
  /**
   * Récupère du contenu par réalisateurs
   * @param {Array} directors - Liste des réalisateurs
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus correspondants
   */
  async getContentByDirectors(directors, limit = 10) {
    if (!directors || directors.length === 0) {
      return [];
    }
    
    try {
      // Construire la clé de cache
      const cacheKey = `directors:${directors.sort().join(',')}:${limit}`;
      
      // Vérifier le cache
      if (this.contentCache.has(cacheKey)) {
        const cachedData = this.contentCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          return cachedData.content;
        }
      }
      
      // Rechercher le contenu pour chaque réalisateur
      const contentPromises = directors.map(director => 
        searchContent({
          director,
          limit: Math.ceil(limit / directors.length) + 2
        })
      );
      
      const contentResults = await Promise.all(contentPromises);
      
      // Fusionner et dédupliquer les résultats
      const mergedContent = this._mergeAndDeduplicate(contentResults.flat());
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content: mergedContent,
        timestamp: Date.now()
      });
      
      return mergedContent.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche par réalisateurs:', error);
      return [];
    }
  }
  
  /**
   * Récupère du contenu populaire
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus populaires
   */
  async getPopularContent(limit = 10) {
    try {
      // Construire la clé de cache
      const cacheKey = `popular:${limit}`;
      
      // Vérifier le cache
      if (this.contentCache.has(cacheKey)) {
        const cachedData = this.contentCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 1800000) { // Cache valide pour 30 minutes
          return cachedData.content;
        }
      }
      
      // Rechercher le contenu populaire
      const content = await searchContent({
        sort: 'popularity',
        limit
      });
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu populaire:', error);
      return [];
    }
  }
  
  /**
   * Récupère du contenu récent
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des contenus récents
   */
  async getRecentContent(limit = 10) {
    try {
      // Construire la clé de cache
      const cacheKey = `recent:${limit}`;
      
      // Vérifier le cache
      if (this.contentCache.has(cacheKey)) {
        const cachedData = this.contentCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 1800000) { // Cache valide pour 30 minutes
          return cachedData.content;
        }
      }
      
      // Rechercher le contenu récent
      const content = await searchContent({
        sort: 'releaseDate',
        limit
      });
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu récent:', error);
      return [];
    }
  }
  
  /**
   * Récupère les détails d'un contenu avec cache
   * @param {string} contentId - ID du contenu
   * @returns {Promise<Object>} Détails du contenu
   * @private
   */
  async _getContentWithCache(contentId) {
    // Construire la clé de cache
    const cacheKey = `content:${contentId}`;
    
    // Vérifier le cache
    if (this.contentCache.has(cacheKey)) {
      const cachedData = this.contentCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 86400000) { // Cache valide pour 24 heures
        return cachedData.content;
      }
    }
    
    try {
      // Récupérer les détails du contenu
      const content = await getContentDetails(contentId);
      
      // Mettre en cache
      this.contentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu ${contentId}:`, error);
      return null;
    }
  }
  
  /**
   * Recherche du contenu similaire selon des critères
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Array>} Liste des contenus correspondants
   * @private
   */
  async _searchSimilarContent(criteria) {
    const { genres, actors, director, country, yearRange, excludeIds, limit } = criteria;
    
    // Préparer les critères de recherche
    const searchParams = {};
    
    if (genres && genres.length > 0) {
      searchParams.genres = genres;
    }
    
    if (actors && actors.length > 0) {
      searchParams.actors = actors.slice(0, 3); // Limiter à 3 acteurs
    }
    
    if (director) {
      searchParams.director = director;
    }
    
    if (country) {
      searchParams.country = country;
    }
    
    if (yearRange) {
      searchParams.yearRange = yearRange;
    }
    
    if (excludeIds && excludeIds.length > 0) {
      searchParams.excludeIds = excludeIds;
    }
    
    searchParams.limit = limit * 2; // Récupérer plus pour le filtrage
    
    try {
      // Effectuer la recherche
      return await searchContent(searchParams);
    } catch (error) {
      console.error('Erreur lors de la recherche de contenu similaire:', error);
      return [];
    }
  }
  
  /**
   * Calcule les scores de similarité pour une liste de contenus
   * @param {Array} contentList - Liste des contenus à évaluer
   * @param {Object} referenceContent - Contenu de référence
   * @returns {Array} Liste des contenus avec scores de similarité
   * @private
   */
  _calculateSimilarityScores(contentList, referenceContent) {
    return contentList.map(content => {
      let similarityScore = 0;
      let matchCount = 0;
      let totalFactors = 0;
      
      // Similarité des genres
      const referenceGenres = referenceContent.genres || [];
      const contentGenres = content.genres || [];
      
      if (referenceGenres.length > 0 && contentGenres.length > 0) {
        totalFactors++;
        const commonGenres = contentGenres.filter(genre => referenceGenres.includes(genre));
        const genreSimilarity = commonGenres.length / Math.max(referenceGenres.length, contentGenres.length);
        similarityScore += genreSimilarity;
        
        if (genreSimilarity > 0.5) {
          matchCount++;
        }
      }
      
      // Similarité des acteurs
      const referenceActors = referenceContent.actors || [];
      const contentActors = content.actors || [];
      
      if (referenceActors.length > 0 && contentActors.length > 0) {
        totalFactors++;
        const commonActors = contentActors.filter(actor => referenceActors.includes(actor));
        const actorSimilarity = commonActors.length / Math.min(3, Math.max(referenceActors.length, contentActors.length));
        similarityScore += actorSimilarity;
        
        if (actorSimilarity > 0.3) {
          matchCount++;
        }
      }
      
      // Similarité du réalisateur
      if (referenceContent.director && content.director) {
        totalFactors++;
        const directorSimilarity = referenceContent.director === content.director ? 1 : 0;
        similarityScore += directorSimilarity;
        
        if (directorSimilarity > 0) {
          matchCount++;
        }
      }
      
      // Similarité du pays
      if (referenceContent.country && content.country) {
        totalFactors++;
        const countrySimilarity = referenceContent.country === content.country ? 1 : 0;
        similarityScore += countrySimilarity * 0.7; // Poids plus faible pour le pays
        
        if (countrySimilarity > 0) {
          matchCount++;
        }
      }
      
      // Similarité de l'année
      if (referenceContent.year && content.year) {
        totalFactors++;
        const yearDiff = Math.abs(referenceContent.year - content.year);
        const yearSimilarity = yearDiff <= 3 ? 1 - (yearDiff / 10) : 0;
        similarityScore += yearSimilarity * 0.5; // Poids plus faible pour l'année
        
        if (yearSimilarity > 0.7) {
          matchCount++;
        }
      }
      
      // Normaliser le score
      const normalizedScore = totalFactors > 0 ? similarityScore / totalFactors : 0;
      
      // Bonus pour les correspondances multiples
      const matchBonus = matchCount >= 2 ? 0.1 : 0;
      
      // Score final
      const finalScore = Math.min(1, normalizedScore + matchBonus);
      
      return {
        ...content,
        similarityScore: finalScore,
        matchCount
      };
    });
  }
  
  /**
   * Fusionne et déduplique plusieurs listes de contenu
   * @param {Array} contentLists - Listes de contenu à fusionner
   * @returns {Array} Liste fusionnée et dédupliquée
   * @private
   */
  _mergeAndDeduplicate(contentList) {
    const uniqueContent = [];
    const seenIds = new Set();
    
    for (const content of contentList) {
      if (!seenIds.has(content.id)) {
        seenIds.add(content.id);
        uniqueContent.push(content);
      }
    }
    
    return uniqueContent;
  }
  
  /**
   * Invalide le cache pour un contenu spécifique
   * @param {string} contentId - ID du contenu à invalider
   */
  invalidateContentCache(contentId) {
    const cacheKey = `content:${contentId}`;
    this.contentCache.delete(cacheKey);
  }
  
  /**
   * Invalide tout le cache
   */
  clearCache() {
    this.contentCache.clear();
    console.log('Cache du moteur de similarité vidé');
  }
}

export default ContentSimilarityEngine;
