#!/bin/bash

# Script de déploiement du service de paiement FloDrama
# Ce script déploie le service sur AWS en fonction de l'environnement spécifié

# Couleurs pour les messages
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Logo FloDrama
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}███████╗██╗      ██████╗     ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗${BLUE}  ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██╔════╝██║     ██╔═══██╗    ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}█████╗  ██║     ██║   ██║    ██║  ██║██████╔╝███████║██╔████╔██║███████║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██╔══╝  ██║     ██║   ██║    ██║  ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}██║     ███████╗╚██████╔╝    ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║${BLUE} ║${NC}"
echo -e "${BLUE}║  ${MAGENTA}╚═╝     ╚══════╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${BLUE} ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${BLUE}                 Service de Paiement Unifié                      ${NC}"
echo ""

# Vérifier les arguments
if [ $# -eq 0 ]; then
    ENV="dev"
    echo -e "${YELLOW}⚠️  Aucun environnement spécifié, utilisation de l'environnement par défaut: ${GREEN}dev${NC}"
else
    ENV=$1
    echo -e "${BLUE}🌍 Environnement sélectionné: ${GREEN}$ENV${NC}"
fi

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si le profil AWS est configuré
aws configure get aws_access_key_id &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ AWS CLI n'est pas configuré. Veuillez exécuter 'aws configure' avant de continuer.${NC}"
    exit 1
fi

# Vérifier si Serverless Framework est installé
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework n'est pas installé. Installation...${NC}"
    npm install -g serverless
fi

echo -e "${BLUE}📦 Installation des dépendances...${NC}"
npm install

echo -e "${BLUE}🔍 Vérification de la configuration...${NC}"
# Vérifier si le fichier .env existe
if [ ! -f .env.$ENV ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env.$ENV n'existe pas. Utilisation des variables d'environnement par défaut.${NC}"
else
    echo -e "${GREEN}✅ Fichier .env.$ENV trouvé.${NC}"
    # Charger les variables d'environnement
    export $(grep -v '^#' .env.$ENV | xargs)
fi

echo -e "${BLUE}🧪 Exécution des tests...${NC}"
npm test || {
    echo -e "${YELLOW}⚠️  Des tests ont échoué. Voulez-vous continuer le déploiement? (o/n)${NC}"
    read answer
    if [ "$answer" != "o" ]; then
        echo -e "${RED}❌ Déploiement annulé.${NC}"
        exit 1
    fi
}

echo -e "${BLUE}🚀 Déploiement du service sur AWS (environnement: ${GREEN}$ENV${BLUE})...${NC}"
serverless deploy --stage $ENV || {
    echo -e "${RED}❌ Erreur lors du déploiement.${NC}"
    exit 1
}

echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"

# Récupérer l'URL de l'API
API_URL=$(serverless info --stage $ENV | grep -o 'ServiceEndpoint: .*' | cut -d' ' -f2)

if [ -n "$API_URL" ]; then
    echo -e "${BLUE}🔗 URL de l'API: ${GREEN}$API_URL${NC}"
    
    # Mettre à jour le fichier de configuration frontend
    CONFIG_FILE="../../src/utils/ApiUtils.js"
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${BLUE}📝 Mise à jour de la configuration frontend...${NC}"
        
        # Sauvegarder le fichier original
        cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
        
        # Mettre à jour l'URL de l'API dans le fichier de configuration
        if [ "$ENV" == "dev" ] || [ "$ENV" == "development" ]; then
            sed -i '' "s|baseUrl: '[^']*'|baseUrl: '$API_URL'|g" "$CONFIG_FILE"
            echo -e "${GREEN}✅ Configuration frontend mise à jour avec succès!${NC}"
        elif [ "$ENV" == "staging" ]; then
            sed -i '' "s|baseUrl: 'https://api-staging.flodrama.com'|baseUrl: '$API_URL'|g" "$CONFIG_FILE"
            echo -e "${GREEN}✅ Configuration frontend mise à jour avec succès!${NC}"
        elif [ "$ENV" == "prod" ] || [ "$ENV" == "production" ]; then
            echo -e "${YELLOW}⚠️  URL de production détectée. Voulez-vous mettre à jour la configuration frontend? (o/n)${NC}"
            read answer
            if [ "$answer" == "o" ]; then
                sed -i '' "s|baseUrl: 'https://api.flodrama.com'|baseUrl: '$API_URL'|g" "$CONFIG_FILE"
                echo -e "${GREEN}✅ Configuration frontend mise à jour avec succès!${NC}"
            else
                echo -e "${BLUE}ℹ️  Configuration frontend inchangée.${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Fichier de configuration frontend non trouvé: $CONFIG_FILE${NC}"
    fi
    
    echo -e "${BLUE}📋 Endpoints disponibles:${NC}"
    echo -e "${GREEN}GET    $API_URL/subscription${NC}"
    echo -e "${GREEN}POST   $API_URL/subscription${NC}"
    echo -e "${GREEN}PUT    $API_URL/subscription${NC}"
    echo -e "${GREEN}POST   $API_URL/subscription/{id}/cancel${NC}"
    echo -e "${GREEN}POST   $API_URL/verify-paypal${NC}"
    echo -e "${GREEN}GET    $API_URL/payment-history${NC}"
    echo -e "${GREEN}POST   $API_URL/analytics/conversion${NC}"
    echo -e "${GREEN}POST   $API_URL/analytics/behavior${NC}"
    echo -e "${GREEN}GET    $API_URL/analytics/conversion-metrics${NC}"
    echo -e "${GREEN}GET    $API_URL/analytics/behavior-metrics${NC}"
else
    echo -e "${YELLOW}⚠️  Impossible de récupérer l'URL de l'API.${NC}"
fi

# Créer un timestamp pour la sauvegarde
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="../../backups"
mkdir -p "$BACKUP_DIR"

# Créer une sauvegarde du déploiement
echo -e "${BLUE}💾 Création d'une sauvegarde du déploiement...${NC}"
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_payment-service.zip"
zip -r "$BACKUP_FILE" . -x "node_modules/*" ".serverless/*" ".dynamodb/*" > /dev/null

echo -e "${GREEN}✅ Sauvegarde créée: $BACKUP_FILE${NC}"

# Commit et push si git est disponible
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo -e "${BLUE}🔄 Commit et push des changements...${NC}"
    git add .
    git commit -m "✨ [FEAT] Déploiement du service de paiement unifié (env: $ENV)"
    git push origin master || git push origin main || echo -e "${YELLOW}⚠️  Impossible de push les changements.${NC}"
fi

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║  ${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS                            ${BLUE}║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
