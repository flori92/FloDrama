#!/bin/bash

# Script pour lister les ressources AWS Lambda
# Ce script affiche toutes les ressources Lambda associées à FloDrama
# avec des options pour filtrer par type, région et préfixe

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un titre de section
section() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Vérification de l'installation d'AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}AWS CLI n'est pas installé.${NC}"
  echo "Veuillez l'installer en suivant les instructions sur https://aws.amazon.com/cli/"
  exit 1
fi

# Vérification de la configuration AWS
echo "Vérification de la configuration AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Vous n'êtes pas connecté à AWS ou vos identifiants sont invalides.${NC}"
  echo "Veuillez configurer vos identifiants AWS avec 'aws configure'"
  exit 1
fi

echo -e "${GREEN}✓ Connecté à AWS${NC}"

# Définition des variables par défaut
AWS_REGION="us-east-1"
PROJECT_PREFIX="FloDrama"
OUTPUT_FORMAT="table"
RESOURCE_TYPE="all"

# Afficher l'aide
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --region REGION       Région AWS à utiliser (défaut: us-east-1)"
  echo "  --prefix PREFIX       Préfixe pour filtrer les ressources (défaut: FloDrama)"
  echo "  --output FORMAT       Format de sortie: table, json, text (défaut: table)"
  echo "  --type TYPE           Type de ressource à lister: functions, layers, logs, all (défaut: all)"
  echo "  --help                Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0 --region eu-west-3 --prefix Prod"
  echo "  $0 --type functions --output json"
  exit 0
}

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --region) AWS_REGION="$2"; shift ;;
    --prefix) PROJECT_PREFIX="$2"; shift ;;
    --output) OUTPUT_FORMAT="$2"; shift ;;
    --type) RESOURCE_TYPE="$2"; shift ;;
    --help) show_help ;;
    *) echo "Option inconnue: $1"; show_help ;;
  esac
  shift
done

# Configuration de la région AWS
aws configure set region $AWS_REGION

echo "Région AWS: $AWS_REGION"
echo "Préfixe du projet: $PROJECT_PREFIX"
echo "Format de sortie: $OUTPUT_FORMAT"
echo "Type de ressource: $RESOURCE_TYPE"

# Fonction pour lister les fonctions Lambda
list_functions() {
  section "Fonctions Lambda"
  
  if [ "$OUTPUT_FORMAT" = "table" ]; then
    echo -e "NOM\tRUNTIME\tMÉMOIRE\tTIMEOUT\tDERNIÈRE MODIFICATION"
    aws lambda list-functions \
      --query "Functions[?contains(FunctionName, '$PROJECT_PREFIX')].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,LastModified:LastModified}" \
      --output text | sort | column -t
  else
    aws lambda list-functions \
      --query "Functions[?contains(FunctionName, '$PROJECT_PREFIX')]" \
      --output $OUTPUT_FORMAT
  fi
  
  # Compter le nombre de fonctions
  FUNCTION_COUNT=$(aws lambda list-functions \
    --query "length(Functions[?contains(FunctionName, '$PROJECT_PREFIX')])" \
    --output text)
  
  echo -e "\nNombre total de fonctions Lambda: ${GREEN}$FUNCTION_COUNT${NC}"
}

# Fonction pour lister les couches Lambda
list_layers() {
  section "Couches Lambda"
  
  if [ "$OUTPUT_FORMAT" = "table" ]; then
    echo -e "NOM\tVERSION\tDESCRIPTION\tTAILLE"
    aws lambda list-layers \
      --query "Layers[?contains(LayerName, '$PROJECT_PREFIX')].{Name:LayerName,Version:LatestVersion.Version,Description:LatestVersion.Description,Size:LatestVersion.CodeSize}" \
      --output text | sort | column -t
  else
    aws lambda list-layers \
      --query "Layers[?contains(LayerName, '$PROJECT_PREFIX')]" \
      --output $OUTPUT_FORMAT
  fi
  
  # Compter le nombre de couches
  LAYER_COUNT=$(aws lambda list-layers \
    --query "length(Layers[?contains(LayerName, '$PROJECT_PREFIX')])" \
    --output text)
  
  echo -e "\nNombre total de couches Lambda: ${GREEN}$LAYER_COUNT${NC}"
}

# Fonction pour lister les groupes de logs
list_logs() {
  section "Groupes de logs CloudWatch"
  
  if [ "$OUTPUT_FORMAT" = "table" ]; then
    echo -e "NOM\tTAILLE\tRÉTENTION"
    aws logs describe-log-groups \
      --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
      --query "logGroups[*].{Name:logGroupName,Size:storedBytes,Retention:retentionInDays}" \
      --output text | sort | column -t
  else
    aws logs describe-log-groups \
      --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
      --output $OUTPUT_FORMAT
  fi
  
  # Compter le nombre de groupes de logs
  LOG_COUNT=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
    --query "length(logGroups)" \
    --output text)
  
  echo -e "\nNombre total de groupes de logs: ${GREEN}$LOG_COUNT${NC}"
}

# Fonction pour lister les mappages d'événements
list_event_mappings() {
  section "Mappages d'événements"
  
  # Obtenir la liste des fonctions
  FUNCTIONS=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, '$PROJECT_PREFIX')].FunctionName" \
    --output text)
  
  if [ -z "$FUNCTIONS" ]; then
    echo "Aucune fonction trouvée avec le préfixe '$PROJECT_PREFIX'"
    return
  fi
  
  TOTAL_MAPPINGS=0
  
  for func in $FUNCTIONS; do
    # Lister les mappages d'événements pour cette fonction
    MAPPINGS=$(aws lambda list-event-source-mappings \
      --function-name $func \
      --query "EventSourceMappings" \
      --output json)
    
    MAPPING_COUNT=$(echo "$MAPPINGS" | jq 'length')
    TOTAL_MAPPINGS=$((TOTAL_MAPPINGS + MAPPING_COUNT))
    
    if [ "$MAPPING_COUNT" -gt 0 ]; then
      echo "Fonction: $func - $MAPPING_COUNT mappages"
      
      if [ "$OUTPUT_FORMAT" = "table" ]; then
        echo -e "UUID\tSOURCE\tÉTAT"
        echo "$MAPPINGS" | jq -r '.[] | [.UUID, .EventSourceArn, .State] | @tsv' | column -t
      else
        echo "$MAPPINGS" | jq '.'
      fi
      
      echo ""
    fi
  done
  
  echo -e "Nombre total de mappages d'événements: ${GREEN}$TOTAL_MAPPINGS${NC}"
}

# Exécuter les fonctions selon le type de ressource demandé
case $RESOURCE_TYPE in
  "functions")
    list_functions
    ;;
  "layers")
    list_layers
    ;;
  "logs")
    list_logs
    ;;
  "events")
    list_event_mappings
    ;;
  "all")
    list_functions
    list_layers
    list_logs
    list_event_mappings
    ;;
  *)
    echo -e "${RED}Type de ressource inconnu: $RESOURCE_TYPE${NC}"
    show_help
    ;;
esac

# Résumé des ressources
section "Résumé des ressources AWS Lambda"

# Obtenir le nombre total de fonctions
FUNCTION_COUNT=$(aws lambda list-functions \
  --query "length(Functions[?contains(FunctionName, '$PROJECT_PREFIX')])" \
  --output text)

# Obtenir le nombre total de couches
LAYER_COUNT=$(aws lambda list-layers \
  --query "length(Layers[?contains(LayerName, '$PROJECT_PREFIX')])" \
  --output text)

# Obtenir le nombre total de groupes de logs
LOG_COUNT=$(aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
  --query "length(logGroups)" \
  --output text)

echo "Ressources Lambda pour le projet '$PROJECT_PREFIX' dans la région '$AWS_REGION':"
echo -e "- Fonctions Lambda: ${GREEN}$FUNCTION_COUNT${NC}"
echo -e "- Couches Lambda: ${GREEN}$LAYER_COUNT${NC}"
echo -e "- Groupes de logs: ${GREEN}$LOG_COUNT${NC}"

echo -e "\n${GREEN}✓ Listage des ressources AWS Lambda terminé !${NC}"
echo "Pour nettoyer les ressources inutilisées, utilisez le script aws-lambda-cleanup.sh"

exit 0
