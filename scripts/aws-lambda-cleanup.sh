#!/bin/bash

# Script pour lister et nettoyer les ressources AWS Lambda inutilisées
# Ce script permet d'identifier et de supprimer les ressources Lambda obsolètes
# pour optimiser les coûts et la maintenance

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

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher un message d'erreur
error() {
  echo -e "${RED}✗ $1${NC}"
}

# Fonction pour afficher un message d'avertissement
warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Vérification de l'installation d'AWS CLI
if ! command -v aws &> /dev/null; then
  error "AWS CLI n'est pas installé."
  echo "Veuillez l'installer en suivant les instructions sur https://aws.amazon.com/cli/"
  exit 1
fi

# Vérification de la configuration AWS
echo "Vérification de la configuration AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  error "Vous n'êtes pas connecté à AWS ou vos identifiants sont invalides."
  echo "Veuillez configurer vos identifiants AWS avec 'aws configure'"
  exit 1
fi

success "Connecté à AWS"

# Définition des variables
AWS_REGION="us-east-1"
PROJECT_PREFIX="FloDrama"
DAYS_INACTIVE=30
INTERACTIVE=true

# Configuration de la région AWS
aws configure set region $AWS_REGION

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --region) AWS_REGION="$2"; shift ;;
    --prefix) PROJECT_PREFIX="$2"; shift ;;
    --days) DAYS_INACTIVE="$2"; shift ;;
    --non-interactive) INTERACTIVE=false ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
  shift
done

echo "Région AWS: $AWS_REGION"
echo "Préfixe du projet: $PROJECT_PREFIX"
echo "Jours d'inactivité: $DAYS_INACTIVE"
echo "Mode interactif: $INTERACTIVE"

# 1. Lister toutes les fonctions Lambda
section "Liste des fonctions Lambda"
LAMBDA_FUNCTIONS=$(aws lambda list-functions --query "Functions[*].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,LastModified:LastModified}" --output json)

# Afficher les fonctions dans un format lisible
echo "$LAMBDA_FUNCTIONS" | jq -r '.[] | "\(.Name) | \(.Runtime) | \(.Memory) MB | \(.LastModified)"' | column -t -s '|'

# Filtrer les fonctions par préfixe
PROJECT_FUNCTIONS=$(echo "$LAMBDA_FUNCTIONS" | jq -r --arg prefix "$PROJECT_PREFIX" '.[] | select(.Name | contains($prefix)) | .Name')

if [ -z "$PROJECT_FUNCTIONS" ]; then
  warning "Aucune fonction Lambda trouvée avec le préfixe '$PROJECT_PREFIX'"
else
  success "Fonctions Lambda trouvées avec le préfixe '$PROJECT_PREFIX':"
  echo "$PROJECT_FUNCTIONS"
fi

# 2. Identifier les fonctions inutilisées
section "Identification des fonctions inutilisées"

UNUSED_FUNCTIONS=()
CURRENT_DATE=$(date +%s)

for func in $PROJECT_FUNCTIONS; do
  # Obtenir la date de dernière invocation
  echo "Vérification de l'utilisation de $func..."
  
  # Obtenir les métriques d'invocation pour les derniers jours
  LAST_INVOCATION=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$func \
    --start-time $(date -v-${DAYS_INACTIVE}d -u +"%Y-%m-%dT%H:%M:%SZ") \
    --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
    --period 2592000 \
    --statistics Sum \
    --output json)
  
  INVOCATION_COUNT=$(echo "$LAST_INVOCATION" | jq -r '.Datapoints[0].Sum // 0')
  
  if [ "$INVOCATION_COUNT" = "0" ] || [ -z "$INVOCATION_COUNT" ]; then
    warning "La fonction $func n'a pas été invoquée depuis $DAYS_INACTIVE jours"
    UNUSED_FUNCTIONS+=("$func")
  else
    success "La fonction $func a été invoquée $INVOCATION_COUNT fois dans les derniers $DAYS_INACTIVE jours"
  fi
done

# 3. Lister les versions et alias inutilisés
section "Versions et alias inutilisés"

for func in $PROJECT_FUNCTIONS; do
  echo "Versions de la fonction $func:"
  
  # Lister toutes les versions
  VERSIONS=$(aws lambda list-versions-by-function \
    --function-name $func \
    --query "Versions[?Version!='$LATEST'].{Version:Version,Description:Description,LastModified:LastModified}" \
    --output json)
  
  echo "$VERSIONS" | jq -r '.[] | "\(.Version) | \(.LastModified) | \(.Description // "Pas de description")"' | column -t -s '|'
  
  # Lister tous les alias
  echo "Alias de la fonction $func:"
  ALIASES=$(aws lambda list-aliases \
    --function-name $func \
    --query "Aliases[*].{Name:Name,FunctionVersion:FunctionVersion,Description:Description}" \
    --output json)
  
  echo "$ALIASES" | jq -r '.[] | "\(.Name) -> version \(.FunctionVersion) | \(.Description // "Pas de description")"' | column -t -s '|'
done

# 4. Lister les couches Lambda
section "Couches Lambda"

LAYERS=$(aws lambda list-layers \
  --query "Layers[*].{Name:LayerName,LatestVersion:LatestVersion}" \
  --output json)

echo "$LAYERS" | jq -r '.[] | "\(.Name) | Version \(.LatestVersion.Version) | \(.LatestVersion.Description // "Pas de description")"' | column -t -s '|'

# Filtrer les couches par préfixe
PROJECT_LAYERS=$(echo "$LAYERS" | jq -r --arg prefix "$PROJECT_PREFIX" '.[] | select(.Name | contains($prefix)) | .Name')

if [ -n "$PROJECT_LAYERS" ]; then
  success "Couches Lambda trouvées avec le préfixe '$PROJECT_PREFIX':"
  echo "$PROJECT_LAYERS"
  
  for layer in $PROJECT_LAYERS; do
    echo "Versions de la couche $layer:"
    
    # Lister toutes les versions de la couche
    LAYER_VERSIONS=$(aws lambda list-layer-versions \
      --layer-name $layer \
      --query "LayerVersions[*].{Version:Version,Description:Description,CreatedDate:CreatedDate}" \
      --output json)
    
    echo "$LAYER_VERSIONS" | jq -r '.[] | "\(.Version) | \(.CreatedDate) | \(.Description // "Pas de description")"' | column -t -s '|'
  done
fi

# 5. Lister les groupes de logs CloudWatch
section "Groupes de logs CloudWatch"

LOG_GROUPS=$(aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
  --query "logGroups[*].{Name:logGroupName,StoredBytes:storedBytes,RetentionInDays:retentionInDays}" \
  --output json)

echo "$LOG_GROUPS" | jq -r '.[] | "\(.Name) | \(.StoredBytes) bytes | Rétention: \(.RetentionInDays // "illimitée") jours"' | column -t -s '|'

# 6. Lister les événements et déclencheurs
section "Événements et déclencheurs"

for func in $PROJECT_FUNCTIONS; do
  echo "Mappages d'événements pour la fonction $func:"
  
  # Lister tous les mappages d'événements
  EVENT_MAPPINGS=$(aws lambda list-event-source-mappings \
    --function-name $func \
    --query "EventSourceMappings[*].{UUID:UUID,EventSourceArn:EventSourceArn,State:State,LastModified:LastModified}" \
    --output json)
  
  if [ "$(echo "$EVENT_MAPPINGS" | jq 'length')" -gt 0 ]; then
    echo "$EVENT_MAPPINGS" | jq -r '.[] | "\(.UUID) | \(.EventSourceArn) | \(.State) | \(.LastModified)"' | column -t -s '|'
  else
    echo "Aucun mappage d'événement trouvé."
  fi
  
  # Lister les permissions (déclencheurs)
  echo "Permissions pour la fonction $func:"
  POLICY=$(aws lambda get-policy --function-name $func 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "$POLICY" | jq -r '.Policy' | jq -r '.Statement[] | "\(.Sid) | \(.Principal.Service) | \(.Action) | \(.Condition.ArnLike["AWS:SourceArn"] // "N/A")"' | column -t -s '|'
  else
    echo "Aucune politique de ressource trouvée."
  fi
done

# 7. Nettoyage interactif
if [ "$INTERACTIVE" = true ] && [ ${#UNUSED_FUNCTIONS[@]} -gt 0 ]; then
  section "Nettoyage des ressources inutilisées"
  
  echo "Les fonctions suivantes n'ont pas été utilisées depuis $DAYS_INACTIVE jours:"
  for i in "${!UNUSED_FUNCTIONS[@]}"; do
    echo "[$i] ${UNUSED_FUNCTIONS[$i]}"
  done
  
  read -p "Voulez-vous supprimer ces fonctions inutilisées? (o/n): " confirm
  if [[ $confirm =~ ^[Oo]$ ]]; then
    for func in "${UNUSED_FUNCTIONS[@]}"; do
      echo "Suppression de la fonction $func..."
      
      # Supprimer les mappages d'événements
      EVENT_MAPPINGS=$(aws lambda list-event-source-mappings \
        --function-name $func \
        --query "EventSourceMappings[*].UUID" \
        --output text)
      
      for mapping in $EVENT_MAPPINGS; do
        echo "Suppression du mappage d'événement $mapping..."
        aws lambda delete-event-source-mapping --uuid $mapping
      done
      
      # Supprimer la fonction
      aws lambda delete-function --function-name $func
      
      if [ $? -eq 0 ]; then
        success "Fonction $func supprimée avec succès"
      else
        error "Erreur lors de la suppression de la fonction $func"
      fi
    done
  else
    echo "Nettoyage annulé."
  fi
fi

# 8. Générer un rapport
section "Rapport de ressources Lambda"

echo "Ressources Lambda pour le projet $PROJECT_PREFIX dans la région $AWS_REGION:"
echo "- Fonctions Lambda: $(echo "$PROJECT_FUNCTIONS" | wc -l | xargs)"
echo "- Fonctions inutilisées: ${#UNUSED_FUNCTIONS[@]}"
echo "- Couches Lambda: $(echo "$PROJECT_LAYERS" | wc -l | xargs)"
echo "- Groupes de logs: $(echo "$LOG_GROUPS" | jq 'length')"

# Estimation des coûts (approximative)
TOTAL_MEMORY=0
TOTAL_EXECUTIONS=0

for func in $PROJECT_FUNCTIONS; do
  # Obtenir la mémoire configurée
  MEMORY=$(aws lambda get-function-configuration \
    --function-name $func \
    --query "MemorySize" \
    --output text)
  
  TOTAL_MEMORY=$((TOTAL_MEMORY + MEMORY))
  
  # Obtenir le nombre d'exécutions du mois dernier
  EXECUTIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$func \
    --start-time $(date -v-30d -u +"%Y-%m-%dT%H:%M:%SZ") \
    --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
    --period 2592000 \
    --statistics Sum \
    --output json | jq -r '.Datapoints[0].Sum // 0')
  
  TOTAL_EXECUTIONS=$((TOTAL_EXECUTIONS + EXECUTIONS))
done

echo "- Mémoire totale allouée: $TOTAL_MEMORY MB"
echo "- Exécutions totales (30 derniers jours): $TOTAL_EXECUTIONS"

success "Analyse des ressources Lambda terminée!"
echo "Exécutez ce script régulièrement pour maintenir vos ressources Lambda optimisées."

exit 0
