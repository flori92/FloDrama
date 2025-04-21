#!/bin/bash

# Script de nettoyage des ressources AWS Lambda pour FloDrama
# Ce script permet de supprimer les anciennes versions des fonctions Lambda
# et de nettoyer les ressources API Gateway associées

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Nettoyage des ressources AWS Lambda pour FloDrama${NC}"
echo "Ce script va supprimer les anciennes versions et ressources inutilisées."

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
API_GATEWAY_NAME="FloDramaAPI"

# Configuration de la région AWS
aws configure set region $AWS_REGION

# 1. Nettoyage des versions Lambda
echo -e "\n${YELLOW}Nettoyage des versions de la fonction Lambda...${NC}"

# Récupération des versions de la fonction Lambda
LAMBDA_VERSIONS=$(aws lambda list-versions-by-function --function-name $LAMBDA_FUNCTION_NAME --query "Versions[?Version!='$LATEST'].Version" --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}La fonction Lambda $LAMBDA_FUNCTION_NAME n'existe pas ou vous n'avez pas les permissions nécessaires.${NC}"
else
    # Suppression des anciennes versions (garder les 2 plus récentes)
    if [ -n "$LAMBDA_VERSIONS" ]; then
        # Trier les versions et garder uniquement les plus anciennes à supprimer
        VERSIONS_TO_DELETE=$(echo "$LAMBDA_VERSIONS" | tr '\t' '\n' | sort -n | head -n -2)
        
        if [ -n "$VERSIONS_TO_DELETE" ]; then
            echo "Versions à supprimer: $VERSIONS_TO_DELETE"
            
            for VERSION in $VERSIONS_TO_DELETE; do
                echo "Suppression de la version $VERSION de $LAMBDA_FUNCTION_NAME..."
                aws lambda delete-function --function-name $LAMBDA_FUNCTION_NAME --qualifier $VERSION
                
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✓ Version $VERSION supprimée avec succès${NC}"
                else
                    echo -e "${RED}✗ Erreur lors de la suppression de la version $VERSION${NC}"
                fi
            done
        else
            echo "Aucune ancienne version à supprimer."
        fi
    else
        echo "Aucune version supplémentaire trouvée pour la fonction $LAMBDA_FUNCTION_NAME."
    fi
fi

# 2. Nettoyage des déploiements API Gateway
echo -e "\n${YELLOW}Nettoyage des déploiements API Gateway...${NC}"

# Récupération de l'ID de l'API Gateway
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_GATEWAY_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo -e "${YELLOW}L'API Gateway $API_GATEWAY_NAME n'existe pas ou vous n'avez pas les permissions nécessaires.${NC}"
else
    echo "API Gateway ID: $API_ID"
    
    # Récupération des déploiements
    DEPLOYMENTS=$(aws apigateway get-deployments --rest-api-id $API_ID --query "items[*].id" --output text)
    
    if [ -n "$DEPLOYMENTS" ]; then
        # Compter le nombre de déploiements
        DEPLOYMENT_COUNT=$(echo "$DEPLOYMENTS" | wc -w)
        
        if [ $DEPLOYMENT_COUNT -gt 5 ]; then
            # Trier les déploiements par date de création et garder uniquement les plus anciens à supprimer
            DEPLOYMENTS_TO_DELETE=$(aws apigateway get-deployments --rest-api-id $API_ID --query "items[0:$((DEPLOYMENT_COUNT-5))].id" --output text)
            
            if [ -n "$DEPLOYMENTS_TO_DELETE" ]; then
                echo "Déploiements à supprimer: $DEPLOYMENTS_TO_DELETE"
                
                for DEPLOYMENT_ID in $DEPLOYMENTS_TO_DELETE; do
                    echo "Suppression du déploiement $DEPLOYMENT_ID..."
                    aws apigateway delete-deployment --rest-api-id $API_ID --deployment-id $DEPLOYMENT_ID
                    
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}✓ Déploiement $DEPLOYMENT_ID supprimé avec succès${NC}"
                    else
                        echo -e "${RED}✗ Erreur lors de la suppression du déploiement $DEPLOYMENT_ID${NC}"
                    fi
                done
            fi
        else
            echo "Moins de 5 déploiements trouvés. Aucun nettoyage nécessaire."
        fi
    else
        echo "Aucun déploiement trouvé pour l'API Gateway $API_GATEWAY_NAME."
    fi
fi

# 3. Nettoyage des logs CloudWatch
echo -e "\n${YELLOW}Nettoyage des logs CloudWatch...${NC}"

# Récupération des groupes de logs pour la fonction Lambda
LOG_GROUP="/aws/lambda/$LAMBDA_FUNCTION_NAME"

# Vérification de l'existence du groupe de logs
LOG_GROUP_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query "logGroups[?logGroupName=='$LOG_GROUP'].logGroupName" --output text)

if [ -n "$LOG_GROUP_EXISTS" ]; then
    echo "Groupe de logs trouvé: $LOG_GROUP"
    
    # Suppression des flux de logs plus anciens que 30 jours
    echo "Définition de la politique de rétention à 30 jours..."
    aws logs put-retention-policy --log-group-name "$LOG_GROUP" --retention-in-days 30
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Politique de rétention définie avec succès${NC}"
    else
        echo -e "${RED}✗ Erreur lors de la définition de la politique de rétention${NC}"
    fi
else
    echo "Aucun groupe de logs trouvé pour la fonction Lambda $LAMBDA_FUNCTION_NAME."
fi

echo -e "\n${GREEN}✓ Nettoyage des ressources AWS Lambda terminé !${NC}"
echo "Les ressources suivantes ont été nettoyées :"
echo "- Anciennes versions de la fonction Lambda $LAMBDA_FUNCTION_NAME"
echo "- Anciens déploiements de l'API Gateway $API_GATEWAY_NAME"
echo "- Logs CloudWatch plus anciens que 30 jours"

exit 0
