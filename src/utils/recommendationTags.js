// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function generateRecommendationTags(_contentId) {
  // Retourne des tags de recommandation fictifs
  return [
    {
      id: 'drama-asiatique',
      name: 'Drama Asiatique',
      weight: 0.95,
      category: 'genre'
    },
    {
      id: 'romance-contemporaine',
      name: 'Romance Contemporaine',
      weight: 0.82,
      category: 'sous-genre'
    },
    {
      id: 'coréen',
      name: 'Coréen',
      weight: 0.9,
      category: 'origine'
    }
  ];
}

export function getTagCategories() {
  // Retourne les catégories de tags disponibles
  return [
    'genre', 'sous-genre', 'origine', 'époque', 
    'thème', 'public', 'ambiance', 'format'
  ];
}
