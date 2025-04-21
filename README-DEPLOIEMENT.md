# Guide de Déploiement FloDrama

Ce document décrit le processus de déploiement de FloDrama, une plateforme intelligente de distribution de contenu pour drames, anime, films de Bollywood et films internationaux.

## 📋 Architecture de Déploiement

FloDrama utilise une architecture serverless avec les composants suivants :

- **Frontend** : Application React déployée sur GitHub Pages
- **Backend** : API Node.js déployée sur AWS Lambda
- **Stockage** : Contenu stocké sur Amazon S3
- **CDN** : Distribution via Amazon CloudFront
- **API Gateway** : Point d'entrée pour les requêtes API

## 🔑 Prérequis

Pour déployer FloDrama, vous aurez besoin de :

1. Un compte GitHub avec accès au dépôt FloDrama
2. Un compte AWS avec les services suivants configurés :
   - AWS Lambda
   - Amazon S3
   - Amazon CloudFront
   - Amazon API Gateway
3. GitHub CLI (gh) installé localement
4. AWS CLI installé et configuré localement

## 🚀 Processus de Déploiement

Le déploiement de FloDrama est entièrement automatisé via GitHub Actions. Le workflow principal se trouve dans `.github/workflows/deploy.yml`.

### Configuration des Secrets GitHub

Avant de déployer, configurez les secrets GitHub nécessaires en utilisant le script fourni :

```bash
./scripts/configure-github-secrets.sh
```

Ce script vous guidera pour configurer les secrets suivants :
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`
- `AWS_LAMBDA_ROLE_ARN`

### Déclenchement du Déploiement

Le déploiement peut être déclenché de deux façons :

1. **Automatiquement** : À chaque push sur les branches `main`, `master` ou `gh-pages`
2. **Manuellement** : En utilisant la commande suivante :

```bash
gh workflow run deploy.yml --ref gh-pages
```

### Étapes du Déploiement

Le workflow de déploiement exécute les étapes suivantes :

1. **Déploiement du Backend** :
   - Vérification des identifiants AWS
   - Installation des dépendances du backend
   - Création du package Lambda
   - Déploiement sur AWS Lambda
   - Configuration de l'API Gateway
   - Nettoyage des anciennes versions Lambda

2. **Déploiement du Frontend** :
   - Installation des dépendances du frontend
   - Configuration des données S3 et API
   - Build du projet
   - Déploiement sur GitHub Pages

## 🧹 Maintenance

### Nettoyage des Ressources AWS

Pour nettoyer les ressources AWS (anciennes versions Lambda, déploiements API Gateway, logs CloudWatch), utilisez le script suivant :

```bash
./scripts/clean-lambda.sh
```

### Surveillance des Fonctions Lambda

Pour surveiller les performances et l'état des fonctions Lambda, utilisez :

```bash
./scripts/lambda-monitoring.sh
```

Ce script fournit des statistiques sur :
- Nombre d'invocations
- Erreurs
- Durée d'exécution
- Utilisation de la mémoire
- Limitations
- Exécutions concurrentes

## 🔍 Dépannage

### Problèmes Courants

1. **Erreur d'authentification AWS** :
   - Vérifiez que les secrets GitHub sont correctement configurés
   - Assurez-vous que l'utilisateur AWS a les permissions nécessaires

2. **Échec du déploiement Lambda** :
   - Vérifiez les logs CloudWatch pour plus de détails
   - Assurez-vous que le rôle IAM a les permissions requises

3. **Problèmes de connexion Frontend-Backend** :
   - Vérifiez la configuration CORS dans API Gateway
   - Assurez-vous que l'URL de l'API est correctement configurée dans le frontend

## 📊 Surveillance et Alertes

Le script `lambda-monitoring.sh` peut être configuré pour s'exécuter périodiquement via une tâche cron afin de surveiller les performances de l'application et d'envoyer des alertes en cas de problème.

## 🌐 URLs de Production

- **Frontend** : https://flodrama.com
- **API Backend** : https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production
- **CDN** : https://d1323ouxr1qbdp.cloudfront.net

## 📝 Notes Importantes

- Les modifications apportées au workflow de déploiement doivent être testées sur une branche de développement avant d'être fusionnées
- Assurez-vous de maintenir à jour les secrets AWS pour éviter les problèmes de déploiement
- Effectuez régulièrement des sauvegardes des données importantes stockées dans S3
