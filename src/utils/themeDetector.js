// Mock minimal pour débloquer le build
export function detectThemes(contentId, options = {}) {
  return {
    mainThemes: [
      {
        id: `theme-${contentId}-1`,
        name: "Thème principal (mock)",
        confidence: 0.95,
        keywords: ["mot-clé1", "mot-clé2", "mot-clé3"]
      }
    ],
    secondaryThemes: [
      {
        id: `theme-${contentId}-2`,
        name: "Thème secondaire (mock)",
        confidence: 0.75,
        keywords: ["mot-clé4", "mot-clé5"]
      }
    ],
    relatedGenres: ["Drama", "Romance"]
  };
}
