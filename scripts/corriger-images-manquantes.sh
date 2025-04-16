#!/bin/bash

# Script de correction des images manquantes pour FloDrama
# Ce script télécharge les images depuis TMDB et les place dans les bons dossiers

echo "📋 Correction des erreurs 404 pour les images dans FloDrama"

# Création des dossiers nécessaires
echo "🔧 Création des dossiers d'images..."
mkdir -p ../public/assets/posters
mkdir -p ../public/images/posters

# Liste des images à télécharger avec leur URL TMDB
declare -A IMAGES
IMAGES=(
  ["goblin"]="https://image.tmdb.org/t/p/w500/jMh7903oTJktQAZKdK6dl7EDFsK.jpg"
  ["crash-landing-on-you"]="https://image.tmdb.org/t/p/w500/iFFXSsvl4dZkdUKpf88Kp2Rkm7S.jpg"
  ["itaewon-class"]="https://image.tmdb.org/t/p/w500/yQUyayLdVhRKQh33P9rDAavjJDl.jpg"
  ["squid-game"]="https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg"
  ["train-to-busan"]="https://image.tmdb.org/t/p/w500/2mFR7ncAUgICQRYL98yLK9qEYA3.jpg"
  ["oldboy"]="https://image.tmdb.org/t/p/w500/jB7ol6ry8dlqMp6kKlKHLfPke4e.jpg"
  ["the-handmaiden"]="https://image.tmdb.org/t/p/w500/wvzfK5QR6dGLwND8MCzWjsQWG4Q.jpg"
  ["minari"]="https://image.tmdb.org/t/p/w500/9Bb6K6HINl3vEKCu8WXEZyHvvpq.jpg"
  ["mother"]="https://image.tmdb.org/t/p/w500/fgce3DHrMZDQTJkALT5hVxvbGPf.jpg"
  ["parasite"]="https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"
  ["burning"]="https://image.tmdb.org/t/p/w500/8n5ZKh97Wz2C1YpsZxVjARe85gF.jpg"
  ["my-love-from-the-star"]="https://image.tmdb.org/t/p/w500/oVOnxvr6xLBdcfZcteA4diE0CQQ.jpg"
  ["vincenzo"]="https://image.tmdb.org/t/p/w500/8ToIjpLKSRRR3TT22n2ZceSiNkq.jpg"
  ["attack-on-titan"]="https://image.tmdb.org/t/p/w500/aiy35Evcofzl7hNzFdoEZ2xmEb3.jpg"
  ["demon-slayer"]="https://image.tmdb.org/t/p/w500/wrCVHdkBlBWdJUZPvnJWcBRuhSY.jpg"
  ["jujutsu-kaisen"]="https://image.tmdb.org/t/p/w500/g1rK2nRXSidcMwNliWDIroWWGTn.jpg"
  ["your-name"]="https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg"
  ["solo-leveling"]="https://image.tmdb.org/t/p/w500/waBWGjsksNAopCgqKQGGGQXnKlp.jpg"
  ["snowpiercer"]="https://image.tmdb.org/t/p/w500/fVVU9hG6i6jeMv4HdkeeLmXt0n8.jpg"
  ["memories-of-murder"]="https://image.tmdb.org/t/p/w500/p3OLukKzk0OMWKl29G2PvHJiGXX.jpg"
)

# Téléchargement des images dans les deux dossiers
echo "🔽 Téléchargement des images depuis TMDB..."
for image in "${!IMAGES[@]}"; do
  url="${IMAGES[$image]}"
  
  # Télécharger l'image dans assets/posters
  echo "  📥 Téléchargement de $image.jpg"
  curl -s "$url" -o "../public/assets/posters/$image.jpg"
  
  # Copier l'image dans images/posters pour être sûr
  cp "../public/assets/posters/$image.jpg" "../public/images/posters/"
  
  # Copier aussi à la racine (pour les chemins sans préfixe)
  cp "../public/assets/posters/$image.jpg" "../public/"
done

echo "✅ Téléchargement des images terminé"

# Modification du fichier index.html pour améliorer le système de fallback
echo "🔄 Mise à jour du système de fallback dans index.html..."

# Sauvegarde du fichier original
cp ../index.html ../index.html.bak

# Création du nouveau code de gestion d'images plus robuste
cat > ../image-fallback.js << 'EOF'
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
EOF

# Remplacer le code existant dans index.html
sed -i '' "s|// Fonction pour obtenir l'URL optimisée d'une image.*// Fonction optimisée de chargement d'image avec retries|$(cat ../image-fallback.js)|" ../index.html

echo "✅ Système de fallback amélioré"
echo "🎉 Toutes les corrections ont été appliquées avec succès!"
