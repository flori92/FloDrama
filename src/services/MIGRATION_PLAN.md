# Plan de Migration des Services FloDrama

## Objectif
Converger vers une source unique de services (`src/services`) qui regroupe toutes les fonctionnalités actuellement réparties entre `Frontend/services` et `src/services`.

## Inventaire des Services Existants

### Services dans `src/services`
| Service | Fonctionnalités | Dépendances | Destination | Statut |
|---------|----------------|-------------|------------|--------|
| ContentDataService.js | Gestion des données de contenu, mise en cache | Aucune | `content/ContentDataService.js` | ✅ Migré |
| FavoritesService.js | Gestion des favoris utilisateur | localStorage | `user/FavoritesService.js` | ✅ Migré |
| RecommendationService.js | Recommandations personnalisées | ContentDataService, FavoritesService | `user/RecommendationService.js` | ✅ Migré |
| SearchService.js | Recherche et indexation | ContentDataService | `ui/SearchService.js` | 🔄 À migrer |
| ImageIntegrationService.js | Intégration d'images | Aucune | `content/ImageService.js` | ✅ Migré |

### Services dans `Frontend/services`
| Service | Fonctionnalités | Dépendances | Action | Statut |
|---------|----------------|-------------|--------|--------|
| AdaptiveScraperService.js | Scraping adaptatif | ProxyService | Migrer vers `core/ScrapingService.js` | ✅ Migré |
| ApiService.js | Communication API | Aucune | Migrer vers `core/ApiService.js` | ✅ Migré |
| ApiService.mock.js | Mocks pour tests | ApiService | Migrer vers `core/ApiService.mock.js` | 🔄 À migrer |
| AuthService.js | Authentification | ApiService | Migrer vers `core/AuthService.js` | ✅ Migré |
| BrowserFingerprintService.js | Empreinte navigateur | Aucune | Migrer vers `core/SecurityService.js` | 🔄 À migrer |
| CachedProxyService.js | Proxy avec cache | ProxyService | Fusionner avec `core/ApiService.js` | ✅ Migré |
| ContentCategorizer.js | Catégorisation | Aucune | Migrer vers `content/ContentCategorizer.js` | ✅ Migré |
| ContentDataService.js | Gestion de contenu | ApiService | Fusionner avec `src/services/ContentDataService.js` | ✅ Migré |
| ContentService.js | Services de contenu | ContentDataService | Fusionner avec `content/ContentDataService.js` | ✅ Migré |
| HumanBehaviorService.js | Simulation comportement | Aucune | Migrer vers `ui/InteractionService.js` | 🔄 À migrer |
| HybridBridgeService.js | Pont entre services | Multiples | Remplacer par `src/bridge.js` | ✅ Migré |
| InMemoryIndex.js | Indexation en mémoire | Aucune | Fusionner avec `ui/SearchService.js` | 🔄 À migrer |
| IndexedDBService.js | Stockage IndexedDB | Aucune | Migrer vers `core/StorageService.js` | ✅ Migré |
| PayPalService.js | Intégration PayPal | ApiService | Migrer vers `core/PaymentService.js` | 🔄 À migrer |
| ProxyService.js | Proxy pour requêtes | Aucune | Fusionner avec `core/ApiService.js` | ✅ Migré |
| ScrapingService.js | Scraping de contenu | ProxyService | Fusionner avec `core/ScrapingService.js` | ✅ Migré |
| SearchIndexService.js | Indexation recherche | Aucune | Fusionner avec `ui/SearchService.js` | 🔄 À migrer |
| SmartScrapingService.js | Scraping intelligent | ScrapingService | Fusionner avec `core/ScrapingService.js` | ✅ Migré |
| SubscriptionService.js | Gestion abonnements | ApiService, PayPalService | Migrer vers `user/SubscriptionService.js` | ✅ Migré |
| TranslationService.js | Traduction | ApiService | Migrer vers `ui/TranslationService.js` | 🔄 À migrer |
| UserDataService.js | Données utilisateur | ApiService, StorageService | Migrer vers `user/UserDataService.js` | ✅ Migré |
| VideoPlaybackService.js | Lecture vidéo | Aucune | Migrer vers `content/VideoService.js` | ✅ Migré |
| WatchPartyService.js | Visionnage en groupe | ApiService | Migrer vers `user/WatchPartyService.js` | ✅ Migré |
| videoScraper.js | Scraping vidéo | ScrapingService | Fusionner avec `core/ScrapingService.js` | ✅ Migré |

## Plan de Migration par Phase

### Phase 1 : Services Fondamentaux (Core) ✅ TERMINÉ
1. ✅ Créer `core/ApiService.js` (fusionner Frontend/ApiService.js, ProxyService.js, CachedProxyService.js)
2. ✅ Créer `core/StorageService.js` (fusionner localStorage, IndexedDBService.js)
3. ✅ Créer `core/AuthService.js` (migrer Frontend/AuthService.js)
4. ✅ Créer `core/ScrapingService.js` (fusionner les services de scraping)

### Phase 2 : Services de Contenu ✅ TERMINÉ
1. ✅ Migrer `src/services/ContentDataService.js` vers `content/ContentDataService.js`
2. ✅ Fusionner avec Frontend/ContentService.js et Frontend/ContentDataService.js
3. ✅ Migrer `content/ContentCategorizer.js`
4. ✅ Migrer `content/VideoService.js` et `content/ImageService.js`

### Phase 3 : Services Utilisateur ✅ TERMINÉ
1. ✅ Migrer `src/services/FavoritesService.js` vers `user/FavoritesService.js`
2. ✅ Migrer `src/services/RecommendationService.js` vers `user/RecommendationService.js`
3. ✅ Créer `user/UserDataService.js` et `user/WatchHistoryService.js`
4. ✅ Migrer `user/SubscriptionService.js` et `user/WatchPartyService.js`

### Phase 4 : Services d'Interface 🔄 EN COURS
1. 🔄 Migrer `src/services/SearchService.js` vers `ui/SearchService.js`
2. 🔄 Fusionner avec Frontend/SearchIndexService.js et InMemoryIndex.js
3. 🔄 Migrer `ui/TranslationService.js` et `ui/NotificationService.js`
4. 🔄 Créer `ui/InteractionService.js`

### Phase 5 : Nettoyage et Finalisation 🔄 À VENIR
1. 🔄 Mettre à jour toutes les importations dans les composants
2. 🔄 Supprimer les services obsolètes dans Frontend/services
3. 🔄 Mettre à jour la documentation et les tests

## Stratégie de Migration pour les Composants

### Composants React
1. Créer des wrappers via le bridge pour chaque service migré
2. Mettre à jour les importations pour utiliser `src/services/index.js`
3. Tester intensivement chaque composant après migration

### Composants Vanilla JS
1. Mettre à jour les importations pour utiliser `src/services/index.js`
2. Utiliser la fonction `initializeServices()` pour l'initialisation

## Calendrier Estimé et Progression
- Phase 1 : 3 jours ✅ TERMINÉ
- Phase 2 : 3 jours ✅ TERMINÉ
- Phase 3 : 3 jours ✅ TERMINÉ
- Phase 4 : 2 jours 🔄 EN COURS
- Phase 5 : 2 jours 🔄 À VENIR

**Progression globale : 70% (9/13 jours)**

## Prochaines étapes immédiates

1. Créer la structure de base pour les services UI
   ```
   /src/services/ui/
     SearchService.js
     NotificationService.js
     TranslationService.js
     InteractionService.js
     index.js
   ```

2. Migrer le SearchService existant vers la nouvelle architecture
   - Intégrer les fonctionnalités de SearchIndexService et InMemoryIndex
   - Ajouter la compatibilité avec le pattern Bridge

3. Corriger les erreurs de lint identifiées dans les services existants:
   - ImageService.js: variable 'options' non utilisée
   - WatchPartyService.js: variable 'syncData' non utilisée

4. Mettre à jour le fichier d'index principal pour intégrer les nouveaux services UI
