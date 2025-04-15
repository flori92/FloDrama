// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function predictUserBehavior(_userId) {
  // Retourne des prédictions fictives sur le comportement utilisateur
  return {
    likelyToSkip: false,
    estimatedWatchTime: 25, // minutes
    preferredQuality: 'auto',
    attentionScore: 0.8, // 0-1
    devicePreferences: {
      mobile: 0.3,
      desktop: 0.7,
      tv: 0.0
    }
  };
}

export function getUserWatchingPatterns() {
  // Retourne des patterns de visionnage fictifs
  return {
    timeOfDay: 'evening',
    averageSessionLength: 45, // minutes
    completionRate: 0.75 // 0-1
  };
}
