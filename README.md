# FloDrama

Plateforme de streaming dédiée aux dramas et films asiatiques.

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
- `npm run deploy` : Déployer l'application sur GitHub Pages
- `npm run deploy:force` : Forcer le déploiement sans page de maintenance

## Architecture

L'application utilise une architecture hybride :
- **Frontend** : React + Next.js, déployé sur GitHub Pages
- **Backend** : Services AWS (Lambda, DynamoDB, S3)
- **CDN** : AWS CloudFront (d1323ouxr1qbdp.cloudfront.net)
- **Assets** : Stockés sur S3 avec fallback vers GitHub Pages

## Système d'images multi-sources

Le système d'images de FloDrama utilise une approche multi-sources avec ordre de priorité :
1. GitHub Pages (flodrama.com) - Priorité 1
2. CloudFront (d1323ouxr1qbdp.cloudfront.net) - Priorité 2
3. S3 direct (flodrama-assets.s3.amazonaws.com) - Priorité 3

## Déploiement

L'application est déployée sur GitHub Pages à l'adresse [https://flodrama.com](https://flodrama.com).

## Documentation

Pour plus d'informations, consultez les documents dans le dossier `docs/`.
