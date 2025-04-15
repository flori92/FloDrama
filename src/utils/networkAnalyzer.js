// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function analyzeNetworkConditions() {
  // Retourne des conditions réseau fictives
  return {
    bandwidth: 5000, // kbps
    latency: 50, // ms
    jitter: 10, // ms
    packetLoss: 0.1, // %
    connectionType: 'wifi',
    isStable: true
  };
}

export function getNetworkQualityScore() {
  // Retourne un score de qualité réseau fictif (0-100)
  return 85;
}
