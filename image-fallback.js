// Fonction améliorée pour obtenir l'URL optimisée d'une image
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
  
  // Fonction pour vérifier si une image existe
  function imageExists(url) {
    const http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    try {
      http.send();
      return http.status === 200;
    } catch(e) {
      return false;
    }
  }
  
  // Vérification des chemins locaux
  for (let path of localPaths) {
    if (imageExists(path)) {
      console.log(`Image trouvée localement: ${path}`);
      return path;
    }
  }
  
  // Vérifier dans notre mapping TMDB
  if (POSTER_MAPPING[baseName]) {
    console.log(`Utilisation du mapping TMDB pour: ${baseName}`);
    return POSTER_MAPPING[baseName];
  }
  
  // Dernier recours: Unsplash avec le nom comme requête
  console.log(`Fallback vers Unsplash pour: ${baseName}`);
  return `https://source.unsplash.com/300x450/?movie,${baseName.replace(/-/g, ',')}`;
}

// Fonction optimisée de chargement d'image avec retries
function loadImage(src, callback, retryCount = 0) {
  const MAX_RETRIES = 3;
  const preloadImg = new Image();
  
  preloadImg.onload = function() {
    if (callback) callback(this.src);
  };
  
  preloadImg.onerror = function() {
    if (retryCount < MAX_RETRIES) {
      console.log(`Erreur de chargement de l'image: ${src}, essai ${retryCount + 1}/${MAX_RETRIES}`);
      // Essayer le chemin suivant ou le fallback
      const fallbackSrc = getOptimizedImageUrl(src);
      setTimeout(() => loadImage(fallbackSrc, callback, retryCount + 1), 500);
    } else {
      console.error(`Impossible de charger l'image après ${MAX_RETRIES} essais: ${src}`);
      if (callback) callback('https://via.placeholder.com/300x450?text=Image+Non+Disponible');
    }
  };
  
  preloadImg.src = src;
  return preloadImg;
}
