# FloDrama

## Présentation

FloDrama est une plateforme de streaming qui agrège et organise des contenus provenant de diverses sources (dramas, animes, films). L'application utilise une architecture moderne et scalable basée sur le cloud AWS.

## Architecture technique

### Frontend

- **Framework** : Next.js avec React 18
- **Rendu** : Hybride (SSR + CSR)
- **Styling** : Tailwind CSS
- **État global** : React Context API + Hooks personnalisés
- **Déploiement** : Surge.sh (https://flodrama.com)

### Backend

- **Langage** : Python 3.9+
- **API** : FastAPI pour les endpoints REST
- **Base de données** : MongoDB pour le stockage principal
- **Cache** : Redis pour les performances
- **Recherche** : OpenSearch pour la recherche avancée
- **Authentification** : JWT (JSON Web Tokens)

### Infrastructure Cloud (AWS)

- **Compute** : AWS Lambda pour les fonctions serverless
- **API** : API Gateway pour exposer les endpoints REST
- **Stockage** : S3 pour les médias et fichiers statiques
- **CDN** : CloudFront pour la distribution de contenu
- **Région principale** : us-east-1 (N. Virginia)

### Intégration et Déploiement

- **Versioning** : Git avec GitHub
- **CI/CD** : GitHub Actions pour l'intégration continue
- **Déploiement Frontend** : Surge.sh (automatisé via GitHub Actions)
- **Déploiement Backend** : AWS Lambda + API Gateway (via AWS CLI)

## Changements récents

### Migration vers Surge.sh (Avril 2025)

- Migration du frontend de GitHub Pages vers Surge.sh
- Configuration CORS complète sur l'API Gateway AWS
- Suppression de la dépendance au proxy CORS intermédiaire
- Communication directe entre le frontend et l'API Gateway
- Mise à jour du workflow CI/CD pour automatiser le déploiement sur Surge.sh

## Développement local

### Prérequis

- Node.js 18+
- Python 3.9+
- AWS CLI configuré avec les accès appropriés

### Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/flori92/FloDrama.git
   cd FloDrama
   ```

2. Installer les dépendances du frontend :
   ```bash
   cd Frontend
   npm install
   ```

3. Installer les dépendances du backend :
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

### Lancement en local

1. Démarrer le frontend :
   ```bash
   cd Frontend
   npm run dev
   ```

2. Démarrer le backend (si disponible en local) :
   ```bash
   cd Backend
   python main.py
   ```

## Déploiement

### Frontend

Le déploiement du frontend est automatisé via GitHub Actions. À chaque push sur la branche `main`, le workflow CI/CD :

1. Construit l'application React
2. Déploie sur Surge.sh à l'adresse https://flodrama.com

### Backend

Le backend est déployé sur AWS Lambda et exposé via API Gateway. L'URL de l'API est :
https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production

## Monitoring

- **Logs API Gateway** : CloudWatch Logs (/aws/apigateway/FloDrama-API-Production)
- **Métriques** : CloudWatch Metrics
- **Alertes** : CloudWatch Alarms

## Licence

Tous droits réservés 2025 FloDrama
