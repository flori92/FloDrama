# Instructions pour la récupération et configuration des secrets

## 1. Récupération des valeurs existantes

Pour récupérer chaque secret de l'ancien service, exécutez ces commandes une par une (notez les valeurs) :

```bash
# Dans le répertoire /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/backend/auth
npx wrangler secret get FRONTEND_URL --name flodrama-backend
npx wrangler secret get GOOGLE_CLIENT_ID --name flodrama-backend
npx wrangler secret get GOOGLE_CLIENT_SECRET --name flodrama-backend
npx wrangler secret get GOOGLE_REDIRECT_URI --name flodrama-backend
npx wrangler secret get JWT_SECRET --name flodrama-backend
npx wrangler secret get SESSION_SECRET --name flodrama-backend
```

## 2. Modification du script de configuration

Une fois les valeurs récupérées, modifiez le script `configure_env_vars.sh` pour remplacer les valeurs placeholder par les véritables valeurs obtenues précédemment.

## 3. Configuration de la nouvelle URL de redirection

**Important** : La valeur de `GOOGLE_REDIRECT_URI` doit être mise à jour pour pointer vers la nouvelle API consolidée :

```
https://flodrama-api-consolidated.florifavi.workers.dev/api/auth/google/callback
```

## 4. Exécution du script de configuration

Rendez le script exécutable et lancez-le :

```bash
chmod +x /Users/floriace/FLO_DRAMA/FloDrama/scripts/configure_env_vars.sh
/Users/floriace/FLO_DRAMA/FloDrama/scripts/configure_env_vars.sh
```

## 5. Vérification de la configuration

Après l'exécution du script, vérifiez que toutes les variables ont été correctement configurées :

```bash
npx wrangler secret list --name flodrama-api-consolidated
```

## 6. Mise à jour de la console Google Cloud

N'oubliez pas de mettre à jour l'URL de redirection dans la console Google Cloud pour votre projet OAuth, afin d'autoriser la nouvelle URL de callback :

1. Accédez à la [console Google Cloud](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans "APIs & Services" > "Credentials"
4. Modifiez votre client OAuth
5. Ajoutez l'URL de redirection suivante :
   ```
   https://flodrama-api-consolidated.florifavi.workers.dev/api/auth/google/callback
   ```
