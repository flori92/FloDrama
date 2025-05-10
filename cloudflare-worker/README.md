# Configuration CORS pour l'API FloDrama

Ce dossier contient la configuration CORS pour l'API FloDrama, implémentée comme un Worker Cloudflare.

## Problème résolu

L'API Cloudflare bloque actuellement les requêtes avec l'erreur CORS suivante :

```
Access to XMLHttpRequest at 'https://flodrama-api-worker.florifavi.workers.dev/google-auth' from origin 'https://58e2dd5b.flodrama-frontend.pages.dev' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Solution

Le fichier `cors-config.js` contient un Worker CORS Proxy qui :

1. Gère correctement les requêtes OPTIONS (pre-flight CORS)
2. Utilise l'origine spécifique de la requête au lieu du wildcard '*'
3. Permet les requêtes avec credentials
4. Transmet toutes les requêtes à l'API FloDrama existante

## Instructions de déploiement manuel

Pour déployer ce Worker CORS Proxy manuellement :

1. Connectez-vous à votre compte Cloudflare (https://dash.cloudflare.com)
2. Accédez à la section Workers & Pages
3. Cliquez sur "Create application" puis "Create Worker"
4. Donnez un nom au Worker (ex: flodrama-cors-proxy)
5. Dans l'éditeur de code, copiez-collez le contenu du fichier `cors-config.js`
6. Cliquez sur "Save and deploy"
7. Notez l'URL du Worker (ex: https://flodrama-cors-proxy.florifavi.workers.dev)

## Mise à jour de l'application frontend

Après avoir déployé le Worker CORS Proxy, vous devez mettre à jour l'application frontend pour utiliser ce proxy au lieu de l'API directe :

1. Ouvrez le fichier `/src/Cloudflare/CloudflareConfig.js`
2. Remplacez l'URL de l'API par l'URL du Worker CORS Proxy :

```javascript
// Remplacer cette ligne
export const API_BASE_URL = 'https://flodrama-api-worker.florifavi.workers.dev';

// Par celle-ci
export const API_BASE_URL = 'https://flodrama-cors-proxy.florifavi.workers.dev';
```

3. Recompilez et redéployez l'application frontend

## Recommandations supplémentaires

Pour une gestion optimale des images, nous recommandons également :

1. Modifier le scraping pour récupérer systématiquement les images
2. Stocker ces images sur Cloudflare Images avec des IDs uniques
3. Utiliser un format d'URL cohérent pour toutes les images (ex: `https://images.flodrama.com/<type>/<id>`)

Consultez le fichier `image-scraping-guide.md` pour plus de détails sur l'implémentation de cette solution.
