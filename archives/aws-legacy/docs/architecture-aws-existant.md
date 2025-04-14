# Architecture Multi-Plateformes FloDrama basée sur l'AWS Existant

## Vue d'ensemble

Cette architecture s'appuie sur les services AWS déjà en place pour FloDrama, tout en les adaptant pour supporter une approche multi-plateformes avec Turborepo et React Native Web.

## Services AWS existants à réutiliser

### Stockage et Distribution

| Service | Ressources existantes | Utilisation pour la refonte |
|---------|------------------------|----------------------------|
| **Amazon S3** | `flodrama-app-bucket`, `flodrama-media-prod` | Stockage des builds web et des assets partagés |
| **CloudFront** | Distributions existantes | Distribution du frontend web avec mise en cache |

### Backend et API

| Service | Ressources existantes | Utilisation pour la refonte |
|---------|------------------------|----------------------------|
| **API Gateway** | `FloDrama-API-Production` | API unifiée pour toutes les plateformes |
| **Lambda** | Fonctions existantes | Backend serverless partagé |
| **DynamoDB** | Tables existantes | Stockage de données cross-platform |

### Authentification et Utilisateurs

| Service | Ressources existantes | Utilisation pour la refonte |
|---------|------------------------|----------------------------|
| **Cognito** | `flodrama-user-pool-prod` | Authentification unifiée pour toutes les plateformes |

## Nouvelles ressources AWS à créer

### CI/CD et Déploiement

| Service | Nouvelle ressource | Utilisation |
|---------|-------------------|-------------|
| **CodeBuild** | `flodrama-monorepo-build` | Build multi-plateformes à partir du monorepo |
| **CodePipeline** | `flodrama-monorepo-pipeline` | Pipeline CI/CD pour toutes les plateformes |
| **S3** | `flodrama-app-builds` | Stockage des builds pour toutes les plateformes |

### Mobile et Desktop

| Service | Nouvelle ressource | Utilisation |
|---------|-------------------|-------------|
| **Device Farm** | `flodrama-mobile-testing` | Tests automatisés pour les apps mobiles |
| **S3** | `flodrama-app-releases` | Stockage des versions desktop et APK Android |

## Architecture du Monorepo avec Turborepo

```
flodrama-monorepo/
├── apps/
│   ├── web/                 # Application web (Next.js + React Native Web)
│   ├── mobile/              # Application mobile (React Native)
│   └── desktop/             # Application desktop (Electron/Capacitor)
├── packages/
│   ├── ui/                  # Composants UI partagés
│   ├── core/                # Logique métier partagée
│   ├── api/                 # Client API partagé
│   ├── theme/               # Thème et styles partagés
│   └── config/              # Configuration partagée
└── infrastructure/
    ├── aws/                 # Configuration AWS CloudFormation
    └── ci/                  # Configuration CI/CD
```

## Flux de déploiement

1. **Développement**
   - Les développeurs travaillent sur le monorepo localement
   - Turborepo permet de construire et tester uniquement ce qui a changé

2. **Intégration Continue**
   - Le code est poussé vers le repository
   - CodeBuild construit les packages partagés
   - Tests unitaires et d'intégration exécutés

3. **Déploiement Web**
   - Build de l'application web avec Next.js
   - Déploiement vers le bucket S3 existant
   - Invalidation du cache CloudFront

4. **Déploiement Mobile**
   - Build des applications iOS et Android
   - Tests sur Device Farm
   - Publication vers les app stores

5. **Déploiement Desktop**
   - Build des applications desktop
   - Création des installateurs
   - Publication vers S3 pour distribution

## Réutilisation des services existants

### API Gateway et Lambda

L'API Gateway existante (`FloDrama-API-Production`) sera utilisée comme point d'entrée unique pour toutes les plateformes. Les fonctions Lambda existantes seront réutilisées et adaptées si nécessaire pour supporter les nouvelles fonctionnalités multi-plateformes.

### DynamoDB

Les tables DynamoDB existantes seront conservées et utilisées par toutes les plateformes. La structure actuelle, notamment pour la fonctionnalité Watch Party, est déjà adaptée à une utilisation multi-plateformes.

### Cognito

Le user pool Cognito existant (`flodrama-user-pool-prod`) sera utilisé pour l'authentification sur toutes les plateformes, assurant une expérience utilisateur cohérente.

## Migration des données

La migration des données ne sera pas nécessaire puisque nous réutilisons les services de stockage existants. Les nouvelles applications accéderont aux mêmes données que l'application actuelle.

## Coûts estimés

L'utilisation des services AWS existants permet de minimiser les coûts supplémentaires liés à la refonte. Les principaux coûts additionnels seront :

- **CodeBuild et CodePipeline** : ~20€/mois pour les builds multi-plateformes
- **Device Farm** : ~40€/mois pour les tests mobiles
- **S3 et CloudFront** : Coûts marginaux pour le stockage et la distribution des nouvelles applications

## Sécurité

Les politiques IAM existantes seront étendues pour couvrir les nouveaux services et ressources. Les meilleures pratiques de sécurité AWS seront appliquées, notamment :

- Principe du moindre privilège pour tous les rôles IAM
- Chiffrement des données au repos et en transit
- Authentification multi-facteurs pour les accès sensibles

## Surveillance et Observabilité

Les services de surveillance existants (CloudWatch, X-Ray) seront étendus pour couvrir les nouvelles applications. Des tableaux de bord spécifiques seront créés pour suivre les performances sur chaque plateforme.

## Plan de repli

En cas de problème avec la nouvelle architecture, il sera possible de revenir à l'architecture existante sans perte de données, puisque nous réutilisons les mêmes services de backend et de stockage.
