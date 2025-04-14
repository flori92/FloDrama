# Architecture Multi-Plateformes pour FloDrama

## Vue d'ensemble

Cette documentation présente l'architecture multi-plateformes proposée pour FloDrama, permettant de déployer l'application sur:
- Web (desktop et mobile)
- Applications mobiles natives (iOS et Android)
- Applications desktop (macOS, Windows, Linux)

## Structure du Monorepo

```
flodrama/
├── apps/
│   ├── mobile/          # Application React Native
│   ├── web/             # Application React pour le web
│   └── desktop/         # Application desktop avec Capacitor
├── packages/
│   ├── ui/              # Composants UI partagés
│   ├── core/            # Logique métier partagée
│   ├── api/             # Clients API partagés
│   ├── theme/           # Thème partagé
│   └── utils/           # Utilitaires partagés
├── tools/               # Scripts et outils de build
└── package.json         # Configuration racine
```

## Technologies utilisées

- **Turborepo**: Gestion du monorepo et optimisation des builds
- **React Native**: Pour les applications mobiles natives
- **React Native Web**: Pour partager le code entre web et mobile
- **Capacitor**: Pour créer des applications desktop et accéder aux API natives
- **TypeScript**: Pour le typage statique
- **Styled Components**: Pour le styling cross-platform
- **Jest**: Pour les tests unitaires
- **Detox**: Pour les tests e2e sur mobile
- **Cypress**: Pour les tests e2e sur web

## Principes de conception

### 1. Code sharing maximal

L'architecture est conçue pour maximiser le partage de code entre les plateformes:

- **Logique métier**: 100% partagée
- **UI Components**: ~80% partagés avec des adaptations spécifiques à chaque plateforme
- **Navigation**: Structure partagée avec des implémentations spécifiques
- **Animations**: Bibliothèque d'animations partagée avec des optimisations par plateforme

### 2. Design System unifié

Un système de design unifié est implémenté via le package `@flodrama/theme` qui définit:

- Couleurs
- Typographie
- Espacements
- Animations
- Ombres et élévations

### 3. Architecture modulaire

Les fonctionnalités sont organisées en modules indépendants:

- Authentication
- Catalogue
- Lecteur vidéo
- Recommandations
- Profil utilisateur
- etc.

Chaque module expose une API claire et peut être développé indépendamment.

### 4. Stratégie de déploiement

- **Web**: Déploiement automatique sur AWS via GitHub Actions
- **Mobile**: Build et publication sur App Store et Google Play
- **Desktop**: Génération d'installateurs pour macOS, Windows et Linux

## Migration depuis l'architecture actuelle

La migration depuis l'architecture actuelle se fera en plusieurs phases:

1. **Phase 1**: Création de la structure du monorepo et migration des composants partagés
2. **Phase 2**: Migration de l'application web existante
3. **Phase 3**: Développement de l'application mobile
4. **Phase 4**: Développement de l'application desktop
5. **Phase 5**: Optimisations et améliorations continues

## Avantages de cette architecture

- **Développement plus rapide**: Grâce au partage de code et aux builds optimisés
- **Cohérence**: UI et UX cohérents sur toutes les plateformes
- **Maintenance simplifiée**: Les corrections de bugs sont appliquées à toutes les plateformes
- **Scalabilité**: Architecture conçue pour évoluer avec les besoins de l'application
- **Performance**: Optimisations spécifiques à chaque plateforme tout en partageant le maximum de code
