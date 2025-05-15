# FloDrama - Nouvelle Version

Ce dépôt contient la nouvelle version de FloDrama, avec une architecture modernisée et optimisée.

## Structure du projet

- **frontend/** : Application React avec Vite et Tailwind CSS
- **backend/** : Services backend basés sur Cloudflare Workers
  - **api/** : API principale pour les contenus et fonctionnalités
  - **auth/** : Service d'authentification et gestion des utilisateurs
- **docs/** : Documentation du projet

## Démarrage rapide

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend API
```bash
cd backend/api
npm install
npx wrangler dev
```

### Backend Auth
```bash
cd backend/auth
npm install
npx wrangler dev
```

## Déploiement

Le frontend est déployé sur Cloudflare Pages, tandis que les backends sont déployés comme Cloudflare Workers.

Pour plus d'informations, consultez la documentation dans le dossier `docs/`.

## Historique

Ce projet est une refonte complète de l'application FloDrama, avec une architecture moderne basée sur Cloudflare Workers et Pages.
