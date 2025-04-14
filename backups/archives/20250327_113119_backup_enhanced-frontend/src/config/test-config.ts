/**
 * Configuration temporaire pour les tests
 * À remplacer par la configuration Lynx officielle dès qu'elle sera disponible
 */

export const TEST_CONFIG = {
  // Mode de test : 'temp' pour notre solution temporaire, 'lynx' pour Lynx officiel
  testMode: 'temp' as const,
  
  // Configuration des composants pour les tests
  components: {
    video: {
      testIdPrefix: 'lynx-video',
      defaultControls: true,
      defaultQuality: 'auto',
      supportedQualities: ['auto', '1080p', '720p', '480p'],
      controlsTimeout: 3000,
    },
    carousel: {
      testIdPrefix: 'lynx-carousel',
      defaultAutoplay: false,
      defaultInterval: 5000,
      defaultShowIndicators: true,
    }
  },

  // Configuration des threads pour les tests
  threads: {
    useMainThread: true,
    useBackgroundThread: true,
    mainThreadTimeout: 100,
    backgroundThreadTimeout: 200,
  },

  // Configuration des événements pour les tests
  events: {
    video: {
      onPlay: 'video:play',
      onPause: 'video:pause',
      onEnd: 'video:end',
      onError: 'video:error',
      onQualityChange: 'video:quality',
      onTimeUpdate: 'video:time',
    },
    carousel: {
      onChange: 'carousel:change',
      onAutoplayChange: 'carousel:autoplay',
    }
  }
};
