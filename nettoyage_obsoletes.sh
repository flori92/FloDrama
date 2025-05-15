#!/bin/bash

# Script pour nettoyer les fichiers obsolètes du projet FloDrama
# Ce script identifie et supprime les fichiers qui ne sont plus nécessaires après la migration vers Cloudflare

# Définition des chemins de base
BASE_DIR="/Users/floriace/FLO_DRAMA"
FLODRAMA_DIR="${BASE_DIR}/FloDrama"
NEW_DIR="${FLODRAMA_DIR}/New-FloDrama"

# Création d'une sauvegarde avant de commencer
echo "Création d'une sauvegarde..."
BACKUP_DIR="${FLODRAMA_DIR}/backups/nettoyage_obsoletes_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# Fonction pour gérer les erreurs
function handle_error {
  echo "ERREUR: $1"
  exit 1
}

# Fonction pour sauvegarder avant suppression
function backup_and_remove {
  local source="$1"
  local dest_dir="$2"
  
  if [ -e "$source" ]; then
    # Créer le répertoire de destination s'il n'existe pas
    mkdir -p "$dest_dir"
    
    # Obtenir le nom du fichier/dossier sans le chemin
    local name=$(basename "$source")
    
    # Copier vers la sauvegarde
    cp -r "$source" "$dest_dir/$name" || echo "Avertissement: Échec de la sauvegarde de $source"
    
    # Supprimer l'original
    rm -rf "$source" || echo "Avertissement: Échec de la suppression de $source"
    
    echo "✓ Supprimé: $source (sauvegardé dans $dest_dir/$name)"
  fi
}

echo "=== Début du nettoyage des fichiers obsolètes ==="

# 1. Supprimer les fichiers de déploiement obsolètes
echo "Suppression des fichiers de déploiement obsolètes..."
OBSOLETE_DEPLOY_FILES=(
  "${FLODRAMA_DIR}/desactiver_cloudfront.sh"
  "${FLODRAMA_DIR}/update-imports.sh"
  "${NEW_DIR}/update_domain_final.sh"
  "${NEW_DIR}/vercel.json"
  "${NEW_DIR}/netlify.toml"
)

for file in "${OBSOLETE_DEPLOY_FILES[@]}"; do
  if [ -f "$file" ]; then
    backup_and_remove "$file" "${BACKUP_DIR}/obsolete_deploy"
  fi
done

# 2. Nettoyer les dossiers temporaires et de sauvegarde
echo "Nettoyage des dossiers temporaires..."
TEMP_DIRS=(
  "${NEW_DIR}/temp"
  "${NEW_DIR}/temp_backup"
)

for dir in "${TEMP_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    backup_and_remove "$dir" "${BACKUP_DIR}/temp_dirs"
  fi
done

# 3. Supprimer les fichiers de configuration redondants
echo "Suppression des fichiers de configuration redondants..."
if [ -f "${NEW_DIR}/_routes.json" ]; then
  # Vérifier si le fichier existe déjà dans frontend
  if [ -f "${NEW_DIR}/frontend/_routes.json" ]; then
    backup_and_remove "${NEW_DIR}/_routes.json" "${BACKUP_DIR}/redundant_configs"
  else
    # Si le fichier n'existe pas dans frontend, le déplacer
    mkdir -p "${NEW_DIR}/frontend"
    cp "${NEW_DIR}/_routes.json" "${NEW_DIR}/frontend/_routes.json" || echo "Avertissement: Échec de la copie de _routes.json"
    backup_and_remove "${NEW_DIR}/_routes.json" "${BACKUP_DIR}/redundant_configs"
  fi
fi

if [ -f "${NEW_DIR}/_headers" ]; then
  # Vérifier si le fichier existe déjà dans frontend
  if [ -f "${NEW_DIR}/frontend/_headers" ]; then
    backup_and_remove "${NEW_DIR}/_headers" "${BACKUP_DIR}/redundant_configs"
  else
    # Si le fichier n'existe pas dans frontend, le déplacer
    mkdir -p "${NEW_DIR}/frontend"
    cp "${NEW_DIR}/_headers" "${NEW_DIR}/frontend/_headers" || echo "Avertissement: Échec de la copie de _headers"
    backup_and_remove "${NEW_DIR}/_headers" "${BACKUP_DIR}/redundant_configs"
  fi
fi

# 4. Supprimer les anciens scripts de déploiement
echo "Suppression des anciens scripts de déploiement..."
find "${FLODRAMA_DIR}" -name "deploy*.sh" | while read -r file; do
  backup_and_remove "$file" "${BACKUP_DIR}/obsolete_scripts"
done

# 5. Nettoyer les fichiers de log obsolètes
echo "Nettoyage des fichiers de log obsolètes..."
find "${FLODRAMA_DIR}" -name "*.log" | while read -r file; do
  # Exclure les logs récents (moins de 7 jours)
  if [ $(find "$file" -mtime +7 -print | wc -l) -gt 0 ]; then
    backup_and_remove "$file" "${BACKUP_DIR}/old_logs"
  fi
done

# 6. Supprimer les fichiers de package.json redondants
echo "Vérification des package.json redondants..."
if [ -f "${NEW_DIR}/package.json" ] && [ -f "${NEW_DIR}/frontend/package.json" ]; then
  echo "⚠️ Des fichiers package.json redondants ont été détectés."
  echo "Le fichier package.json à la racine sera conservé pour l'instant."
  echo "Vous pouvez le déplacer manuellement si nécessaire."
fi

# 7. Nettoyer les anciens dossiers de build
echo "Nettoyage des anciens dossiers de build..."
OLD_BUILD_DIRS=(
  "${FLODRAMA_DIR}/build"
  "${FLODRAMA_DIR}/dist"
)

for dir in "${OLD_BUILD_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    backup_and_remove "$dir" "${BACKUP_DIR}/old_build_dirs"
  fi
done

# 8. Supprimer les fichiers .DS_Store
echo "Suppression des fichiers .DS_Store..."
find "${FLODRAMA_DIR}" -name ".DS_Store" | while read -r file; do
  rm -f "$file"
  echo "✓ Supprimé: $file"
done

# 9. Nettoyer les fichiers de sauvegarde créés par les éditeurs
echo "Nettoyage des fichiers de sauvegarde des éditeurs..."
find "${FLODRAMA_DIR}" -name "*~" -o -name "*.swp" -o -name "*.swo" | while read -r file; do
  rm -f "$file"
  echo "✓ Supprimé: $file"
done

echo "=== Nettoyage des fichiers obsolètes terminé ==="
echo "Une sauvegarde a été créée dans ${BACKUP_DIR}"
echo ""
echo "⚠️ IMPORTANT: Vérifiez manuellement que l'application fonctionne correctement après ce nettoyage."
echo ""
echo "Prochaines étapes recommandées:"
echo "1. Testez l'application frontend: cd ${NEW_DIR}/frontend && npm run dev"
echo "2. Testez les API backend: cd ${NEW_DIR}/backend/api && npx wrangler dev"
echo "3. Testez le service d'authentification: cd ${NEW_DIR}/backend/auth && npx wrangler dev"
