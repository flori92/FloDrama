# Guide de déploiement FloDrama avec AWS Amplify

## Introduction

Ce guide explique comment déployer l'application FloDrama sur AWS Amplify pour résoudre les problèmes suivants :
- Erreurs CORS (Cross-Origin Resource Sharing)
- Problèmes de type MIME (les fichiers CSS servis comme text/html)
- Accès 403 (Forbidden) aux fichiers dans S3
- Problèmes de résolution DNS

## Prérequis

- Compte AWS avec les permissions nécessaires
- AWS CLI installé et configuré
- Node.js et npm installés
- AWS Amplify CLI installé (`npm install -g @aws-amplify/cli`)

## Étapes de déploiement automatisé

Nous avons créé un script qui automatise le processus de déploiement. Pour l'utiliser :

1. Ouvrez un terminal à la racine du projet FloDrama
2. Rendez le script exécutable :
   ```bash
   chmod +x ./scripts/deployer-amplify.sh
   ```
3. Exécutez le script :
   ```bash
   ./scripts/deployer-amplify.sh
   ```

Le script effectuera les opérations suivantes :
- Vérification des prérequis (AWS CLI, Amplify CLI)
- Initialisation du projet avec Amplify si nécessaire
- Configuration du déploiement avec les paramètres optimaux
- Déploiement de l'application sur AWS Amplify

## Déploiement manuel

Si vous préférez effectuer le déploiement manuellement, suivez ces étapes :

### 1. Initialiser Amplify dans votre projet

```bash
amplify init
```

Répondez aux questions :
- Nom du projet : FloDrama
- Environnement : prod
- Type d'application : javascript
- Framework : react
- Source Directory Path : src
- Distribution Directory Path : dist
- Build Command : npm run build
- Start Command : npm start

### 2. Ajouter l'hébergement

```bash
amplify add hosting
```

Choisissez "Amplify Console" et "CICD" pour l'hébergement.

### 3. Publier l'application

```bash
amplify publish
```

## Configuration des en-têtes et résolution des problèmes

Le fichier `amplify.yml` à la racine du projet contient la configuration nécessaire pour résoudre les problèmes mentionnés :

### Résolution des problèmes de type MIME

Les en-têtes Content-Type sont correctement définis pour chaque type de fichier :
- Fichiers JavaScript : `application/javascript; charset=utf-8`
- Fichiers CSS : `text/css; charset=utf-8`
- Fichiers HTML : `text/html; charset=utf-8`

### Résolution des problèmes CORS

Les en-têtes CORS sont configurés pour permettre les requêtes cross-origin :
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE`

### Résolution des problèmes d'accès 403

AWS Amplify configure automatiquement les permissions nécessaires pour accéder aux ressources. De plus, les erreurs 403 et 404 sont redirigées vers index.html pour assurer le bon fonctionnement des applications SPA (Single Page Application).

## Vérification du déploiement

Une fois le déploiement terminé, vous recevrez une URL pour accéder à votre application (par exemple, https://prod.xxxxxxxxxx.amplifyapp.com).

Vérifiez que :
1. L'application se charge correctement
2. Les styles CSS sont appliqués (pas d'erreurs MIME)
3. Les requêtes API fonctionnent (pas d'erreurs CORS)
4. Tous les fichiers sont accessibles (pas d'erreurs 403)

## Dépannage

### Problèmes de build

Si vous rencontrez des erreurs lors du build, vérifiez :
- Les dépendances dans package.json
- Les scripts de build dans package.json
- Les logs de build dans la console AWS Amplify

### Problèmes CORS persistants

Si les problèmes CORS persistent :
1. Vérifiez que les en-têtes sont correctement configurés dans amplify.yml
2. Assurez-vous que vos API backend sont également configurées pour accepter les requêtes CORS
3. Utilisez les outils de développement du navigateur pour identifier les requêtes problématiques

### Problèmes de cache

Si les modifications ne sont pas visibles immédiatement :
1. Videz le cache du navigateur
2. Utilisez la fonction "Invalidation" dans la console AWS Amplify pour forcer une mise à jour du cache CloudFront

## Ressources additionnelles

- [Documentation AWS Amplify](https://docs.amplify.aws/)
- [Guide de déploiement React sur Amplify](https://docs.amplify.aws/guides/hosting/deploy-react-app/q/platform/js/)
- [Configuration des en-têtes personnalisés](https://docs.aws.amazon.com/amplify/latest/userguide/custom-headers.html)

## Support

Pour toute question ou problème, consultez la documentation AWS Amplify ou contactez l'équipe de développement FloDrama.
