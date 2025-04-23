# Déploiement du proxy CORS FloDrama sur Render.com

Ce guide explique comment déployer le proxy CORS FloDrama sur Render.com, un service d'hébergement gratuit qui permet d'exécuter des applications Node.js.

## Étapes de déploiement

1. **Créer un compte Render.com**
   - Rendez-vous sur [render.com](https://render.com) et créez un compte

2. **Créer un nouveau service Web**
   - Dans le tableau de bord Render, cliquez sur "New" puis "Web Service"
   - Connectez votre dépôt GitHub ou utilisez l'option "Deploy from GitHub"
   - Sélectionnez le dépôt FloDrama

3. **Configurer le service**
   - **Name**: `flodrama-cors-proxy`
   - **Environment**: `Node`
   - **Build Command**: `cd cors-proxy && npm install --production`
   - **Start Command**: `cd cors-proxy && node cors-anywhere.js`
   - **Plan**: Free

4. **Variables d'environnement**
   - Ajoutez la variable `PORT` avec la valeur `10000` (ou laissez Render la définir automatiquement)

5. **Déployer le service**
   - Cliquez sur "Create Web Service"
   - Attendez que le déploiement soit terminé (cela peut prendre quelques minutes)

6. **Récupérer l'URL du service**
   - Une fois le déploiement terminé, Render vous fournira une URL (par exemple `https://flodrama-cors-proxy.onrender.com`)
   - Cette URL sera utilisée pour accéder au proxy CORS

## Mise à jour du frontend

1. **Modifier le fichier `.env.production`**
   ```
   VITE_API_URL=https://flodrama-cors-proxy.onrender.com/api
   ```

2. **Commiter et pousser les modifications**
   ```bash
   git add Frontend/.env.production
   git commit -m "✨ [CONFIG] Mise à jour de l'URL de l'API pour utiliser le proxy CORS"
   git push
   ```

## Test du proxy

Pour vérifier que le proxy fonctionne correctement :
```
curl https://flodrama-cors-proxy.onrender.com/status
```

Vous devriez recevoir une réponse JSON indiquant que le proxy est opérationnel.
