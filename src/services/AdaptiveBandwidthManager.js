/**
 * Gestionnaire adaptatif de bande passante pour FloDrama
 * Ce service optimise l'expérience de streaming en adaptant dynamiquement
 * la qualité vidéo et en utilisant des techniques de préchargement intelligent.
 */

import { analyzeNetworkConditions } from '../utils/networkAnalyzer';
import { predictUserBehavior } from '../utils/userBehaviorPredictor';
import { getContentMetadata } from './contentService';
import { getUserPreferences, getUserHistory } from './userService';

class AdaptiveBandwidthManager {
  constructor() {
    // Configuration des fonctionnalités
    this.preloadingEnabled = true;
    this.smartBufferingEnabled = true;
    this.networkPredictionEnabled = true;
    
    // Configuration des seuils de qualité
    this.qualityLevels = {
      low: {
        resolution: '480p',
        bitrate: 800000, // bits/s
        fps: 24,
        audioQuality: 'low'
      },
      medium: {
        resolution: '720p',
        bitrate: 2500000, // bits/s
        fps: 30,
        audioQuality: 'medium'
      },
      high: {
        resolution: '1080p',
        bitrate: 5000000, // bits/s
        fps: 30,
        audioQuality: 'high'
      },
      ultra: {
        resolution: '4K',
        bitrate: 15000000, // bits/s
        fps: 60,
        audioQuality: 'high'
      }
    };
    
    // Configuration du préchargement
    this.preloadConfig = {
      maxSegmentsAhead: 3,
      minBufferTime: 10, // secondes
      optimalBufferTime: 30, // secondes
      maxBufferTime: 120, // secondes
      preloadPriority: ['current', 'next-episode', 'recommendations']
    };
    
    // Configuration du buffer
    this.bufferConfig = {
      initialBufferSize: 5, // secondes
      rebufferingThreshold: 2, // secondes
      maxRetryAttempts: 3,
      retryDelay: 1000, // ms
      exponentialBackoff: true
    };
    
    // Configuration de la prédiction réseau
    this.networkPredictionConfig = {
      samplingInterval: 2000, // ms
      historyLength: 20,
      predictionWindow: 10, // secondes
      confidenceThreshold: 0.7
    };
    
    // Métriques de performance
    this.performanceMetrics = {
      rebufferingEvents: 0,
      qualitySwitches: 0,
      averageBitrate: 0,
      totalRebufferingTime: 0,
      lastQualityLevel: 'medium',
      startupTime: 0
    };
  }
  
  /**
   * Optimise l'expérience de streaming
   * @param {Object} videoData - Données de la vidéo
   * @param {Object} networkConditions - Conditions réseau
   * @param {Object} userHistory - Historique de l'utilisateur
   * @returns {Promise<Object>} - Configuration optimisée
   */
  async optimizeStreamingExperience(videoData, networkConditions, userHistory) {
    try {
      // Analyse des conditions réseau si non fournies
      const network = networkConditions || await analyzeNetworkConditions();
      
      // Prédiction des segments que l'utilisateur va regarder
      const predictedSegments = await this.predictViewingPattern(userHistory, videoData);
      
      // Préchargement intelligent basé sur les prédictions
      if (this.preloadingEnabled) {
        await this.preloadSegments(predictedSegments, network);
      }
      
      // Adaptation dynamique de la qualité selon les conditions réseau
      const optimalQualityLevels = this.calculateOptimalQualityLevels(network, videoData);
      
      // Configuration du buffer adaptatif
      const bufferConfig = this.configureAdaptiveBuffer(network, predictedSegments);
      
      // Création de la configuration optimisée
      return {
        qualityLevels: optimalQualityLevels,
        bufferConfig,
        preloadedSegments: predictedSegments.map(segment => segment.id),
        networkPrediction: this.predictNetworkChanges(network),
        abr: {
          algorithm: 'dynamic',
          initialQuality: optimalQualityLevels.initialLevel,
          maxHeight: optimalQualityLevels.maxHeight,
          maxWidth: optimalQualityLevels.maxWidth,
          maxBitrate: optimalQualityLevels.maxBitrate
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'optimisation de l\'expérience de streaming:', error);
      // Configuration par défaut en cas d'erreur
      return this.getDefaultConfiguration();
    }
  }
  
  /**
   * Prédit les segments que l'utilisateur va regarder
   * @param {Object} userHistory - Historique de l'utilisateur
   * @param {Object} videoData - Données de la vidéo
   * @returns {Promise<Array>} - Segments prédits
   */
  async predictViewingPattern(userHistory, videoData) {
    try {
      // Utilisation du service de prédiction du comportement utilisateur
      const predictions = await predictUserBehavior(userHistory, videoData);
      
      // Structuration des segments prédits
      return predictions.segments.map(segment => ({
        id: segment.id,
        startTime: segment.startTime,
        endTime: segment.endTime,
        probability: segment.probability,
        type: segment.type
      }));
    } catch (error) {
      console.error('Erreur lors de la prédiction des segments:', error);
      // Prédiction par défaut en cas d'erreur
      return this.getDefaultPrediction(videoData);
    }
  }
  
  /**
   * Précharge les segments prédits
   * @param {Array} predictedSegments - Segments prédits
   * @param {Object} networkConditions - Conditions réseau
   * @returns {Promise<boolean>} - Statut du préchargement
   */
  async preloadSegments(predictedSegments, networkConditions) {
    try {
      // Filtrage des segments à précharger selon la probabilité
      const segmentsToPreload = predictedSegments
        .filter(segment => segment.probability > 0.7)
        .sort((a, b) => b.probability - a.probability)
        .slice(0, this.preloadConfig.maxSegmentsAhead);
      
      // Adaptation de la qualité de préchargement selon les conditions réseau
      const preloadQuality = this.determinePreloadQuality(networkConditions);
      
      // Préchargement des segments
      for (const segment of segmentsToPreload) {
        await this.preloadSegment(segment, preloadQuality);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du préchargement des segments:', error);
      return false;
    }
  }
  
  /**
   * Précharge un segment spécifique
   * @param {Object} segment - Segment à précharger
   * @param {string} quality - Qualité de préchargement
   * @returns {Promise<boolean>} - Statut du préchargement
   */
  async preloadSegment(segment, quality) {
    // Simulation de préchargement
    // Dans une implémentation réelle, cela impliquerait des requêtes HTTP
    console.log(`Préchargement du segment ${segment.id} en qualité ${quality}`);
    return true;
  }
  
  /**
   * Détermine la qualité de préchargement selon les conditions réseau
   * @param {Object} networkConditions - Conditions réseau
   * @returns {string} - Qualité de préchargement
   */
  determinePreloadQuality(networkConditions) {
    const { bandwidth, latency, stability } = networkConditions;
    
    if (bandwidth > 10000000 && stability > 0.8) { // 10 Mbps
      return 'high';
    } else if (bandwidth > 3000000 && stability > 0.6) { // 3 Mbps
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Calcule les niveaux de qualité optimaux
   * @param {Object} networkConditions - Conditions réseau
   * @param {Object} videoData - Données de la vidéo
   * @returns {Object} - Niveaux de qualité optimaux
   */
  calculateOptimalQualityLevels(networkConditions, videoData) {
    try {
      const { bandwidth, latency, stability, type } = networkConditions;
      const { duration, importance } = videoData;
      
      // Détermination du niveau de qualité initial
      let initialLevel;
      let maxHeight;
      let maxWidth;
      let maxBitrate;
      
      // Calcul du bitrate disponible (avec marge de sécurité)
      const availableBitrate = bandwidth * 0.8;
      
      if (bandwidth > 10000000 && stability > 0.8) { // 10 Mbps
        initialLevel = 'high';
        maxHeight = 1080;
        maxWidth = 1920;
        maxBitrate = this.qualityLevels.high.bitrate;
        
        // Si le réseau est très bon et stable, permettre la qualité ultra
        if (bandwidth > 20000000 && stability > 0.9 && type !== 'mobile') {
          initialLevel = 'ultra';
          maxHeight = 2160;
          maxWidth = 3840;
          maxBitrate = this.qualityLevels.ultra.bitrate;
        }
      } else if (bandwidth > 3000000 && stability > 0.6) { // 3 Mbps
        initialLevel = 'medium';
        maxHeight = 720;
        maxWidth = 1280;
        maxBitrate = this.qualityLevels.medium.bitrate;
      } else {
        initialLevel = 'low';
        maxHeight = 480;
        maxWidth = 854;
        maxBitrate = this.qualityLevels.low.bitrate;
      }
      
      // Ajustement selon le type d'appareil
      if (type === 'mobile' && initialLevel === 'ultra') {
        initialLevel = 'high';
        maxHeight = 1080;
        maxWidth = 1920;
        maxBitrate = this.qualityLevels.high.bitrate;
      }
      
      // Création des niveaux disponibles
      const availableLevels = [];
      
      // Toujours inclure le niveau bas pour les conditions dégradées
      availableLevels.push({
        id: 'low',
        width: 854,
        height: 480,
        bitrate: this.qualityLevels.low.bitrate,
        fps: this.qualityLevels.low.fps
      });
      
      // Ajouter le niveau moyen si la bande passante le permet
      if (availableBitrate >= this.qualityLevels.medium.bitrate) {
        availableLevels.push({
          id: 'medium',
          width: 1280,
          height: 720,
          bitrate: this.qualityLevels.medium.bitrate,
          fps: this.qualityLevels.medium.fps
        });
      }
      
      // Ajouter le niveau haut si la bande passante le permet
      if (availableBitrate >= this.qualityLevels.high.bitrate) {
        availableLevels.push({
          id: 'high',
          width: 1920,
          height: 1080,
          bitrate: this.qualityLevels.high.bitrate,
          fps: this.qualityLevels.high.fps
        });
      }
      
      // Ajouter le niveau ultra si la bande passante le permet et que ce n'est pas un mobile
      if (availableBitrate >= this.qualityLevels.ultra.bitrate && type !== 'mobile') {
        availableLevels.push({
          id: 'ultra',
          width: 3840,
          height: 2160,
          bitrate: this.qualityLevels.ultra.bitrate,
          fps: this.qualityLevels.ultra.fps
        });
      }
      
      return {
        initialLevel,
        maxHeight,
        maxWidth,
        maxBitrate,
        availableLevels
      };
    } catch (error) {
      console.error('Erreur lors du calcul des niveaux de qualité optimaux:', error);
      // Niveaux par défaut en cas d'erreur
      return {
        initialLevel: 'medium',
        maxHeight: 720,
        maxWidth: 1280,
        maxBitrate: this.qualityLevels.medium.bitrate,
        availableLevels: [
          {
            id: 'low',
            width: 854,
            height: 480,
            bitrate: this.qualityLevels.low.bitrate,
            fps: this.qualityLevels.low.fps
          },
          {
            id: 'medium',
            width: 1280,
            height: 720,
            bitrate: this.qualityLevels.medium.bitrate,
            fps: this.qualityLevels.medium.fps
          }
        ]
      };
    }
  }
  
  /**
   * Configure le buffer adaptatif
   * @param {Object} networkConditions - Conditions réseau
   * @param {Array} predictedSegments - Segments prédits
   * @returns {Object} - Configuration du buffer
   */
  configureAdaptiveBuffer(networkConditions, predictedSegments) {
    try {
      const { bandwidth, latency, stability } = networkConditions;
      
      // Calcul de la taille du buffer initial
      let initialBufferSize = this.bufferConfig.initialBufferSize;
      
      // Ajustement selon la latence
      if (latency > 200) { // ms
        initialBufferSize += Math.min(10, latency / 100);
      }
      
      // Ajustement selon la stabilité
      if (stability < 0.5) {
        initialBufferSize *= 1.5;
      }
      
      // Calcul du seuil de rebuffering
      let rebufferingThreshold = this.bufferConfig.rebufferingThreshold;
      
      // Ajustement selon la stabilité
      if (stability < 0.3) {
        rebufferingThreshold *= 2;
      }
      
      // Calcul du temps de buffer optimal
      let optimalBufferTime = this.preloadConfig.optimalBufferTime;
      
      // Ajustement selon la bande passante
      if (bandwidth < 2000000) { // 2 Mbps
        optimalBufferTime *= 1.5;
      } else if (bandwidth > 10000000) { // 10 Mbps
        optimalBufferTime *= 0.8;
      }
      
      // Ajustement selon les prédictions
      if (predictedSegments.some(segment => segment.type === 'skip')) {
        // Si l'utilisateur est susceptible de sauter des segments, réduire le buffer
        optimalBufferTime *= 0.7;
      }
      
      return {
        initialBufferSize,
        rebufferingThreshold,
        optimalBufferTime,
        maxBufferTime: this.preloadConfig.maxBufferTime,
        minBufferTime: this.preloadConfig.minBufferTime
      };
    } catch (error) {
      console.error('Erreur lors de la configuration du buffer adaptatif:', error);
      // Configuration par défaut en cas d'erreur
      return {
        initialBufferSize: this.bufferConfig.initialBufferSize,
        rebufferingThreshold: this.bufferConfig.rebufferingThreshold,
        optimalBufferTime: this.preloadConfig.optimalBufferTime,
        maxBufferTime: this.preloadConfig.maxBufferTime,
        minBufferTime: this.preloadConfig.minBufferTime
      };
    }
  }
  
  /**
   * Prédit les changements de réseau
   * @param {Object} currentNetwork - Conditions réseau actuelles
   * @returns {Object} - Prédiction des changements
   */
  predictNetworkChanges(currentNetwork) {
    try {
      if (!this.networkPredictionEnabled) {
        return null;
      }
      
      const { bandwidth, latency, stability, type, history } = currentNetwork;
      
      // Analyse des tendances historiques
      let bandwidthTrend = 'stable';
      let latencyTrend = 'stable';
      
      if (history && history.bandwidth && history.bandwidth.length > 2) {
        const recentBandwidth = history.bandwidth.slice(-3);
        if (recentBandwidth[2] > recentBandwidth[0] * 1.2) {
          bandwidthTrend = 'increasing';
        } else if (recentBandwidth[2] < recentBandwidth[0] * 0.8) {
          bandwidthTrend = 'decreasing';
        }
      }
      
      if (history && history.latency && history.latency.length > 2) {
        const recentLatency = history.latency.slice(-3);
        if (recentLatency[2] > recentLatency[0] * 1.2) {
          latencyTrend = 'increasing';
        } else if (recentLatency[2] < recentLatency[0] * 0.8) {
          latencyTrend = 'decreasing';
        }
      }
      
      // Prédiction des changements
      return {
        bandwidthTrend,
        latencyTrend,
        stabilityPrediction: stability < 0.3 ? 'unstable' : 'stable',
        recommendedAction: this.getRecommendedAction(bandwidthTrend, latencyTrend, stability)
      };
    } catch (error) {
      console.error('Erreur lors de la prédiction des changements de réseau:', error);
      return null;
    }
  }
  
  /**
   * Obtient l'action recommandée selon les tendances réseau
   * @param {string} bandwidthTrend - Tendance de la bande passante
   * @param {string} latencyTrend - Tendance de la latence
   * @param {number} stability - Stabilité du réseau
   * @returns {string} - Action recommandée
   */
  getRecommendedAction(bandwidthTrend, latencyTrend, stability) {
    if (bandwidthTrend === 'decreasing' && latencyTrend === 'increasing') {
      return 'decrease-quality';
    } else if (bandwidthTrend === 'increasing' && latencyTrend === 'decreasing') {
      return 'increase-quality';
    } else if (stability < 0.3) {
      return 'increase-buffer';
    } else {
      return 'maintain';
    }
  }
  
  /**
   * Obtient une prédiction par défaut
   * @param {Object} videoData - Données de la vidéo
   * @returns {Array} - Prédiction par défaut
   */
  getDefaultPrediction(videoData) {
    const segments = [];
    const segmentDuration = 10; // secondes
    
    // Création de segments pour les 2 premières minutes
    for (let i = 0; i < 12; i++) {
      segments.push({
        id: `segment-${i}`,
        startTime: i * segmentDuration,
        endTime: (i + 1) * segmentDuration,
        probability: 1 - (i * 0.05),
        type: 'watch'
      });
    }
    
    return segments;
  }
  
  /**
   * Obtient une configuration par défaut
   * @returns {Object} - Configuration par défaut
   */
  getDefaultConfiguration() {
    return {
      qualityLevels: {
        initialLevel: 'medium',
        maxHeight: 720,
        maxWidth: 1280,
        maxBitrate: this.qualityLevels.medium.bitrate,
        availableLevels: [
          {
            id: 'low',
            width: 854,
            height: 480,
            bitrate: this.qualityLevels.low.bitrate,
            fps: this.qualityLevels.low.fps
          },
          {
            id: 'medium',
            width: 1280,
            height: 720,
            bitrate: this.qualityLevels.medium.bitrate,
            fps: this.qualityLevels.medium.fps
          }
        ]
      },
      bufferConfig: {
        initialBufferSize: this.bufferConfig.initialBufferSize,
        rebufferingThreshold: this.bufferConfig.rebufferingThreshold,
        optimalBufferTime: this.preloadConfig.optimalBufferTime,
        maxBufferTime: this.preloadConfig.maxBufferTime,
        minBufferTime: this.preloadConfig.minBufferTime
      },
      preloadedSegments: [],
      networkPrediction: null,
      abr: {
        algorithm: 'dynamic',
        initialQuality: 'medium',
        maxHeight: 720,
        maxWidth: 1280,
        maxBitrate: this.qualityLevels.medium.bitrate
      }
    };
  }
}

export default AdaptiveBandwidthManager;
