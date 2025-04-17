import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les évaluations (likes/dislikes) des contenus
 * @returns {Object} Fonctions et états pour gérer les évaluations
 */
const useRatings = () => {
  const [ratings, setRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Charger les évaluations depuis le localStorage au démarrage
  useEffect(() => {
    const loadRatings = () => {
      try {
        const savedRatings = localStorage.getItem('flodrama_ratings');
        if (savedRatings) {
          setRatings(JSON.parse(savedRatings));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des évaluations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, []);

  // Sauvegarder les évaluations dans le localStorage à chaque modification
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('flodrama_ratings', JSON.stringify(ratings));
    }
  }, [ratings, isLoading]);

  /**
   * Vérifier si un contenu est aimé
   * @param {string} id - ID du contenu
   * @returns {boolean} true si le contenu est aimé, false sinon
   */
  const isLiked = useCallback((id) => {
    return ratings[id] === 'like';
  }, [ratings]);

  /**
   * Vérifier si un contenu est non aimé
   * @param {string} id - ID du contenu
   * @returns {boolean} true si le contenu n'est pas aimé, false sinon
   */
  const isDisliked = useCallback((id) => {
    return ratings[id] === 'dislike';
  }, [ratings]);

  /**
   * Obtenir l'évaluation d'un contenu
   * @param {string} id - ID du contenu
   * @returns {string|null} 'like', 'dislike' ou null si pas d'évaluation
   */
  const getRating = useCallback((id) => {
    return ratings[id] || null;
  }, [ratings]);

  /**
   * Aimer un contenu
   * @param {string} id - ID du contenu
   */
  const likeContent = useCallback((id) => {
    setRatings(prev => {
      // Si déjà aimé, on retire l'évaluation
      if (prev[id] === 'like') {
        const newRatings = { ...prev };
        delete newRatings[id];
        return newRatings;
      }
      // Sinon on ajoute/modifie l'évaluation
      return { ...prev, [id]: 'like' };
    });
  }, []);

  /**
   * Ne pas aimer un contenu
   * @param {string} id - ID du contenu
   */
  const dislikeContent = useCallback((id) => {
    setRatings(prev => {
      // Si déjà non aimé, on retire l'évaluation
      if (prev[id] === 'dislike') {
        const newRatings = { ...prev };
        delete newRatings[id];
        return newRatings;
      }
      // Sinon on ajoute/modifie l'évaluation
      return { ...prev, [id]: 'dislike' };
    });
  }, []);

  /**
   * Obtenir tous les contenus aimés
   * @returns {Array<string>} Liste des IDs des contenus aimés
   */
  const getLikedContentIds = useCallback(() => {
    return Object.entries(ratings)
      .filter(([_, value]) => value === 'like')
      .map(([id]) => id);
  }, [ratings]);

  /**
   * Obtenir tous les contenus non aimés
   * @returns {Array<string>} Liste des IDs des contenus non aimés
   */
  const getDislikedContentIds = useCallback(() => {
    return Object.entries(ratings)
      .filter(([_, value]) => value === 'dislike')
      .map(([id]) => id);
  }, [ratings]);

  /**
   * Calculer un score de similarité entre deux contenus
   * @param {Object} item1 - Premier contenu
   * @param {Object} item2 - Second contenu
   * @returns {number} Score de similarité (0-1)
   */
  const calculateSimilarity = useCallback((item1, item2) => {
    if (!item1 || !item2) return 0;
    
    let score = 0;
    let factors = 0;
    
    // Similarité des genres
    if (item1.genres && item2.genres) {
      const commonGenres = item1.genres.filter(g => item2.genres.includes(g));
      if (commonGenres.length > 0) {
        score += commonGenres.length / Math.max(item1.genres.length, item2.genres.length);
        factors++;
      }
    }
    
    // Similarité des tags
    if (item1.tags && item2.tags) {
      const commonTags = item1.tags.filter(t => item2.tags.includes(t));
      if (commonTags.length > 0) {
        score += commonTags.length / Math.max(item1.tags.length, item2.tags.length);
        factors++;
      }
    }
    
    // Même pays
    if (item1.country && item2.country && item1.country === item2.country) {
      score += 1;
      factors++;
    }
    
    // Même année (ou proche)
    if (item1.year && item2.year) {
      const yearDiff = Math.abs(item1.year - item2.year);
      if (yearDiff <= 5) {
        score += 1 - (yearDiff / 5);
        factors++;
      }
    }
    
    // Même réalisateur
    if (item1.director && item2.director && item1.director === item2.director) {
      score += 1;
      factors++;
    }
    
    return factors > 0 ? score / factors : 0;
  }, []);

  return {
    isLoading,
    isLiked,
    isDisliked,
    getRating,
    likeContent,
    dislikeContent,
    getLikedContentIds,
    getDislikedContentIds,
    calculateSimilarity
  };
};

export { useRatings };
