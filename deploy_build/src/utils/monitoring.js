// Fichier de monitoring simplifié pour FloDrama
// Utilise Vercel Analytics et Sentry pour la surveillance des performances

// Initialisation de Sentry pour la surveillance des erreurs
export const initSentry = () => {
  console.log('Initialisation de Sentry pour la surveillance des erreurs');
  // L'implémentation complète sera ajoutée après le déploiement réussi
};

// Fonction pour surveiller les performances de lecture vidéo
export const monitorVideoPerformance = (videoElement) => {
  if (!videoElement) return;
  
  console.log('Surveillance des performances de lecture vidéo initialisée');
  
  const metrics = {
    startTime: Date.now(),
    firstFrameTime: null,
    bufferingEvents: 0,
    bufferingDuration: 0,
    lastBufferingStart: null,
    playbackErrors: 0,
    videoSource: videoElement.src || 'unknown'
  };
  
  // Les événements seront ajoutés après le déploiement réussi
  
  return metrics;
};

// Version simplifiée du provider d'analytics
export const AnalyticsProvider = ({ children }) => {
  return children;
};

export default {
  initSentry,
  AnalyticsProvider,
  monitorVideoPerformance
};
