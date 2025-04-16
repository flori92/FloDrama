/**
 * Système intelligent de gestion d'images pour FloDrama
 * Permet de charger des images depuis différentes sources avec fallback
 */
export const POSTER_MAPPING = {
  'goblin': 'https://image.tmdb.org/t/p/w500/jMh7903oTJktQAZKdK6dl7EDFsK.jpg',
  'crash-landing-on-you': 'https://image.tmdb.org/t/p/w500/iFFXSsvl4dZkdUKpf88Kp2Rkm7S.jpg',
  'itaewon-class': 'https://image.tmdb.org/t/p/w500/yQUyayLdVhRKQh33P9rDAavjJDl.jpg',
  'squid-game': 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
  'train-to-busan': 'https://image.tmdb.org/t/p/w500/2mFR7ncAUgICQRYL98yLK9qEYA3.jpg',
  'oldboy': 'https://image.tmdb.org/t/p/w500/jB7ol6ry8dlqMp6kKlKHLfPke4e.jpg',
  'the-handmaiden': 'https://image.tmdb.org/t/p/w500/wvzfK5QR6dGLwND8MCzWjsQWG4Q.jpg',
  'minari': 'https://image.tmdb.org/t/p/w500/9Bb6K6HINl3vEKCu8WXEZyHvvpq.jpg',
  'mother': 'https://image.tmdb.org/t/p/w500/fgce3DHrMZDQTJkALT5hVxvbGPf.jpg',
  'parasite': 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'
};

// Remplacer les fonctions de chargement d'image existantes
export function getOptimizedImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // Extraire le nom de base sans extension
  const baseName = imagePath.split('/').pop().split('.')[0];
  
  // Vérifier si nous avons une correspondance dans notre mapping
  if (POSTER_MAPPING[baseName]) {
    return POSTER_MAPPING[baseName];
  }
  
  // Fallback sur Unsplash avec le nom comme requête
  return `https://source.unsplash.com/300x450/?movie,${baseName.replace(/-/g, ',')}`;
}

// Composant LazyImage optimisé
export class LazyImageLoader {
  static preloadImage(src, callback) {
    const fallbackSrc = getOptimizedImageUrl(src);
    const img = new Image();
    
    img.onload = function() {
      if (callback) callback(this.src);
    };
    
    img.onerror = function() {
      console.log(`Utilisation de l'image de fallback pour: ${src}`);
      this.src = fallbackSrc;
    };
    
    img.src = src;
    return img;
  }
}

// Initialisation globale
export function initializeImageSystem() {
  // Patch les fonctions de chargement d'image globales
  if (window.loadImage) {
    // Remplacer complètement la fonction existante
    window.loadImage = function(src, callback) {
      return LazyImageLoader.preloadImage(src, callback);
    };
    console.log("Système d'optimisation d'images FloDrama activé");
  }
}
