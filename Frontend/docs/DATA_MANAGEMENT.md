# Gestion des Données dans FloDrama

Ce document explique comment les données sont gérées dans le frontend de FloDrama, en particulier comment les données sont chargées, transformées et utilisées dans les composants UI.

## Architecture de Données

FloDrama utilise une architecture de données en couches pour séparer les préoccupations et faciliter la maintenance :

1. **Sources de données** : Les données peuvent provenir de plusieurs sources :
   - API Backend (via AWS Lambda et API Gateway)
   - Fichiers JSON statiques (pour le développement)
   - Fichiers JSON dans S3/CloudFront (pour la production)

2. **Modèles de données** : Définition des types de données utilisés dans l'application
   - Types de données brutes (provenant des sources)
   - Types de données UI (utilisés par les composants)

3. **Adaptateurs** : Conversion entre les types de données brutes et les types UI
   - Transformation des données pour les adapter aux besoins des composants
   - Enrichissement des données avec des informations supplémentaires

4. **Composants UI** : Affichage des données dans l'interface utilisateur
   - Utilisation des types UI pour le rendu
   - Gestion des interactions utilisateur

## Structure des Fichiers

```
Frontend/
├── src/
│   ├── data/
│   │   ├── index.ts              # Point d'entrée pour le chargement des données
│   │   ├── adapters.ts           # Adaptateurs pour transformer les données
│   │   ├── static/               # Données statiques pour le développement
│   │   └── local/                # Données locales pour le développement
│   └── config/
│       └── data.ts               # Configuration des sources de données
└── components/
    ├── ui/
    │   ├── types.ts              # Types pour les composants UI
    │   ├── CategorySection.tsx   # Composant pour afficher les catégories
    │   ├── TrendingStats.tsx     # Composant pour afficher les statistiques
    │   └── ...                   # Autres composants UI
    └── HomePage.tsx              # Page principale qui utilise les composants
```

## Flux de Données

1. **Chargement des données** : Les données sont chargées depuis la source appropriée (API, fichiers statiques, S3) via les fonctions dans `src/data/index.ts`.

2. **Transformation des données** : Les données brutes sont transformées en types UI via les adaptateurs dans `src/data/adapters.ts`.

3. **Stockage des données** : Les données brutes et les données UI sont stockées dans l'état du composant via React Hooks.

4. **Affichage des données** : Les données UI sont passées aux composants pour l'affichage.

## Types de Données

### Types de Données Brutes

```typescript
// ContentItem - Élément de contenu (film, série, etc.)
interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  videoUrl?: string;
  score?: number;
  popularity?: number;
  releaseDate?: string;
  addedDate?: string;
  category: string;
  source: string;
  tags: string[];
  isFeatured?: boolean;
}

// Category - Catégorie de contenu
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sources: {
    id: string;
    name: string;
    count: number;
    image: string;
  }[];
}

// Metadata - Métadonnées globales
interface Metadata {
  lastUpdate: string;
  contentCounts: {
    total: number;
    popular: number;
    featured: number;
    topRated: number;
    recently: number;
  };
  trends?: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    popularGenres: { name: string; percentage: number; }[];
    popularSources: { name: string; percentage: number; }[];
  };
  userStats?: {
    totalUsers: number;
    activeUsers: number;
    averageWatchTime: number;
    completionRate: number;
  };
  platformPerformance?: {
    averageLoadTime: number;
    cacheHitRate: number;
    cdnPerformance: number;
    apiResponseTime: number;
  };
}
```

### Types de Données UI

```typescript
// ContentItem - Pour les composants ContentCard, ContentRow, etc.
interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  year: number;
  rating: number;
  duration: string;
  category?: string;
  tags?: string[];
}

// HeroContent - Pour le composant HeroBanner
interface HeroContent {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  videoUrl?: string;
}

// Category - Pour le composant CategorySection
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  sources: Source[];
}

// Source - Pour les sources dans les catégories
interface Source {
  id: string;
  name: string;
  count: number;
  image: string;
  url: string;
}

// StatItem - Pour le composant TrendingStats
interface StatItem {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

// Recommendation - Pour le composant PersonalizedRecommendations
interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  source?: string;
  score: number;
  popularity: number;
  releaseDate: string;
}
```

## Comment Ajouter de Nouveaux Contenus

### 1. Ajouter des Données Statiques pour le Développement

Pour ajouter de nouveaux contenus pour le développement, vous pouvez ajouter des fichiers JSON dans le dossier `Frontend/src/data/static/` :

```json
// featured.json, popular.json, recently.json, topRated.json
[
  {
    "id": "item-1",
    "title": "Titre du Contenu",
    "subtitle": "Sous-titre",
    "description": "Description du contenu",
    "image": "https://flodrama-content-1745269660.s3.amazonaws.com/images/featured/item-1.jpg",
    "videoUrl": "https://flodrama-content-1745269660.s3.amazonaws.com/videos/previews/item-1.mp4",
    "score": 8.5,
    "popularity": 90,
    "releaseDate": "2023-05-15",
    "addedDate": "2025-04-01",
    "category": "drama",
    "source": "dramacool",
    "tags": ["romance", "comédie", "corée du sud"],
    "isFeatured": true
  },
  // ... autres éléments
]
```

### 2. Ajouter des Catégories

Pour ajouter de nouvelles catégories, vous pouvez modifier le fichier `Frontend/src/data/static/categories.json` :

```json
[
  {
    "id": "drama",
    "name": "Dramas",
    "description": "Séries dramatiques asiatiques avec des histoires captivantes",
    "icon": "film",
    "color": "from-blue-500 to-purple-600",
    "sources": [
      {
        "id": "korean",
        "name": "Coréens",
        "count": 245,
        "image": "https://flodrama-content-1745269660.s3.amazonaws.com/images/categories/korean.jpg"
      },
      // ... autres sources
    ]
  },
  // ... autres catégories
]
```

### 3. Mettre à Jour les Métadonnées

Pour mettre à jour les métadonnées globales, vous pouvez modifier le fichier `Frontend/src/data/static/metadata.json` :

```json
{
  "lastUpdate": "2025-04-22T15:30:00Z",
  "contentCounts": {
    "total": 1245,
    "popular": 245,
    "featured": 187,
    "topRated": 134,
    "recently": 89
  },
  "trends": {
    "weeklyGrowth": 12.5,
    "monthlyGrowth": 8.3,
    "popularGenres": [
      {
        "name": "Romance",
        "percentage": 28.5
      },
      // ... autres genres
    ],
    "popularSources": [
      {
        "name": "Corée du Sud",
        "percentage": 42.8
      },
      // ... autres sources
    ]
  },
  // ... autres métadonnées
}
```

## Déploiement des Données

Pour déployer les données en production, utilisez le script `scripts/generate_aggregated_content.py` qui :

1. Récupère les données brutes depuis les sources (MongoDB, fichiers JSON, etc.)
2. Traite et agrège les données
3. Génère les fichiers JSON pour le frontend
4. Téléverse les fichiers vers S3
5. Invalide le cache CloudFront

```bash
# Exécuter le script de génération de contenu
python scripts/generate_aggregated_content.py
```

## Optimisation des Images

FloDrama utilise une fonction Lambda@Edge pour optimiser les images à la volée. Cette fonction est déployée via le script `scripts/deploy-image-optimizer.sh` et permet :

1. Redimensionnement des images
2. Conversion de format (WebP, JPEG, PNG)
3. Ajustement de la qualité
4. Effet de flou (pour le chargement progressif)
5. Mise en cache des images optimisées

Pour utiliser cette fonctionnalité, utilisez le composant `OptimizedImage` :

```tsx
import { OptimizedImage } from "./ui/OptimizedImage";

// Dans votre composant
<OptimizedImage
  src="https://flodrama-content-1745269660.s3.amazonaws.com/images/featured/item-1.jpg"
  alt="Titre du contenu"
  width={300}
  height={450}
  quality={80}
  format="webp"
  blur={5}
  className="rounded-lg"
/>
```

## Bonnes Pratiques

1. **Séparation des préoccupations** : Gardez les types de données brutes séparés des types UI.
2. **Adaptateurs explicites** : Utilisez toujours les adaptateurs pour convertir les données.
3. **Types forts** : Utilisez TypeScript pour typer toutes les données.
4. **Fallbacks** : Prévoyez toujours des valeurs par défaut en cas de données manquantes.
5. **Optimisation des images** : Utilisez le composant `OptimizedImage` pour toutes les images.
6. **Lazy loading** : Chargez les données et les composants de manière paresseuse.
7. **Mise en cache** : Utilisez la mise en cache pour les données qui changent rarement.
8. **Tests** : Testez les adaptateurs et les composants avec des données fictives.

## Ressources

- [Documentation AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
- [Documentation AWS CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [Documentation AWS Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)
- [Documentation React](https://reactjs.org/docs/getting-started.html)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
