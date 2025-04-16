/**
 * Système amélioré de gestion d'images pour FloDrama
 * Créé le 16 avril 2025
 */

// Mapping des images pour garantir le chargement
const POSTER_MAPPING = {
  'goblin': 'https://image.tmdb.org/t/p/w500/jMh7903oTJktQAZKdK6dl7EDFsK.jpg',
  'crash-landing-on-you': 'https://image.tmdb.org/t/p/w500/iFFXSsvl4dZkdUKpf88Kp2Rkm7S.jpg',
  'itaewon-class': 'https://image.tmdb.org/t/p/w500/yQUyayLdVhRKQh33P9rDAavjJDl.jpg',
  'squid-game': 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
  'train-to-busan': 'https://image.tmdb.org/t/p/w500/2mFR7ncAUgICQRYL98yLK9qEYA3.jpg',
  'oldboy': 'https://image.tmdb.org/t/p/w500/jB7ol6ry8dlqMp6kKlKHLfPke4e.jpg',
  'the-handmaiden': 'https://image.tmdb.org/t/p/w500/wvzfK5QR6dGLwND8MCzWjsQWG4Q.jpg',
  'minari': 'https://image.tmdb.org/t/p/w500/9Bb6K6HINl3vEKCu8WXEZyHvvpq.jpg',
  'mother': 'https://image.tmdb.org/t/p/w500/fgce3DHrMZDQTJkALT5hVxvbGPf.jpg',
  'parasite': 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  'burning': 'https://image.tmdb.org/t/p/w500/8n5ZKh97Wz2C1YpsZxVjARe85gF.jpg',
  'my-love-from-the-star': 'https://image.tmdb.org/t/p/w500/oVOnxvr6xLBdcfZcteA4diE0CQQ.jpg',
  'vincenzo': 'https://image.tmdb.org/t/p/w500/8ToIjpLKSRRR3TT22n2ZceSiNkq.jpg',
  'attack-on-titan': 'https://image.tmdb.org/t/p/w500/aiy35Evcofzl7hNzFdoEZ2xmEb3.jpg',
  'demon-slayer': 'https://image.tmdb.org/t/p/w500/wrCVHdkBlBWdJUZPvnJWcBRuhSY.jpg',
  'jujutsu-kaisen': 'https://image.tmdb.org/t/p/w500/g1rK2nRXSidcMwNliWDIroWWGTn.jpg',
  'your-name': 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
  'solo-leveling': 'https://image.tmdb.org/t/p/w500/waBWGjsksNAopCgqKQGGGQXnKlp.jpg',
  'snowpiercer': 'https://image.tmdb.org/t/p/w500/fVVU9hG6i6jeMv4HdkeeLmXt0n8.jpg',
  'memories-of-murder': 'https://image.tmdb.org/t/p/w500/p3OLukKzk0OMWKl29G2PvHJiGXX.jpg'
};

/**
 * Fonction améliorée pour obtenir l'URL optimisée d'une image
 * Gère plusieurs chemins possibles et utilise un système de fallback
 */
function getOptimizedImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // Extraire le nom de base sans extension
  const baseName = imagePath.split('/').pop().split('.')[0];
  
  // Essayer d'abord en local avec les différents chemins possibles
  const localPaths = [
    `${baseName}.jpg`,
    `assets/posters/${baseName}.jpg`,
    `images/posters/${baseName}.jpg`,
    `/assets/posters/${baseName}.jpg`,
    `/images/posters/${baseName}.jpg`
  ];
  
  // Vérifier dans notre mapping TMDB (solution sûre)
  if (POSTER_MAPPING[baseName]) {
    console.log(`Utilisation du mapping TMDB pour: ${baseName}`);
    return POSTER_MAPPING[baseName];
  }
  
  // Dernier recours: Unsplash avec le nom comme requête
  console.log(`Fallback vers Unsplash pour: ${baseName}`);
  return `https://source.unsplash.com/300x450/?movie,${baseName.replace(/-/g, ',')}`;
}

/**
 * Fonction optimisée de chargement d'image avec retries
 * Gère les erreurs et utilise un système de fallback
 */
function loadImage(src, callback, retryCount = 0) {
  const MAX_RETRIES = 3;
  const preloadImg = new Image();
  
  preloadImg.onload = function() {
    if (callback) callback(this.src);
  };
  
  preloadImg.onerror = function() {
    console.log(`Erreur de chargement de l'image: ${src}`);
    if (retryCount < MAX_RETRIES) {
      // Essayer le fallback
      const fallbackSrc = getOptimizedImageUrl(src);
      setTimeout(() => loadImage(fallbackSrc, callback, retryCount + 1), 500);
    } else {
      console.error(`Impossible de charger l'image après ${MAX_RETRIES} essais: ${src}`);
      // Image de secours finale
      this.src = 'https://via.placeholder.com/300x450?text=Image+Non+Disponible';
      if (callback) callback(this.src);
    }
  };
  
  preloadImg.src = src;
  return preloadImg;
}
