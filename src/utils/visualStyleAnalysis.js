// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function analyzeVisualStyle(_contentId) {
  // Retourne une analyse visuelle fictive
  return {
    dominantColors: [
      { hex: '#3b82f6', name: 'bleu', percentage: 35 }, // Bleu signature FloDrama
      { hex: '#d946ef', name: 'fuchsia', percentage: 25 }, // Fuchsia accent FloDrama
      { hex: '#121118', name: 'noir', percentage: 40 } // Fond principal FloDrama
    ],
    lighting: 'sombre',
    composition: 'équilibrée',
    motionStyle: 'fluide',
    visualTags: ['contrasté', 'moderne', 'élégant']
  };
}

export function getVisualPalette() {
  // Retourne une palette visuelle fictive basée sur l'identité FloDrama
  return {
    primary: '#3b82f6', // Bleu signature
    secondary: '#d946ef', // Fuchsia accent
    background: '#121118', // Fond principal
    backgroundSecondary: '#1A1926', // Fond secondaire
    text: '#FFFFFF',
    gradient: 'linear-gradient(to right, #3b82f6, #d946ef)' // Dégradé signature
  };
}
