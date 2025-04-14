# Guide de résolution des problèmes d'authentification Vercel

## Problème actuel

Nous avons réussi à déployer FloDrama sur Vercel via l'intégration GitHub, et la page de maintenance est visible. Cependant, nous rencontrons toujours des problèmes d'authentification lors des tests automatisés (erreur HTTP 401).

## Solutions recommandées

### 1. Désactivation complète de la protection par mot de passe

1. Connectez-vous au [tableau de bord Vercel](https://vercel.com/dashboard)
2. Sélectionnez le projet "flodrama"
3. Allez dans "Settings" > "Password Protection"
4. Assurez-vous que l'option "Enable Password Protection" est désactivée
5. Cliquez sur "Save"

### 2. Vérification des paramètres de déploiement

1. Dans "Settings" > "General" :
   - Vérifiez que "Privacy" est défini sur "Public"
   - Assurez-vous que "Deployment Protection" est désactivé

2. Dans "Settings" > "Environment Variables" :
   - Vérifiez qu'aucune variable d'environnement ne bloque l'accès public

### 3. Redéploiement avec configuration simplifiée

Si les étapes précédentes ne résolvent pas le problème, essayez de simplifier davantage la configuration :

1. Modifiez le fichier `vercel.json` comme suit :
```json
{
  "version": 2,
  "public": true,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

2. Poussez les modifications sur GitHub pour déclencher un nouveau déploiement

### 4. Utilisation de l'interface Vercel pour la configuration

Si les problèmes persistent, essayez de configurer le projet directement via l'interface Vercel :

1. Supprimez le fichier `vercel.json` du projet
2. Configurez les paramètres de build dans l'interface Vercel :
   - Framework Preset : Other
   - Build Command : npm run build
   - Output Directory : build
   - Install Command : npm install

3. Configurez les redirections via l'interface Vercel dans "Settings" > "Rewrites"

## Vérification après modifications

Après chaque modification, vérifiez l'accessibilité du site en exécutant :

```bash
./scripts/tester-deploiement-vercel.sh
```

## Ressources utiles

- [Documentation Vercel sur la protection par mot de passe](https://vercel.com/docs/concepts/deployments/password-protection)
- [Guide de déploiement Vercel](https://vercel.com/docs/deployments/overview)
- [Dépannage des déploiements Vercel](https://vercel.com/docs/deployments/troubleshooting)
- [Configuration des redirections Vercel](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
