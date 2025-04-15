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

export function applyVisualStyle(subtitles, style = 'default', options = {}) {
  return {
    styledSubtitles: subtitles.map(subtitle => ({
      ...subtitle,
      style: {
        fontFamily: style === 'default' ? 'SF Pro Display' : 'SF Pro Text',
        fontSize: style === 'default' ? '16px' : '18px',
        color: style === 'default' ? '#FFFFFF' : '#F8F8F8',
        background: style === 'default' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.8)',
        position: 'bottom'
      }
    })),
    appliedStyle: style
  };
}
