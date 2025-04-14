# Guide de configuration manuelle de Vercel pour FloDrama

## Problème actuel

Nous rencontrons un problème d'authentification lors de l'accès au site déployé sur Vercel. Le site demande une authentification, ce qui empêche l'accès public.

## Solution : Configuration manuelle du projet

Pour résoudre ce problème, suivez ces étapes sur le tableau de bord Vercel :

### 1. Connexion au tableau de bord Vercel
   - Rendez-vous sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Connectez-vous avec vos identifiants

### 2. Accès aux paramètres du projet
   - Sélectionnez le projet "flodrama" dans la liste
   - Notez l'ID du projet : `prj_1tJXiyQeYrae8GFccevyztN63MDY`
   - Cliquez sur l'onglet "Settings" dans le menu supérieur

### 3. Désactivation de la protection par mot de passe
   - Dans le menu de gauche, cliquez sur "Password Protection"
   - Désactivez l'option "Enable Password Protection"
   - Cliquez sur "Save" pour enregistrer les modifications

### 4. Configuration de l'accès public
   - Dans le menu de gauche, cliquez sur "General"
   - Recherchez l'option "Privacy" ou "Visibility"
   - Sélectionnez "Public" pour rendre le projet accessible à tous
   - Cliquez sur "Save" pour enregistrer les modifications

### 5. Configuration du domaine
   - Dans le menu de gauche, cliquez sur "Domains"
   - Cliquez sur "Add" pour ajouter un domaine
   - Entrez votre domaine personnalisé : `flodrama.com`
   - Suivez les instructions pour configurer les enregistrements DNS

### 6. Configuration du build
   - Dans le menu de gauche, cliquez sur "Build & Development Settings"
   - Framework Preset : `Other`
   - Build Command : `npm run build`
   - Output Directory : `build`
   - Install Command : `npm install`
   - Development Command : `npm start`

### 7. Configuration des variables d'environnement
   - Dans le menu de gauche, cliquez sur "Environment Variables"
   - Ajoutez les variables suivantes :
     - `AWS_REGION` : `us-east-1`
     - `API_ENDPOINT` : `https://api.flodrama.com`

### 8. Redéploiement du projet
   - Retournez à l'onglet "Deployments"
   - Cliquez sur le bouton "Redeploy" pour le dernier déploiement
   - Attendez que le déploiement soit terminé

## Vérification de l'accès public

Après avoir effectué ces modifications, testez l'accès au site en utilisant le script `tester-deploiement-vercel.sh` :

```bash
./scripts/tester-deploiement-vercel.sh
```

Le site devrait maintenant être accessible sans authentification.

## Problèmes courants et solutions

### Problème : Le site reste protégé par mot de passe

**Solution :** Vérifiez que vous avez bien désactivé la protection par mot de passe dans les paramètres du projet. Parfois, il peut y avoir un délai avant que les modifications prennent effet. Attendez quelques minutes et réessayez.

### Problème : Erreur 404 après la désactivation de la protection

**Solution :** Assurez-vous que la configuration de routage dans `vercel.json` est correcte. Le fichier doit contenir une règle pour rediriger toutes les routes vers `index.html`.

### Problème : Les assets ne sont pas chargés correctement

**Solution :** Vérifiez que les chemins des assets dans le code HTML sont relatifs et non absolus. Si nécessaire, modifiez les chemins dans le fichier `index.html`.

## Prochaines étapes après résolution

Une fois l'accès public configuré correctement :

1. Configurez les domaines personnalisés avec le script `configurer-domaine-vercel.sh`
2. Nettoyez les ressources AWS inutiles avec le script `nettoyer-ressources-aws.sh`
3. Mettez à jour la documentation avec les nouvelles URLs et informations de déploiement
