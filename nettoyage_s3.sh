#!/bin/bash

# Script de nettoyage des buckets S3 redondants pour FloDrama
# Ce script conserve uniquement le bucket le plus récent et supprime les autres

echo "✨ [CHORE] Début du nettoyage des buckets S3 redondants"

# Récupérer la liste des buckets flodrama-content-*
CONTENT_BUCKETS=$(aws s3 ls | grep "flodrama-content-" | awk '{print $3}')

# Trier les buckets par date (en utilisant le timestamp dans le nom)
SORTED_BUCKETS=($(echo "$CONTENT_BUCKETS" | sort -r))

# Conserver le bucket le plus récent
LATEST_BUCKET=${SORTED_BUCKETS[0]}
echo "ℹ️ Conservation du bucket le plus récent: $LATEST_BUCKET"

# Supprimer les autres buckets
for bucket in "${SORTED_BUCKETS[@]:1}"; do
  echo "🔄 Suppression du bucket obsolète: $bucket"
  
  # Vider le bucket avant de le supprimer
  echo "  - Vidage du bucket..."
  aws s3 rm s3://$bucket --recursive
  
  # Supprimer le bucket
  echo "  - Suppression du bucket..."
  aws s3api delete-bucket --bucket $bucket
  
  if [ $? -eq 0 ]; then
    echo "✅ Bucket $bucket supprimé avec succès"
  else
    echo "❌ Échec de la suppression du bucket $bucket"
  fi
done

echo "✨ [CHORE] Nettoyage des buckets S3 terminé"
