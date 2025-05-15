# Workflows GitHub Actions de FloDrama

Ce dossier contient les workflows GitHub Actions utilisés pour automatiser les processus de scraping, d'enrichissement et de distribution des données pour le projet FloDrama.

## Workflows actifs

### Pipeline de Scraping (`scraping-pipeline-optimise.yml`)

Ce workflow est le pipeline principal de scraping qui remplace tous les anciens workflows. Il combine les fonctionnalités de scraping, d'enrichissement et de distribution des données en un seul workflow modulaire.

**Déclencheurs :**
- Exécution manuelle via l'interface GitHub (avec options configurables)
- Exécution planifiée tous les jours à 2h du matin
- Push sur les branches `main` ou `integration-cloudflare` dans les dossiers spécifiques

**Fonctionnalités :**
- Scraping modulaire avec support de sources multiples
- Enrichissement des données via l'API TMDB
- Distribution des données vers Cloudflare D1
- Notifications Discord pour les succès et échecs
- Mode debug pour faciliter le dépannage

**Options configurables :**
- Sauter certaines étapes (scraping, enrichissement, distribution)
- Activer le mode debug
- Spécifier les sources à scraper

## Workflows archivés

Les workflows suivants ont été archivés et ne sont plus utilisés :

- `crawlee-scraping.yml` - Ancien workflow utilisant Crawlee
- `scrapy-scraper.yml` - Ancien workflow utilisant Scrapy
- `content-distribution.yml` - Ancien workflow de distribution des données
- `scraping-pipeline.yml` - Version précédente du pipeline de scraping

## Bonnes pratiques

1. **Utilisation des secrets :** Toutes les clés d'API et informations sensibles sont stockées dans les secrets GitHub
2. **Concurrency :** Limitation de l'exécution simultanée pour éviter les conflits
3. **Timeouts :** Limitation de la durée d'exécution pour éviter les workflows bloqués
4. **Notifications :** Alertes Discord pour les succès et échecs des workflows

## Comment utiliser

Pour exécuter manuellement le workflow de scraping :

1. Accédez à l'onglet "Actions" du dépôt GitHub
2. Sélectionnez "Pipeline de Scraping FloDrama" dans la liste des workflows
3. Cliquez sur "Run workflow"
4. Configurez les options selon vos besoins
5. Cliquez sur "Run workflow" pour démarrer l'exécution

## Structure des dossiers

- `.github/workflows/` - Contient les workflows actifs
- `.github/workflows/archives/` - Contient les workflows archivés
- `.github/scripts/stealth/` - Scripts de scraping optimisés
- `.github/scripts/enrichment/` - Scripts d'enrichissement des données
- `cloudflare/scraping/` - Configuration et scripts pour Cloudflare D1
