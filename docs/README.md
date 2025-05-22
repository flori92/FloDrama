# Documentation FloDrama

Bienvenue dans la documentation technique de FloDrama, la plateforme de streaming moderne.

## 📚 Table des Matières

1. [Architecture](/architecture/overview.md)
   - Vue d'ensemble
   - Composants principaux
   - Flux de données

2. [Base de Données](/database/schema.md)
   - Schéma de la base principale
   - Schéma du système de streaming
   - Relations entre les tables

3. [API](/api/openapi.yaml)
   - Documentation complète des endpoints
   - Modèles de données
   - Exemples de requêtes

4. [Déploiement](/deployment/README.md)
   - Prérequis
   - Variables d'environnement
   - Procédures de déploiement

5. [Développement](/development/README.md)
   - Configuration de l'environnement
   - Standards de code
   - Processus de contribution

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- pnpm 8+
- Compte Cloudflare
- Wrangler CLI

### Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/flodrama.git
   cd flodrama
   ```

2. Installer les dépendances :
   ```bash
   pnpm install
   ```

3. Configurer les variables d'environnement :
   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos paramètres
   ```

4. Lancer l'environnement de développement :
   ```bash
   pnpm dev
   ```

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).
