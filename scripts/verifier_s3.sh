#!/bin/bash

# Script de vérification et gestion des buckets S3 pour FloDrama
# Ce script vérifie l'existence des buckets S3 et crée ceux qui sont nécessaires

echo "✨ [CHORE] Vérification et gestion des buckets S3 pour FloDrama"

# Configuration
REGION="eu-west-3"  # Région Paris (même région que le bucket flodrama-assets existant)
BUCKETS=(
  "flodrama-content"
  "flodrama-images"
  "flodrama-assets"
)

# Fonction pour vérifier si un bucket existe
check_bucket_exists() {
  local bucket_name=$1
  echo "🔍 Vérification du bucket S3: $bucket_name"
  
  if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
    echo "✅ Le bucket $bucket_name existe."
    return 0
  else
    echo "⚠️ Le bucket $bucket_name n'existe pas."
    return 1
  fi
}

# Fonction pour créer un bucket
create_bucket() {
  local bucket_name=$1
  echo "🔧 Création du bucket S3: $bucket_name"
  
  if aws s3api create-bucket \
    --bucket "$bucket_name" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"; then
    
    echo "✅ Bucket $bucket_name créé avec succès."
    
    # Configuration du bucket pour l'accès public
    echo "🔧 Configuration de l'accès public pour le bucket $bucket_name"
    aws s3api put-public-access-block \
      --bucket "$bucket_name" \
      --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # Configuration de la politique du bucket pour permettre l'accès public en lecture
    echo "🔧 Configuration de la politique d'accès pour le bucket $bucket_name"
    policy='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::'$bucket_name'/*"
        }
      ]
    }'
    
    aws s3api put-bucket-policy \
      --bucket "$bucket_name" \
      --policy "$policy"
    
    # Configuration CORS pour le bucket
    echo "🔧 Configuration CORS pour le bucket $bucket_name"
    cors='{
      "CORSRules": [
        {
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "HEAD"],
          "AllowedOrigins": ["*"],
          "ExposeHeaders": ["ETag"],
          "MaxAgeSeconds": 3000
        }
      ]
    }'
    
    aws s3api put-bucket-cors \
      --bucket "$bucket_name" \
      --cors-configuration "$cors"
    
    return 0
  else
    echo "❌ Échec de la création du bucket $bucket_name."
    return 1
  fi
}

# Fonction pour lister le contenu d'un bucket
list_bucket_content() {
  local bucket_name=$1
  echo "📋 Contenu du bucket $bucket_name:"
  
  # Récupérer la liste des objets
  objects=$(aws s3 ls "s3://$bucket_name/" --recursive)
  
  if [ -z "$objects" ]; then
    echo "   Le bucket est vide."
  else
    echo "$objects"
  fi
}

# Vérifier et créer les buckets si nécessaire
for bucket in "${BUCKETS[@]}"; do
  if ! check_bucket_exists "$bucket"; then
    create_bucket "$bucket"
  fi
  
  # Lister le contenu du bucket
  list_bucket_content "$bucket"
  echo ""
done

echo "✅ Vérification et gestion des buckets S3 terminées."
echo ""
echo "📝 Pour uploader du contenu dans un bucket, utilisez la commande:"
echo "aws s3 cp /chemin/vers/fichier s3://nom-du-bucket/chemin/destination"
echo ""
echo "📝 Pour synchroniser un dossier avec un bucket, utilisez la commande:"
echo "aws s3 sync /chemin/vers/dossier s3://nom-du-bucket/chemin/destination"
