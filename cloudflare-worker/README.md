# Configuration CORS pour l'API FloDrama

Ce dossier contient la configuration CORS pour le Worker Cloudflare de l'API FloDrama.

## Problème résolu

L'API Cloudflare bloque actuellement les requêtes avec l'erreur CORS suivante :

```
Access to XMLHttpRequest at 'https://flodrama-api-worker.florifavi.workers.dev/google-auth' from origin 'https://58e2dd5b.flodrama-frontend.pages.dev' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Solution

Le fichier `cors-config.js` contient une configuration CORS qui :

1. Gère correctement les requêtes OPTIONS (pre-flight CORS)
2. Utilise l'origine de la requête au lieu du wildcard '*'
3. Permet les requêtes avec credentials

## Instructions de déploiement

Pour déployer cette configuration sur le Worker Cloudflare :

1. Connectez-vous à votre compte Cloudflare
2. Accédez au Worker `flodrama-api-worker.florifavi.workers.dev`
3. Intégrez le code du fichier `cors-config.js` dans votre Worker existant
4. Assurez-vous d'appeler correctement votre fonction de traitement des requêtes existante

## Recommandations supplémentaires

Pour une gestion optimale des images, nous recommandons également :

1. Modifier le scraping pour récupérer systématiquement les images
2. Stocker ces images sur Cloudflare Images avec des IDs uniques
3. Utiliser un format d'URL cohérent pour toutes les images (ex: `https://images.flodrama.com/<type>/<id>`)
