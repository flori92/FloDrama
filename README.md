# FloDrama

Plateforme de streaming dédiée aux dramas et films asiatiques.

## Fonctionnalités principales

- Interface utilisateur moderne et responsive
- Carrousels de contenu dynamiques avec lazy loading
- Lecture de vidéos avec contrôles avancés
- Gestion de liste de visionnage personnalisée
- Système robuste de gestion d'erreurs et de fallback
- Authentification MongoDB Atlas avec fallback local

## Environnement de développement

### Prérequis

- Node.js (v18+)
- npm (v9+)
- Git
- AWS CLI (pour la gestion des ressources AWS)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/flori92/FloDrama.git
cd FloDrama

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Scripts disponibles

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Construire l'application pour la production
- `npm run preview` : Prévisualiser la version de production localement
- `npm run lint` : Vérifier le code avec ESLint
- `npm run format` : Formater le code avec Prettier
- `npm run test` : Exécuter les tests unitaires
- `./scripts/aws-setup.sh` : Configuration de l'infrastructure AWS
- `./scripts/deploy-aws.sh` : Déploiement de l'infrastructure AWS

## Architecture

L'application utilise une architecture hybride :
- **Frontend** : React + Vite, déployé sur GitHub Pages
- **Backend API** : AWS API Gateway + Lambda
- **Base de données** : MongoDB Atlas
- **Stockage** : AWS S3 pour les assets

```
┌─────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│                     │     │                       │     │                     │
│   GitHub Pages      │────▶│   AWS API Gateway     │────▶│   MongoDB Atlas     │
│   (Frontend)        │     │   (Backend API)       │     │   (Base de données) │
│                     │     │                       │     │                     │
└─────────────────────┘     └───────────────────────┘     └─────────────────────┘
         ▲                            │                             │
         │                            ▼                             │
         │                  ┌───────────────────────┐              │
         │                  │                       │              │
         └──────────────────│   AWS Lambda          │◀─────────────┘
                            │   (Fonctions)         │
                            │                       │
                            └───────────────────────┘
```

### Optimisations implémentées

- **Lazy loading des images** : Chargement des images uniquement lorsqu'elles sont visibles
- **Système de cache local** : Stockage des métadonnées en local pour réduire les requêtes
- **Gestion d'erreurs robuste** : ErrorBoundary pour empêcher les plantages de l'application
- **Fallback pour les ressources manquantes** : Placeholders SVG pour les images non disponibles
- **Authentification hybride** : MongoDB Atlas avec fallback local pour la résilience

## Déploiement

L'application est déployée sur GitHub Pages à l'adresse [https://flori92.github.io/FloDrama/](https://flori92.github.io/FloDrama/).

## Documentation

Pour plus d'informations, consultez les documents dans le dossier `docs/`.

## Structure des données

Les métadonnées des contenus sont stockées dans le format suivant :

```json
{
  "id": "drama001",
  "title": "Crash Landing on You",
  "originalTitle": "사랑의 불시착",
  "type": "drama",
  "category": "drama",
  "country": "kr",
  "year": 2019,
  "rating": 9.2,
  "episodes": 16,
  "duration": 70,
  "synopsis": "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord...",
  "genres": ["Romance", "Comédie", "Drame"],
  "cast": ["Hyun Bin", "Son Ye-jin", "Kim Jung-hyun", "Seo Ji-hye"],
  "director": "Lee Jeong-hyo"
}
```

## Migration vers GitHub Pages et AWS

Le projet FloDrama a été migré de Vercel vers GitHub Pages avec backend AWS le 14/04/2025 pour améliorer la scalabilité et la résilience.

### Avantages de cette architecture

- **Séparation claire des responsabilités**
  - Frontend statique rapide sur GitHub Pages
  - Logique métier dans des fonctions serverless AWS
  - Données persistantes dans MongoDB Atlas

- **Sécurité renforcée**
  - Pas d'exposition directe de MongoDB au frontend
  - Authentification et autorisation gérées par AWS
  - Secrets et clés d'API protégés dans AWS

- **Scalabilité et performance**
  - GitHub Pages pour servir rapidement le contenu statique
  - AWS Lambda s'adapte automatiquement à la charge
  - MongoDB Atlas gère l'évolutivité de la base de données

### Déploiement

Pour configurer l'infrastructure AWS :

```bash
# Configuration de l'infrastructure AWS
./scripts/aws-setup.sh

# Déploiement de l'infrastructure AWS
./scripts/deploy-aws.sh
```

Pour déployer le frontend sur GitHub Pages :

```bash
# Déploiement manuel
npm run build
npx gh-pages -d dist

# Ou via GitHub Actions (automatique à chaque push)
git push origin main
```

### Ressources

- [Documentation GitHub Pages](https://docs.github.com/fr/pages)
- [Documentation AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Documentation MongoDB Atlas](https://docs.atlas.mongodb.com/)
