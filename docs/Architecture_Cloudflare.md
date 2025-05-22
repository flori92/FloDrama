# Architecture Cloudflare de FloDrama

## Services frontend

| Nom | URL | Environnement | Description |
|-----|-----|---------------|-------------|
| Frontend principal | [flodrama-frontend.pages.dev](https://flodrama-frontend.pages.dev) | Production | Application React principale |
| Frontend production | [flodrama.com](https://flodrama.com) | Production | Domaine personnalisé |
| Preview identité visuelle | Diverses URLs avec préfixe `identite-visuelle-flodrama` | Prévisualisation | Branches de développement |

## Services backend (Workers)

| Nom | URL | Statut | Description |
|-----|-----|--------|-------------|
| API Principale | [flodrama-api-prod.florifavi.workers.dev](https://flodrama-api-prod.florifavi.workers.dev) | Actif | API centrale pour les contenus |
| Service d'authentification | [flodrama-backend.florifavi.workers.dev](https://flodrama-backend.florifavi.workers.dev) | Actif | Service OAuth Google et gestion des tokens |
| Ancienne API | [round-moon-16e4.florifavi.workers.dev](https://round-moon-16e4.florifavi.workers.dev) | Obsolète | Ancienne version, à décommissionner |
| API avec CORS | [flodrama-api.florifavi.workers.dev](https://flodrama-api.florifavi.workers.dev) | Problématique | Problèmes CORS identifiés |
| API directe | [flodrama-api-worker.florifavi.workers.dev](https://flodrama-api-worker.florifavi.workers.dev) | Inconnu | Version API directe |
| Proxy CORS | [flodrama-cors-proxy.florifavi.workers.dev](https://flodrama-cors-proxy.florifavi.workers.dev) | Inconnu | Proxy pour résolution CORS |

## Services de base de données

| Nom | ID | Type | Description |
|-----|----|----|-------------|
| Database principale | 39a4a8fd-f1fd-49ab-abcc-290fd473a311 | D1 | Base de données principale pour utilisateurs et contenu |

## Ressources KV et R2

| Nom | ID | Type | Description |
|-----|----|----|-------------|
| KV Namespace | 7388919bd83241cfab509b44f819bb2f | KV | Stockage de données clé-valeur |
| Stream | customer-ehlynuge6dnzfnfd.cloudflarestream.com | Stream | Service de streaming vidéo |

## Plan de consolidation

### Phase 1 : Unification des APIs (Objectif immédiat)
- Migrer les fonctionnalités d'authentification vers l'API principale
- Structure cible : `flodrama-api-prod.florifavi.workers.dev`

### Phase 2 : Standardisation (À venir)
- Créer des environnements distincts (prod, staging, dev)
- Implémenter une documentation OpenAPI

### Phase 3 : Optimisation (Long terme)
- Mettre en place un monitoring
- Optimiser les performances
- Automatiser les déploiements
