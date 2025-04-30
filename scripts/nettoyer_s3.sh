#!/bin/bash

# Script de nettoyage des buckets S3 pour FloDrama
# Ce script supprime les buckets S3 redondants et conserve uniquement ceux nécessaires

echo "✨ [CHORE] Nettoyage des buckets S3 pour FloDrama"

# Liste des buckets à conserver
BUCKETS_A_CONSERVER=(
  "flodrama-assets"       # Bucket principal pour les assets statiques (déjà utilisé)
  "images.flodrama.com"   # Bucket pour les images (déjà utilisé)
)

# Liste des buckets à supprimer
BUCKETS_A_SUPPRIMER=(
  "flodrama-content"             # Créé récemment, redondant
  "flodrama-content-1745484469"  # Bucket de test
  "flodrama-images"              # Créé récemment, redondant avec images.flodrama.com
)

# Fonction pour vider un bucket
vider_bucket() {
  local bucket_name=$1
  echo "🗑️ Vidage du bucket $bucket_name..."
  
  # Vérifier si le bucket existe
  if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
    # Supprimer tous les objets du bucket
    aws s3 rm "s3://$bucket_name/" --recursive
    echo "✅ Bucket $bucket_name vidé avec succès."
    return 0
  else
    echo "⚠️ Le bucket $bucket_name n'existe pas."
    return 1
  fi
}

# Fonction pour supprimer un bucket
supprimer_bucket() {
  local bucket_name=$1
  echo "🗑️ Suppression du bucket $bucket_name..."
  
  # Vérifier si le bucket existe
  if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
    # Supprimer le bucket
    aws s3api delete-bucket --bucket "$bucket_name"
    echo "✅ Bucket $bucket_name supprimé avec succès."
    return 0
  else
    echo "⚠️ Le bucket $bucket_name n'existe pas."
    return 1
  fi
}

# Afficher les buckets à conserver
echo "🔒 Buckets à conserver:"
for bucket in "${BUCKETS_A_CONSERVER[@]}"; do
  echo "  - $bucket"
done

# Afficher les buckets à supprimer
echo "🗑️ Buckets à supprimer:"
for bucket in "${BUCKETS_A_SUPPRIMER[@]}"; do
  echo "  - $bucket"
done

# Demander confirmation
read -p "Voulez-vous procéder au nettoyage des buckets S3 ? (o/n) " confirmation
if [[ "$confirmation" != "o" ]]; then
  echo "❌ Opération annulée."
  exit 1
fi

# Vider et supprimer les buckets
for bucket in "${BUCKETS_A_SUPPRIMER[@]}"; do
  vider_bucket "$bucket"
  if [ $? -eq 0 ]; then
    supprimer_bucket "$bucket"
  fi
done

echo "✅ Nettoyage des buckets S3 terminé."
echo ""
echo "📋 Liste des buckets S3 restants:"
aws s3 ls
