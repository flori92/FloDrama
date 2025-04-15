// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation si besoin

export function getUserPreferences(userId) {
  // Retourne des préférences fictives
  return {
    genres: ['drama', 'anime', 'movie'],
    favoris: [],
    historique: []
  };
}

export function getUserHistory(userId) {
  // Retourne un historique fictif
  return [];
}
