#!/bin/bash
# Script de nettoyage complet des ressources AWS pour FloDrama
# Ce script identifie et supprime toutes les ressources AWS liées au projet FloDrama

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher un message avec une couleur
print_message() {
  echo -e "${2}${1}${NC}"
}

# Fonction pour afficher une bannière
print_banner() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════╗"
  echo "║                                                ║"
  echo "║   FloDrama - Nettoyage AWS Complet             ║"
  echo "║                                                ║"
  echo "╚════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Afficher la bannière
print_banner

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  print_message "❌ AWS CLI n'est pas installé. Veuillez l'installer pour continuer." "$RED"
  exit 1
fi

# Vérifier les identifiants AWS
print_message "🔄 Vérification des identifiants AWS..." "$YELLOW"
if ! aws sts get-caller-identity &> /dev/null; then
  print_message "❌ Les identifiants AWS ne sont pas valides ou ont expiré." "$RED"
  print_message "👉 Veuillez configurer vos identifiants AWS avec 'aws configure' avant de continuer." "$YELLOW"
  exit 1
fi

print_message "✅ Identifiants AWS valides" "$GREEN"

# Définir les préfixes et tags pour identifier les ressources FloDrama
PREFIXES=("flodrama" "FloDrama" "flo-drama" "flotv")

# 1. Supprimer les distributions CloudFront
print_message "\n🔄 Recherche et suppression des distributions CloudFront..." "$YELLOW"
DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'FloDrama') || contains(Origins.Items[0].Id, 'flodrama')].Id" --output text)

if [ -n "$DISTRIBUTIONS" ]; then
  for DIST_ID in $DISTRIBUTIONS; do
    print_message "🔄 Désactivation de la distribution CloudFront $DIST_ID..." "$YELLOW"
    
    # Récupérer la configuration actuelle
    aws cloudfront get-distribution-config --id $DIST_ID > /tmp/dist-config.json
    ETAG=$(jq -r '.ETag' /tmp/dist-config.json)
    
    # Modifier la configuration pour désactiver la distribution
    jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json > /tmp/dist-config-disabled.json
    
    # Mettre à jour la distribution
    aws cloudfront update-distribution --id $DIST_ID --if-match $ETAG --distribution-config file:///tmp/dist-config-disabled.json
    
    print_message "🔄 Distribution CloudFront $DIST_ID désactivée. Attente de la propagation..." "$YELLOW"
    print_message "⚠️ La suppression complète sera possible après la propagation (peut prendre jusqu'à 15 minutes)" "$YELLOW"
  done
else
  print_message "✅ Aucune distribution CloudFront liée à FloDrama trouvée" "$GREEN"
fi

# 2. Supprimer les buckets S3
print_message "\n🔄 Recherche et suppression des buckets S3..." "$YELLOW"
for PREFIX in "${PREFIXES[@]}"; do
  BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${PREFIX}')].Name" --output text)
  
  if [ -n "$BUCKETS" ]; then
    for BUCKET in $BUCKETS; do
      print_message "🔄 Vidage et suppression du bucket S3 $BUCKET..." "$YELLOW"
      
      # Vider le bucket
      aws s3 rm s3://$BUCKET --recursive
      
      # Supprimer le bucket
      aws s3api delete-bucket --bucket $BUCKET
      
      print_message "✅ Bucket S3 $BUCKET supprimé" "$GREEN"
    done
  else
    print_message "✅ Aucun bucket S3 avec le préfixe '$PREFIX' trouvé" "$GREEN"
  fi
done

# 3. Supprimer les fonctions Lambda
print_message "\n🔄 Recherche et suppression des fonctions Lambda..." "$YELLOW"
for PREFIX in "${PREFIXES[@]}"; do
  FUNCTIONS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, '${PREFIX}')].FunctionName" --output text)
  
  if [ -n "$FUNCTIONS" ]; then
    for FUNCTION in $FUNCTIONS; do
      print_message "🔄 Suppression de la fonction Lambda $FUNCTION..." "$YELLOW"
      
      # Supprimer la fonction
      aws lambda delete-function --function-name $FUNCTION
      
      print_message "✅ Fonction Lambda $FUNCTION supprimée" "$GREEN"
    done
  else
    print_message "✅ Aucune fonction Lambda avec le préfixe '$PREFIX' trouvée" "$GREEN"
  fi
done

# 4. Supprimer les API Gateway
print_message "\n🔄 Recherche et suppression des API Gateway..." "$YELLOW"
for PREFIX in "${PREFIXES[@]}"; do
  APIS=$(aws apigateway get-rest-apis --query "items[?contains(name, '${PREFIX}')].id" --output text)
  
  if [ -n "$APIS" ]; then
    for API_ID in $APIS; do
      print_message "🔄 Suppression de l'API Gateway $API_ID..." "$YELLOW"
      
      # Supprimer l'API
      aws apigateway delete-rest-api --rest-api-id $API_ID
      
      print_message "✅ API Gateway $API_ID supprimée" "$GREEN"
    done
  else
    print_message "✅ Aucune API Gateway avec le préfixe '$PREFIX' trouvée" "$GREEN"
  fi
done

# 5. Supprimer les groupes de logs CloudWatch
print_message "\n🔄 Recherche et suppression des groupes de logs CloudWatch..." "$YELLOW"
for PREFIX in "${PREFIXES[@]}"; do
  LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/${PREFIX}" --query "logGroups[*].logGroupName" --output text)
  
  if [ -n "$LOG_GROUPS" ]; then
    for LOG_GROUP in $LOG_GROUPS; do
      print_message "🔄 Suppression du groupe de logs CloudWatch $LOG_GROUP..." "$YELLOW"
      
      # Supprimer le groupe de logs
      aws logs delete-log-group --log-group-name $LOG_GROUP
      
      print_message "✅ Groupe de logs CloudWatch $LOG_GROUP supprimé" "$GREEN"
    done
  else
    print_message "✅ Aucun groupe de logs CloudWatch avec le préfixe '$PREFIX' trouvé" "$GREEN"
  fi
done

# 6. Vérification finale
print_message "\n🔄 Vérification finale..." "$YELLOW"

# Vérifier les distributions CloudFront
REMAINING_DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'FloDrama') || contains(Origins.Items[0].Id, 'flodrama')].Id" --output text 2>/dev/null || echo "")
if [ -n "$REMAINING_DISTRIBUTIONS" ]; then
  print_message "⚠️ Certaines distributions CloudFront sont encore en cours de désactivation. Réexécutez ce script plus tard pour les supprimer complètement." "$YELLOW"
else
  print_message "✅ Aucune distribution CloudFront liée à FloDrama restante" "$GREEN"
fi

# Vérifier les buckets S3
REMAINING_BUCKETS=""
for PREFIX in "${PREFIXES[@]}"; do
  BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${PREFIX}')].Name" --output text 2>/dev/null || echo "")
  if [ -n "$BUCKETS" ]; then
    REMAINING_BUCKETS="$REMAINING_BUCKETS $BUCKETS"
  fi
done

if [ -n "$REMAINING_BUCKETS" ]; then
  print_message "⚠️ Certains buckets S3 n'ont pas pu être supprimés: $REMAINING_BUCKETS" "$YELLOW"
else
  print_message "✅ Aucun bucket S3 lié à FloDrama restant" "$GREEN"
fi

print_message "\n✅ Nettoyage des ressources AWS pour FloDrama terminé!" "$GREEN"
print_message "👉 Note: Si certaines ressources n'ont pas pu être supprimées, vérifiez les dépendances ou les politiques de protection." "$YELLOW"
