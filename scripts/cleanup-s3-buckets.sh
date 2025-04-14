#!/bin/bash
# Script pour nettoyer les buckets S3 inutiles pour FloDrama

# Buckets à conserver
KEEP_BUCKETS=(
  "flodrama-app"
  "flodrama-assets"
)

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  error "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier l'authentification AWS
log "Vérification de l'authentification AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  error "Vous n'êtes pas authentifié à AWS. Exécutez 'aws configure' pour configurer vos identifiants."
  exit 1
fi

# Récupérer la liste des buckets
log "Récupération de la liste des buckets S3..."
BUCKETS=$(aws s3 ls | awk '{print $3}')

# Afficher les buckets à supprimer et demander confirmation
echo "Buckets à conserver:"
for bucket in "${KEEP_BUCKETS[@]}"; do
  echo -e "${GREEN}- $bucket${NC}"
done

echo -e "\nBuckets à supprimer:"
DELETE_BUCKETS=()
for bucket in $BUCKETS; do
  if [[ ! " ${KEEP_BUCKETS[@]} " =~ " ${bucket} " ]]; then
    echo -e "${RED}- $bucket${NC}"
    DELETE_BUCKETS+=("$bucket")
  fi
done

if [ ${#DELETE_BUCKETS[@]} -eq 0 ]; then
  success "Aucun bucket à supprimer."
  exit 0
fi

echo ""
read -p "Êtes-vous sûr de vouloir supprimer ces buckets ? (oui/non) " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
  warn "Opération annulée."
  exit 0
fi

# Supprimer les buckets
for bucket in "${DELETE_BUCKETS[@]}"; do
  log "Suppression du bucket $bucket..."
  
  # Vider le bucket d'abord
  log "Vidage du bucket $bucket..."
  if aws s3 rm s3://$bucket --recursive; then
    success "Bucket $bucket vidé avec succès"
  else
    error "Échec du vidage du bucket $bucket"
    continue
  fi
  
  # Supprimer le bucket
  if aws s3 rb s3://$bucket; then
    success "Bucket $bucket supprimé avec succès"
  else
    error "Échec de la suppression du bucket $bucket"
  fi
done

success "Nettoyage des buckets terminé!"
log "Buckets conservés: ${KEEP_BUCKETS[*]}"
