// Mock minimal pour débloquer le build
export function getCulturalNotes(text, context = {}) {
  return {
    notes: [{
      term: text.split(' ')[0] || 'terme',
      explanation: 'Explication culturelle (mock)',
      importance: 'medium'
    }],
    hasNotes: true
  };
}
