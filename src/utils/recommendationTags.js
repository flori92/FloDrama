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

export function getRecommendationTags(contentId, options = {}) {
  return {
    tags: [
      {
        id: `tag-${contentId}-1`,
        name: "Recommandation tag 1",
        weight: 0.9,
        category: "genre"
      },
      {
        id: `tag-${contentId}-2`,
        name: "Recommandation tag 2",
        weight: 0.7,
        category: "mood"
      },
      {
        id: `tag-${contentId}-3`,
        name: "Recommandation tag 3",
        weight: 0.5,
        category: "theme"
      }
    ],
    relatedContentIds: ["content-123", "content-456"]
  };
}
