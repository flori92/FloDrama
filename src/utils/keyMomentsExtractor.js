// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function extractKeyMoments(_videoId, _options = {}) {
  // Retourne des moments clés fictifs pour une vidéo
  return [
    { 
      timestamp: 120, // secondes
      type: 'action',
      description: 'Scène d\'introduction',
      thumbnailUrl: '/assets/images/keymoments/intro.webp',
      confidence: 0.95
    },
    { 
      timestamp: 450, // secondes
      type: 'dialogue',
      description: 'Conversation importante',
      thumbnailUrl: '/assets/images/keymoments/dialogue.webp',
      confidence: 0.87
    },
    { 
      timestamp: 780, // secondes
      type: 'climax',
      description: 'Moment culminant',
      thumbnailUrl: '/assets/images/keymoments/climax.webp',
      confidence: 0.92
    }
  ];
}

export function getKeyMomentTypes() {
  // Retourne les types de moments clés disponibles
  return [
    'action', 'dialogue', 'climax', 'transition', 
    'émotion', 'révélation', 'introduction', 'conclusion'
  ];
}
