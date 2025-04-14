# Déploiement de FloDrama sur AWS

Ce document explique comment déployer l'application FloDrama sur l'infrastructure AWS configurée avec Terraform.

## Architecture AWS

L'architecture AWS de FloDrama est composée des éléments suivants :

- **Frontend** : Application React hébergée sur S3 et distribuée via CloudFront
- **Backend** : Services déployés sur EKS (Elastic Kubernetes Service)
- **Base de données** : DocumentDB pour le stockage des données
- **Cache** : ElastiCache (Redis) pour la mise en cache
- **Stockage média** : S3 pour le stockage des médias
- **Authentification** : Cognito pour la gestion des utilisateurs
- **Personnalisation** : Amazon Personalize pour les recommandations
- **Surveillance** : CloudWatch pour la surveillance et les alertes

## Prérequis

- AWS CLI configuré avec les informations d'identification appropriées
- Terraform v1.0.0 ou supérieur
- kubectl
- Helm
- Docker
- jq

## Structure des fichiers

```
infrastructure/
├── terraform/                # Configuration Terraform
│   ├── main.tf               # Configuration principale
│   ├── variables.tf          # Définition des variables
│   └── modules/              # Modules Terraform
│       ├── vpc/              # Configuration du VPC
│       ├── eks/              # Configuration d'EKS
│       ├── documentdb/       # Configuration de DocumentDB
│       ├── elasticache/      # Configuration d'ElastiCache
│       ├── static_hosting/   # Configuration S3 et CloudFront
│       ├── cognito/          # Configuration de Cognito
│       ├── media/            # Configuration du stockage média
│       ├── personalize/      # Configuration de Personalize
│       └── monitoring/       # Configuration de la surveillance
├── kubernetes/               # Configuration Kubernetes
│   ├── namespaces.yaml       # Définition des namespaces
│   └── charts/               # Charts Helm
│       ├── api/              # Chart pour l'API
│       ├── scraper/          # Chart pour le scraper
│       ├── redis/            # Chart pour Redis
│       └── mongodb/          # Chart pour MongoDB
├── deploy.sh                 # Script de déploiement principal
└── deploy-backend.sh         # Script de déploiement des services backend
```

## Étapes de déploiement

### 1. Déploiement de l'infrastructure

Pour déployer l'infrastructure AWS, exécutez le script `deploy.sh` :

```bash
# Pour l'environnement de développement
./deploy.sh dev

# Pour l'environnement de production
./deploy.sh prod
```

Ce script effectue les opérations suivantes :
- Initialise et applique la configuration Terraform
- Construit l'application React
- Déploie l'application sur S3
- Invalide le cache CloudFront

### 2. Déploiement des services backend

Pour déployer les services backend sur EKS, exécutez le script `deploy-backend.sh` :

```bash
# Pour l'environnement de développement
./deploy-backend.sh dev

# Pour l'environnement de production
./deploy-backend.sh prod
```

Ce script effectue les opérations suivantes :
- Se connecte au cluster EKS
- Construit et pousse les images Docker vers ECR
- Déploie les services sur Kubernetes avec Helm
- Vérifie le statut des déploiements

## Variables d'environnement

Les variables d'environnement suivantes sont utilisées pour configurer le déploiement :

- `ENV` : Environnement de déploiement (dev, staging, prod)
- `AWS_REGION` : Région AWS
- `AWS_ACCOUNT_ID` : ID du compte AWS
- `DOMAIN_NAME` : Nom de domaine pour l'application

## Surveillance et maintenance

### Surveillance

La surveillance de l'application est assurée par CloudWatch. Des tableaux de bord sont créés automatiquement pour surveiller les métriques suivantes :

- Performances du frontend (temps de chargement, taux d'erreur)
- Performances du backend (latence, taux d'erreur)
- Utilisation des ressources (CPU, mémoire)
- Coûts

### Maintenance

Pour mettre à jour l'application, suivez les étapes suivantes :

1. Mettez à jour le code source
2. Exécutez le script de déploiement approprié
3. Vérifiez que le déploiement s'est déroulé correctement

## Résolution des problèmes

### Problèmes courants

- **Erreur de déploiement Terraform** : Vérifiez les logs Terraform pour identifier le problème
- **Erreur de déploiement Kubernetes** : Utilisez `kubectl logs` pour voir les logs des pods
- **Problèmes de connexion** : Vérifiez les groupes de sécurité et les ACL réseau

### Commandes utiles

```bash
# Vérifier l'état de l'infrastructure Terraform
cd terraform && terraform show

# Vérifier l'état des pods Kubernetes
kubectl get pods -n flodrama

# Vérifier les logs d'un pod
kubectl logs -f <nom-du-pod> -n flodrama

# Vérifier l'état des services
kubectl get services -n flodrama
```

## Sécurité

L'infrastructure est configurée avec les meilleures pratiques de sécurité :

- Chiffrement des données au repos et en transit
- Accès réseau limité via des groupes de sécurité
- Authentification et autorisation via IAM et RBAC
- Journalisation et audit via CloudTrail et CloudWatch Logs

## Support

Pour toute question ou problème, contactez l'équipe DevOps de FloDrama.
