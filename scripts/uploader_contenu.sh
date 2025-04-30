#!/bin/bash

# Script pour uploader du contenu vers les buckets S3 de FloDrama
# Ce script permet de télécharger facilement des fichiers et dossiers vers les buckets S3

echo "✨ [FEAT] Outil d'upload de contenu vers les buckets S3 de FloDrama"

# Configuration
REGION="eu-west-3"  # Région Paris
BUCKETS=(
  "flodrama-content"
  "flodrama-images"
  "flodrama-assets"
)

# Fonction pour afficher l'aide
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                  Afficher cette aide"
  echo "  -b, --bucket NOM_BUCKET     Spécifier le bucket S3 (flodrama-content, flodrama-images, flodrama-assets)"
  echo "  -f, --file FICHIER          Uploader un fichier"
  echo "  -d, --directory DOSSIER     Uploader un dossier (synchronisation)"
  echo "  -p, --path CHEMIN_DEST      Chemin de destination dans le bucket (optionnel)"
  echo ""
  echo "Exemples:"
  echo "  $0 --bucket flodrama-content --file ./data/drama.json"
  echo "  $0 --bucket flodrama-images --directory ./images/posters --path media/posters"
  echo ""
}

# Vérifier si un bucket existe
check_bucket_exists() {
  local bucket_name=$1
  echo "🔍 Vérification du bucket S3: $bucket_name"
  
  if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
    echo "✅ Le bucket $bucket_name existe."
    return 0
  else
    echo "❌ Le bucket $bucket_name n'existe pas."
    return 1
  fi
}

# Uploader un fichier
upload_file() {
  local bucket_name=$1
  local file_path=$2
  local dest_path=$3
  
  # Vérifier si le fichier existe
  if [ ! -f "$file_path" ]; then
    echo "❌ Le fichier $file_path n'existe pas."
    return 1
  fi
  
  # Construire le chemin de destination
  local full_dest_path="s3://$bucket_name/"
  if [ -n "$dest_path" ]; then
    full_dest_path="${full_dest_path}${dest_path}/"
  fi
  
  # Extraire le nom du fichier
  local filename=$(basename "$file_path")
  full_dest_path="${full_dest_path}${filename}"
  
  echo "🔼 Upload du fichier $file_path vers $full_dest_path"
  
  # Uploader le fichier
  if aws s3 cp "$file_path" "$full_dest_path" --acl public-read; then
    echo "✅ Fichier uploadé avec succès."
    echo "📝 URL publique: https://$bucket_name.s3.$REGION.amazonaws.com/${dest_path:+$dest_path/}$filename"
    return 0
  else
    echo "❌ Échec de l'upload du fichier."
    return 1
  fi
}

# Uploader un dossier (synchronisation)
upload_directory() {
  local bucket_name=$1
  local dir_path=$2
  local dest_path=$3
  
  # Vérifier si le dossier existe
  if [ ! -d "$dir_path" ]; then
    echo "❌ Le dossier $dir_path n'existe pas."
    return 1
  fi
  
  # Construire le chemin de destination
  local full_dest_path="s3://$bucket_name/"
  if [ -n "$dest_path" ]; then
    full_dest_path="${full_dest_path}${dest_path}/"
  fi
  
  echo "🔄 Synchronisation du dossier $dir_path vers $full_dest_path"
  
  # Synchroniser le dossier
  if aws s3 sync "$dir_path" "$full_dest_path" --acl public-read; then
    echo "✅ Dossier synchronisé avec succès."
    echo "📝 URL de base: https://$bucket_name.s3.$REGION.amazonaws.com/${dest_path:+$dest_path/}"
    return 0
  else
    echo "❌ Échec de la synchronisation du dossier."
    return 1
  fi
}

# Initialisation des variables
BUCKET=""
FILE_PATH=""
DIR_PATH=""
DEST_PATH=""

# Traitement des arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -b|--bucket)
      BUCKET="$2"
      shift 2
      ;;
    -f|--file)
      FILE_PATH="$2"
      shift 2
      ;;
    -d|--directory)
      DIR_PATH="$2"
      shift 2
      ;;
    -p|--path)
      DEST_PATH="$2"
      shift 2
      ;;
    *)
      echo "❌ Option inconnue: $1"
      show_help
      exit 1
      ;;
  esac
done

# Vérifier si un bucket a été spécifié
if [ -z "$BUCKET" ]; then
  echo "❌ Vous devez spécifier un bucket avec l'option --bucket."
  show_help
  exit 1
fi

# Vérifier si le bucket existe
if ! check_bucket_exists "$BUCKET"; then
  echo "❌ Le bucket $BUCKET n'existe pas. Veuillez d'abord exécuter le script verifier_s3.sh pour créer les buckets nécessaires."
  exit 1
fi

# Vérifier si un fichier ou un dossier a été spécifié
if [ -z "$FILE_PATH" ] && [ -z "$DIR_PATH" ]; then
  echo "❌ Vous devez spécifier un fichier avec --file ou un dossier avec --directory."
  show_help
  exit 1
fi

# Uploader le fichier ou le dossier
if [ -n "$FILE_PATH" ]; then
  upload_file "$BUCKET" "$FILE_PATH" "$DEST_PATH"
elif [ -n "$DIR_PATH" ]; then
  upload_directory "$BUCKET" "$DIR_PATH" "$DEST_PATH"
fi

echo "✅ Opération terminée."
