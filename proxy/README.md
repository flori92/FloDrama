# Proxy CORS pour FloDrama

Ce proxy CORS permet de résoudre les problèmes d'accès à l'API AWS depuis l'application frontend FloDrama hébergée sur GitHub Pages.

## Comment ça fonctionne

Le proxy est implémenté en tant que Cloudflare Worker, qui agit comme intermédiaire entre le frontend et l'API AWS. Il ajoute automatiquement les en-têtes CORS nécessaires pour permettre les requêtes cross-origin.

## Déploiement

### Prérequis

- Compte Cloudflare
- Cloudflare Wrangler CLI installé (`npm install -g wrangler`)
- Authentification Wrangler (`wrangler login`)

### Instructions de déploiement

1. Modifier le fichier `wrangler.toml` pour ajouter votre `account_id` Cloudflare
2. Déployer le worker :
   ```bash
   cd cors-proxy
   npm install
   npx wrangler publish
   ```
3. Noter l'URL du worker déployé (ex: `https://flodrama-cors-proxy.username.workers.dev`)
4. Mettre à jour le fichier `.env.production` dans le dossier Frontend :
   ```
   VITE_API_URL=https://flodrama-cors-proxy.username.workers.dev/api
   ```
5. Redéployer le frontend sur GitHub Pages

## Développement local

Pour tester le proxy localement :
```bash
cd cors-proxy
npm install
npx wrangler dev
```

## Maintenance

Si l'API AWS change, vous devrez mettre à jour les constantes `API_HOST` et `API_STAGE` dans le fichier `worker.js`.

## Sécurité

Ce proxy n'implémente pas d'authentification. Si votre API nécessite une authentification, assurez-vous que les jetons d'authentification sont correctement transmis dans les en-têtes des requêtes.
