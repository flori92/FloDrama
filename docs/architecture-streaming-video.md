# Architecture de Streaming Vidéo pour FloDrama

## Vue d'ensemble

FloDrama utilise une architecture hybride AWS/Vercel pour offrir une expérience de streaming vidéo sécurisée, performante et conforme aux réglementations. Cette documentation détaille l'implémentation technique, les choix architecturaux et les considérations de sécurité.

## Architecture Globale

![Architecture Hybride AWS/Vercel](https://i.imgur.com/XYZ123.png)

### Composants Principaux

1. **Frontend (Vercel)**
   - Application React déployée sur Vercel
   - Composant VideoPlayer optimisé avec gestion des erreurs et reprise de lecture
   - Service VideoProxyService pour la gestion des URL pré-signées
   - Interface utilisateur réactive et moderne avec effets de survol et prévisualisations

2. **Backend de Streaming (AWS)**
   - API Gateway pour la gestion des requêtes sécurisées
   - Lambda pour la génération d'URLs pré-signées avec durée de validité configurable
   - CloudFront pour la distribution de contenu (CDN) avec restrictions géographiques
   - S3 pour le stockage sécurisé des vidéos avec politiques d'accès strictes
   - DynamoDB pour les métadonnées, les sessions de visionnage et les statistiques

## Flux de Données

1. **Demande de Streaming**
   - L'utilisateur sélectionne un contenu à regarder dans l'interface
   - Le composant VideoPlayer demande une URL pré-signée via VideoProxyService
   - Le service appelle l'API Gateway avec l'ID du contenu, les paramètres de qualité et l'ID de session

2. **Génération d'URL Pré-signée**
   - La fonction Lambda authentifie la requête et vérifie les droits d'accès
   - Elle génère une URL S3 pré-signée avec une durée de validité limitée (par défaut 1 heure)
   - L'URL et les métadonnées (qualités disponibles, durée, etc.) sont renvoyées au frontend
   - Le service met en cache les URL pour optimiser les performances

3. **Lecture du Contenu**
   - Le lecteur vidéo utilise l'URL pré-signée pour accéder directement au contenu
   - Le composant gère automatiquement la reprise de lecture à la dernière position
   - Les statistiques de visionnage sont enregistrées périodiquement via le service VideoProxyService
   - Le changement de qualité est géré dynamiquement sans interruption de lecture

## Sécurité et Conformité

### Mesures de Sécurité

- **URLs Pré-signées**: Accès temporaire et limité aux ressources vidéo avec signature cryptographique
- **Authentification**: Vérification des tokens JWT pour chaque requête à l'API
- **Géo-restriction**: Limitation de l'accès selon les régions via CloudFront
- **Protection contre le Hotlinking**: Validation de l'origine des requêtes
- **Chiffrement**: Données en transit (HTTPS) et au repos (S3 SSE-S3)
- **Session Tracking**: Suivi des sessions pour détecter les accès non autorisés

### Conformité Légale

- **Journalisation**: Enregistrement détaillé des accès pour des raisons légales
- **Filtrage de Contenu**: Possibilité de bloquer certains contenus selon les juridictions
- **Durée de Conservation**: Politique configurable pour les données de visionnage
- **GDPR**: Conformité avec les réglementations sur la protection des données

## Performance et Mise à l'Échelle

- **Mise en Cache**: Système de cache à deux niveaux (frontend et CloudFront)
- **Auto-Scaling**: Les ressources AWS s'adaptent automatiquement à la demande
- **Multi-Région**: Déploiement possible dans plusieurs régions AWS pour une latence réduite
- **Qualité Adaptative**: Sélection manuelle ou automatique de la qualité selon la bande passante
- **Reprise de Lecture**: Sauvegarde et restauration automatique de la position de lecture

## Intégration avec le Service de Scraping

Le service de proxy vidéo s'intègre parfaitement avec le service de scraping existant:

1. Le scraper extrait les URLs de streaming des sources
2. Ces URLs sont stockées de manière sécurisée dans DynamoDB
3. Le service de proxy récupère ces URLs lors des demandes de streaming
4. Le contenu est mis en cache dans S3 pour les vidéos populaires
5. Les métadonnées (durée, qualités disponibles) sont extraites et stockées

## Configuration et Déploiement

### Prérequis

- Compte AWS avec accès aux services nécessaires (S3, CloudFront, Lambda, API Gateway, DynamoDB)
- Compte Vercel pour le déploiement du frontend
- CLI AWS et Vercel installés localement
- ffmpeg pour la génération de vidéos de test

### Scripts de Déploiement

1. `deployer-lambda.sh`: Déploie la fonction Lambda de génération d'URL pré-signées
2. `generer-url-presignees.sh`: Utilitaire pour tester la génération d'URL pré-signées
3. `telecharger-videos-test.sh`: Télécharge et téléverse des vidéos de test vers S3
4. `configurer-cloudfront.sh`: Configure la distribution CloudFront avec les paramètres optimaux
5. `tester-integration.html`: Page HTML pour tester l'intégration complète

### Variables d'Environnement

- `REACT_APP_VIDEO_PROXY_API`: URL de l'API Gateway pour le service de proxy vidéo
- `REACT_APP_CLOUDFRONT_DOMAIN`: Domaine CloudFront pour l'accès aux ressources
- `REACT_APP_ENV`: Environnement d'exécution (development, production)
- `AWS_S3_BUCKET`: Nom du bucket S3 pour le stockage des vidéos
- `TOKEN_EXPIRATION`: Durée de validité des URL pré-signées en secondes

## Surveillance et Maintenance

- **CloudWatch**: Surveillance des métriques AWS et alertes
- **Logs**: Journalisation centralisée pour le débogage
- **Rapports d'Utilisation**: Statistiques détaillées de visionnage et d'utilisation des ressources
- **Monitoring des Erreurs**: Suivi des erreurs de génération d'URL et de lecture

## Composants Frontend

### VideoPlayer

Le composant VideoPlayer a été optimisé pour offrir une expérience utilisateur fluide:

- Gestion avancée des erreurs avec affichage de messages explicites
- Reprise automatique de la lecture à la dernière position connue
- Changement de qualité sans interruption de lecture
- Interface utilisateur réactive avec contrôles contextuels
- Intégration avec le système de Watch Party pour le visionnage en groupe

### VideoProxyService

Service singleton qui gère:

- La récupération des URL pré-signées depuis l'API
- La mise en cache des URL pour optimiser les performances
- L'enregistrement des sessions de visionnage
- La gestion de l'authentification pour l'accès aux contenus protégés

## Considérations Futures

- Implémentation d'un système de recommandation basé sur l'historique de visionnage
- Support pour le streaming en direct avec faible latence
- Intégration avec des services de sous-titrage automatique
- Optimisation des coûts AWS avec des stratégies de mise en cache avancées
- Support pour les technologies DRM avancées pour les contenus premium

## Conclusion

Cette architecture hybride offre un équilibre optimal entre performance, sécurité et coût. L'utilisation des URL pré-signées garantit un accès sécurisé aux contenus tout en offrant une expérience utilisateur fluide. Le système est conçu pour évoluer facilement avec l'augmentation du catalogue et de la base d'utilisateurs de FloDrama.
