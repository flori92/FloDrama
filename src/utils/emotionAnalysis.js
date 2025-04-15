// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function analyzeEmotionalContent(_content) {
  // Retourne une analyse émotionnelle fictive
  return {
    dominant: 'neutre',
    emotions: {
      joie: 0.2,
      tristesse: 0.1,
      peur: 0.05,
      colère: 0.05,
      surprise: 0.1,
      neutre: 0.5
    },
    intensity: 0.3, // 0-1
    tone: 'modéré'
  };
}

export function getEmotionAnalysis(content, options = {}) {
  return {
    dominant: 'neutral',
    emotions: {
      joy: 0.2,
      sadness: 0.1,
      anger: 0.05,
      fear: 0.05,
      surprise: 0.1,
      neutral: 0.5
    },
    intensity: 'medium',
    confidence: 0.85
  };
}

export function getEmotionalTags(_content) {
  // Retourne des tags émotionnels fictifs
  return ['neutre', 'réflexif'];
}
