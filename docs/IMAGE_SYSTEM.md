# Système de Gestion d'Images FloDrama

## Vue d'ensemble

Le système de gestion d'images de FloDrama est une solution robuste et performante pour le chargement, la gestion et l'affichage des images dans l'application. Il offre des mécanismes avancés de fallback, une intégration transparente avec les services de scraping et de gestion de contenu, et une expérience utilisateur optimale même en cas d'indisponibilité des ressources.

## Caractéristiques principales

- **Multi-source avec fallback automatique** : Utilisation de GitHub Pages et AWS CloudFront avec basculement intelligent
- **Génération dynamique de SVG** : Création de placeholders respectant l'identité visuelle de FloDrama
- **Intégration avec les services existants** : Synchronisation avec ContentDataService et ScrapingService
- **Composant React réutilisable** : Composant `FloDramaImage` pour une intégration facile
- **Cache multi-niveaux** : Mise en cache en mémoire pour des performances optimales
- **Surveillance des CDNs** : Vérification périodique de la disponibilité des CDNs
- **Scripts de synchronisation** : Outils pour maintenir la cohérence des images entre les différentes sources

## Architecture

Le système de gestion d'images est composé de plusieurs modules interconnectés :

```
src/
├── components/
│   ├── FloDramaImage.jsx           # Composant React réutilisable
│   └── FloDramaImage.css           # Styles pour le composant
├── config/
│   └── imageSystemConfig.js        # Configuration centralisée
├── services/
│   └── ImageIntegrationService.js  # Service d'intégration avec les autres services
├── pages/
│   └── ExamplePage.jsx             # Page d'exemple d'utilisation
└── scripts/
    ├── generate-placeholders.sh    # Script de génération de placeholders
    └── sync-images.sh              # Script de synchronisation des images
```

## Flux de chargement des images

1. **Demande d'image** : L'application demande une image pour un contenu spécifique
2. **Vérification du cache** : Le système vérifie si l'image est déjà en cache
3. **Tentative de chargement** : Si non cachée, tentative de chargement depuis GitHub Pages (source prioritaire)
4. **Mécanisme de fallback** : En cas d'échec, tentative avec AWS CloudFront
5. **Recherche dans les services** : Si les CDNs échouent, recherche dans ContentDataService et ScrapingService
6. **Génération de SVG** : Si toutes les sources échouent, génération d'un SVG dynamique
7. **Mise en cache** : L'image réussie est mise en cache pour les futures demandes

## Types d'images supportés

- **POSTER** : Affiches de films/séries (ratio 2:3)
- **BACKDROP** : Arrière-plans (ratio 16:9)
- **THUMBNAIL** : Vignettes (ratio 16:9)
- **LOGO** : Logos (ratio 10:3)

## Identité visuelle

Le système respecte l'identité visuelle de FloDrama avec :

- **Bleu signature** : `#3b82f6`
- **Fuchsia accent** : `#d946ef`
- **Dégradé signature** : `linear-gradient(to right, #3b82f6, #d946ef)`
- **Fond principal** : `#121118`
- **Fond secondaire** : `#1A1926`

## Intégration dans les pages HTML

### Intégration automatique

Le système s'intègre automatiquement dans les pages HTML via le script `flodrama-image-system.js` :

```html
<!-- Intégration du système de gestion d'images -->
<script src="/js/flodrama-image-system.js"></script>
```

### Utilisation avec le composant React

Pour utiliser le composant React dans vos pages :

```jsx
import FloDramaImage from '../components/FloDramaImage';
import '../components/FloDramaImage.css';

// Dans votre composant
<FloDramaImage
  contentId="drama001"
  type="poster"
  alt="Crash Landing on You"
  showPlaceholder={true}
/>
```

### Utilisation manuelle dans le HTML

Pour utiliser manuellement le système dans vos pages HTML :

```html
<img 
  src="" 
  alt="Drama 1" 
  class="drama-poster" 
  data-content-id="drama001" 
  data-type="poster"
  onload="this.classList.remove('loading-placeholder')"
  onerror="FloDramaImageSystem.handleImageError(event)"
>

<script>
  // Initialiser les images avec les sources appropriées
  document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img[data-content-id]');
    
    images.forEach(img => {
      const contentId = img.dataset.contentId;
      const type = img.dataset.type;
      
      if (contentId && type) {
        // Ajouter la classe de chargement
        img.classList.add('loading-placeholder');
        
        // Générer les sources d'images
        const sources = FloDramaImageSystem.generateImageSources(contentId, type);
        
        // Utiliser la première source disponible
        if (sources.length > 0) {
          img.src = sources[0];
        } else {
          // Appliquer le fallback SVG si aucune source n'est disponible
          FloDramaImageSystem.applyFallbackSvg(img, contentId, type);
        }
      }
    });
  });
</script>
```

## Bonnes pratiques

1. **Attributs data-*** : Toujours ajouter `data-content-id` et `data-type` aux balises `<img>` :
   ```html
   <img 
     src="" 
     data-content-id="drama001" 
     data-type="poster" 
     alt="Crash Landing on You" 
     class="drama-poster"
   >
   ```

2. **Gestionnaire d'erreur** : Ajouter le gestionnaire d'erreur aux images importantes :
   ```html
   <img src="..." onerror="FloDramaImageSystem.handleImageError(event)">
   ```

3. **Classes CSS** : Utiliser les classes CSS appropriées pour les différents types d'images :
   ```css
   .drama-poster { aspect-ratio: 2/3; }
   .drama-backdrop { aspect-ratio: 16/9; }
   .drama-thumbnail { aspect-ratio: 16/9; }
   ```

## Configuration

La configuration du système est centralisée dans `src/config/imageSystemConfig.js`. Les principaux paramètres configurables sont :

- Sources d'images et leur priorité
- Configuration du fallback SVG
- Types d'images et leurs dimensions
- Paramètres de cache

## Débogage

Pour vérifier l'état des CDNs et des images :

```javascript
// Dans la console du navigateur
FloDramaImageSystem.checkAllCdnStatus().then(console.log);

// Voir les sources disponibles pour une image
console.log(FloDramaImageSystem.generateImageSources('drama001', 'poster'));
```

## Scripts utilitaires

Le système inclut plusieurs scripts utilitaires :

### generate-placeholders.sh

Script pour générer des placeholders pour les images manquantes :

```bash
# Rendre le script exécutable
chmod +x scripts/generate-placeholders.sh

# Exécuter le script
./scripts/generate-placeholders.sh
```

### sync-images.sh

Script pour synchroniser les images entre GitHub Pages et AWS CloudFront :

```bash
# Rendre le script exécutable
chmod +x scripts/sync-images.sh

# Exécuter le script
./scripts/sync-images.sh
```

## Intégration avec les services existants

Le service `ImageIntegrationService` assure l'intégration avec les services existants :

- **ContentDataService** : Récupération des métadonnées des contenus
- **ScrapingService** : Récupération des images depuis des sources externes

```javascript
// Exemple d'utilisation du service d'intégration
import imageIntegrationService from '../services/ImageIntegrationService';

// Récupérer l'URL d'une image
const imageUrl = await imageIntegrationService.fetchContentImage('drama001', 'poster');

// Enrichir un contenu avec des URLs d'images
const enrichedContent = imageIntegrationService.enrichContentWithImages(content);
```

## Performances

Le système est conçu pour optimiser les performances avec :

- Préchargement des images populaires
- Cache en mémoire pour les images fréquemment utilisées
- Chargement asynchrone des images non critiques
- Génération efficace de SVG pour les fallbacks
- Animations de chargement pour améliorer l'expérience utilisateur

## Maintenance

Pour maintenir le système en bon état :

1. Vérifier régulièrement l'état des CDNs avec `FloDramaImageSystem.checkAllCdnStatus()`
2. Exécuter le script `sync-images.sh` pour synchroniser les images entre les différentes sources
3. Générer des placeholders pour les nouvelles images avec `generate-placeholders.sh`
4. Surveiller les erreurs de chargement d'images dans la console du navigateur

---

 FloDrama 2023 - Système de gestion d'images v2.0
