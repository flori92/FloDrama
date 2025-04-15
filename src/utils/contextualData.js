// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation si besoin

export function getCurrentEvents() {
  // Retourne des événements contextuels fictifs
  return [
    { type: 'soirée', description: 'Soirée films asiatiques' },
    { type: 'vacances', description: 'Vacances scolaires' }
  ];
}

export function getSeasonalTrends() {
  // Retourne des tendances saisonnières fictives
  return [
    { saison: 'printemps', genres: ['romance', 'comédie'] },
    { saison: 'hiver', genres: ['drama', 'thriller'] }
  ];
}
