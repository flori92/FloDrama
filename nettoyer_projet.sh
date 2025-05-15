#!/bin/bash

# Script pour nettoyer le projet FloDrama après la réorganisation
# Ce script supprime les fichiers redondants et inutiles

# Définition des chemins de base
BASE_DIR="/Users/floriace/FLO_DRAMA"
FLODRAMA_DIR="${BASE_DIR}/FloDrama"
NEW_DIR="${FLODRAMA_DIR}/New-FloDrama"

# Création d'une sauvegarde avant de commencer
echo "Création d'une sauvegarde..."
BACKUP_DIR="${FLODRAMA_DIR}/backups/nettoyage_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# Fonction pour gérer les erreurs
function handle_error {
  echo "ERREUR: $1"
  exit 1
}

# Vérification que la réorganisation a bien été effectuée
if [ ! -d "${NEW_DIR}/frontend/src" ] || [ ! "$(ls -A "${NEW_DIR}/frontend/src")" ]; then
  handle_error "La réorganisation ne semble pas avoir été effectuée. Le dossier frontend/src est vide ou n'existe pas."
fi

# Sauvegarde des fichiers qui vont être supprimés
echo "Sauvegarde des fichiers qui vont être supprimés..."
mkdir -p "${BACKUP_DIR}/src_original"
mkdir -p "${BACKUP_DIR}/public_original"
mkdir -p "${BACKUP_DIR}/temp_files"

cp -r "${NEW_DIR}/src" "${BACKUP_DIR}/src_original/" || handle_error "Échec de la sauvegarde du dossier src"
cp -r "${NEW_DIR}/public" "${BACKUP_DIR}/public_original/" || handle_error "Échec de la sauvegarde du dossier public"

# Fichiers temporaires à sauvegarder avant suppression
cp -r "${NEW_DIR}/temp" "${BACKUP_DIR}/temp_files/" 2>/dev/null || true
cp -r "${NEW_DIR}/temp_backup" "${BACKUP_DIR}/temp_files/" 2>/dev/null || true

# Liste des fichiers et dossiers à supprimer après la réorganisation
echo "Suppression des fichiers et dossiers redondants..."

# Suppression des dossiers source originaux (après avoir vérifié qu'ils ont bien été copiés)
if [ -d "${NEW_DIR}/frontend/src" ] && [ "$(ls -A "${NEW_DIR}/frontend/src")" ]; then
  echo "Suppression du dossier src original..."
  rm -rf "${NEW_DIR}/src"
fi

if [ -d "${NEW_DIR}/frontend/public" ] && [ "$(ls -A "${NEW_DIR}/frontend/public")" ]; then
  echo "Suppression du dossier public original..."
  rm -rf "${NEW_DIR}/public"
fi

# Suppression des dossiers temporaires
echo "Suppression des dossiers temporaires..."
rm -rf "${NEW_DIR}/temp" 2>/dev/null || true
rm -rf "${NEW_DIR}/temp_backup" 2>/dev/null || true

# Déplacement des fichiers de configuration vers le dossier frontend
echo "Déplacement des fichiers de configuration vers le dossier frontend..."
for config_file in postcss.config.cjs tailwind.config.cjs vite.config.js .npmrc .auditrc
do
  if [ -f "${NEW_DIR}/${config_file}" ]; then
    # Vérifier si le fichier existe déjà dans le dossier frontend
    if [ ! -f "${NEW_DIR}/frontend/${config_file}" ]; then
      cp "${NEW_DIR}/${config_file}" "${NEW_DIR}/frontend/" || echo "Avertissement: Échec de la copie de ${config_file}"
    fi
    # Sauvegarde avant suppression
    cp "${NEW_DIR}/${config_file}" "${BACKUP_DIR}/${config_file}" 2>/dev/null || true
    # Suppression du fichier original
    rm "${NEW_DIR}/${config_file}" 2>/dev/null || true
  fi
done

# Déplacement des fichiers de documentation vers le dossier docs
echo "Déplacement des fichiers de documentation vers le dossier docs..."
for doc_file in MIGRATION_CLOUDFLARE.md SECURITE.md
do
  if [ -f "${NEW_DIR}/${doc_file}" ]; then
    # Vérifier si le fichier existe déjà dans le dossier docs
    if [ ! -f "${NEW_DIR}/docs/${doc_file}" ]; then
      cp "${NEW_DIR}/${doc_file}" "${NEW_DIR}/docs/" || echo "Avertissement: Échec de la copie de ${doc_file}"
    fi
    # Sauvegarde avant suppression
    cp "${NEW_DIR}/${doc_file}" "${BACKUP_DIR}/${doc_file}" 2>/dev/null || true
    # Suppression du fichier original
    rm "${NEW_DIR}/${doc_file}" 2>/dev/null || true
  fi
done

# Mise à jour du README principal
echo "Mise à jour du README principal..."
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

## Historique

Ce projet est une refonte complète de l'application FloDrama, avec une architecture moderne basée sur Cloudflare Workers et Pages.
EOF

echo "=================================================="
echo "✅ Nettoyage du projet terminé avec succès!"
echo "=================================================="
echo "Les fichiers redondants ont été supprimés"
echo "Une sauvegarde a été créée dans ${BACKUP_DIR}"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Vérifiez manuellement que l'application fonctionne correctement après ce nettoyage."
echo ""
echo "Prochaines étapes recommandées:"
echo "1. Testez l'application frontend: cd ${NEW_DIR}/frontend && npm run dev"
echo "2. Testez les API backend: cd ${NEW_DIR}/backend/api && npx wrangler dev"
echo "3. Testez le service d'authentification: cd ${NEW_DIR}/backend/auth && npx wrangler dev"
echo "=================================================="
