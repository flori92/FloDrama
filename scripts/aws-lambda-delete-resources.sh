#!/bin/bash

# Script pour supprimer les ressources AWS Lambda inutilisées
# Ce script permet de supprimer de manière sélective ou automatique
# les ressources Lambda obsolètes ou inutilisées

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

# Définition des variables par défaut
AWS_REGION="us-east-1"
PROJECT_PREFIX="FloDrama"
DAYS_INACTIVE=30
FORCE=false
DRY_RUN=true
RESOURCE_TYPE="all"

# Afficher l'aide
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --region REGION       Région AWS à utiliser (défaut: us-east-1)"
  echo "  --prefix PREFIX       Préfixe pour filtrer les ressources (défaut: FloDrama)"
  echo "  --days DAYS           Nombre de jours d'inactivité pour considérer une ressource comme inutilisée (défaut: 30)"
  echo "  --force               Supprimer sans confirmation (défaut: false)"
  echo "  --execute             Exécuter réellement les suppressions (défaut: dry-run)"
  echo "  --type TYPE           Type de ressource à supprimer: functions, versions, layers, logs, all (défaut: all)"
  echo "  --help                Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0 --region eu-west-3 --prefix Prod --days 60 --type functions"
  echo "  $0 --execute --force --type versions"
  exit 0
}

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --region) AWS_REGION="$2"; shift ;;
    --prefix) PROJECT_PREFIX="$2"; shift ;;
    --days) DAYS_INACTIVE="$2"; shift ;;
    --force) FORCE=true ;;
    --execute) DRY_RUN=false ;;
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
echo "Jours d'inactivité: $DAYS_INACTIVE"
echo "Mode force: $FORCE"
echo "Mode simulation: $DRY_RUN"
echo "Type de ressource: $RESOURCE_TYPE"

if [ "$DRY_RUN" = true ]; then
  warning "Mode SIMULATION activé. Aucune ressource ne sera réellement supprimée."
  warning "Utilisez l'option --execute pour effectuer les suppressions."
else
  warning "Mode EXÉCUTION activé. Les ressources seront réellement supprimées."
  
  if [ "$FORCE" = false ]; then
    read -p "Êtes-vous sûr de vouloir supprimer des ressources AWS Lambda? (o/n): " confirm
    if [[ ! $confirm =~ ^[Oo]$ ]]; then
      echo "Opération annulée."
      exit 0
    fi
  fi
fi

# Fonction pour supprimer les fonctions Lambda inutilisées
delete_unused_functions() {
  section "Suppression des fonctions Lambda inutilisées"
  
  # Obtenir la liste des fonctions
  FUNCTIONS=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, '$PROJECT_PREFIX')].FunctionName" \
    --output text)
  
  if [ -z "$FUNCTIONS" ]; then
    warning "Aucune fonction trouvée avec le préfixe '$PROJECT_PREFIX'"
    return
  fi
  
  UNUSED_FUNCTIONS=()
  
  for func in $FUNCTIONS; do
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
  
  if [ ${#UNUSED_FUNCTIONS[@]} -eq 0 ]; then
    success "Aucune fonction inutilisée trouvée."
    return
  fi
  
  echo "Fonctions inutilisées trouvées: ${#UNUSED_FUNCTIONS[@]}"
  
  for func in "${UNUSED_FUNCTIONS[@]}"; do
    echo "Fonction: $func"
    
    if [ "$DRY_RUN" = false ]; then
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
      echo "Suppression de la fonction $func..."
      aws lambda delete-function --function-name $func
      
      if [ $? -eq 0 ]; then
        success "Fonction $func supprimée avec succès"
      else
        error "Erreur lors de la suppression de la fonction $func"
      fi
    else
      warning "[SIMULATION] La fonction $func serait supprimée"
    fi
  done
}

# Fonction pour supprimer les anciennes versions de fonctions
delete_old_versions() {
  section "Suppression des anciennes versions de fonctions"
  
  # Obtenir la liste des fonctions
  FUNCTIONS=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, '$PROJECT_PREFIX')].FunctionName" \
    --output text)
  
  if [ -z "$FUNCTIONS" ]; then
    warning "Aucune fonction trouvée avec le préfixe '$PROJECT_PREFIX'"
    return
  fi
  
  for func in $FUNCTIONS; do
    echo "Vérification des versions de $func..."
    
    # Lister toutes les versions
    VERSIONS=$(aws lambda list-versions-by-function \
      --function-name $func \
      --query "Versions[?Version!='$LATEST'].Version" \
      --output text)
    
    if [ -z "$VERSIONS" ]; then
      success "Aucune version supplémentaire trouvée pour la fonction $func."
      continue
    fi
    
    # Compter le nombre de versions
    VERSION_COUNT=$(echo "$VERSIONS" | wc -w | xargs)
    
    if [ "$VERSION_COUNT" -le 2 ]; then
      success "La fonction $func a seulement $VERSION_COUNT versions. Aucun nettoyage nécessaire."
      continue
    fi
    
    # Trier les versions et garder uniquement les plus anciennes à supprimer
    VERSIONS_TO_DELETE=$(echo "$VERSIONS" | tr '\t' '\n' | sort -n | head -n -2)
    
    if [ -z "$VERSIONS_TO_DELETE" ]; then
      success "Aucune version à supprimer pour la fonction $func."
      continue
    fi
    
    echo "Versions à supprimer pour $func: $VERSIONS_TO_DELETE"
    
    for version in $VERSIONS_TO_DELETE; do
      if [ "$DRY_RUN" = false ]; then
        echo "Suppression de la version $version de $func..."
        aws lambda delete-function --function-name $func --qualifier $version
        
        if [ $? -eq 0 ]; then
          success "Version $version de $func supprimée avec succès"
        else
          error "Erreur lors de la suppression de la version $version de $func"
        fi
      else
        warning "[SIMULATION] La version $version de $func serait supprimée"
      fi
    done
  done
}

# Fonction pour supprimer les anciennes couches Lambda
delete_old_layers() {
  section "Suppression des anciennes couches Lambda"
  
  # Obtenir la liste des couches
  LAYERS=$(aws lambda list-layers \
    --query "Layers[?contains(LayerName, '$PROJECT_PREFIX')].LayerName" \
    --output text)
  
  if [ -z "$LAYERS" ]; then
    warning "Aucune couche trouvée avec le préfixe '$PROJECT_PREFIX'"
    return
  fi
  
  for layer in $LAYERS; do
    echo "Vérification des versions de la couche $layer..."
    
    # Lister toutes les versions de la couche
    LAYER_VERSIONS=$(aws lambda list-layer-versions \
      --layer-name $layer \
      --query "LayerVersions[*].{Version:Version,CreatedDate:CreatedDate}" \
      --output json)
    
    # Compter le nombre de versions
    VERSION_COUNT=$(echo "$LAYER_VERSIONS" | jq 'length')
    
    if [ "$VERSION_COUNT" -le 2 ]; then
      success "La couche $layer a seulement $VERSION_COUNT versions. Aucun nettoyage nécessaire."
      continue
    fi
    
    # Trier les versions par date de création et garder uniquement les plus anciennes à supprimer
    VERSIONS_TO_DELETE=$(echo "$LAYER_VERSIONS" | jq -r 'sort_by(.CreatedDate) | .[0:-2] | .[].Version')
    
    if [ -z "$VERSIONS_TO_DELETE" ]; then
      success "Aucune version à supprimer pour la couche $layer."
      continue
    fi
    
    echo "Versions à supprimer pour la couche $layer: $VERSIONS_TO_DELETE"
    
    for version in $VERSIONS_TO_DELETE; do
      if [ "$DRY_RUN" = false ]; then
        echo "Suppression de la version $version de la couche $layer..."
        aws lambda delete-layer-version --layer-name $layer --version-number $version
        
        if [ $? -eq 0 ]; then
          success "Version $version de la couche $layer supprimée avec succès"
        else
          error "Erreur lors de la suppression de la version $version de la couche $layer"
        fi
      else
        warning "[SIMULATION] La version $version de la couche $layer serait supprimée"
      fi
    done
  done
}

# Fonction pour configurer la rétention des logs CloudWatch
configure_log_retention() {
  section "Configuration de la rétention des logs CloudWatch"
  
  # Obtenir la liste des groupes de logs
  LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/$PROJECT_PREFIX" \
    --query "logGroups[*].{Name:logGroupName,Retention:retentionInDays}" \
    --output json)
  
  if [ -z "$LOG_GROUPS" ] || [ "$(echo "$LOG_GROUPS" | jq 'length')" -eq 0 ]; then
    warning "Aucun groupe de logs trouvé avec le préfixe '/aws/lambda/$PROJECT_PREFIX'"
    return
  fi
  
  # Parcourir les groupes de logs
  for group in $(echo "$LOG_GROUPS" | jq -r '.[].Name'); do
    RETENTION=$(echo "$LOG_GROUPS" | jq -r --arg group "$group" '.[] | select(.Name == $group) | .Retention')
    
    if [ "$RETENTION" = "null" ] || [ -z "$RETENTION" ]; then
      echo "Le groupe de logs $group n'a pas de politique de rétention définie."
      
      if [ "$DRY_RUN" = false ]; then
        echo "Configuration de la politique de rétention à 30 jours..."
        aws logs put-retention-policy --log-group-name "$group" --retention-in-days 30
        
        if [ $? -eq 0 ]; then
          success "Politique de rétention définie avec succès pour $group"
        else
          error "Erreur lors de la définition de la politique de rétention pour $group"
        fi
      else
        warning "[SIMULATION] Une politique de rétention de 30 jours serait définie pour $group"
      fi
    else
      success "Le groupe de logs $group a déjà une politique de rétention de $RETENTION jours."
    fi
  done
}

# Exécuter les fonctions selon le type de ressource demandé
case $RESOURCE_TYPE in
  "functions")
    delete_unused_functions
    ;;
  "versions")
    delete_old_versions
    ;;
  "layers")
    delete_old_layers
    ;;
  "logs")
    configure_log_retention
    ;;
  "all")
    delete_unused_functions
    delete_old_versions
    delete_old_layers
    configure_log_retention
    ;;
  *)
    error "Type de ressource inconnu: $RESOURCE_TYPE"
    show_help
    ;;
esac

# Résumé des opérations
section "Résumé des opérations"

if [ "$DRY_RUN" = true ]; then
  warning "Mode SIMULATION : Aucune ressource n'a été réellement supprimée."
  echo "Pour exécuter réellement les suppressions, utilisez l'option --execute"
else
  success "Les ressources ont été nettoyées avec succès."
fi

echo -e "\n${GREEN}✓ Nettoyage des ressources AWS Lambda terminé !${NC}"

exit 0
