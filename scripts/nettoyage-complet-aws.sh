#!/bin/bash
# Script de nettoyage complet des ressources AWS pour FloDrama
# Ce script supprime toutes les ressources AWS utilisées par FloDrama
# ATTENTION: Ce script supprime définitivement des ressources

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

succes() {
  echo -e "${VERT}[SUCCÈS]${NC} $1"
}

erreur() {
  echo -e "${ROUGE}[ERREUR]${NC} $1"
}

attention() {
  echo -e "${JAUNE}[ATTENTION]${NC} $1"
}

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "${LOG_DIR}"

# Fichier de log
LOG_FILE="${LOG_DIR}/nettoyage-aws-$(date +"%Y%m%d_%H%M%S").log"
touch "${LOG_FILE}"

# Fonction pour logger les messages
logger() {
  echo "$1" | tee -a "${LOG_FILE}"
}

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier l'authentification AWS
log "Vérification de l'authentification AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  erreur "Vous n'êtes pas authentifié à AWS. Exécutez 'aws configure' pour configurer vos identifiants."
  exit 1
fi

# Demander confirmation avant de continuer
echo ""
attention "ATTENTION: Ce script va supprimer définitivement les ressources AWS suivantes:"
echo "- Buckets S3: flodrama-app, flodrama-prod, flodrama-assets"
echo "- Distribution CloudFront associée à flodrama.com"
echo "- Tables DynamoDB: FloDrama-*"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirmation
if [[ "${confirmation}" != "oui" ]]; then
  log "Opération annulée par l'utilisateur."
  exit 0
fi

# Créer un rapport des ressources avant nettoyage
log "Création d'un rapport des ressources AWS avant nettoyage..."
RAPPORT_FILE="${LOG_DIR}/rapport-ressources-aws-$(date +"%Y%m%d_%H%M%S").txt"

logger "=== RAPPORT DES RESSOURCES AWS AVANT NETTOYAGE ===" > "${RAPPORT_FILE}"
logger "Date: $(date)" >> "${RAPPORT_FILE}"
logger "" >> "${RAPPORT_FILE}"

logger "=== BUCKETS S3 ===" >> "${RAPPORT_FILE}"
aws s3 ls >> "${RAPPORT_FILE}" 2>&1
logger "" >> "${RAPPORT_FILE}"

logger "=== DISTRIBUTIONS CLOUDFRONT ===" >> "${RAPPORT_FILE}"
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id, Domain:DomainName, Status:Status, Aliases:Aliases.Items}" --output table >> "${RAPPORT_FILE}" 2>&1
logger "" >> "${RAPPORT_FILE}"

logger "=== TABLES DYNAMODB ===" >> "${RAPPORT_FILE}"
aws dynamodb list-tables >> "${RAPPORT_FILE}" 2>&1
logger "" >> "${RAPPORT_FILE}"

succes "Rapport des ressources créé: ${RAPPORT_FILE}"

# Nettoyage des buckets S3
log "Nettoyage des buckets S3..."

# Liste des buckets à nettoyer
BUCKETS=("flodrama-app" "flodrama-prod" "flodrama-assets")

for bucket in "${BUCKETS[@]}"; do
  if aws s3 ls "s3://${bucket}" &> /dev/null; then
    log "Vidage du bucket ${bucket}..."
    aws s3 rm "s3://${bucket}" --recursive
    
    log "Suppression du bucket ${bucket}..."
    aws s3 rb "s3://${bucket}" --force
    
    if [ $? -eq 0 ]; then
      succes "Bucket ${bucket} supprimé avec succès."
      logger "Bucket ${bucket} supprimé avec succès." >> "${LOG_FILE}"
    else
      erreur "Échec de la suppression du bucket ${bucket}."
      logger "Échec de la suppression du bucket ${bucket}." >> "${LOG_FILE}"
    fi
  else
    attention "Le bucket ${bucket} n'existe pas ou vous n'avez pas les permissions nécessaires."
    logger "Le bucket ${bucket} n'existe pas ou vous n'avez pas les permissions nécessaires." >> "${LOG_FILE}"
  fi
done

# Nettoyage des distributions CloudFront
log "Nettoyage des distributions CloudFront..."

# Récupérer l'ID de la distribution CloudFront associée à flodrama.com
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'flodrama.com')] && Status=='Deployed'].Id" --output text | head -n 1)

if [ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ]; then
  log "Désactivation de la distribution CloudFront ${CLOUDFRONT_DISTRIBUTION_ID}..."
  
  # Récupérer la configuration actuelle
  TEMP_CONFIG_FILE="/tmp/cloudfront-config-$(date +%s).json"
  aws cloudfront get-distribution-config --id "${CLOUDFRONT_DISTRIBUTION_ID}" > "${TEMP_CONFIG_FILE}"
  
  # Extraire l'ETag
  ETAG=$(jq -r '.ETag' "${TEMP_CONFIG_FILE}")
  
  # Désactiver la distribution
  jq '.DistributionConfig.Enabled = false' "${TEMP_CONFIG_FILE}" > "${TEMP_CONFIG_FILE}.new"
  
  # Mettre à jour la configuration
  aws cloudfront update-distribution --id "${CLOUDFRONT_DISTRIBUTION_ID}" --if-match "${ETAG}" --distribution-config "$(jq '.DistributionConfig' "${TEMP_CONFIG_FILE}.new")"
  
  if [ $? -eq 0 ]; then
    succes "Distribution CloudFront ${CLOUDFRONT_DISTRIBUTION_ID} désactivée avec succès."
    logger "Distribution CloudFront ${CLOUDFRONT_DISTRIBUTION_ID} désactivée avec succès." >> "${LOG_FILE}"
    
    log "Attente de la désactivation de la distribution CloudFront..."
    attention "REMARQUE: La désactivation complète peut prendre jusqu'à 15 minutes."
    attention "Une fois désactivée, vous pourrez supprimer la distribution manuellement depuis la console AWS."
  else
    erreur "Échec de la désactivation de la distribution CloudFront ${CLOUDFRONT_DISTRIBUTION_ID}."
    logger "Échec de la désactivation de la distribution CloudFront ${CLOUDFRONT_DISTRIBUTION_ID}." >> "${LOG_FILE}"
  fi
  
  # Nettoyer les fichiers temporaires
  rm -f "${TEMP_CONFIG_FILE}" "${TEMP_CONFIG_FILE}.new"
else
  attention "Aucune distribution CloudFront associée à flodrama.com n'a été trouvée."
  logger "Aucune distribution CloudFront associée à flodrama.com n'a été trouvée." >> "${LOG_FILE}"
fi

# Nettoyage des tables DynamoDB
log "Nettoyage des tables DynamoDB..."

# Récupérer la liste des tables DynamoDB
TABLES=$(aws dynamodb list-tables --query "TableNames[?starts_with(@, 'FloDrama-')]" --output text)

if [ -n "${TABLES}" ]; then
  for table in ${TABLES}; do
    log "Suppression de la table DynamoDB ${table}..."
    aws dynamodb delete-table --table-name "${table}"
    
    if [ $? -eq 0 ]; then
      succes "Table DynamoDB ${table} supprimée avec succès."
      logger "Table DynamoDB ${table} supprimée avec succès." >> "${LOG_FILE}"
    else
      erreur "Échec de la suppression de la table DynamoDB ${table}."
      logger "Échec de la suppression de la table DynamoDB ${table}." >> "${LOG_FILE}"
    fi
  done
else
  attention "Aucune table DynamoDB commençant par 'FloDrama-' n'a été trouvée."
  logger "Aucune table DynamoDB commençant par 'FloDrama-' n'a été trouvée." >> "${LOG_FILE}"
fi

# Résumé du nettoyage
echo ""
log "Résumé du nettoyage:"
echo "- Buckets S3: ${#BUCKETS[@]} buckets traités"
echo "- CloudFront: $([ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ] && echo "1 distribution désactivée" || echo "Aucune distribution trouvée")"
echo "- DynamoDB: $([ -n "${TABLES}" ] && echo "${#TABLES[@]} tables supprimées" || echo "Aucune table trouvée")"
echo ""
succes "Nettoyage terminé! Consultez le fichier de log pour plus de détails: ${LOG_FILE}"
echo ""
attention "REMARQUE: Certaines ressources AWS peuvent nécessiter une suppression manuelle depuis la console AWS."
attention "Notamment, les distributions CloudFront désactivées doivent être supprimées manuellement après leur désactivation complète."
