# Guide d'Utilisation de FloDrama Frontend

## Résumé des Modifications

Nous avons apporté plusieurs améliorations au frontend de FloDrama pour le rendre plus robuste et fonctionnel :

1. **Utilisation de données locales** : Le service de distribution de contenu a été modifié pour utiliser les données locales stockées dans `src/data/content.json` au lieu des API endpoints qui retournaient des erreurs 404.

2. **Mécanisme de fallback** : Un système de repli a été mis en place pour garantir que l'application fonctionne même sans connexion aux API.

3. **Optimisation de la configuration** : La configuration Vite a été améliorée pour optimiser les performances de l'application.

4. **Scripts de démarrage et de déploiement** : Des scripts ont été créés pour faciliter le démarrage et le déploiement de l'application.

## Démarrage de l'Application

### Utilisation du Script de Démarrage

Nous avons créé un script de démarrage qui facilite le lancement de l'application dans différents modes :

```bash
# Démarrer en mode développement (par défaut)
./scripts/start_app.sh

# Démarrer en mode prévisualisation (après build)
./scripts/start_app.sh --mode preview

# Construire l'application en mode production
./scripts/start_app.sh --mode prod

# Spécifier un port personnalisé
./scripts/start_app.sh --port 8080
```

### Démarrage Manuel

Si vous préférez démarrer l'application manuellement, vous pouvez utiliser les commandes suivantes :

```bash
# Installation des dépendances (si nécessaire)
npm install

# Démarrage en mode développement
npm run dev

# Construction de l'application
npm run build

# Prévisualisation de l'application construite
npm run preview
```

## Structure des Données Locales

Les données locales sont stockées dans le fichier `src/data/content.json`. Ce fichier contient un objet JSON avec la structure suivante :

```json
{
  "data": [
    {
      "id": "drama-1",
      "title": "Titre du Drama",
      "description": "Description du drama...",
      "poster": "chemin/vers/poster.jpg",
      "backdrop": "chemin/vers/backdrop.jpg",
      "rating": 8.5,
      "year": 2023,
      "content_type": "drama",
      "genres": ["Romance", "Comédie"],
      "trailer_url": "id-video-trailer",
      "watch_url": "id-video-episode"
      // autres propriétés...
    },
    // autres éléments...
  ]
}
```

Vous pouvez modifier ce fichier pour ajouter, supprimer ou modifier des éléments de contenu.

## Déploiement sur Cloudflare Pages

### Problèmes Connus

Lors de nos tentatives de déploiement sur Cloudflare Pages, nous avons rencontré des problèmes d'authentification. Le token API Cloudflare ne dispose pas des permissions nécessaires pour le déploiement.

### Solutions Recommandées

1. **Obtenir un nouveau token API** : Créez un nouveau token API Cloudflare avec les permissions adéquates, notamment `User->User Details->Read` et `Pages->Edit`.

2. **Déploiement via l'interface web** : Utilisez l'interface web de Cloudflare Pages pour déployer l'application en connectant le dépôt GitHub.

3. **Configuration des variables d'environnement** : Configurez les variables d'environnement directement dans le dashboard Cloudflare Pages :
   - `VITE_API_URL` : URL de l'API Cloudflare Workers
   - `VITE_USE_LOCAL_DATA` : `true` pour utiliser les données locales, `false` pour utiliser l'API

### Utilisation du Script de Déploiement

Si vous avez résolu les problèmes d'authentification, vous pouvez utiliser le script de déploiement :

```bash
./scripts/deploy_to_cloudflare.sh --project flodrama-frontend
```

## Dépannage

### Erreurs 404 lors de l'accès aux API

Si vous rencontrez des erreurs 404 lors de l'accès aux API, vérifiez que :

1. L'API Cloudflare Workers est correctement déployée et accessible.
2. Les endpoints API sont correctement configurés dans le service de distribution de contenu.
3. La variable `VITE_USE_LOCAL_DATA` est définie sur `true` pour utiliser les données locales en cas d'échec de l'API.

### Problèmes de Déploiement sur Cloudflare Pages

Si vous rencontrez des problèmes lors du déploiement sur Cloudflare Pages :

1. Vérifiez que vous disposez des permissions nécessaires pour le déploiement.
2. Essayez d'utiliser l'interface web de Cloudflare Pages pour le déploiement.
3. Consultez les logs de déploiement pour identifier les erreurs spécifiques.

## Ressources Utiles

- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentation Vite](https://vitejs.dev/guide/)
- [Documentation Wrangler](https://developers.cloudflare.com/workers/wrangler/)
