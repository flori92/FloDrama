// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function generateThumbnail(_videoUrl, _options = {}) {
  // Retourne une URL de miniature fictive
  return '/assets/images/posters/fallback.svg';
}

export function getThumbnailOptions() {
  // Retourne des options de génération de miniature fictives
  return {
    sizes: [
      { width: 320, height: 180, quality: 80 },
      { width: 640, height: 360, quality: 85 },
      { width: 1280, height: 720, quality: 90 }
    ],
    formats: ['webp', 'jpg'],
    defaultStyle: {
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(59, 130, 246, 0.2)' // Bordure légère avec le bleu signature
    }
  };
}
