# Architecture AWS pour FloDrama

## Vue d'ensemble

FloDrama est déployé sur AWS selon une architecture moderne et évolutive, conçue pour offrir une haute disponibilité et des performances optimales pour une plateforme de streaming vidéo.

## Schéma d'architecture

```
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Frontend React  │──────▶ Amazon S3      │──────▶ CloudFront     │
└─────────────────┘      └────────────────┘      └────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Utilisateurs    │◀─────▶ API Gateway    │◀─────▶ EKS            │
└─────────────────┘      └────────────────┘      └────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Cognito         │◀─────▶ DocumentDB     │      │ ElastiCache    │
└─────────────────┘      └────────────────┘      └────────────────┘
```

## Composants principaux

### Frontend

- **Amazon S3** : Hébergement des fichiers statiques du frontend React avec versioning activé
- **CloudFront** : Distribution CDN pour une diffusion globale optimisée avec:
  - Redirection automatique des erreurs 404 vers index.html pour le routage côté client
  - Mise en cache optimisée pour les ressources statiques
  - Certificat SSL/TLS pour HTTPS

### Backend

- **EKS (Elastic Kubernetes Service)** : Orchestration des microservices avec:
  - Version 1.29 de Kubernetes
  - Auto-scaling des pods basé sur la charge
  - Namespaces séparés pour les services applicatifs et l'infrastructure
  - Sécurité renforcée avec chiffrement des secrets

### Bases de données

- **DocumentDB** : Base de données principale compatible MongoDB pour:
  - Stockage des données utilisateurs
  - Catalogues de dramas
  - Historiques de visionnage
  
- **ElastiCache (Redis)** : Cache haute performance pour:
  - Sessions utilisateurs
  - Données temporaires
  - Mise en cache des résultats de requêtes fréquentes

### Authentification et personnalisation

- **Cognito** : Service de gestion des utilisateurs et des abonnements
- **Amazon Personalize** : Service de recommandation personnalisée

## Organisation des namespaces Kubernetes

Les services sont organisés en deux namespaces distincts:

- **flodrama** : Services applicatifs
  - API REST
  - Service de scraping
  - Service de Watch Party
  
- **flodrama-infra** : Services d'infrastructure
  - Redis
  - MongoDB

## Optimisations et Sécurité

### Code Splitting et Performance

FloDrama utilise une stratégie de code splitting pour optimiser les performances de chargement. La configuration Vite divise le code en plusieurs chunks :

- `vendor.js` : Contient les bibliothèques React et React Router
- `ui-components.js` : Contient les composants UI (Material UI)
- `watch-party.js` : Contient les fonctionnalités de watch party
- `player.js` : Contient le lecteur vidéo
- `auth.js` : Contient les fonctionnalités d'authentification

Cette approche permet de réduire le temps de chargement initial et d'améliorer l'expérience utilisateur.

### Surveillance et Monitoring

La surveillance de l'application est assurée par AWS CloudWatch avec les métriques suivantes :

- Taux d'erreurs 4xx et 5xx
- Latence des requêtes
- Nombre de requêtes
- Octets téléchargés

Un tableau de bord dédié "FloDrama-Dashboard" permet de visualiser ces métriques en temps réel.

Des alertes sont configurées pour notifier l'équipe en cas de :
- Taux d'erreurs 5xx > 5%
- Taux d'erreurs 4xx > 10%
- Latence > 1000ms

### Sécurité

La sécurité de l'application est renforcée par l'utilisation de Lambda@Edge qui ajoute automatiquement les en-têtes de sécurité suivants à chaque réponse :

- **Strict-Transport-Security** : Force l'utilisation de HTTPS
- **Content-Security-Policy** : Limite les sources de contenu autorisées
- **X-Content-Type-Options** : Empêche le MIME sniffing
- **X-Frame-Options** : Empêche le site d'être affiché dans un iframe
- **X-XSS-Protection** : Active la protection XSS du navigateur
- **Referrer-Policy** : Contrôle les informations de référence
- **Permissions-Policy** : Limite les fonctionnalités du navigateur

## Déploiement

Le déploiement est entièrement automatisé via deux scripts principaux:

- **deploy.sh** : Script principal qui:
  - Configure l'infrastructure avec Terraform
  - Construit l'application React
  - Déploie le frontend sur S3
  - Invalide le cache CloudFront

- **deploy-backend.sh** : Script pour les services backend qui:
  - Se connecte au cluster EKS
  - Construit et pousse les images Docker vers ECR
  - Déploie les microservices sur Kubernetes
  - Vérifie le statut des déploiements

## Scripts de Déploiement et Maintenance

### Déploiement de l'Application

Le déploiement de l'application est géré par le script `deployer-aws.sh` qui :
1. Compile l'application React
2. Synchronise les fichiers avec le bucket S3
3. Invalide le cache CloudFront

### Configuration de la Surveillance

Le script `setup-monitoring.sh` configure automatiquement :
1. Les alertes CloudWatch
2. Le tableau de bord de surveillance
3. Les notifications par e-mail
4. Le budget AWS

### Sécurité

Le script `deploy-lambda-edge.sh` déploie la fonction Lambda@Edge qui ajoute les en-têtes de sécurité et l'associe à la distribution CloudFront.

## Sécurité

L'architecture implémente plusieurs niveaux de sécurité:

- Chiffrement des données au repos et en transit
- Accès privé au cluster EKS
- Authentification multi-facteurs pour les utilisateurs administrateurs
- Gestion des secrets via Kubernetes Secrets
- Politiques IAM restrictives selon le principe du moindre privilège

## Surveillance et maintenance

- CloudWatch pour la surveillance des métriques et des logs
- Prometheus et Grafana pour la surveillance détaillée des services Kubernetes
- Alertes automatisées en cas de problèmes détectés

## Évolutivité

L'architecture est conçue pour évoluer facilement:

- Auto-scaling horizontal des pods Kubernetes
- Réplication multi-AZ pour la haute disponibilité
- Possibilité d'extension vers des régions AWS supplémentaires

## Coûts et Budget

Un budget AWS est configuré pour surveiller les coûts mensuels et envoyer des alertes lorsque le seuil de 80% est atteint.
