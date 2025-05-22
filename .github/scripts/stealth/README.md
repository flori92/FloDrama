# Pipeline de Scraping FloDrama

Ce dossier contient les scripts nécessaires pour exécuter le pipeline complet de scraping de FloDrama.

## Structure du projet

```
.github/scripts/stealth/
├── README.md                  # Ce fichier
├── run-pipeline.sh            # Script principal du pipeline
├── run-scraper.sh             # Script pour exécuter le scraper
├── enrichissement.js          # Script d'enrichissement des données (optionnel)
└── distribution.js           # Script de distribution des données (optionnel)
```

## Prérequis

- Bash 4.0 ou supérieur
- Node.js 14.x ou supérieur
- npm 6.x ou supérieur
- Les dépendances listées dans `package.json`

## Installation des dépendances

```bash
# Installer les dépendances globales (si nécessaire)
npm install -g fs-extra axios cheerio puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

# Ou les installer localement dans le projet
npm install fs-extra axios cheerio puppeteer puppeteer-extra puppeteer-extra-plugin-stealth --save
```

## Utilisation

### Script principal (run-pipeline.sh)

Le script principal `run-pipeline.sh` gère l'ensemble du processus de scraping, d'enrichissement et de distribution des données.

```bash
# Afficher l'aide
./run-pipeline.sh --help

# Exécuter le pipeline complet
./run-pipeline.sh

# Options disponibles
./run-pipeline.sh [--skip-scraping] [--skip-enrichment] [--skip-distribution] [--clean] [--verbose] [--help]

# Exemple : Exécuter uniquement le scraping avec nettoyage
./run-pipeline.sh --skip-enrichment --skip-distribution --clean
```

#### Options

- `-s, --skip-scraping` : Ignorer l'étape de scraping
- `-e, --skip-enrichment` : Ignorer l'étape d'enrichissement
- `-d, --skip-distribution` : Ignorer l'étape de distribution
- `-c, --clean` : Nettoyer les fichiers temporaires après l'exécution
- `-v, --verbose` : Activer le mode verbeux
- `-h, --help` : Afficher l'aide

### Script de scraping (run-scraper.sh)

Ce script est utilisé en interne par le pipeline principal pour exécuter le scraper.

```bash
# Utilisation de base
./run-scraper.sh

# Options disponibles
./run-scraper.sh [--all] [--limit=N] [--output=DIR] [--debug] [--save]
```

## Configuration

### Variables d'environnement

Le script utilise plusieurs variables d'environnement pour la configuration :

- `LOG_DIR` : Répertoire de stockage des logs (par défaut : `./logs`)
- `MAX_LOG_FILES` : Nombre maximum de fichiers de logs à conserver (par défaut : 10)
- `DISCORD_WEBHOOK` : URL du webhook Discord pour les notifications d'erreur (optionnel)
- `GITHUB_ACTIONS` : Défini automatiquement par GitHub Actions (ne pas modifier)

### Fichiers de configuration

- `.env` : Fichier pour définir les variables d'environnement (optionnel)
- `scraping-config.json` : Configuration spécifique au scraper

## Journalisation

Les journaux sont enregistrés dans le répertoire `logs/` avec le format suivant :

```
logs/
├── scraping-pipeline_20230521_143022.log
└── pipeline_report_20230521_143022.txt
```

## Intégration avec GitHub Actions

Le pipeline peut être exécuté via GitHub Actions en utilisant le workflow défini dans `.github/workflows/scraping-pipeline.yml`.

## Dépannage

### Problèmes courants

1. **Erreurs de dépendances** :
   ```bash
   npm install
   ```

2. **Problèmes de permissions** :
   ```bash
   chmod +x *.sh
   ```

3. **Fichiers temporaires corrompus** :
   ```bash
   ./run-pipeline.sh --clean
   ```

## Sécurité

- Ne partagez jamais les fichiers de configuration contenant des informations sensibles
- Utilisez des variables d'environnement pour les secrets
- Vérifiez régulièrement les journaux pour détecter d'éventuelles erreurs ou activités suspectes

## Licence

Ce projet est sous licence [LICENSE]. Voir le fichier `LICENSE` pour plus de détails.

## Auteur

[Votre nom] - [Votre email] - [Votre site web]

---

Dernière mise à jour : 21 mai 2025
