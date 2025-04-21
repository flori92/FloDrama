#!/bin/bash

# Script de surveillance des fonctions Lambda pour FloDrama
# Ce script permet de vérifier l'état des fonctions Lambda et de générer des alertes
# en cas de problème de performance ou d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Surveillance des fonctions Lambda pour FloDrama${NC}"

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

# Définition des variables
AWS_REGION="us-east-1"
LAMBDA_FUNCTION_NAME="FloDramaAPI"
ALERT_THRESHOLD_ERRORS=5
ALERT_THRESHOLD_DURATION=3000  # en millisecondes
ALERT_THRESHOLD_MEMORY=80      # pourcentage d'utilisation de la mémoire

# Configuration de la région AWS
aws configure set region $AWS_REGION

# Fonction pour obtenir les métriques CloudWatch
get_metric_statistics() {
    local metric_name=$1
    local start_time=$(date -u -v-1d +"%Y-%m-%dT%H:%M:%SZ")
    local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    aws cloudwatch get-metric-statistics \
        --namespace "AWS/Lambda" \
        --metric-name "$metric_name" \
        --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION_NAME \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 3600 \
        --statistics Maximum Average Sum \
        --output json
}

# Vérification de l'existence de la fonction Lambda
echo -e "\n${YELLOW}Vérification de la fonction Lambda $LAMBDA_FUNCTION_NAME...${NC}"
LAMBDA_INFO=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}La fonction Lambda $LAMBDA_FUNCTION_NAME n'existe pas ou vous n'avez pas les permissions nécessaires.${NC}"
    exit 1
fi

# Extraction des informations de base
RUNTIME=$(echo "$LAMBDA_INFO" | grep -o '"Runtime": "[^"]*"' | cut -d'"' -f4)
MEMORY=$(echo "$LAMBDA_INFO" | grep -o '"MemorySize": [0-9]*' | awk '{print $2}')
TIMEOUT=$(echo "$LAMBDA_INFO" | grep -o '"Timeout": [0-9]*' | awk '{print $2}')
LAST_MODIFIED=$(echo "$LAMBDA_INFO" | grep -o '"LastModified": "[^"]*"' | cut -d'"' -f4)

echo -e "Informations sur la fonction Lambda :"
echo -e "- Runtime : $RUNTIME"
echo -e "- Mémoire allouée : $MEMORY MB"
echo -e "- Timeout : $TIMEOUT secondes"
echo -e "- Dernière modification : $LAST_MODIFIED"

# Récupération des métriques d'invocation
echo -e "\n${YELLOW}Récupération des métriques d'invocation...${NC}"
INVOCATIONS=$(get_metric_statistics "Invocations")
ERRORS=$(get_metric_statistics "Errors")
DURATION=$(get_metric_statistics "Duration")
THROTTLES=$(get_metric_statistics "Throttles")
CONCURRENT_EXECUTIONS=$(get_metric_statistics "ConcurrentExecutions")

# Calcul des statistiques
TOTAL_INVOCATIONS=$(echo "$INVOCATIONS" | grep -o '"Sum": [0-9.]*' | awk '{sum += $2} END {print sum}')
TOTAL_ERRORS=$(echo "$ERRORS" | grep -o '"Sum": [0-9.]*' | awk '{sum += $2} END {print sum}')
AVG_DURATION=$(echo "$DURATION" | grep -o '"Average": [0-9.]*' | awk '{sum += $2; count++} END {print sum/count}')
MAX_DURATION=$(echo "$DURATION" | grep -o '"Maximum": [0-9.]*' | awk '{if ($2 > max) max = $2} END {print max}')
TOTAL_THROTTLES=$(echo "$THROTTLES" | grep -o '"Sum": [0-9.]*' | awk '{sum += $2} END {print sum}')
MAX_CONCURRENT=$(echo "$CONCURRENT_EXECUTIONS" | grep -o '"Maximum": [0-9.]*' | awk '{if ($2 > max) max = $2} END {print max}')

# Affichage des statistiques
echo -e "\n${YELLOW}Statistiques des dernières 24 heures :${NC}"
echo -e "- Nombre total d'invocations : ${TOTAL_INVOCATIONS:-0}"
echo -e "- Nombre total d'erreurs : ${TOTAL_ERRORS:-0}"
echo -e "- Durée moyenne d'exécution : ${AVG_DURATION:-0} ms"
echo -e "- Durée maximale d'exécution : ${MAX_DURATION:-0} ms"
echo -e "- Nombre total de limitations : ${TOTAL_THROTTLES:-0}"
echo -e "- Exécutions concurrentes maximales : ${MAX_CONCURRENT:-0}"

# Vérification des alertes
echo -e "\n${YELLOW}Vérification des alertes...${NC}"
ALERTS=0

# Alerte sur les erreurs
if [ "${TOTAL_ERRORS:-0}" -gt "$ALERT_THRESHOLD_ERRORS" ]; then
    echo -e "${RED}⚠️ ALERTE : Nombre élevé d'erreurs (${TOTAL_ERRORS:-0} > $ALERT_THRESHOLD_ERRORS)${NC}"
    ALERTS=$((ALERTS+1))
fi

# Alerte sur la durée d'exécution
if (( $(echo "${MAX_DURATION:-0} > $ALERT_THRESHOLD_DURATION" | bc -l) )); then
    echo -e "${RED}⚠️ ALERTE : Durée d'exécution élevée (${MAX_DURATION:-0} ms > $ALERT_THRESHOLD_DURATION ms)${NC}"
    ALERTS=$((ALERTS+1))
fi

# Alerte sur les limitations
if [ "${TOTAL_THROTTLES:-0}" -gt 0 ]; then
    echo -e "${RED}⚠️ ALERTE : Des limitations ont été détectées (${TOTAL_THROTTLES:-0})${NC}"
    ALERTS=$((ALERTS+1))
fi

# Calcul de l'utilisation de la mémoire
MEMORY_UTILIZATION=$(get_metric_statistics "MemoryUtilization")
MAX_MEMORY_UTILIZATION=$(echo "$MEMORY_UTILIZATION" | grep -o '"Maximum": [0-9.]*' | awk '{if ($2 > max) max = $2} END {print max}')

if [ -n "$MAX_MEMORY_UTILIZATION" ]; then
    echo -e "- Utilisation maximale de la mémoire : ${MAX_MEMORY_UTILIZATION:-0}%"
    
    # Alerte sur l'utilisation de la mémoire
    if (( $(echo "${MAX_MEMORY_UTILIZATION:-0} > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        echo -e "${RED}⚠️ ALERTE : Utilisation élevée de la mémoire (${MAX_MEMORY_UTILIZATION:-0}% > $ALERT_THRESHOLD_MEMORY%)${NC}"
        ALERTS=$((ALERTS+1))
    fi
else
    echo -e "- Utilisation maximale de la mémoire : Non disponible"
fi

# Récupération des derniers logs
echo -e "\n${YELLOW}Récupération des derniers logs...${NC}"
LOG_GROUP="/aws/lambda/$LAMBDA_FUNCTION_NAME"
LOG_STREAMS=$(aws logs describe-log-streams --log-group-name "$LOG_GROUP" --order-by LastEventTime --descending --limit 1 --query "logStreams[0].logStreamName" --output text 2>/dev/null)

if [ -n "$LOG_STREAMS" ] && [ "$LOG_STREAMS" != "None" ]; then
    echo -e "Derniers logs de la fonction Lambda :"
    aws logs get-log-events --log-group-name "$LOG_GROUP" --log-stream-name "$LOG_STREAMS" --limit 10 --query "events[*].message" --output text | head -n 10
else
    echo -e "Aucun log disponible pour la fonction Lambda."
fi

# Résumé
if [ "$ALERTS" -eq 0 ]; then
    echo -e "\n${GREEN}✅ Aucune alerte détectée. La fonction Lambda fonctionne normalement.${NC}"
else
    echo -e "\n${RED}⚠️ $ALERTS alertes détectées. Veuillez vérifier les performances de la fonction Lambda.${NC}"
fi

# Recommandations
echo -e "\n${YELLOW}Recommandations :${NC}"

# Recommandation sur la mémoire
if [ -n "$MAX_MEMORY_UTILIZATION" ] && (( $(echo "${MAX_MEMORY_UTILIZATION:-0} > 90" | bc -l) )); then
    echo -e "- Augmenter la mémoire allouée à la fonction Lambda (actuellement $MEMORY MB)"
elif [ -n "$MAX_MEMORY_UTILIZATION" ] && (( $(echo "${MAX_MEMORY_UTILIZATION:-0} < 40" | bc -l) )); then
    echo -e "- Réduire la mémoire allouée à la fonction Lambda pour optimiser les coûts (actuellement $MEMORY MB)"
fi

# Recommandation sur le timeout
if (( $(echo "${MAX_DURATION:-0} > $TIMEOUT * 800" | bc -l) )); then
    echo -e "- Augmenter le timeout de la fonction Lambda (actuellement $TIMEOUT secondes)"
fi

# Recommandation sur les erreurs
if [ "${TOTAL_ERRORS:-0}" -gt 0 ]; then
    echo -e "- Analyser les logs pour identifier la cause des erreurs"
fi

exit 0
