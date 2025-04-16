# FloDrama

Plateforme de streaming dédiée aux dramas et films asiatiques.

## Environnement de développement

### Prérequis

- Node.js (v18+)
- npm (v9+)
- Git
- Vercel CLI (pour le déploiement)
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
- `npm run deploy` : Déployer l'application sur Vercel
- `npm run deploy:force` : Forcer le déploiement sans page de maintenance

## Architecture

L'application utilise une architecture hybride :
- **Frontend** : React + Vite, déployé sur Vercel
- **Backend** : Services AWS (Lambda, DynamoDB, S3)

## Déploiement

L'application est déployée sur Vercel à l'adresse [https://flodrama.vercel.app](https://flodrama.vercel.app).

## Documentation

Pour plus d'informations, consultez les documents dans le dossier `docs/`.
