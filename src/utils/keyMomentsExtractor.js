// Mock minimal pour débloquer le build
export function extractKeyMoments(contentId, options = {}) {
  return {
    keyMoments: [
      {
        id: `km-${contentId}-1`,
        timestamp: 120,
        title: "Moment clé 1 (mock)",
        description: "Description du moment clé 1",
        thumbnailUrl: `/assets/key-moments/${contentId}/1.jpg`,
        importance: "high"
      },
      {
        id: `km-${contentId}-2`,
        timestamp: 360,
        title: "Moment clé 2 (mock)",
        description: "Description du moment clé 2",
        thumbnailUrl: `/assets/key-moments/${contentId}/2.jpg`,
        importance: "medium"
      }
    ],
    totalCount: 2
  };
}

export function getKeyMomentTypes() {
  // Retourne les types de moments clés disponibles
  return [
    'action', 'dialogue', 'climax', 'transition', 
    'émotion', 'révélation', 'introduction', 'conclusion'
  ];
}
