// Mock minimal pour débloquer la build GitHub Actions
// À remplacer par une vraie implémentation après le déploiement

export function applySubtitleStyle(_subtitle, _style) {
  // Retourne le sous-titre avec style fictif
  return _subtitle;
}

export function getAvailableStyles() {
  // Retourne les styles disponibles
  return [
    { id: 'default', name: 'Par défaut', colors: { text: '#FFFFFF', background: 'transparent' } },
    { id: 'flodrama', name: 'FloDrama', colors: { text: '#3b82f6', background: 'rgba(18, 17, 24, 0.7)' } }
  ];
}
