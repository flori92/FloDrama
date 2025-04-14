# Service de Paiement Unifié FloDrama

Ce service gère l'ensemble des fonctionnalités liées aux paiements, abonnements et analyses de conversion pour la plateforme FloDrama.

## 🎯 Fonctionnalités

- Gestion complète des abonnements (création, mise à jour, annulation)
- Vérification des paiements PayPal
- Historique des paiements
- Suivi des conversions et du comportement utilisateur
- Métriques et analyses pour le tableau de bord administrateur

## 🛠️ Architecture

Le service est construit avec:
- AWS Lambda pour le backend serverless
- DynamoDB pour le stockage des données
- API Gateway pour l'exposition des endpoints REST
- Cognito pour l'authentification

## 📋 Structure des tables DynamoDB

### Table Subscriptions
- Clé primaire: `userId` (String)
- Attributs: plan, statut, dates, méthode de paiement, etc.

### Table PaymentHistory
- Clé primaire: `id` (String)
- Index secondaire global: `userId` (String)
- Attributs: type de transaction, montant, devise, détails du paiement, etc.

### Table Analytics
- Clé primaire: `id` (String)
- Attributs: type d'événement, données utilisateur, timestamp, etc.

## 🔌 Endpoints API

### Abonnements
- `GET /subscription` - Récupérer l'abonnement de l'utilisateur
- `POST /subscription` - Créer un nouvel abonnement
- `PUT /subscription` - Mettre à jour un abonnement
- `POST /subscription/{id}/cancel` - Annuler un abonnement

### Paiements
- `POST /verify-paypal` - Vérifier un paiement PayPal
- `GET /payment-history` - Récupérer l'historique des paiements

### Analytics
- `POST /analytics/conversion` - Enregistrer un événement de conversion
- `POST /analytics/behavior` - Enregistrer un événement de comportement utilisateur
- `GET /analytics/conversion-metrics` - Récupérer les métriques de conversion
- `GET /analytics/behavior-metrics` - Récupérer les métriques de comportement

## 🚀 Installation et Démarrage

### Prérequis
- Node.js v16+
- AWS CLI configuré avec les identifiants appropriés
- Serverless Framework installé globalement (`npm install -g serverless`)

### Configuration locale
```bash
# Configuration initiale
npm run setup

# Démarrer le service en local
npm start
```

### Tests
```bash
# Exécuter les tests
npm test
```

### Déploiement
```bash
# Déployer sur l'environnement de développement
npm run deploy:dev

# Déployer sur l'environnement de staging
npm run deploy:staging

# Déployer sur l'environnement de production
npm run deploy:prod
```

## 🔒 Sécurité

- Authentification via Cognito User Pools
- Autorisation basée sur les tokens JWT
- CORS configuré pour limiter les origines
- Validation des entrées utilisateur

## 🎨 Identité visuelle

Le service respecte l'identité visuelle de FloDrama:
- Bleu signature: #3b82f6
- Fuchsia accent: #d946ef
- Dégradé signature: linear-gradient(to right, #3b82f6, #d946ef)
- Fond principal: #121118
- Fond secondaire: #1A1926

## 📊 Métriques et KPIs

Le service collecte et analyse les métriques suivantes:
- Taux de conversion
- Valeur moyenne des commandes
- Taux d'abandon
- Distribution des plans d'abonnement
- Comportement utilisateur sur les pages de paiement

## 🔄 Intégration avec le frontend

Le service s'intègre avec le frontend via le `PaymentApiService.js` qui encapsule toutes les interactions avec ces endpoints.

## 📝 Logs et surveillance

Les logs sont envoyés à CloudWatch et structurés pour faciliter le débogage et l'analyse des performances.

## 🧪 Scripts de test

Trois scripts de test sont disponibles:
1. `test-unified-payment-service.js` - Tests unitaires du service de paiement
2. `test-payment-integration.js` - Tests d'intégration avec le backend
3. `test-payment-performance.js` - Tests de performance sous charge

## 📦 Sauvegarde et versioning

Le service implémente un système de sauvegarde automatique:
- Sauvegarde avant chaque déploiement
- Format: `[timestamp]_backup_payment-service.zip`
- Commit Git automatique avec message descriptif
