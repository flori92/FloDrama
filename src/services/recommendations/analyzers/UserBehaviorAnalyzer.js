/**
 * Analyseur de comportement utilisateur pour FloDrama
 * Analyse les habitudes de visionnage et les préférences implicites des utilisateurs
 */

import { USER_EVENTS, THRESHOLDS, CONTENT_GENRES } from '../constants';

class UserBehaviorAnalyzer {
  constructor() {
    console.log('Analyseur de comportement utilisateur FloDrama initialisé');
  }
  
  /**
   * Analyse le comportement utilisateur à partir de son historique
   * @param {Object} userHistory - Historique de l'utilisateur
   * @returns {Object} Insights sur le comportement utilisateur
   */
  analyzeUserBehavior(userHistory) {
    if (!userHistory) {
      return this._getDefaultInsights();
    }
    
    try {
      // Extraire les données pertinentes de l'historique
      const recentlyWatched = userHistory.recentlyWatched || [];
      const inProgress = userHistory.inProgress || [];
      const completed = userHistory.completed || [];
      const events = userHistory.events || [];
      
      // Analyser les préférences de genre
      const genrePreferences = this._analyzeGenrePreferences(recentlyWatched, completed);
      
      // Analyser les habitudes de visionnage
      const viewingHabits = this._analyzeViewingHabits(recentlyWatched, inProgress, completed);
      
      // Analyser les interactions utilisateur
      const interactionPatterns = this._analyzeInteractionPatterns(events);
      
      // Analyser les préférences de durée
      const durationPreferences = this._analyzeDurationPreferences(completed);
      
      // Analyser les préférences de qualité
      const qualityPreferences = this._analyzeQualityPreferences(completed, events);
      
      // Analyser les préférences de langue
      const languagePreferences = this._analyzeLanguagePreferences(completed);
      
      // Analyser les moments de visionnage
      const viewingTimes = this._analyzeViewingTimes(events);
      
      // Générer des insights sur le comportement de l'utilisateur
      return {
        genrePreferences,
        viewingHabits,
        interactionPatterns,
        durationPreferences,
        qualityPreferences,
        languagePreferences,
        viewingTimes,
        lastAnalyzed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du comportement utilisateur:', error);
      return this._getDefaultInsights();
    }
  }
  
  /**
   * Analyse les préférences de genre de l'utilisateur
   * @private
   */
  _analyzeGenrePreferences(recentlyWatched, completed) {
    // Compter les occurrences de chaque genre
    const genreCounts = {};
    const recentGenreCounts = {};
    
    // Analyser les contenus récemment regardés (avec un poids plus élevé)
    recentlyWatched.forEach(item => {
      const genres = item.genres || [];
      genres.forEach(genre => {
        recentGenreCounts[genre] = (recentGenreCounts[genre] || 0) + 1;
        genreCounts[genre] = (genreCounts[genre] || 0) + 2; // Poids double pour les récents
      });
    });
    
    // Analyser les contenus terminés
    completed.forEach(item => {
      const genres = item.genres || [];
      genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    // Calculer les scores de préférence pour chaque genre
    const genreScores = Object.entries(genreCounts).map(([genre, count]) => {
      // Calculer un score normalisé entre 0 et 1
      const score = Math.min(count / THRESHOLDS.GENRE_PREFERENCE, 1);
      
      // Déterminer si c'est une préférence récente
      const isRecent = recentGenreCounts[genre] >= 2;
      
      return {
        genre,
        score,
        count,
        isRecent
      };
    });
    
    // Trier par score décroissant
    genreScores.sort((a, b) => b.score - a.score);
    
    // Extraire les genres préférés (score > 0.5)
    const preferredGenres = genreScores
      .filter(item => item.score > 0.5)
      .map(item => item.genre);
    
    // Extraire les genres récemment préférés
    const recentPreferredGenres = genreScores
      .filter(item => item.isRecent && item.score > 0.3)
      .map(item => item.genre);
    
    return {
      allGenres: genreScores,
      preferredGenres,
      recentPreferredGenres
    };
  }
  
  /**
   * Analyse les habitudes de visionnage de l'utilisateur
   * @private
   */
  _analyzeViewingHabits(recentlyWatched, inProgress, completed) {
    // Nombre total de contenus regardés
    const totalWatched = recentlyWatched.length + completed.length;
    
    // Nombre de contenus en cours
    const inProgressCount = inProgress.length;
    
    // Calculer le taux de complétion
    const completionRate = totalWatched > 0 
      ? completed.length / totalWatched 
      : 0;
    
    // Vérifier si l'utilisateur regarde plusieurs contenus à la fois
    const multitasker = inProgressCount > 3;
    
    // Vérifier si l'utilisateur préfère terminer un contenu avant d'en commencer un autre
    const serialWatcher = completionRate > 0.8;
    
    // Vérifier si l'utilisateur préfère les séries ou les films
    const seriesCount = completed.filter(item => item.type === 'drama' || item.type === 'anime').length;
    const movieCount = completed.filter(item => item.type === 'movie').length;
    
    const prefersSeries = seriesCount > movieCount * 1.5;
    const prefersMovies = movieCount > seriesCount * 1.5;
    
    // Vérifier si l'utilisateur termine généralement les séries qu'il commence
    const startedSeries = [...inProgress, ...completed].filter(
      item => item.type === 'drama' || item.type === 'anime'
    );
    
    const completedSeries = completed.filter(
      item => (item.type === 'drama' || item.type === 'anime') && item.progress?.completed
    );
    
    const seriesCompletionRate = startedSeries.length > 0 
      ? completedSeries.length / startedSeries.length 
      : 0;
    
    // Vérifier si l'utilisateur regarde souvent des contenus similaires à la suite
    const watchesSimilarContent = this._checkForSimilarContentPatterns(recentlyWatched);
    
    return {
      totalWatched,
      inProgressCount,
      completionRate,
      multitasker,
      serialWatcher,
      prefersSeries,
      prefersMovies,
      seriesCompletionRate,
      watchesSimilarContent
    };
  }
  
  /**
   * Analyse les patterns d'interaction de l'utilisateur
   * @private
   */
  _analyzeInteractionPatterns(events) {
    if (!events || events.length === 0) {
      return {
        pauseFrequency: 'unknown',
        seekFrequency: 'unknown',
        completionRate: 'unknown',
        sharingFrequency: 'unknown',
        downloadFrequency: 'unknown',
        ratingFrequency: 'unknown'
      };
    }
    
    // Compter les différents types d'événements
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });
    
    // Nombre total d'événements de lecture
    const playCount = eventCounts[USER_EVENTS.PLAY] || 0;
    
    // Calculer les fréquences
    const pauseFrequency = this._calculateFrequency(eventCounts[USER_EVENTS.PAUSE], playCount);
    const seekFrequency = this._calculateFrequency(eventCounts[USER_EVENTS.SEEK], playCount);
    const completionRate = this._calculateFrequency(eventCounts[USER_EVENTS.COMPLETE], playCount);
    const sharingFrequency = this._calculateFrequency(eventCounts[USER_EVENTS.SHARE], playCount);
    const downloadFrequency = this._calculateFrequency(eventCounts[USER_EVENTS.DOWNLOAD], playCount);
    const ratingFrequency = this._calculateFrequency(eventCounts[USER_EVENTS.RATE], playCount);
    
    return {
      pauseFrequency,
      seekFrequency,
      completionRate,
      sharingFrequency,
      downloadFrequency,
      ratingFrequency,
      eventCounts
    };
  }
  
  /**
   * Analyse les préférences de durée de l'utilisateur
   * @private
   */
  _analyzeDurationPreferences(completed) {
    if (!completed || completed.length === 0) {
      return {
        averageDuration: 0,
        preferredDuration: 'unknown',
        durationDistribution: {}
      };
    }
    
    // Extraire les durées
    const durations = completed
      .filter(item => item.duration)
      .map(item => item.duration);
    
    if (durations.length === 0) {
      return {
        averageDuration: 0,
        preferredDuration: 'unknown',
        durationDistribution: {}
      };
    }
    
    // Calculer la durée moyenne
    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    
    // Catégoriser les durées
    const durationDistribution = {
      short: 0, // < 30 minutes
      medium: 0, // 30-60 minutes
      long: 0 // > 60 minutes
    };
    
    durations.forEach(duration => {
      if (duration < 30) {
        durationDistribution.short++;
      } else if (duration <= 60) {
        durationDistribution.medium++;
      } else {
        durationDistribution.long++;
      }
    });
    
    // Déterminer la durée préférée
    let preferredDuration = 'medium';
    if (durationDistribution.short > durationDistribution.medium && durationDistribution.short > durationDistribution.long) {
      preferredDuration = 'short';
    } else if (durationDistribution.long > durationDistribution.medium && durationDistribution.long > durationDistribution.short) {
      preferredDuration = 'long';
    }
    
    return {
      averageDuration,
      preferredDuration,
      durationDistribution
    };
  }
  
  /**
   * Analyse les préférences de qualité de l'utilisateur
   * @private
   */
  _analyzeQualityPreferences(completed, events) {
    // Extraire les qualités des contenus terminés
    const qualityCounts = {};
    
    completed.forEach(item => {
      if (item.quality) {
        qualityCounts[item.quality] = (qualityCounts[item.quality] || 0) + 1;
      }
    });
    
    // Vérifier les événements de changement de qualité
    const qualityChangeEvents = events.filter(event => 
      event.type === 'quality_change' && event.data && event.data.quality
    );
    
    qualityChangeEvents.forEach(event => {
      qualityCounts[event.data.quality] = (qualityCounts[event.data.quality] || 0) + 1;
    });
    
    // Déterminer la qualité préférée
    let preferredQuality = 'auto';
    let maxCount = 0;
    
    for (const [quality, count] of Object.entries(qualityCounts)) {
      if (count > maxCount) {
        maxCount = count;
        preferredQuality = quality;
      }
    }
    
    // Vérifier si l'utilisateur ajuste souvent la qualité
    const adjustsQuality = qualityChangeEvents.length > 5;
    
    return {
      preferredQuality,
      qualityCounts,
      adjustsQuality
    };
  }
  
  /**
   * Analyse les préférences de langue de l'utilisateur
   * @private
   */
  _analyzeLanguagePreferences(completed) {
    // Extraire les langues des contenus terminés
    const languageCounts = {};
    const subtitleCounts = {};
    
    completed.forEach(item => {
      if (item.language) {
        languageCounts[item.language] = (languageCounts[item.language] || 0) + 1;
      }
      
      if (item.subtitles) {
        subtitleCounts[item.subtitles] = (subtitleCounts[item.subtitles] || 0) + 1;
      }
    });
    
    // Déterminer la langue préférée
    let preferredLanguage = 'unknown';
    let maxCount = 0;
    
    for (const [language, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        preferredLanguage = language;
      }
    }
    
    // Déterminer les sous-titres préférés
    let preferredSubtitles = 'unknown';
    maxCount = 0;
    
    for (const [subtitles, count] of Object.entries(subtitleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        preferredSubtitles = subtitles;
      }
    }
    
    // Vérifier si l'utilisateur préfère le contenu sous-titré
    const prefersSubtitles = Object.values(subtitleCounts).reduce((sum, count) => sum + count, 0) > 
                            Object.values(languageCounts).reduce((sum, count) => sum + count, 0) * 0.7;
    
    return {
      preferredLanguage,
      preferredSubtitles,
      prefersSubtitles,
      languageCounts,
      subtitleCounts
    };
  }
  
  /**
   * Analyse les moments de visionnage de l'utilisateur
   * @private
   */
  _analyzeViewingTimes(events) {
    if (!events || events.length === 0) {
      return {
        preferredTimeOfDay: 'unknown',
        preferredDaysOfWeek: [],
        timeDistribution: {},
        dayDistribution: {}
      };
    }
    
    // Initialiser les distributions
    const timeDistribution = {
      morning: 0, // 5-9h
      forenoon: 0, // 9-12h
      noon: 0, // 12-14h
      afternoon: 0, // 14-18h
      evening: 0, // 18-22h
      night: 0 // 22-5h
    };
    
    const dayDistribution = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    // Analyser les événements de lecture
    const playEvents = events.filter(event => event.type === USER_EVENTS.PLAY && event.timestamp);
    
    playEvents.forEach(event => {
      const timestamp = new Date(event.timestamp);
      const hour = timestamp.getHours();
      const day = timestamp.getDay(); // 0 = dimanche, 1 = lundi, etc.
      
      // Déterminer le moment de la journée
      if (hour >= 5 && hour < 9) {
        timeDistribution.morning++;
      } else if (hour >= 9 && hour < 12) {
        timeDistribution.forenoon++;
      } else if (hour >= 12 && hour < 14) {
        timeDistribution.noon++;
      } else if (hour >= 14 && hour < 18) {
        timeDistribution.afternoon++;
      } else if (hour >= 18 && hour < 22) {
        timeDistribution.evening++;
      } else {
        timeDistribution.night++;
      }
      
      // Déterminer le jour de la semaine
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      dayDistribution[days[day]]++;
    });
    
    // Déterminer le moment préféré de la journée
    let preferredTimeOfDay = 'unknown';
    let maxCount = 0;
    
    for (const [time, count] of Object.entries(timeDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        preferredTimeOfDay = time;
      }
    }
    
    // Déterminer les jours préférés de la semaine
    const preferredDaysOfWeek = Object.entries(dayDistribution)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([day, _]) => day);
    
    return {
      preferredTimeOfDay,
      preferredDaysOfWeek,
      timeDistribution,
      dayDistribution
    };
  }
  
  /**
   * Vérifie si l'utilisateur regarde souvent des contenus similaires à la suite
   * @private
   */
  _checkForSimilarContentPatterns(recentlyWatched) {
    if (recentlyWatched.length < 3) {
      return false;
    }
    
    let similarContentCount = 0;
    
    // Parcourir les contenus récemment regardés par paires consécutives
    for (let i = 0; i < recentlyWatched.length - 1; i++) {
      const current = recentlyWatched[i];
      const next = recentlyWatched[i + 1];
      
      // Vérifier si les contenus sont similaires
      if (this._areContentsSimilar(current, next)) {
        similarContentCount++;
      }
    }
    
    // Si plus de la moitié des paires sont similaires, l'utilisateur regarde souvent des contenus similaires
    return similarContentCount >= (recentlyWatched.length - 1) / 2;
  }
  
  /**
   * Vérifie si deux contenus sont similaires
   * @private
   */
  _areContentsSimilar(content1, content2) {
    if (!content1 || !content2) {
      return false;
    }
    
    // Vérifier si les contenus font partie de la même série
    if (content1.seriesId && content2.seriesId && content1.seriesId === content2.seriesId) {
      return true;
    }
    
    // Vérifier si les contenus ont des genres en commun
    const genres1 = content1.genres || [];
    const genres2 = content2.genres || [];
    
    const commonGenres = genres1.filter(genre => genres2.includes(genre));
    if (commonGenres.length >= 2) {
      return true;
    }
    
    // Vérifier si les contenus ont des acteurs en commun
    const actors1 = content1.actors || [];
    const actors2 = content2.actors || [];
    
    const commonActors = actors1.filter(actor => actors2.includes(actor));
    if (commonActors.length >= 1) {
      return true;
    }
    
    // Vérifier si les contenus ont le même réalisateur
    if (content1.director && content2.director && content1.director === content2.director) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calcule la fréquence d'un événement par rapport au nombre total d'événements de lecture
   * @private
   */
  _calculateFrequency(eventCount, playCount) {
    if (!eventCount || !playCount) {
      return 'low';
    }
    
    const ratio = eventCount / playCount;
    
    if (ratio < 0.2) {
      return 'low';
    } else if (ratio < 0.5) {
      return 'medium';
    } else {
      return 'high';
    }
  }
  
  /**
   * Retourne des insights par défaut
   * @private
   */
  _getDefaultInsights() {
    return {
      genrePreferences: {
        allGenres: [],
        preferredGenres: [],
        recentPreferredGenres: []
      },
      viewingHabits: {
        totalWatched: 0,
        inProgressCount: 0,
        completionRate: 0,
        multitasker: false,
        serialWatcher: false,
        prefersSeries: false,
        prefersMovies: false,
        seriesCompletionRate: 0,
        watchesSimilarContent: false
      },
      interactionPatterns: {
        pauseFrequency: 'unknown',
        seekFrequency: 'unknown',
        completionRate: 'unknown',
        sharingFrequency: 'unknown',
        downloadFrequency: 'unknown',
        ratingFrequency: 'unknown'
      },
      durationPreferences: {
        averageDuration: 0,
        preferredDuration: 'unknown',
        durationDistribution: {}
      },
      qualityPreferences: {
        preferredQuality: 'auto',
        qualityCounts: {},
        adjustsQuality: false
      },
      languagePreferences: {
        preferredLanguage: 'unknown',
        preferredSubtitles: 'unknown',
        prefersSubtitles: false,
        languageCounts: {},
        subtitleCounts: {}
      },
      viewingTimes: {
        preferredTimeOfDay: 'unknown',
        preferredDaysOfWeek: [],
        timeDistribution: {},
        dayDistribution: {}
      },
      lastAnalyzed: new Date().toISOString()
    };
  }
}

export default UserBehaviorAnalyzer;
