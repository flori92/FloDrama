# Documentation Technique FloDrama

## Architecture Globale

FloDrama est une application de streaming organisée selon une architecture moderne :

- **Front-end** : Application React (`New-FloDrama`) 
- **Back-end** : API REST Cloudflare Workers (`FloDrama-Cloudflare`)
- **Base de données** : Cloudflare D1 (SQL)
- **Alimentation de contenu** : Pipeline de scraping automatisé (`cloudflare/scraping`)

## Pipeline de Données

```
Scraping → Conversion → Injection SQL → API Cloudflare → Front-end React
```

### 1. Scraping (`cloudflare/scraping/`)

- **Scripts spécialisés** par catégorie : `drama-scrapers.js`, `anime-scrapers.js`, `film-scrapers.js`, `bollywood-scrapers.js`
- **Stratégies variées** : direct, browser, HTML parsing, APIs tierces (TMDb, etc.)
- **Monitoring** intégré pour la fiabilité et les logs
- **Résultats** stockés dans `scraping-results/` puis convertis dans `scraping-results-converted/`

### 2. Injection SQL (`cloudflare/scraping/scripts/inject_scraped_content.js`)

- Script Node.js qui :
  - Parcourt les fichiers JSON convertis
  - Génère des requêtes SQL `INSERT OR REPLACE`
  - Insère dans les tables correspondantes (`dramas`, `animes`, `films`, `bollywood`)
  - Loggue les succès/erreurs

### 3. API Cloudflare (`FloDrama-Cloudflare/api/`)

- **Endpoints REST** :
  - `/api/dramas`, `/api/animes`, `/api/films`, `/api/bollywood` (GET)
  - `/api/dramas/trending`, `/api/dramas/featured`, etc. (vues spéciales)
  - `/api/users/:id/favorites` et `/api/users/:id/history` (gestion des listes personnalisées)
- **Réponses standardisées** avec gestion d'erreurs

### 4. Front-end React (`New-FloDrama/`)

- **Composants principaux** : `Home`, `RowPost`, `MoviePopUp`, `UserMovieSection`, etc.
- **Hooks personnalisés** : `useUpdateMylist`, `useUpdateLikedMovies`, `useUpdateWatchedMovies`
- **Constantes d'API** : `FloDramaURLs.js` (centralisées)
- **Authentification** : Firebase (à migrer vers Cloudflare si besoin)

## Automatisation

Le pipeline complet est automatisé via le script `cloudflare/scraping/scripts/pipeline_automatise.sh` qui :
1. Lance les scripts de scraping
2. Convertit les résultats
3. Injecte dans la base SQL
4. Vérifie la disponibilité des données via l'API
5. Notifie en cas de succès/erreur

**Configuration cron recommandée** : Exécution quotidienne à 3h du matin
```
0 3 * * * /chemin/vers/FloDrama/cloudflare/scraping/scripts/pipeline_automatise.sh
```

## Points de vigilance

- **Sécurité des API** : Authentification pour les endpoints sensibles (favoris, historique)
- **Gestion des erreurs** : Monitoring et logs centralisés
- **Performance** : Pagination pour les listes volumineuses
- **Cohérence des données** : Format standardisé entre scraping et API

## Évolutions possibles

- **Interface d'administration** : Ajout d'endpoints CRUD pour gérer le contenu
- **Recherche avancée** : Filtrage par genre, année, pays, etc.
- **Migration complète** : Passage de Firebase à Cloudflare pour l'authentification

## Journal des décisions architecturales

| Date | Décision | Justification | Alternatives considérées |
|------|----------|---------------|--------------------------|
| 2025-05-08 | Migration des hooks utilisateur vers l'API Cloudflare | Centralisation de la logique métier, cohérence | Conserver Firebase |
| 2025-05-08 | Automatisation du pipeline complet | Fiabilité, régularité des mises à jour | Mise à jour manuelle |
| 2025-05-08 | Conservation de l'authentification Firebase | Stabilité, transition progressive | Migration complète vers Cloudflare Auth |

---

*Documentation créée le 2025-05-08 par l'équipe FloDrama*
