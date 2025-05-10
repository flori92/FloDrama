# Guide d'amélioration du scraping et de la gestion des images

## Problématique actuelle

Actuellement, l'application rencontre des difficultés avec l'affichage des images :
- Les URLs des images scrapées ne sont pas toujours disponibles ou accessibles
- Les propriétés d'images varient selon les sources (poster_path, image_url, etc.)
- Certaines images sont bloquées par des restrictions CORS

## Solution proposée

### 1. Amélioration du processus de scraping

#### Étape 1 : Récupération systématique des images
```javascript
// Exemple de code pour le scraper
async function scrapeContent(url) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Extraire les informations de base
  const title = $('h1.title').text().trim();
  const description = $('div.description').text().trim();
  
  // Extraire et télécharger les images
  const posterUrl = $('img.poster').attr('src');
  const backdropUrl = $('div.backdrop img').attr('src');
  
  // Télécharger les images
  const posterId = await downloadAndStoreImage(posterUrl, 'poster');
  const backdropId = await downloadAndStoreImage(backdropUrl, 'backdrop');
  
  return {
    title,
    description,
    poster_id: posterId,
    backdrop_id: backdropId
  };
}
```

#### Étape 2 : Stockage des images sur Cloudflare Images
```javascript
async function downloadAndStoreImage(url, type) {
  if (!url) return null;
  
  try {
    // Télécharger l'image
    const response = await fetch(url);
    const imageBuffer = await response.arrayBuffer();
    
    // Générer un ID unique basé sur l'URL et le type
    const uniqueId = generateUniqueId(url, type);
    
    // Stocker sur Cloudflare Images
    const uploadResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {api_token}',
        'Content-Type': 'multipart/form-data'
      },
      body: createFormData(imageBuffer, uniqueId)
    });
    
    const result = await uploadResponse.json();
    
    // Retourner l'ID de l'image stockée
    return result.success ? uniqueId : null;
  } catch (error) {
    console.error(`Erreur lors du téléchargement de l'image ${url}:`, error);
    return null;
  }
}

function generateUniqueId(url, type) {
  // Générer un hash à partir de l'URL
  const hash = createHash('md5').update(url).digest('hex');
  return `${type}_${hash}`;
}
```

### 2. Structure de données standardisée

Stocker les données avec une structure cohérente :

```javascript
{
  "id": "movie_12345",
  "title": "Titre du film",
  "description": "Description du film...",
  "release_date": "2023-01-01",
  "images": {
    "poster": "poster_a1b2c3d4e5f6",
    "backdrop": "backdrop_f6e5d4c3b2a1",
    "thumbnail": "thumbnail_1a2b3c4d5e6f"
  },
  "genres": ["Action", "Drama"],
  "rating": 4.5
}
```

### 3. Accès aux images via une URL standardisée

Dans l'application frontend, utiliser un format d'URL cohérent :

```javascript
function getImageUrl(imageId, size = 'medium') {
  if (!imageId) return '/default-image.png';
  
  const sizes = {
    small: 'w200',
    medium: 'w500',
    large: 'w1000',
    original: 'original'
  };
  
  const sizeParam = sizes[size] || sizes.medium;
  return `https://images.flodrama.com/${sizeParam}/${imageId}`;
}

// Utilisation
const posterUrl = getImageUrl(movie.images.poster, 'medium');
const backdropUrl = getImageUrl(movie.images.backdrop, 'large');
```

## Avantages de cette approche

1. **Contrôle total** sur les images utilisées dans l'application
2. **Élimination des problèmes CORS** puisque les images sont servies depuis votre propre domaine
3. **Optimisation des performances** grâce au réseau CDN de Cloudflare
4. **Structure de données cohérente** facilitant le développement frontend
5. **Résilience** face aux changements des sites sources

## Mise en œuvre

1. Modifier le scraper pour télécharger et stocker les images
2. Configurer Cloudflare Images pour héberger les images
3. Mettre à jour l'API pour renvoyer les IDs d'images standardisés
4. Adapter le frontend pour utiliser le nouveau format d'URL d'images

Cette approche nécessite un investissement initial mais offre une solution robuste et pérenne pour la gestion des images dans l'application.
