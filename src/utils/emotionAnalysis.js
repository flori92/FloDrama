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

export function getEmotionalTags(_content) {
  // Retourne des tags émotionnels fictifs
  return ['neutre', 'réflexif'];
}
