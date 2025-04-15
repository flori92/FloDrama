// Mock minimal pour débloquer le build
export function getCulturalContext(content, region = 'asia', options = {}) {
  return {
    region,
    culturalElements: [
      {
        type: 'reference',
        name: 'Référence culturelle (mock)',
        description: 'Description de la référence culturelle',
        importance: 'medium'
      }
    ],
    relevance: 0.8
  };
}

export function getRegionalPreferences() {
  // Retourne des préférences régionales fictives
  return {
    'asie': { subtitles: true, dubbing: false, culturalNotes: true },
    'europe': { subtitles: true, dubbing: true, culturalNotes: false },
    'amerique': { subtitles: false, dubbing: true, culturalNotes: false }
  };
}
