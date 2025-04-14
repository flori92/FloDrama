# Architecture FloDrama : Vercel + AWS

## Vue d'ensemble

FloDrama utilise désormais une architecture hybride :
- **Frontend** : Hébergé sur Vercel
- **Backend de scraping** : Services AWS (Lambda, DynamoDB)

## Composants

### Frontend (Vercel)

- **URL de production** : https://flodrama.vercel.app
- **Domaines personnalisés** : 
  - flodrama.com
  - www.flodrama.com
  - dev.flodrama.com (environnement de développement)

### Backend (AWS)

#### Services de scraping
- **Lambda Functions** : Fonctions Python pour le scraping de contenu
- **API Gateway** : Exposition des APIs de scraping
- **DynamoDB** : Stockage des données scrapées

#### Stockage de données
- **DynamoDB** : Tables principales (dramas, users, etc.)
- **S3** : Stockage des médias et assets

## Flux de déploiement

### Frontend
1. Push sur GitHub (branche main)
2. Déploiement automatique sur Vercel
3. Prévisualisations automatiques pour les Pull Requests

### Backend
1. Déploiement manuel des fonctions Lambda via AWS CLI
2. Configuration des tables DynamoDB via AWS CLI ou Console

## Maintenance

### Monitoring
- Vercel Analytics pour le frontend
- CloudWatch pour les services AWS

### Sauvegardes
- Export régulier des tables DynamoDB
- Réplication des buckets S3 importants

## Contacts

- **Responsable infrastructure** : [Nom]
- **Responsable développement** : [Nom]
