# FloDrama - Système de Scraping et Déploiement

Ce dossier contient l'ensemble des scripts nécessaires pour le scraping, la validation, la correction et le déploiement des données FloDrama vers Cloudflare KV.

## Architecture du système

Le système est composé de plusieurs modules interconnectés :

### 1. Scraping des données

- `serveur-relay-local-v2.js` : Serveur relay qui facilite le scraping en contournant les protections anti-bot
- `test-scraping-local.js` : Script principal de scraping qui récupère les données depuis les sources configurées

### 2. Analyse et monitoring

- `analyze-scraping-results.js` : Analyse les résultats du scraping et génère des rapports
- `monitor-sources-health.js` : Surveille la santé des sources de scraping
- `monitor-cloudflare-kv.js` : Surveille la santé des données dans Cloudflare KV

### 3. Correction et déploiement

- `fix-json-files.js` : Corrige les fichiers JSON corrompus ou mal formatés
- `deploy-to-cloudflare.js` : Déploie les fichiers JSON vers Cloudflare KV

### 4. Automatisation

- `automatisation-complete.js` : Orchestre l'ensemble du processus de scraping à déploiement
- `lancer-automatisation.sh` : Script shell pour lancer facilement l'automatisation complète
- `lancer-scraping-complet.sh` : Script shell pour lancer uniquement le processus de scraping

## Configuration

Les scripts utilisent les variables d'environnement suivantes :

- `CLOUDFLARE_ACCOUNT_ID` : ID du compte Cloudflare
- `CLOUDFLARE_NAMESPACE_ID` : ID du namespace KV
- `CLOUDFLARE_API_TOKEN` : Token d'API Cloudflare
- `DISCORD_WEBHOOK_URL` (optionnel) : URL du webhook Discord pour les notifications

## Utilisation

### Lancer l'automatisation complète

```bash
./lancer-automatisation.sh [DISCORD_WEBHOOK_URL]
```

### Surveiller la santé des données Cloudflare KV

```bash
node monitor-cloudflare-kv.js
```

### Corriger et déployer des fichiers JSON spécifiques

```bash
node fix-json-files.js
```

## Structure des dossiers

- `output/` : Contient les fichiers JSON bruts issus du scraping
- `fixed-output/` : Contient les fichiers JSON corrigés
- `logs/` : Contient les logs d'exécution des scripts
- `kv-reports/` : Contient les rapports de santé des données Cloudflare KV
- `source-analysis/` : Contient les analyses des sources de scraping

> **Note importante** : Les références à TMDB ont été supprimées car cette source n'est plus utilisée dans le projet FloDrama.

## Workflow recommandé

1. Exécuter le scraping complet via `./lancer-scraping-complet.sh`
2. Vérifier les résultats avec `node analyze-scraping-results.js`
3. Corriger les fichiers problématiques avec `node fix-json-files.js`
4. Déployer les données vers Cloudflare KV avec `node deploy-to-cloudflare.js`
5. Vérifier la santé des données avec `node monitor-cloudflare-kv.js`

Alternativement, utiliser `./lancer-automatisation.sh` pour exécuter toutes ces étapes automatiquement.

## Maintenance

- Vérifier régulièrement la santé des sources avec `monitor-sources-health.js`
- Mettre à jour les configurations des sources dans `serveur-relay-local-v2.js` si nécessaire
- Surveiller les rapports de santé dans le dossier `kv-reports/`
