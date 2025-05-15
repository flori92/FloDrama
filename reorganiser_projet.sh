#!/bin/bash

# Script de réorganisation du projet FloDrama
# Ce script déplace les fichiers nécessaires vers la nouvelle structure

# Définition des chemins de base
BASE_DIR="/Users/floriace/FLO_DRAMA"
FLODRAMA_DIR="${BASE_DIR}/FloDrama"
NEW_DIR="${FLODRAMA_DIR}/New-FloDrama"
BACKEND_DIR="${BASE_DIR}/FloDrama-backend"

# Création d'une sauvegarde avant de commencer
echo "Création d'une sauvegarde..."
BACKUP_DIR="${BASE_DIR}/backups/reorganisation_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# Fonction pour gérer les erreurs
function handle_error {
  echo "ERREUR: $1"
  exit 1
}

# Vérification que les dossiers source existent
if [ ! -d "${FLODRAMA_DIR}" ]; then handle_error "Dossier FloDrama introuvable"; fi
if [ ! -d "${BACKEND_DIR}" ]; then handle_error "Dossier FloDrama-backend introuvable"; fi

# Sauvegarde des fichiers importants
cp -r "${NEW_DIR}" "${BACKUP_DIR}/New-FloDrama_backup" || handle_error "Échec de la sauvegarde"

# Création de la structure de base si elle n'existe pas déjà
echo "Création de la structure de dossiers..."
mkdir -p "${NEW_DIR}/frontend/src"
mkdir -p "${NEW_DIR}/frontend/public"
mkdir -p "${NEW_DIR}/backend/api"
mkdir -p "${NEW_DIR}/backend/auth"
mkdir -p "${NEW_DIR}/docs"

# Déplacement du contenu actuel du frontend vers la nouvelle structure
echo "Organisation du frontend actuel..."
# Conserver les fichiers actuels du frontend dans New-FloDrama
echo "Le frontend est déjà dans New-FloDrama, conservation de la structure actuelle"

# Déplacement du backend Cloudflare Workers vers New-FloDrama/backend/api
echo "Déplacement des API Cloudflare Workers..."
if [ -d "${FLODRAMA_DIR}/cloudflare/workers/flodrama-api" ]; then
  cp -r "${FLODRAMA_DIR}/cloudflare/workers/flodrama-api"/* "${NEW_DIR}/backend/api/" || handle_error "Échec de la copie de flodrama-api"
fi

if [ -d "${FLODRAMA_DIR}/cloudflare/workers/unified-api" ]; then
  mkdir -p "${NEW_DIR}/backend/api/unified"
  cp -r "${FLODRAMA_DIR}/cloudflare/workers/unified-api"/* "${NEW_DIR}/backend/api/unified/" || handle_error "Échec de la copie de unified-api"
fi

# Déplacement du backend d'authentification
echo "Déplacement du service d'authentification..."
cp -r "${BACKEND_DIR}"/* "${NEW_DIR}/backend/auth/" || handle_error "Échec de la copie du backend d'authentification"

# Déplacement de la documentation
echo "Déplacement de la documentation..."
if [ -f "${FLODRAMA_DIR}/Documentation_FloDrama.md" ]; then
  cp "${FLODRAMA_DIR}/Documentation_FloDrama.md" "${NEW_DIR}/docs/" || handle_error "Échec de la copie de Documentation_FloDrama.md"
fi

if [ -f "${NEW_DIR}/MIGRATION_CLOUDFLARE.md" ]; then
  cp "${NEW_DIR}/MIGRATION_CLOUDFLARE.md" "${NEW_DIR}/docs/" || handle_error "Échec de la copie de MIGRATION_CLOUDFLARE.md"
fi

if [ -f "${NEW_DIR}/SECURITE.md" ]; then
  cp "${NEW_DIR}/SECURITE.md" "${NEW_DIR}/docs/" || handle_error "Échec de la copie de SECURITE.md"
fi

if [ -f "${FLODRAMA_DIR}/README.md" ]; then
  cp "${FLODRAMA_DIR}/README.md" "${NEW_DIR}/docs/projet-original.md" || handle_error "Échec de la copie du README original"
fi

# Création d'un nouveau README principal
echo "Création du nouveau README..."
cat > "${NEW_DIR}/README.md" << 'EOF'
# FloDrama - Nouvelle Version

Ce dépôt contient la nouvelle version de FloDrama, avec une architecture modernisée et optimisée.

## Structure du projet

- **frontend/** : Application React avec Vite et Tailwind CSS
- **backend/** : Services backend basés sur Cloudflare Workers
  - **api/** : API principale pour les contenus et fonctionnalités
  - **auth/** : Service d'authentification et gestion des utilisateurs
- **docs/** : Documentation du projet

## Démarrage rapide

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend API
```bash
cd backend/api
npm install
npx wrangler dev
```

### Backend Auth
```bash
cd backend/auth
npm install
npx wrangler dev
```

## Déploiement

Le frontend est déployé sur Cloudflare Pages, tandis que les backends sont déployés comme Cloudflare Workers.

Pour plus d'informations, consultez la documentation dans le dossier `docs/`.
EOF

# Création d'un fichier de configuration pour le déploiement
echo "Création du fichier de configuration pour le déploiement..."
cat > "${NEW_DIR}/wrangler.toml" << 'EOF'
# Configuration globale pour le projet FloDrama

[env.production]
name = "flodrama"
type = "webpack"
account_id = "42fc982266a2c31b942593b18097e4b3"
workers_dev = true

# Variables d'environnement communes
[vars]
ENVIRONMENT = "production"
API_VERSION = "1.0.0"
EOF

echo "=================================================="
echo "✅ Réorganisation terminée avec succès!"
echo "=================================================="
echo "Structure du projet réorganisée dans ${NEW_DIR}"
echo "Une sauvegarde a été créée dans ${BACKUP_DIR}"
echo "=================================================="
