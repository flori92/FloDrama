#!/bin/bash

# Script pour nettoyer complètement le projet FloDrama
# Ce script supprime tous les éléments inutiles, obsolètes ou redondants

# Définition des chemins de base
BASE_DIR="/Users/floriace/FLO_DRAMA"
FLODRAMA_DIR="${BASE_DIR}/FloDrama"
NEW_DIR="${FLODRAMA_DIR}/New-FloDrama"

# Création d'une sauvegarde avant de commencer
echo "Création d'une sauvegarde..."
BACKUP_DIR="${FLODRAMA_DIR}/backups/nettoyage_complet_$(date +%Y%m%d_%H%M%S)"
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

echo "=== Début du nettoyage complet du projet FloDrama ==="

# 1. Supprimer tous les fichiers .bak
echo "Suppression des fichiers .bak..."
mkdir -p "${BACKUP_DIR}/bak_files"
find "${NEW_DIR}" -name "*.bak" | while read -r file; do
  backup_and_remove "$file" "${BACKUP_DIR}/bak_files"
done

# 2. Supprimer le dossier componets (doublon de components avec faute d'orthographe)
echo "Suppression du dossier componets (doublon de components)..."
if [ -d "${NEW_DIR}/frontend/src/componets" ]; then
  # Vérifier si les fichiers existent déjà dans components
  find "${NEW_DIR}/frontend/src/componets" -type f | while read -r file; do
    rel_path=$(echo "$file" | sed "s|${NEW_DIR}/frontend/src/componets/||")
    target_file="${NEW_DIR}/frontend/src/components/${rel_path}"
    
    # Si le fichier n'existe pas dans components, le copier
    if [ ! -f "$target_file" ]; then
      mkdir -p "$(dirname "$target_file")"
      cp "$file" "$target_file" || echo "Avertissement: Échec de la copie de $file vers $target_file"
      echo "Copié: $file -> $target_file (fichier manquant dans components)"
    fi
  done
  
  # Sauvegarder et supprimer le dossier componets
  backup_and_remove "${NEW_DIR}/frontend/src/componets" "${BACKUP_DIR}/redundant_folders"
fi

# 3. Supprimer les fichiers de configuration redondants à la racine
echo "Suppression des fichiers de configuration redondants..."
CONFIG_FILES=(
  "postcss.config.cjs"
  "tailwind.config.cjs"
  "vite.config.js"
  ".npmrc"
  ".auditrc"
)

for file in "${CONFIG_FILES[@]}"; do
  if [ -f "${NEW_DIR}/${file}" ] && [ -f "${NEW_DIR}/frontend/${file}" ]; then
    backup_and_remove "${NEW_DIR}/${file}" "${BACKUP_DIR}/redundant_configs"
  fi
done

# 4. Supprimer les scripts de mise à jour de domaine obsolètes
echo "Suppression des scripts obsolètes..."
OBSOLETE_SCRIPTS=(
  "update_domain.sh"
  "update_domain_v2.sh"
  "update_domain_v3.sh"
)

for script in "${OBSOLETE_SCRIPTS[@]}"; do
  if [ -f "${NEW_DIR}/${script}" ]; then
    backup_and_remove "${NEW_DIR}/${script}" "${BACKUP_DIR}/obsolete_scripts"
  fi
done

# 5. Nettoyer les dossiers vides
echo "Suppression des dossiers vides..."
find "${NEW_DIR}" -type d -empty | while read -r dir; do
  echo "Suppression du dossier vide: $dir"
  rmdir "$dir" || echo "Avertissement: Échec de la suppression du dossier vide $dir"
done

# 6. Supprimer les fichiers index.html redondants
if [ -f "${NEW_DIR}/index.html" ] && [ -f "${NEW_DIR}/frontend/index.html" ]; then
  backup_and_remove "${NEW_DIR}/index.html" "${BACKUP_DIR}/redundant_files"
fi

# 7. Supprimer les fichiers node_modules redondants (attention, cette opération peut prendre du temps)
echo "Vérification des node_modules redondants..."
if [ -d "${NEW_DIR}/node_modules" ] && [ -d "${NEW_DIR}/frontend/node_modules" ]; then
  echo "⚠️ Des dossiers node_modules redondants ont été détectés."
  echo "Le dossier node_modules à la racine sera conservé pour l'instant."
  echo "Vous pouvez le supprimer manuellement si nécessaire avec:"
  echo "rm -rf \"${NEW_DIR}/node_modules\""
fi

# 8. Vérifier et corriger les doublons dans les dossiers src
echo "Vérification des doublons dans les dossiers src..."
if [ -d "${NEW_DIR}/src" ]; then
  echo "⚠️ Le dossier src à la racine existe toujours après la réorganisation."
  echo "Il devrait avoir été déplacé vers frontend/src."
  echo "Vous pouvez le supprimer manuellement si nécessaire avec:"
  echo "rm -rf \"${NEW_DIR}/src\""
fi

# 9. Vérifier et corriger les doublons dans les dossiers public
echo "Vérification des doublons dans les dossiers public..."
if [ -d "${NEW_DIR}/public" ]; then
  echo "⚠️ Le dossier public à la racine existe toujours après la réorganisation."
  echo "Il devrait avoir été déplacé vers frontend/public."
  echo "Vous pouvez le supprimer manuellement si nécessaire avec:"
  echo "rm -rf \"${NEW_DIR}/public\""
fi

# 10. Supprimer les fichiers temporaires
echo "Suppression des fichiers temporaires..."
find "${NEW_DIR}" -name "*.tmp" -o -name "*.temp" | while read -r file; do
  backup_and_remove "$file" "${BACKUP_DIR}/temp_files"
done

echo "=== Nettoyage complet terminé ==="
echo "Une sauvegarde a été créée dans ${BACKUP_DIR}"
echo ""
echo "⚠️ IMPORTANT: Vérifiez manuellement que l'application fonctionne correctement après ce nettoyage."
echo ""
echo "Prochaines étapes recommandées:"
echo "1. Testez l'application frontend: cd ${NEW_DIR}/frontend && npm run dev"
echo "2. Testez les API backend: cd ${NEW_DIR}/backend/api && npx wrangler dev"
echo "3. Testez le service d'authentification: cd ${NEW_DIR}/backend/auth && npx wrangler dev"
