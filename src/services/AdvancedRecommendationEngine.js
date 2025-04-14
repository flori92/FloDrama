/**
 * Système de recommandation hybride avancé pour FloDrama
 * Ce service combine plusieurs approches de recommandation (contenu, collaborative, contextuelle)
 * pour offrir des suggestions de contenu plus pertinentes que celles de Netflix ou Apple TV.
 */

import { getUserPreferences, getUserHistory } from './userService';
import { getContentMetadata, getContentSimilarity } from './contentService';
import { getCurrentEvents, getSeasonalTrends } from '../utils/contextualData';
import { analyzeUserMood } from '../utils/moodAnalysis';
import { diversifyRecommendations } from '../utils/diversityEngine';

class AdvancedRecommendationEngine {
  constructor() {
    // Pondération des différentes approches de recommandation
    this.contentBasedWeight = 0.4;
    this.collaborativeWeight = 0.3;
    this.contextualWeight = 0.3;
    
    // Configuration des seuils
    this.similarityThreshold = 0.65;
    this.noveltyFactor = 0.2;
    this.diversityFactor = 0.25;
    this.recencyBoost = 0.15;
    
    // Identité visuelle FloDrama
    this.flodramaStyle = {
      primaryBlue: '#3b82f6',
      primaryFuchsia: '#d946ef',
      backgroundDark: '#121118',
      backgroundSecondary: '#1A1926',
      gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
      cornerRadius: '8px',
      transitionDuration: '0.3s'
    };
    
    // Configuration des catégories de contenu
    this.contentCategories = {
      drama: { weight: 1.0 },
      anime: { weight: 1.0 },
      movie: { weight: 1.0 },
      bollywood: { weight: 1.0 }
    };
    
    // Configuration des règles de diversité
    this.diversityRules = {
      maxSameGenre: 3,
      maxSameOrigin: 4,
      minGenres: 3,
      minOrigins: 2
    };
  }
  
  /**
   * Génère des recommandations personnalisées pour un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} currentContext - Contexte actuel (heure, saison, localisation, etc.)
   * @returns {Promise<Array>} - Liste des recommandations
   */
  async generateRecommendations(userId, currentContext) {
    try {
      // Récupération des recommandations basées sur le contenu
      const contentRecs = await this.contentBasedRecommendations(userId);
      
      // Récupération des recommandations collaboratives
      const collabRecs = await this.collaborativeRecommendations(userId);
      
      // Récupération des recommandations contextuelles
      const contextRecs = await this.contextualRecommendations(userId, currentContext);
      
      // Détection de l'humeur de l'utilisateur
      const userMood = await this.detectUserMood(userId, currentContext);
      
      // Fusion intelligente des recommandations
      const fusedRecs = await this.hybridFusion(
        contentRecs,
        collabRecs,
        contextRecs,
        userMood
      );
      
      // Application des règles de diversité
      const diversifiedRecs = await this.applyDiversityRules(fusedRecs);
      
      // Enrichissement des métadonnées des recommandations
      return await this.enrichRecommendations(diversifiedRecs);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      // En cas d'erreur, retourner des recommandations par défaut
      return this.getDefaultRecommendations();
    }
  }
  
  /**
   * Génère des recommandations basées sur le contenu
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} - Liste des recommandations basées sur le contenu
   */
  async contentBasedRecommendations(userId) {
    try {
      // Récupération des préférences et de l'historique de l'utilisateur
      const userPreferences = await getUserPreferences(userId);
      const userHistory = await getUserHistory(userId);
      
      // Extraction des contenus consultés récemment
      const recentlyWatched = userHistory.filter(item => item.progress > 0.1)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      // Récupération des métadonnées des contenus récents
      const recentContentsMetadata = await Promise.all(
        recentlyWatched.map(item => getContentMetadata(item.contentId))
      );
      
      // Extraction des caractéristiques pertinentes
      const relevantFeatures = this.extractRelevantFeatures(recentContentsMetadata, userPreferences);
      
      // Recherche de contenus similaires
      const similarContents = await this.findSimilarContents(relevantFeatures);
      
      // Filtrage des contenus déjà vus
      const watchedContentIds = userHistory.map(item => item.contentId);
      const filteredRecommendations = similarContents.filter(
        content => !watchedContentIds.includes(content.id)
      );
      
      // Calcul des scores de recommandation
      return filteredRecommendations.map(content => ({
        id: content.id,
        title: content.title,
        type: content.type,
        score: content.similarity,
        reason: 'Basé sur vos goûts',
        source: 'content-based'
      }));
    } catch (error) {
      console.error('Erreur lors des recommandations basées sur le contenu:', error);
      return [];
    }
  }
  
  /**
   * Extrait les caractéristiques pertinentes des contenus
   * @param {Array} contentsMetadata - Métadonnées des contenus
   * @param {Object} userPreferences - Préférences de l'utilisateur
   * @returns {Object} - Caractéristiques pertinentes
   */
  extractRelevantFeatures(contentsMetadata, userPreferences) {
    // Initialisation des compteurs de caractéristiques
    const genreCounts = {};
    const actorCounts = {};
    const directorCounts = {};
    const originCounts = {};
    const themeCounts = {};
    
    // Analyse des métadonnées des contenus
    contentsMetadata.forEach(content => {
      // Comptage des genres
      if (content.genres) {
        content.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
      
      // Comptage des acteurs
      if (content.cast) {
        content.cast.forEach(actor => {
          actorCounts[actor] = (actorCounts[actor] || 0) + 1;
        });
      }
      
      // Comptage des réalisateurs
      if (content.directors) {
        content.directors.forEach(director => {
          directorCounts[director] = (directorCounts[director] || 0) + 1;
        });
      }
      
      // Comptage des origines
      if (content.origin) {
        originCounts[content.origin] = (originCounts[content.origin] || 0) + 1;
      }
      
      // Comptage des thèmes
      if (content.themes) {
        content.themes.forEach(theme => {
          themeCounts[theme.name] = (themeCounts[theme.name] || 0) + 1;
        });
      }
    });
    
    // Normalisation des compteurs
    const totalContents = contentsMetadata.length;
    
    const normalizeCounter = counter => {
      const normalized = {};
      Object.entries(counter).forEach(([key, count]) => {
        normalized[key] = count / totalContents;
      });
      return normalized;
    };
    
    // Intégration des préférences explicites de l'utilisateur
    const boostFromPreferences = (counter, preferenceCategory) => {
      const boosted = { ...counter };
      if (userPreferences && userPreferences[preferenceCategory]) {
        Object.entries(userPreferences[preferenceCategory]).forEach(([key, value]) => {
          if (boosted[key]) {
            boosted[key] += value * 0.5; // Boost basé sur les préférences explicites
          } else {
            boosted[key] = value * 0.3;
          }
        });
      }
      return boosted;
    };
    
    // Caractéristiques normalisées et boostées
    return {
      genres: boostFromPreferences(normalizeCounter(genreCounts), 'preferredGenres'),
      actors: boostFromPreferences(normalizeCounter(actorCounts), 'preferredActors'),
      directors: boostFromPreferences(normalizeCounter(directorCounts), 'preferredDirectors'),
      origins: boostFromPreferences(normalizeCounter(originCounts), 'preferredOrigins'),
      themes: normalizeCounter(themeCounts)
    };
  }
  
  /**
   * Recherche des contenus similaires aux préférences de l'utilisateur
   * @param {Object} relevantFeatures - Caractéristiques pertinentes
   * @returns {Promise<Array>} - Contenus similaires
   */
  async findSimilarContents(relevantFeatures) {
    try {
      // Récupération des contenus similaires via le service de contenu
      const similarContents = await getContentSimilarity(relevantFeatures);
      
      // Filtrage des contenus selon le seuil de similarité
      return similarContents
        .filter(content => content.similarity >= this.similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Erreur lors de la recherche de contenus similaires:', error);
      return [];
    }
  }
  
  /**
   * Génère des recommandations collaboratives
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} - Liste des recommandations collaboratives
   */
  async collaborativeRecommendations(userId) {
    try {
      // Récupération de l'historique de l'utilisateur
      const userHistory = await getUserHistory(userId);
      
      // Extraction des contenus appréciés par l'utilisateur
      const likedContents = userHistory
        .filter(item => item.rating >= 4 || item.progress > 0.7)
        .map(item => item.contentId);
      
      if (likedContents.length === 0) {
        return [];
      }
      
      // Récupération des utilisateurs similaires
      const similarUsers = await this.findSimilarUsers(userId, likedContents);
      
      // Récupération des contenus appréciés par les utilisateurs similaires
      const recommendedContents = await this.getRecommendedFromSimilarUsers(similarUsers, likedContents);
      
      // Calcul des scores de recommandation
      return recommendedContents.map(content => ({
        id: content.id,
        title: content.title,
        type: content.type,
        score: content.collaborativeScore,
        reason: 'Populaire auprès d\'utilisateurs aux goûts similaires',
        source: 'collaborative'
      }));
    } catch (error) {
      console.error('Erreur lors des recommandations collaboratives:', error);
      return [];
    }
  }
  
  /**
   * Recherche des utilisateurs aux goûts similaires
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Array} likedContents - Contenus appréciés par l'utilisateur
   * @returns {Promise<Array>} - Utilisateurs similaires
   */
  async findSimilarUsers(userId, likedContents) {
    // Simulation de recherche d'utilisateurs similaires
    // Dans une implémentation réelle, cela impliquerait une requête à la base de données
    return [
      { id: 'user123', similarity: 0.85 },
      { id: 'user456', similarity: 0.78 },
      { id: 'user789', similarity: 0.72 }
    ];
  }
  
  /**
   * Récupère les contenus recommandés par des utilisateurs similaires
   * @param {Array} similarUsers - Utilisateurs similaires
   * @param {Array} alreadyLikedContents - Contenus déjà appréciés par l'utilisateur
   * @returns {Promise<Array>} - Contenus recommandés
   */
  async getRecommendedFromSimilarUsers(similarUsers, alreadyLikedContents) {
    // Simulation de récupération de contenus recommandés
    // Dans une implémentation réelle, cela impliquerait une requête à la base de données
    return [
      { id: 'content123', title: 'Drama A', type: 'drama', collaborativeScore: 0.92 },
      { id: 'content456', title: 'Anime B', type: 'anime', collaborativeScore: 0.87 },
      { id: 'content789', title: 'Film C', type: 'movie', collaborativeScore: 0.81 }
    ].filter(content => !alreadyLikedContents.includes(content.id));
  }
  
  /**
   * Génère des recommandations contextuelles
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} currentContext - Contexte actuel
   * @returns {Promise<Array>} - Liste des recommandations contextuelles
   */
  async contextualRecommendations(userId, currentContext) {
    try {
      // Extraction des informations contextuelles
      const { time, date, season, location, device, previousActivity } = currentContext;
      
      // Récupération des événements actuels
      const currentEvents = await getCurrentEvents(date, location);
      
      // Récupération des tendances saisonnières
      const seasonalTrends = await getSeasonalTrends(season, location);
      
      // Adaptation au moment de la journée
      const timeOfDay = this.getTimeOfDay(time);
      
      // Récupération des recommandations contextuelles
      const contextualContents = await this.getContextualContents(
        timeOfDay,
        seasonalTrends,
        currentEvents,
        device,
        previousActivity
      );
      
      // Calcul des scores de recommandation
      return contextualContents.map(content => ({
        id: content.id,
        title: content.title,
        type: content.type,
        score: content.contextualScore,
        reason: content.contextualReason,
        source: 'contextual'
      }));
    } catch (error) {
      console.error('Erreur lors des recommandations contextuelles:', error);
      return [];
    }
  }
  
  /**
   * Détermine le moment de la journée
   * @param {string} time - Heure actuelle
   * @returns {string} - Moment de la journée
   */
  getTimeOfDay(time) {
    const hour = parseInt(time.split(':')[0], 10);
    
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }
  
  /**
   * Récupère des contenus adaptés au contexte
   * @param {string} timeOfDay - Moment de la journée
   * @param {Array} seasonalTrends - Tendances saisonnières
   * @param {Array} currentEvents - Événements actuels
   * @param {string} device - Appareil utilisé
   * @param {string} previousActivity - Activité précédente
   * @returns {Promise<Array>} - Contenus contextuels
   */
  async getContextualContents(timeOfDay, seasonalTrends, currentEvents, device, previousActivity) {
    // Simulation de récupération de contenus contextuels
    // Dans une implémentation réelle, cela impliquerait une requête à la base de données
    
    const contextualContents = [];
    
    // Recommandations basées sur le moment de la journée
    if (timeOfDay === 'morning') {
      contextualContents.push({
        id: 'content101',
        title: 'Drama du matin',
        type: 'drama',
        contextualScore: 0.85,
        contextualReason: 'Parfait pour commencer la journée'
      });
    } else if (timeOfDay === 'night') {
      contextualContents.push({
        id: 'content102',
        title: 'Anime de soirée',
        type: 'anime',
        contextualScore: 0.88,
        contextualReason: 'Idéal pour se détendre en fin de journée'
      });
    }
    
    // Recommandations basées sur les tendances saisonnières
    seasonalTrends.forEach(trend => {
      contextualContents.push({
        id: `content_seasonal_${trend.id}`,
        title: trend.title,
        type: trend.type,
        contextualScore: 0.8 + (Math.random() * 0.15),
        contextualReason: `Tendance cette saison: ${trend.reason}`
      });
    });
    
    // Recommandations basées sur les événements actuels
    currentEvents.forEach(event => {
      contextualContents.push({
        id: `content_event_${event.id}`,
        title: event.relatedContent.title,
        type: event.relatedContent.type,
        contextualScore: 0.75 + (Math.random() * 0.2),
        contextualReason: `En lien avec l'actualité: ${event.name}`
      });
    });
    
    // Adaptation à l'appareil
    if (device === 'mobile') {
      contextualContents.push({
        id: 'content103',
        title: 'Épisodes courts',
        type: 'drama',
        contextualScore: 0.82,
        contextualReason: 'Format court idéal pour mobile'
      });
    } else if (device === 'tv') {
      contextualContents.push({
        id: 'content104',
        title: 'Film épique',
        type: 'movie',
        contextualScore: 0.9,
        contextualReason: 'Expérience cinématographique pour grand écran'
      });
    }
    
    return contextualContents.sort((a, b) => b.contextualScore - a.contextualScore);
  }
  
  /**
   * Détecte l'humeur de l'utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} currentContext - Contexte actuel
   * @returns {Promise<Object>} - Humeur détectée
   */
  async detectUserMood(userId, currentContext) {
    try {
      // Récupération de l'historique récent
      const recentHistory = await getUserHistory(userId, { limit: 5 });
      
      // Analyse de l'humeur basée sur l'historique et le contexte
      const moodAnalysis = await analyzeUserMood(recentHistory, currentContext);
      
      return {
        primaryMood: moodAnalysis.primaryMood,
        intensity: moodAnalysis.intensity,
        confidence: moodAnalysis.confidence
      };
    } catch (error) {
      console.error('Erreur lors de la détection de l\'humeur:', error);
      return {
        primaryMood: 'neutral',
        intensity: 0.5,
        confidence: 0.3
      };
    }
  }
  
  /**
   * Fusionne les différentes recommandations en une liste cohérente
   * @param {Array} contentRecs - Recommandations basées sur le contenu
   * @param {Array} collabRecs - Recommandations collaboratives
   * @param {Array} contextRecs - Recommandations contextuelles
   * @param {Object} userMood - Humeur de l'utilisateur
   * @returns {Promise<Array>} - Recommandations fusionnées
   */
  async hybridFusion(contentRecs, collabRecs, contextRecs, userMood) {
    try {
      // Création d'une map pour fusionner les recommandations
      const recommendationsMap = new Map();
      
      // Ajustement des poids selon l'humeur de l'utilisateur
      const adjustedWeights = this.adjustWeightsByMood(userMood);
      
      // Traitement des recommandations basées sur le contenu
      contentRecs.forEach(rec => {
        recommendationsMap.set(rec.id, {
          ...rec,
          finalScore: rec.score * adjustedWeights.contentBasedWeight
        });
      });
      
      // Traitement des recommandations collaboratives
      collabRecs.forEach(rec => {
        if (recommendationsMap.has(rec.id)) {
          // Fusion avec une recommandation existante
          const existingRec = recommendationsMap.get(rec.id);
          existingRec.finalScore += rec.score * adjustedWeights.collaborativeWeight;
          existingRec.reasons = existingRec.reasons || [existingRec.reason];
          existingRec.reasons.push(rec.reason);
        } else {
          // Nouvelle recommandation
          recommendationsMap.set(rec.id, {
            ...rec,
            finalScore: rec.score * adjustedWeights.collaborativeWeight
          });
        }
      });
      
      // Traitement des recommandations contextuelles
      contextRecs.forEach(rec => {
        if (recommendationsMap.has(rec.id)) {
          // Fusion avec une recommandation existante
          const existingRec = recommendationsMap.get(rec.id);
          existingRec.finalScore += rec.score * adjustedWeights.contextualWeight;
          existingRec.reasons = existingRec.reasons || [existingRec.reason];
          existingRec.reasons.push(rec.reason);
        } else {
          // Nouvelle recommandation
          recommendationsMap.set(rec.id, {
            ...rec,
            finalScore: rec.score * adjustedWeights.contextualWeight
          });
        }
      });
      
      // Conversion de la map en tableau et tri par score final
      const fusedRecommendations = Array.from(recommendationsMap.values())
        .sort((a, b) => b.finalScore - a.finalScore);
      
      // Sélection de la raison principale pour chaque recommandation
      return fusedRecommendations.map(rec => ({
        ...rec,
        reason: rec.reasons ? this.selectMainReason(rec.reasons) : rec.reason
      }));
    } catch (error) {
      console.error('Erreur lors de la fusion des recommandations:', error);
      return [...contentRecs, ...collabRecs, ...contextRecs]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    }
  }
  
  /**
   * Ajuste les poids des recommandations selon l'humeur de l'utilisateur
   * @param {Object} userMood - Humeur de l'utilisateur
   * @returns {Object} - Poids ajustés
   */
  adjustWeightsByMood(userMood) {
    const weights = {
      contentBasedWeight: this.contentBasedWeight,
      collaborativeWeight: this.collaborativeWeight,
      contextualWeight: this.contextualWeight
    };
    
    // Ajustement selon l'humeur principale
    switch (userMood.primaryMood) {
      case 'happy':
        // Favoriser les recommandations collaboratives
        weights.collaborativeWeight += 0.1;
        weights.contentBasedWeight -= 0.05;
        weights.contextualWeight -= 0.05;
        break;
      case 'sad':
        // Favoriser les recommandations basées sur le contenu (plus familier)
        weights.contentBasedWeight += 0.15;
        weights.collaborativeWeight -= 0.1;
        weights.contextualWeight -= 0.05;
        break;
      case 'curious':
        // Favoriser les recommandations contextuelles
        weights.contextualWeight += 0.15;
        weights.contentBasedWeight -= 0.1;
        weights.collaborativeWeight -= 0.05;
        break;
      case 'bored':
        // Favoriser la nouveauté
        weights.contextualWeight += 0.2;
        weights.contentBasedWeight -= 0.15;
        weights.collaborativeWeight -= 0.05;
        break;
      default:
        // Pas d'ajustement pour les autres humeurs
        break;
    }
    
    // Ajustement selon l'intensité de l'humeur
    const intensityFactor = userMood.intensity * userMood.confidence;
    
    // Normalisation des poids
    const totalWeight = weights.contentBasedWeight + weights.collaborativeWeight + weights.contextualWeight;
    
    return {
      contentBasedWeight: weights.contentBasedWeight / totalWeight,
      collaborativeWeight: weights.collaborativeWeight / totalWeight,
      contextualWeight: weights.contextualWeight / totalWeight
    };
  }
  
  /**
   * Sélectionne la raison principale parmi plusieurs raisons
   * @param {Array} reasons - Liste des raisons
   * @returns {string} - Raison principale
   */
  selectMainReason(reasons) {
    // Priorisation des raisons contextuelles
    const contextualReasons = reasons.filter(reason => 
      reason.includes('saison') || 
      reason.includes('actualité') || 
      reason.includes('journée') ||
      reason.includes('Parfait pour') ||
      reason.includes('Idéal pour')
    );
    
    if (contextualReasons.length > 0) {
      return contextualReasons[0];
    }
    
    // Priorisation des raisons collaboratives
    const collaborativeReasons = reasons.filter(reason => 
      reason.includes('Populaire') || 
      reason.includes('utilisateurs')
    );
    
    if (collaborativeReasons.length > 0) {
      return collaborativeReasons[0];
    }
    
    // Par défaut, retourner la première raison
    return reasons[0];
  }
  
  /**
   * Applique des règles de diversité aux recommandations
   * @param {Array} recommendations - Liste des recommandations
   * @returns {Promise<Array>} - Recommandations diversifiées
   */
  async applyDiversityRules(recommendations) {
    try {
      // Utilisation du service de diversification
      return await diversifyRecommendations(
        recommendations,
        this.diversityRules
      );
    } catch (error) {
      console.error('Erreur lors de l\'application des règles de diversité:', error);
      return recommendations;
    }
  }
  
  /**
   * Enrichit les métadonnées des recommandations
   * @param {Array} recommendations - Liste des recommandations
   * @returns {Promise<Array>} - Recommandations enrichies
   */
  async enrichRecommendations(recommendations) {
    try {
      // Récupération des métadonnées complètes pour chaque recommandation
      const enrichedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          const metadata = await getContentMetadata(rec.id);
          
          return {
            ...rec,
            ...metadata,
            reason: rec.reason
          };
        })
      );
      
      return enrichedRecommendations;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des recommandations:', error);
      return recommendations;
    }
  }
  
  /**
   * Récupère des recommandations par défaut
   * @returns {Array} - Recommandations par défaut
   */
  getDefaultRecommendations() {
    return [
      {
        id: 'default1',
        title: 'Crash Landing on You',
        type: 'drama',
        score: 0.95,
        reason: 'Drama coréen populaire'
      },
      {
        id: 'default2',
        title: 'Demon Slayer',
        type: 'anime',
        score: 0.92,
        reason: 'Anime très apprécié'
      },
      {
        id: 'default3',
        title: 'Parasite',
        type: 'movie',
        score: 0.9,
        reason: 'Film primé internationalement'
      }
    ];
  }
}

export default AdvancedRecommendationEngine;
