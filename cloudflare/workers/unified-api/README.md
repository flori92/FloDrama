# FloDrama Content API

API unifiée pour accéder aux contenus Anime, Drama et Bollywood pour l'application FloDrama.

## 📋 Architecture

L'API FloDrama est construite avec une architecture modulaire qui permet d'agréger des données provenant de plusieurs sources :

- **Anime** : Jikan API (MyAnimeList), Anime API, Animechan API
- **Drama** : KDramas API, MyDramaList API
- **Bollywood** : Bollywood API

L'architecture est composée de :

- **Modèles** : Normalisation des données provenant des différentes APIs
- **Services** : Interaction avec les APIs externes avec gestion du cache
- **Contrôleurs** : Agrégation des données et gestion des fallbacks
- **API Gateway** : Point d'entrée unifié avec routage des requêtes

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# Exécuter les tests
npm test

# Déployer sur Cloudflare Workers
npm run deploy
```

## 🔄 Endpoints disponibles

### Anime

- `GET /api/anime/search` - Rechercher des animes
- `GET /api/anime/trending` - Récupérer les animes en tendance
- `GET /api/anime/recent` - Récupérer les animes récents
- `GET /api/anime/random` - Récupérer un anime aléatoire
- `GET /api/anime/:id` - Récupérer un anime par ID
- `GET /api/anime/:id/episodes` - Récupérer les épisodes d'un anime
- `GET /api/anime/:id/characters` - Récupérer les personnages d'un anime
- `GET /api/anime/:id/recommendations` - Récupérer les recommandations pour un anime
- `GET /api/anime/:id/streaming/:episode` - Récupérer les informations de streaming d'un épisode

### Drama

- `GET /api/drama/search` - Rechercher des dramas
- `GET /api/drama/trending` - Récupérer les dramas en tendance
- `GET /api/drama/recent` - Récupérer les dramas récents
- `GET /api/drama/popular` - Récupérer les dramas populaires
- `GET /api/drama/genre/:genre` - Récupérer les dramas par genre
- `GET /api/drama/country/:country` - Récupérer les dramas par pays
- `GET /api/drama/:id` - Récupérer un drama par ID
- `GET /api/drama/:id/episodes` - Récupérer les épisodes d'un drama
- `GET /api/drama/:id/cast` - Récupérer le casting d'un drama

### Bollywood

- `GET /api/bollywood/search` - Rechercher des films Bollywood
- `GET /api/bollywood/trending` - Récupérer les films Bollywood en tendance
- `GET /api/bollywood/recent` - Récupérer les films Bollywood récents
- `GET /api/bollywood/popular` - Récupérer les films Bollywood populaires
- `GET /api/bollywood/genre/:genre` - Récupérer les films Bollywood par genre
- `GET /api/bollywood/actor/:actor` - Récupérer les films Bollywood par acteur
- `GET /api/bollywood/director/:director` - Récupérer les films Bollywood par réalisateur
- `GET /api/bollywood/:id` - Récupérer un film Bollywood par ID

## 🔧 Configuration

L'API utilise Cloudflare Workers et KV pour le stockage en cache. La configuration est définie dans le fichier `wrangler.toml`.

## 🧪 Tests

Les tests unitaires sont implémentés avec Jest et couvrent :

- Modèles de données
- Services d'API
- Contrôleurs
- API Gateway

Pour exécuter les tests :

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec surveillance des modifications
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage
```

## 📦 Déploiement

L'API est déployée sur Cloudflare Workers. Pour déployer :

```bash
# Déployer en production
npm run deploy

# Déployer en environnement de staging
npm run deploy:staging
```

## 🔒 Sécurité

L'API implémente les headers CORS appropriés pour sécuriser les requêtes cross-origin.

## 📈 Performance

L'API utilise un système de cache à deux niveaux :

1. **Cloudflare KV** pour le stockage persistant
2. **Cache API** comme fallback pour les environnements sans KV

La durée de vie du cache est configurable par endpoint.
