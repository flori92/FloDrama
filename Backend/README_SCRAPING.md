# Documentation du Système de Scraping FloDrama

## Vue d'ensemble

Le système de scraping de FloDrama est conçu pour collecter automatiquement des contenus asiatiques (dramas, animes, films, etc.) depuis diverses sources en ligne. Il s'agit d'une architecture hybride avec des composants frontend et backend qui fonctionnent ensemble pour fournir une expérience utilisateur optimale.

## Architecture

Le système est composé de deux parties principales :

1. **Frontend (JavaScript)** : 
   - `SmartScrapingService.js` : Adaptateur qui s'intègre à l'application React/Next.js
   - Gère le cache local et l'interface avec l'utilisateur
   - Fournit des méthodes pour rechercher et afficher les contenus

2. **Backend (Python)** : 
   - `ScrapingService.py` : Service principal de scraping
   - Effectue le scraping des sites sources
   - Stocke les données dans MongoDB et les indexe dans OpenSearch
   - S'exécute sur AWS Lambda pour les opérations à grande échelle

## Configuration et Installation

### Prérequis

- Python 3.9+
- Node.js 16+
- AWS CLI configuré avec les identifiants appropriés
- MongoDB
- Redis
- OpenSearch

### Installation

1. Exécutez le script d'installation :

```bash
cd /Users/floriace/FLO_DRAMA/FloDrama/Backend
chmod +x setup_scraping.sh
./setup_scraping.sh
```

Ce script va :
- Installer les dépendances Python nécessaires
- Configurer AWS CLI avec vos identifiants
- Créer les fichiers de configuration nécessaires

2. Déployez la fonction Lambda :

```bash
python3 deploy_lambda.py
```

## Utilisation

### Test des Sources de Scraping

Pour tester la disponibilité des sources de scraping :

```bash
python3 src/scripts/test_scraping_sources.py
```

Ce script génère un rapport HTML dans le dossier `reports/` avec les résultats des tests.

### Lancement du Scraping sur AWS

Pour lancer le scraping sur AWS Lambda :

```bash
python3 launch_aws_scraping.py
```

Ce script invoque la fonction Lambda pour chaque source configurée dans `scraping_config.py`.

## Sources de Contenu

Le système est configuré pour scraper les sources suivantes :

- **Dramas** : Dramacool, Vostfree, MyAsianTV, DramaBus
- **Animes** : Gogoanime, VoirAnime, Neko-Sama
- **Films** : Diverses sources
- **Bollywood** : Zee5, Hotstar

- [x] La source Senpai-Stream a été retirée du projet car l'accès aux contenus nécessite une authentification ou n'est pas exploitable sans compte. Toutes les références, scripts et utilitaires associés ont été supprimés conformément à la politique de scraping.

## Statistiques et Monitoring

Le système collecte les statistiques suivantes :

- Nombre total d'éléments par catégorie
- Sources de contenu
- Qualité des métadonnées
- Langues disponibles
- Genres les plus populaires

Ces statistiques sont disponibles via l'API du backend et peuvent être visualisées dans l'interface d'administration.

## Sécurité et Conformité

Le système est conçu pour respecter les bonnes pratiques de scraping :

- Délais entre les requêtes pour éviter la surcharge des serveurs
- Respect des robots.txt
- Identification claire de l'agent utilisateur
- Mise en cache pour minimiser les requêtes répétées

## Dépannage

### Problèmes courants

1. **Erreur "No module named 'aiohttp'"** :
   - Solution : Exécutez `pip3 install aiohttp`

2. **Erreur de connexion AWS** :
   - Solution : Vérifiez vos identifiants AWS avec `aws configure`

3. **Erreur MongoDB** :
   - Solution : Assurez-vous que MongoDB est en cours d'exécution

## Développement Futur

- Intégration avec des services d'IA pour l'analyse de contenu
- Support pour davantage de sources
- Interface d'administration améliorée pour le monitoring
- Système de notification pour les nouveaux contenus

---

*Documentation générée le 20/04/2025*
