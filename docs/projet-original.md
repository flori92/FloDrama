# FloDrama

## Présentation

FloDrama est une plateforme de streaming qui agrège et organise des contenus provenant de diverses sources (dramas, animes, films). L'application utilise désormais une architecture moderne et scalable basée entièrement sur l'écosystème Cloudflare.

## Architecture technique

### Frontend

- **Framework** : React avec Vite
- **Rendu** : Hybride (SSR + CSR)
- **Styling** : Tailwind CSS
- **État global** : React Context API + Hooks personnalisés
- **Déploiement** : Cloudflare Pages (https://flodrama.com)

### Backend

- **Langage** : JavaScript/TypeScript
- **API** : Cloudflare Workers pour les endpoints REST
- **Base de données** : Cloudflare D1 (SQL compatible avec SQLite)
- **Cache** : Cloudflare KV pour les performances
- **Stockage** : Cloudflare R2 pour les médias et fichiers statiques
- **Streaming** : Cloudflare Stream pour la diffusion vidéo
- **Authentification** : JWT (JSON Web Tokens)

### Infrastructure Cloud (Cloudflare)

- **Compute** : Cloudflare Workers pour les fonctions serverless
- **API** : Cloudflare Workers pour exposer les endpoints REST
- **Stockage** : R2 pour les médias et fichiers statiques
- **CDN** : Réseau global Cloudflare pour la distribution de contenu
- **Scraping** : Architecture hybride (Workers + Render)

### Intégration et Déploiement

- **Versioning** : Git avec GitHub
- **CI/CD** : GitHub Actions pour l'intégration continue
- **Déploiement Frontend** : Cloudflare Pages (automatisé via GitHub Actions)
- **Déploiement Backend** : Wrangler CLI pour Cloudflare Workers

## Changements récents

### Migration vers Cloudflare (Mai 2025)

- Migration complète de l'infrastructure AWS/Supabase vers Cloudflare
- Utilisation de Cloudflare D1 pour remplacer PostgreSQL
- Remplacement du stockage S3 par Cloudflare R2
- Migration des vidéos vers Cloudflare Stream
- Refonte du système de scraping pour utiliser Cloudflare Workers

## Développement local

### Prérequis

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Git

### Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/flori92/FloDrama.git
   cd FloDrama
   ```

2. Installer les dépendances du frontend :
   ```bash
   cd cloudflare/frontend
   npm install
   ```

3. Installer les dépendances du backend :
   ```bash
   cd cloudflare/backend
   npm install
   ```

4. Installer les dépendances du système de scraping :
   ```bash
   cd cloudflare/scraping
   npm install
   ```

### Lancement en local

1. Démarrer le frontend :
   ```bash
   cd cloudflare/frontend
   npm run dev
   ```

2. Démarrer le backend :
   ```bash
   cd cloudflare/backend
   npm run dev
   ```

3. Démarrer le système de scraping (pour les tests) :
   ```bash
   cd cloudflare/scraping
   npm run dev
   ```

## Déploiement

### Frontend

Le déploiement du frontend est automatisé via GitHub Actions. À chaque push sur la branche `main`, le workflow CI/CD :

1. Construit l'application React
2. Déploie sur Cloudflare Pages à l'adresse https://flodrama.com

### Backend et Scraping

Le backend et le système de scraping sont déployés sur Cloudflare Workers via Wrangler :

```bash
# Déploiement du backend
cd cloudflare/backend
npm run deploy

# Déploiement du scraping
cd cloudflare/scraping
npm run deploy
```

Les URLs des services sont :
- API Backend : https://flodrama-api-prod.florifavi.workers.dev
- Système de scraping : https://flodrama-scraper.florifavi.workers.dev

## Structure du projet

```
FloDrama/
├── cloudflare/               # Nouvelle architecture Cloudflare
│   ├── backend/              # API backend (Cloudflare Workers)
│   ├── frontend/             # Application React (Cloudflare Pages)
│   ├── scraping/             # Système de scraping (Cloudflare Workers)
│   └── migration/            # Scripts de migration depuis AWS/Supabase
├── Backend/                  # Ancienne architecture (en cours de migration)
└── Frontend/                 # Ancienne architecture (en cours de migration)
```

## Monitoring

- **Logs Workers** : Cloudflare Dashboard
- **Métriques** : Cloudflare Analytics
- **Alertes** : Cloudflare Notifications

## Licence

Tous droits réservés 2025 FloDrama
