# Outils de Migration FloDrama vers Cloudflare

Ce dossier contient les outils nécessaires pour migrer les données de Supabase vers Cloudflare D1.

## Prérequis

- Node.js v16+
- npm ou yarn
- Wrangler CLI (`npm install -g wrangler`)
- Accès à Supabase (URL et clé API)
- Accès à Cloudflare (compte et token API)

## Configuration

1. Assurez-vous que le fichier `.env` à la racine du dossier `cloudflare` contient les variables suivantes :

```
# Informations Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-clé-api-supabase
DATABASE_URL=postgres://postgres:votre-mot-de-passe@db.votre-projet.supabase.co:5432/postgres

# Informations Cloudflare
CLOUDFLARE_ACCOUNT_ID=42fc982266a2c31b942593b18097e4b3
CLOUDFLARE_API_TOKEN=H1ITLGJaq4ZwAh57Y5tOSNdlL8pfXiHNQp8Zz40E
CLOUDFLARE_STREAM_TOKEN=mGa7n-h-E9RJi3q9IGfpwF1JjPQx57hhRxQuGC0a
```

## Installation

```bash
# Installation des dépendances
npm install
```

## Utilisation

```bash
# Exécution de la migration
npm run migrate
```

Le script effectuera les opérations suivantes :

1. Vérification de la connexion à Supabase
2. Création de la base de données D1 si elle n'existe pas
3. Initialisation du schéma dans D1
4. Migration des données table par table
5. Mise à jour des fichiers de configuration

## Résolution des problèmes

Si vous rencontrez des erreurs lors de la migration, vérifiez les points suivants :

- Les informations de connexion à Supabase sont correctes
- Vous êtes bien connecté à Cloudflare avec `wrangler login`
- Les tables existent bien dans Supabase
- Vous avez les droits nécessaires pour créer des ressources dans Cloudflare

## Après la migration

Une fois la migration terminée, vous pouvez déployer l'application complète avec le script `deploy.sh` à la racine du dossier `cloudflare`.
