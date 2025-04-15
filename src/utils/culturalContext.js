// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function getCulturalContext(_contentId, _region) {
  // Retourne un contexte culturel fictif pour le contenu
  return {
    region: 'asie',
    specificities: [
      { type: 'tradition', name: 'Nouvel An lunaire', description: 'Célébration importante en Asie' },
      { type: 'concept', name: 'Respect des aînés', description: 'Valeur fondamentale dans la culture asiatique' }
    ],
    relevance: 0.8, // 0-1
    references: []
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
