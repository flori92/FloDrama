// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation si besoin

export function getContentMetadata(contentId) {
  // Retourne des métadonnées fictives
  return {
    id: contentId,
    title: 'Titre fictif',
    genres: ['drama', 'anime', 'movie'],
    description: 'Description fictive',
    poster_path: '/assets/images/posters/fallback.svg',
    score: 0.8
  };
}

export function getContentSimilarity(contentIdA, contentIdB) {
  // Retourne une similarité fictive
  return 0.7;
}
