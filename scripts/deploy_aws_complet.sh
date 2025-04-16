#!/bin/bash
# Script de déploiement complet pour FloDrama vers AWS
# Créé le 29-03-2025

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}_backup_deploy"
S3_BUCKET="flodrama-app-bucket"
CLOUDFRONT_DISTRIBUTION_ID="E1MU6L4S4UVUSS" # ID de la distribution CloudFront

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

# Créer un répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
log "Répertoire de sauvegarde créé: $BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r ./Frontend/src "$BACKUP_DIR/src"
cp -r ./Frontend/public "$BACKUP_DIR/public"
cp ./Frontend/package.json "$BACKUP_DIR/package.json"
cp ./Frontend/index.html "$BACKUP_DIR/index.html" 2>/dev/null || :
log "Sauvegarde terminée"

# Se déplacer dans le répertoire du frontend
cd ./Frontend || {
  erreur "Impossible d'accéder au répertoire Frontend"
  exit 1
}

# Installer les dépendances avec --legacy-peer-deps pour éviter les conflits
log "Installation des dépendances avec --legacy-peer-deps..."
npm install --legacy-peer-deps || {
  erreur "Échec de l'installation des dépendances"
  exit 1
}

# Construction de l'application avec les variables d'environnement de production
log "Construction de l'application..."
npm run build || {
  erreur "Échec de la construction de l'application"
  exit 1
}

# Vérifier que le répertoire de build existe
if [ ! -d "./dist" ]; then
  erreur "Le répertoire de build (dist) n'existe pas"
  exit 1
fi

# Revenir au répertoire principal
cd ..

# Créer une politique de bucket S3 pour permettre l'accès public
log "Création de la politique de bucket S3..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

# Mettre à jour la politique du bucket S3
log "Mise à jour de la politique du bucket S3..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json || {
  attention "Échec de la mise à jour de la politique du bucket S3"
}

# Désactiver le blocage de l'accès public
log "Désactivation du blocage de l'accès public..."
aws s3api put-public-access-block --bucket $S3_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || {
  attention "Échec de la désactivation du blocage de l'accès public"
}

# Déployer sur S3 avec l'ACL public-read
log "Déploiement sur S3 avec l'ACL public-read..."
aws s3 sync ./Frontend/dist s3://$S3_BUCKET --delete --acl public-read || {
  erreur "Échec du déploiement sur S3"
  exit 1
}

# Mettre à jour la configuration CloudFront
log "Mise à jour de la configuration CloudFront..."

# Récupérer la configuration actuelle de CloudFront
aws cloudfront get-distribution-config --id $CLOUDFRONT_DISTRIBUTION_ID > current_config.json || {
  attention "Échec de la récupération de la configuration CloudFront"
}

# Extraire l'ETag de la configuration actuelle
if [ -f "current_config.json" ]; then
  ETAG=$(grep -o '"ETag": "[^"]*"' current_config.json | cut -d'"' -f4)
  
  if [ -n "$ETAG" ]; then
    log "ETag récupéré: $ETAG"
    
    # Créer une configuration CloudFront pour les réponses d'erreur personnalisées
    cat > cloudfront-error-config.json << EOF
{
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": 200,
        "ErrorCachingMinTTL": 10
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": 200,
        "ErrorCachingMinTTL": 10
      }
    ]
  }
}
EOF
    
    # Vérifier si jq est installé
    if command -v jq &> /dev/null; then
      # Fusionner les configurations
      jq -s '.[0].DistributionConfig * .[1]' current_config.json cloudfront-error-config.json > updated_config.json || {
        attention "Échec de la fusion des configurations"
      }
      
      # Mettre à jour la configuration CloudFront
      aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://updated_config.json --if-match "$ETAG" || {
        attention "Échec de la mise à jour de la configuration CloudFront"
      }
    else
      attention "L'utilitaire jq n'est pas installé. La fusion des configurations CloudFront ne peut pas être effectuée."
    fi
  else
    attention "ETag non trouvé dans la configuration CloudFront"
  fi
else
  attention "Fichier de configuration CloudFront non trouvé"
fi

# Invalider le cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" || {
  attention "Échec de l'invalidation du cache CloudFront"
}

# Mise à jour des entêtes de sécurité (si nécessaire)
log "Vérification des entêtes de sécurité..."

# Nettoyage des fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -f bucket-policy.json current_config.json cloudfront-error-config.json updated_config.json

log "Déploiement terminé avec succès!"
log "L'application est accessible à l'adresse: https://d1pbqs2b6em4ha.cloudfront.net"
log "Ou via le nom de domaine configuré dans CloudFront."
