#!/bin/bash

# Script pour finaliser la réorganisation du projet FloDrama
# Ce script déplace les fichiers du frontend vers la nouvelle structure

# Définition des chemins de base
BASE_DIR="/Users/floriace/FLO_DRAMA"
FLODRAMA_DIR="${BASE_DIR}/FloDrama"
NEW_DIR="${FLODRAMA_DIR}/New-FloDrama"

# Création d'une sauvegarde avant de commencer
echo "Création d'une sauvegarde..."
BACKUP_DIR="${FLODRAMA_DIR}/backups/finalisation_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# Fonction pour gérer les erreurs
function handle_error {
  echo "ERREUR: $1"
  exit 1
}

# Vérification que les dossiers source existent
if [ ! -d "${NEW_DIR}/src" ]; then handle_error "Dossier source src introuvable"; fi
if [ ! -d "${NEW_DIR}/frontend/src" ]; then handle_error "Dossier destination frontend/src introuvable"; fi

# Sauvegarde des fichiers importants
echo "Sauvegarde des fichiers actuels..."
cp -r "${NEW_DIR}/src" "${BACKUP_DIR}/src_backup" || handle_error "Échec de la sauvegarde du dossier src"
cp -r "${NEW_DIR}/public" "${BACKUP_DIR}/public_backup" || handle_error "Échec de la sauvegarde du dossier public"

# Déplacement des fichiers du frontend vers la nouvelle structure
echo "Déplacement des fichiers du frontend..."
cp -r "${NEW_DIR}/src"/* "${NEW_DIR}/frontend/src/" || handle_error "Échec de la copie des fichiers src"
cp -r "${NEW_DIR}/public"/* "${NEW_DIR}/frontend/public/" || handle_error "Échec de la copie des fichiers public"

# Mise à jour des chemins d'importation dans les fichiers JavaScript/JSX
echo "Mise à jour des chemins d'importation..."
find "${NEW_DIR}/frontend/src" -type f -name "*.js" -o -name "*.jsx" | while read -r file; do
  echo "Traitement du fichier: $file"
  # Sauvegarde du fichier original
  cp "$file" "${file}.bak"
  # Mise à jour des chemins d'importation relatifs
  sed -i '' 's|from "../|from "../../|g' "$file"
  sed -i '' 's|from "./|from "../|g' "$file"
done

# Mise à jour du fichier package.json pour refléter la nouvelle structure
echo "Mise à jour du fichier package.json..."
if [ -f "${NEW_DIR}/package.json" ]; then
  cp "${NEW_DIR}/package.json" "${NEW_DIR}/frontend/package.json"
  # Mise à jour des chemins dans package.json
  sed -i '' 's|"src/|"../src/|g' "${NEW_DIR}/frontend/package.json"
fi

# Mise à jour du fichier vite.config.js
echo "Mise à jour du fichier vite.config.js..."
if [ -f "${NEW_DIR}/vite.config.js" ]; then
  cp "${NEW_DIR}/vite.config.js" "${NEW_DIR}/frontend/vite.config.js"
  # Mise à jour des chemins dans vite.config.js
  sed -i '' 's|resolve: {|resolve: {\n    root: path.resolve(__dirname, "../"),|g' "${NEW_DIR}/frontend/vite.config.js"
fi

# Mise à jour du fichier index.html
echo "Mise à jour du fichier index.html..."
if [ -f "${NEW_DIR}/index.html" ]; then
  cp "${NEW_DIR}/index.html" "${NEW_DIR}/frontend/index.html"
  # Mise à jour des chemins dans index.html
  sed -i '' 's|src="/src/|src="/frontend/src/|g' "${NEW_DIR}/frontend/index.html"
fi

# Création d'un fichier README pour le frontend
echo "Création du fichier README pour le frontend..."
cat > "${NEW_DIR}/frontend/README.md" << 'EOF'
# FloDrama Frontend

Ce dossier contient l'application frontend de FloDrama, développée avec React, Vite et Tailwind CSS.

## Structure du projet

- **src/** : Code source de l'application
  - **Components/** : Composants réutilisables
  - **Pages/** : Pages de l'application
  - **Context/** : Contextes React pour la gestion d'état
  - **CustomHooks/** : Hooks personnalisés
  - **Constants/** : Constantes et configurations
  - **utils/** : Fonctions utilitaires

- **public/** : Ressources statiques

## Démarrage rapide

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Construction pour la production
npm run build
```

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
VITE_API_BASE_URL=https://api.flodrama.com
VITE_AUTH_URL=https://auth.flodrama.com
```

## Déploiement

Le frontend est déployé sur Cloudflare Pages. Pour plus d'informations sur le déploiement, consultez la documentation dans le dossier `docs/`.
EOF

echo "=================================================="
echo "✅ Finalisation de la réorganisation terminée avec succès!"
echo "=================================================="
echo "Les fichiers du frontend ont été déplacés vers ${NEW_DIR}/frontend/"
echo "Une sauvegarde a été créée dans ${BACKUP_DIR}"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Vérifiez manuellement que l'application fonctionne correctement après cette réorganisation."
echo "Vous devrez peut-être ajuster certains chemins d'importation manuellement."
echo ""
echo "Prochaines étapes recommandées:"
echo "1. Testez l'application frontend: cd ${NEW_DIR}/frontend && npm run dev"
echo "2. Testez les API backend: cd ${NEW_DIR}/backend/api && npx wrangler dev"
echo "3. Testez le service d'authentification: cd ${NEW_DIR}/backend/auth && npx wrangler dev"
echo "=================================================="
