# FloDrama Frontend

Ce dossier contient l'application frontend de FloDrama, développée avec React, Vite et Tailwind CSS.

## Structure du projet

- **src/** : Code source de l'application
  - **Components/** : Composants réutilisables
  - **Pages/** : Pages de l'application
  - **Context/** : Contextes React pour la gestion d'état
  - **CustomHooks/** : Hooks personnalisés
  - **Constants/** : Constantes et configurations
  - **utils/** : Fonctions utilitaires

- **public/** : Ressources statiques

## Démarrage rapide

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Construction pour la production
npm run build
```

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
VITE_API_BASE_URL=https://api.flodrama.com
VITE_AUTH_URL=https://auth.flodrama.com
```

## Déploiement

Le frontend est déployé sur Cloudflare Pages. Pour plus d'informations sur le déploiement, consultez la documentation dans le dossier `docs/`.
