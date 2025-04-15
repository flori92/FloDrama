// Mock minimal pour débloquer le build
export function analyzeVisualStyle(content, options = {}) {
  return {
    palette: {
      primary: '#3b82f6',
      secondary: '#d946ef',
      background: '#121118'
    },
    style: 'modern',
    mood: 'dramatic',
    visualElements: [
      { type: 'lighting', value: 'low-key', confidence: 0.9 },
      { type: 'composition', value: 'balanced', confidence: 0.8 }
    ]
  };
}
