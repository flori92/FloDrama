# Guide d'intégration du Worker Cloudflare avec FloDrama

Ce document explique comment intégrer le Worker Cloudflare avec le frontend FloDrama pour afficher correctement les données scrapées.

## 🔄 Modifications apportées au Worker

Le Worker a été mis à jour pour prendre en charge toutes les fonctionnalités nécessaires au frontend FloDrama :

1. **URLs de streaming et de trailer** :
   - Génération automatique d'URLs de streaming pour chaque contenu
   - Extraction de l'ID YouTube à partir des URLs de trailer
   - Support des prévisualisations via les IDs YouTube

2. **Support des banners et cartes** :
   - Endpoint `/banners` pour récupérer les contenus mis en avant
   - Propriétés `is_banner`, `is_featured` et `is_new` pour l'affichage
   - Sélection aléatoire de contenus pour les banners

3. **Format de données unifié** :
   - Transformation des données pour correspondre au format attendu par le frontend
   - Ajout des propriétés manquantes
   - Gestion des différents formats de données sources

## 🚀 Déploiement du Worker

Pour déployer le Worker, suivez ces étapes :

1. Copiez le contenu du fichier `flodrama-api-worker-updated.js` dans `flodrama-api-worker.js`
2. Exécutez la commande suivante :

```bash
cd /Users/floriace/FLO_DRAMA/FloDrama/cloudflare/workers
npx wrangler deploy
```

3. Vérifiez que le Worker est correctement déployé en accédant à l'URL :
   `https://flodrama-api-worker.yourdomain.workers.dev/health`

## 🔗 Intégration avec le frontend

Pour que le frontend utilise correctement le Worker, assurez-vous que :

1. La variable `API_BASE_URL` dans `CloudflareConfig.js` pointe vers l'URL de votre Worker
2. Le paramètre `useCloudflareApi` est activé dans les composants `RowPost`
3. Les routes utilisées dans le frontend correspondent à celles du Worker

## 📊 Structure des données

Le Worker transforme les données pour qu'elles aient la structure suivante :

```javascript
{
  id: "unique-id",
  title: "Titre du contenu",
  originalTitle: "Titre original",
  year: 2023,
  rating: "4.5",
  type: "drama", // ou "film", "anime", "bollywood"
  source: "source-name",
  url: "https://example.com/content",
  image: "https://example.com/image.jpg",
  description: "Description du contenu",
  genres: ["Genre1", "Genre2"],
  trailer_url: "https://youtube.com/watch?v=ABCDEF123456",
  youtube_id: "ABCDEF123456",
  streaming_url: "https://streaming.example.com/content.mp4",
  is_banner: false,
  is_featured: false,
  is_new: true,
  category: "drama"
}
```

## 🔍 Tests et dépannage

Pour tester le Worker, vous pouvez utiliser les endpoints suivants :

- `/health` - Vérifier que le Worker fonctionne
- `/banners` - Récupérer les banners pour la page d'accueil
- `/dramas` - Récupérer les dramas
- `/animes` - Récupérer les animes
- `/films` - Récupérer les films
- `/bollywood` - Récupérer les contenus Bollywood

En cas de problème, vérifiez les logs du Worker dans le dashboard Cloudflare.
