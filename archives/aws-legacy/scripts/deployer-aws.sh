#!/bin/bash
# Script de déploiement de FloDrama sur AWS S3 et CloudFront
# Créé le $(date +"%Y-%m-%d")

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NOM_BUCKET="flodrama-app-bucket"
REGION="eu-west-3"
DISTRIBUTION_ID="E5XC74WR62W9Z"  # Laisser vide si aucune distribution n'existe encore

# Fonction pour afficher les messages
afficher_message() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")] ${1}${NC}"
}

# Fonction pour afficher les erreurs
afficher_erreur() {
  echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: ${1}${NC}"
}

# Fonction pour afficher les succès
afficher_succes() {
  echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: ${1}${NC}"
}

# Se positionner dans le répertoire du projet
cd "$(dirname "$0")/.." || exit 1

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  afficher_erreur "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  afficher_erreur "npm n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  afficher_erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier les identifiants AWS
afficher_message "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  afficher_erreur "Les identifiants AWS ne sont pas configurés correctement. Exécutez 'aws configure' pour les configurer."
  exit 1
fi

# Installation des dépendances
afficher_message "Installation des dépendances..."
if npm install; then
  afficher_succes "Dépendances installées avec succès."
else
  afficher_erreur "Erreur lors de l'installation des dépendances."
  exit 1
fi

# Compilation du projet
afficher_message "Compilation du projet..."
if npm run build; then
  afficher_succes "Compilation réussie."
else
  afficher_erreur "Erreur lors de la compilation."
  
  # Demander à l'utilisateur s'il souhaite continuer malgré les erreurs
  read -p "Des erreurs ont été détectées lors de la compilation. Souhaitez-vous continuer le déploiement ? (o/n) " reponse
  if [[ "$reponse" != "o" && "$reponse" != "O" ]]; then
    exit 1
  fi
  
  afficher_message "Continuation du déploiement malgré les erreurs..."
fi

# Vérification de l'existence du bucket S3
afficher_message "Vérification de l'existence du bucket S3 '$NOM_BUCKET'..."
if ! aws s3api head-bucket --bucket "$NOM_BUCKET" 2>/dev/null; then
  afficher_message "Le bucket '$NOM_BUCKET' n'existe pas. Création en cours..."
  
  # Création du bucket S3
  if aws s3api create-bucket --bucket "$NOM_BUCKET" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"; then
    afficher_succes "Bucket S3 '$NOM_BUCKET' créé avec succès."
  else
    afficher_erreur "Erreur lors de la création du bucket S3 '$NOM_BUCKET'."
    exit 1
  fi
  
  # Configuration du bucket pour l'hébergement de site web statique
  afficher_message "Configuration du bucket pour l'hébergement de site web statique..."
  if aws s3 website s3://$NOM_BUCKET --index-document index.html --error-document error.html; then
    afficher_succes "Bucket configuré pour l'hébergement de site web statique."
  else
    afficher_erreur "Erreur lors de la configuration du bucket pour l'hébergement de site web statique."
    exit 1
  fi
  
  # Désactivation du blocage des politiques publiques
  afficher_message "Désactivation du blocage des politiques publiques..."
  if aws s3api put-public-access-block --bucket $NOM_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"; then
    afficher_succes "Blocage des politiques publiques désactivé."
  else
    afficher_erreur "Erreur lors de la désactivation du blocage des politiques publiques."
    afficher_message "Tentative de déploiement sans modification de la politique d'accès..."
  fi
  
  # Configuration de la politique d'accès public
  afficher_message "Configuration de la politique d'accès public..."
  POLICY='{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$NOM_BUCKET'/*"
      }
    ]
  }'
  
  if aws s3api put-bucket-policy --bucket "$NOM_BUCKET" --policy "$POLICY"; then
    afficher_succes "Politique d'accès public configurée avec succès."
  else
    afficher_erreur "Erreur lors de la configuration de la politique d'accès public."
    exit 1
  fi
else
  afficher_succes "Le bucket '$NOM_BUCKET' existe déjà."
fi

# Déploiement des fichiers sur S3
afficher_message "Déploiement des fichiers sur S3..."
if aws s3 sync dist/ "s3://$NOM_BUCKET" --delete; then
  afficher_succes "Fichiers déployés avec succès sur S3."
else
  afficher_erreur "Erreur lors du déploiement des fichiers sur S3."
  exit 1
fi

# Gestion de CloudFront
if [ -z "$DISTRIBUTION_ID" ]; then
  afficher_message "Aucun ID de distribution CloudFront n'a été spécifié. Vérification de l'existence d'une distribution..."
  
  # Vérification de l'existence d'une distribution CloudFront pour ce bucket
  DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$NOM_BUCKET.s3.amazonaws.com']].Id" --output text)
  
  if [ -z "$DISTRIBUTION_ID" ]; then
    afficher_message "Aucune distribution CloudFront n'existe pour ce bucket. Création d'une nouvelle distribution..."
    
    # Création d'une nouvelle distribution CloudFront
    DISTRIBUTION_CONFIG='{
      "CallerReference": "'$(date +%s)'",
      "Aliases": {
        "Quantity": 0
      },
      "DefaultRootObject": "index.html",
      "Origins": {
        "Quantity": 1,
        "Items": [
          {
            "Id": "S3-'$NOM_BUCKET'",
            "DomainName": "'$NOM_BUCKET'.s3.amazonaws.com",
            "OriginPath": "",
            "CustomHeaders": {
              "Quantity": 0
            },
            "S3OriginConfig": {
              "OriginAccessIdentity": ""
            }
          }
        ]
      },
      "DefaultCacheBehavior": {
        "TargetOriginId": "S3-'$NOM_BUCKET'",
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          },
          "Headers": {
            "Quantity": 0
          },
          "QueryStringCacheKeys": {
            "Quantity": 0
          }
        },
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "AllowedMethods": {
          "Quantity": 2,
          "Items": [
            "GET",
            "HEAD"
          ],
          "CachedMethods": {
            "Quantity": 2,
            "Items": [
              "GET",
              "HEAD"
            ]
          }
        },
        "SmoothStreaming": false,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": ""
      },
      "CacheBehaviors": {
        "Quantity": 0
      },
      "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
          {
            "ErrorCode": 404,
            "ResponsePagePath": "/index.html",
            "ResponseCode": "200",
            "ErrorCachingMinTTL": 300
          }
        ]
      },
      "Comment": "Distribution for FloDrama application",
      "Logging": {
        "Enabled": false,
        "IncludeCookies": false,
        "Bucket": "",
        "Prefix": ""
      },
      "PriceClass": "PriceClass_100",
      "Enabled": true,
      "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1",
        "CertificateSource": "cloudfront"
      },
      "Restrictions": {
        "GeoRestriction": {
          "RestrictionType": "none",
          "Quantity": 0
        }
      },
      "WebACLId": "",
      "HttpVersion": "http2",
      "IsIPV6Enabled": true
    }'
    
    DISTRIBUTION_RESULT=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG")
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_RESULT" | grep -o '"Id": "[^"]*' | cut -d'"' -f4)
    DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_RESULT" | grep -o '"DomainName": "[^"]*' | cut -d'"' -f4)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
      afficher_succes "Distribution CloudFront créée avec succès. ID: $DISTRIBUTION_ID"
      afficher_message "Votre application sera accessible à l'adresse: https://$DISTRIBUTION_DOMAIN"
      
      # Mise à jour du script avec l'ID de la distribution
      sed -i '' "s/DISTRIBUTION_ID=\"\"/DISTRIBUTION_ID=\"$DISTRIBUTION_ID\"/" "$0"
    else
      afficher_erreur "Erreur lors de la création de la distribution CloudFront."
      exit 1
    fi
  else
    afficher_succes "Une distribution CloudFront existe déjà pour ce bucket. ID: $DISTRIBUTION_ID"
    
    # Mise à jour du script avec l'ID de la distribution
    sed -i '' "s/DISTRIBUTION_ID=\"\"/DISTRIBUTION_ID=\"$DISTRIBUTION_ID\"/" "$0"
    
    # Récupération du domaine de la distribution
    DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)
    afficher_message "Votre application est accessible à l'adresse: https://$DISTRIBUTION_DOMAIN"
  fi
else
  afficher_message "Invalidation du cache CloudFront..."
  
  # Invalidation du cache CloudFront
  if aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"; then
    afficher_succes "Cache CloudFront invalidé avec succès."
    
    # Récupération du domaine de la distribution
    DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)
    afficher_message "Votre application est accessible à l'adresse: https://$DISTRIBUTION_DOMAIN"
  else
    afficher_erreur "Erreur lors de l'invalidation du cache CloudFront."
    exit 1
  fi
fi

# Création d'une sauvegarde
afficher_message "Création d'une sauvegarde..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}_backup_deploy"
mkdir -p "$BACKUP_DIR"

# Copie des fichiers de build dans le répertoire de sauvegarde
cp -r dist/* "$BACKUP_DIR/"
afficher_succes "Sauvegarde créée dans $BACKUP_DIR"

# Création d'un commit Git
afficher_message "Création d'un commit Git..."
if git add .; then
  if git commit -m "✨ [DEPLOY] Déploiement sur AWS du $(date +"%Y-%m-%d")"; then
    afficher_succes "Commit créé avec succès."
    
    # Push vers le dépôt distant
    afficher_message "Push vers le dépôt distant..."
    if git push origin HEAD; then
      afficher_succes "Push réussi."
    else
      afficher_erreur "Erreur lors du push. Génération d'un rapport d'erreur..."
      echo "Erreur de push Git du $(date)" > "backups/${TIMESTAMP}_erreur_push.txt"
      git status >> "backups/${TIMESTAMP}_erreur_push.txt"
      git remote -v >> "backups/${TIMESTAMP}_erreur_push.txt"
      echo -e "${JAUNE}Un rapport d'erreur a été généré dans backups/${TIMESTAMP}_erreur_push.txt${NC}"
    fi
  else
    afficher_erreur "Erreur lors de la création du commit."
  fi
else
  afficher_erreur "Erreur lors de l'ajout des fichiers au commit."
fi

afficher_message "Processus de déploiement terminé."
echo -e "${VERT}L'application FloDrama a été déployée avec succès sur AWS.${NC}"
echo -e "${JAUNE}URL de l'application: https://$DISTRIBUTION_DOMAIN${NC}"

exit 0
