#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérification des dépendances
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Variables
APP_ID="d3v3iochmt8wu6"
BRANCH_NAME="main"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}=== Script de correction des assets pour AWS Amplify ===${NC}"

# Modification du fichier public/index.html pour adapter les chemins des assets
echo -e "${YELLOW}Analyse du fichier public/index.html...${NC}"

if [ -f "public/index.html" ]; then
    # Créer un répertoire assets dans public s'il n'existe pas
    if [ ! -d "public/assets" ]; then
        echo -e "${YELLOW}Création du répertoire public/assets${NC}"
        mkdir -p "public/assets"
    fi

    # Vérifie les fichiers CSS et les copie si nécessaire
    echo -e "${YELLOW}Vérification des fichiers CSS...${NC}"
    
    # Si le fichier theme.css n'existe pas, on le crée
    if [ ! -f "public/assets/theme.css" ]; then
        echo -e "${YELLOW}Création d'un fichier theme.css placeholder${NC}"
        echo "/* Theme CSS placeholder - sera remplacé par le build */" > "public/assets/theme.css"
    fi
    
    # Si le fichier index.css n'existe pas, on le crée
    if [ ! -f "public/assets/index.css" ]; then
        echo -e "${YELLOW}Création d'un fichier index.css placeholder${NC}"
        echo "/* Index CSS placeholder - sera remplacé par le build */" > "public/assets/index.css"
    fi
    
    echo -e "${GREEN}Fichiers CSS créés ou vérifiés avec succès${NC}"
else
    echo -e "${RED}Le fichier public/index.html n'existe pas!${NC}"
    exit 1
fi

# Mise à jour de la configuration Amplify
echo -e "${YELLOW}Mise à jour de la configuration buildspec dans AWS Amplify...${NC}"
aws amplify update-app --app-id "$APP_ID" --build-spec file://amplify.yml
echo -e "${GREEN}Configuration buildspec mise à jour${NC}"

# Démarrage d'un nouveau build
echo -e "${YELLOW}Démarrage d'un nouveau build...${NC}"
JOB_ID=$(aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE --query 'jobSummary.jobId' --output text)

if [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}Build démarré avec succès! Job ID: $JOB_ID${NC}"
    
    # Suivi du statut du job
    echo -e "${YELLOW}Suivi du statut du job...${NC}"
    STATUS="PENDING"
    COUNTER=0
    MAX_CHECKS=30
    
    while [ "$STATUS" != "SUCCEED" ] && [ "$STATUS" != "FAILED" ] && [ $COUNTER -lt $MAX_CHECKS ]; do
        # Obtenir le statut actuel
        STATUS=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" --query 'job.summary.status' --output text)
        
        # Afficher le statut
        echo -e "${BLUE}Statut actuel: $STATUS (check $COUNTER/$MAX_CHECKS)${NC}"
        
        # Si toujours en cours, attendre et incrémenter le compteur
        if [ "$STATUS" != "SUCCEED" ] && [ "$STATUS" != "FAILED" ]; then
            COUNTER=$((COUNTER+1))
            sleep 20
        fi
    done
    
    # Afficher le résultat final
    if [ "$STATUS" == "SUCCEED" ]; then
        echo -e "${GREEN}Build terminé avec succès!${NC}"
        echo -e "${GREEN}URL de l'application: https://main.$APP_ID.amplifyapp.com${NC}"
    elif [ "$STATUS" == "FAILED" ]; then
        echo -e "${RED}Build échoué. Consultez les logs dans la console AWS Amplify.${NC}"
    else
        echo -e "${YELLOW}Le suivi du build a atteint le maximum de vérifications ($MAX_CHECKS).${NC}"
        echo -e "${YELLOW}Vérifiez manuellement le statut dans la console AWS Amplify.${NC}"
    fi
else
    echo -e "${RED}Impossible de démarrer le build.${NC}"
fi

echo -e "${BLUE}=== Fin du script ===${NC}"
