// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function detectThemes(_contentId) {
  // Retourne des thèmes fictifs détectés dans le contenu
  return [
    {
      id: 'romance',
      name: 'Romance',
      confidence: 0.85,
      keywords: ['amour', 'relation', 'couple']
    },
    {
      id: 'aventure',
      name: 'Aventure',
      confidence: 0.72,
      keywords: ['voyage', 'découverte', 'exploration']
    },
    {
      id: 'drame',
      name: 'Drame',
      confidence: 0.91,
      keywords: ['conflit', 'émotion', 'tension']
    }
  ];
}

export function getPopularThemes() {
  // Retourne les thèmes populaires fictifs
  return [
    'romance', 'aventure', 'drame', 'comédie', 
    'action', 'fantaisie', 'science-fiction', 'historique'
  ];
}
