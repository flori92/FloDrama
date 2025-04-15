// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function detectDevice() {
  // Retourne des informations fictives sur l'appareil
  return {
    type: 'desktop', // 'mobile', 'tablet', 'desktop', 'tv'
    os: 'macos',
    browser: 'chrome',
    screenSize: {
      width: 1920,
      height: 1080
    },
    pixelRatio: 2,
    capabilities: {
      webp: true,
      avif: false,
      hevc: true,
      hdr: false
    }
  };
}

export function getOptimalImageFormat() {
  // Retourne le format d'image optimal pour l'appareil actuel
  return 'webp';
}

export function getOptimalResolution() {
  // Retourne la résolution optimale pour l'appareil actuel
  return {
    width: 1280,
    height: 720
  };
}
