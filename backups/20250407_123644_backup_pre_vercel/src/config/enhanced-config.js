/**
 * Configuration pour la version améliorée de FloDrama
 * Ce fichier centralise les paramètres spécifiques à la version améliorée
 */

const enhancedConfig = {
  // Activer ou désactiver les fonctionnalités améliorées
  features: {
    enhancedCards: true,
    enhancedCarousel: true,
    enhancedHero: true,
    enhancedPlayer: true,
    enhancedHeader: true,
    enhancedFooter: true,
    animations: true,
    caching: true,
    offlineMode: false // À implémenter dans une future version
  },
  
  // Configuration des animations
  animations: {
    duration: 0.3, // secondes
    staggerChildren: 0.05, // délai entre les animations des enfants
    cardHoverScale: 1.05 // échelle lors du survol des cartes
  },
  
  // Configuration du cache
  cache: {
    metadataExpiration: 30 * 60 * 1000, // 30 minutes en millisecondes
    imageExpiration: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
    maxCacheSize: 50 * 1024 * 1024 // 50 Mo en octets
  },
  
  // Configuration des médias
  media: {
    defaultQuality: 'auto',
    availableQualities: ['auto', '1080p', '720p', '480p', '360p'],
    defaultSubtitle: 'fr',
    availableSubtitles: ['fr', 'en', 'ko', 'jp', 'off']
  },
  
  // Configuration de l'interface utilisateur
  ui: {
    cardsPerRow: {
      small: 2,
      medium: 4,
      large: 6,
      xlarge: 8
    },
    defaultTheme: 'dark',
    headerHeight: '70px',
    footerPadding: '60px 40px 40px',
    primaryColor: '#E50914',
    secondaryColor: '#0071eb'
  }
};

export default enhancedConfig;
