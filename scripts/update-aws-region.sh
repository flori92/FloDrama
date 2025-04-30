#!/bin/bash
# Script pour mettre à jour la configuration de région AWS dans le front-end FloDrama
# Créé le 26-03-2025

set -e

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="flodrama-app-bucket-us-east1-us-east1"
DISTRIBUTION_ID="E5XC74WR62W9Z"
REGION="us-east-1"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLEU}[$(date +"%H:%M:%S")] Mise à jour de la configuration de région AWS pour FloDrama${NC}"
echo "===================================="

# Vérification des prérequis
if ! command -v aws &> /dev/null; then
    echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: AWS CLI n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier les identifiants AWS
echo -e "${BLEU}[$(date +"%H:%M:%S")] Vérification des identifiants AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: Identifiants AWS non configurés ou invalides. Veuillez exécuter 'aws configure'.${NC}"
    exit 1
fi
echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: Identifiants AWS valides.${NC}"

# Copier le fichier .env.production vers S3
echo -e "${BLEU}[$(date +"%H:%M:%S")] Copie du fichier .env.production vers S3...${NC}"
aws s3 cp ./Frontend/.env.production "s3://${BUCKET_NAME}/.env.production" --region "${REGION}"
echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: Fichier .env.production copié vers S3.${NC}"

# Invalidation du cache CloudFront
echo -e "${BLEU}[$(date +"%H:%M:%S")] Invalidation du cache CloudFront...${NC}"
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" --region "${REGION}"
echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: Invalidation du cache CloudFront lancée.${NC}"

echo "===================================="
echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: Configuration de région AWS mise à jour avec succès !${NC}"
echo -e "${JAUNE}[$(date +"%H:%M:%S")] NOTE: La propagation des changements peut prendre quelques minutes.${NC}"
echo "===================================="
