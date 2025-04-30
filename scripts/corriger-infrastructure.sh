#!/bin/bash

# Script pour corriger les incohérences dans l'infrastructure FloDrama
# Ce script corrige les problèmes identifiés et supprime les références à Vercel

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Correction des incohérences dans l'infrastructure FloDrama ===${NC}"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Fonction pour vérifier si une commande a réussi
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# 1. Correction de la distribution CloudFront principale
echo -e "${YELLOW}1. Correction de la distribution CloudFront principale (E5XC74WR62W9Z)...${NC}"
echo -e "   Suppression de l'origine Vercel et redirection vers S3"

# Cette opération nécessite une intervention manuelle dans la console AWS
echo -e "${YELLOW}   Cette opération doit être effectuée manuellement dans la console AWS :${NC}"
echo -e "   1. Accédez à la console CloudFront"
echo -e "   2. Sélectionnez la distribution E5XC74WR62W9Z"
echo -e "   3. Modifiez les origines pour supprimer 'VercelOrigin'"
echo -e "   4. Modifiez le comportement par défaut pour utiliser 'S3-flodrama-prod' comme origine"

# 2. Vérification et correction du bucket S3 flodrama-assets
echo -e "\n${YELLOW}2. Vérification et correction du bucket S3 flodrama-assets...${NC}"

# Vérifier si le bucket est vide
OBJECTS_COUNT=$(aws s3 ls s3://flodrama-assets --recursive --summarize | grep "Total Objects" | awk '{print $3}')
if [ "$OBJECTS_COUNT" -eq "0" ]; then
    echo -e "   Le bucket flodrama-assets est vide. Configuration du transfert des assets..."
    
    # Créer un dossier temporaire pour les assets
    mkdir -p /tmp/flodrama-assets
    
    # Copier les assets locaux vers le bucket S3
    echo -e "   Copie des assets locaux vers le bucket S3..."
    aws s3 cp /Users/floriace/FLO_DRAMA/FloDrama/assets/ s3://flodrama-assets/ --recursive
    check_success "Copie des assets vers S3"
fi

# 3. Consolidation des buckets d'images
echo -e "\n${YELLOW}3. Consolidation des buckets d'images...${NC}"

# Vérifier le contenu du bucket images.flodrama.com
echo -e "   Vérification du bucket images.flodrama.com..."
aws s3 ls s3://images.flodrama.com --recursive

# Copier les placeholders vers le bucket flodrama-assets si nécessaire
echo -e "   Copie des placeholders vers le bucket flodrama-assets..."
aws s3 cp s3://images.flodrama.com/ s3://flodrama-assets/ --recursive
check_success "Copie des placeholders"

# 4. Mise à jour de la configuration d'images dans le code
echo -e "\n${YELLOW}4. Mise à jour de la configuration d'images dans le code...${NC}"

# Chemin du fichier de configuration
CONFIG_FILE="/Users/floriace/FLO_DRAMA/FloDrama/src/config/imageSystemConfig.js"

# Vérifier si le fichier existe
if [ -f "$CONFIG_FILE" ]; then
    echo -e "   Mise à jour du fichier de configuration des images..."
    
    # Créer une sauvegarde du fichier
    cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"
    
    # Mettre à jour la configuration pour utiliser le bucket flodrama-assets
    sed -i '' 's|d1323ouxr1qbdp.cloudfront.net|d11nnqvjfooahr.cloudfront.net|g' "$CONFIG_FILE"
    check_success "Mise à jour de la configuration des images"
else
    echo -e "${RED}   Le fichier de configuration des images n'existe pas.${NC}"
fi

# 5. Nettoyage des user pools Cognito redondants
echo -e "\n${YELLOW}5. Nettoyage des user pools Cognito redondants...${NC}"
echo -e "   Cette opération doit être effectuée manuellement dans la console AWS :"
echo -e "   1. Accédez à la console Cognito"
echo -e "   2. Vérifiez les user pools existants"
echo -e "   3. Conservez uniquement le pool principal (us-east-1_6xeDOhb9h)"
echo -e "   4. Supprimez les pools redondants après avoir migré les utilisateurs si nécessaire"

# 6. Mise à jour du fichier de configuration AWS
echo -e "\n${YELLOW}6. Mise à jour du fichier de configuration AWS...${NC}"

# Chemin du fichier de configuration AWS
AWS_CONFIG_FILE="/Users/floriace/FLO_DRAMA/FloDrama/src/config/aws-config.js"

# Vérifier si le fichier existe
if [ -f "$AWS_CONFIG_FILE" ]; then
    echo -e "   Mise à jour du fichier de configuration AWS..."
    
    # Créer une sauvegarde du fichier
    cp "$AWS_CONFIG_FILE" "${AWS_CONFIG_FILE}.bak"
    
    # Mettre à jour la configuration pour utiliser les bons services
    sed -i '' 's|useLocalMode: true|useLocalMode: false|g' "$AWS_CONFIG_FILE"
    check_success "Mise à jour de la configuration AWS"
else
    echo -e "${RED}   Le fichier de configuration AWS n'existe pas.${NC}"
fi

# 7. Commit et push des modifications
echo -e "\n${YELLOW}7. Commit et push des modifications...${NC}"

# Ajouter les fichiers modifiés
git add "$CONFIG_FILE" "$AWS_CONFIG_FILE"
check_success "Ajout des fichiers modifiés"

# Commit des modifications
git commit -m "🔧 [FIX] Correction des incohérences dans l'infrastructure AWS"
check_success "Commit des modifications"

# Push des modifications
git push origin gh-pages
check_success "Push des modifications"

echo -e "\n${GREEN}Correction des incohérences terminée !${NC}"
echo -e "${BLUE}=== Fin de la correction ===${NC}"

echo -e "\n${YELLOW}Actions manuelles requises :${NC}"
echo -e "1. Supprimer l'origine Vercel de la distribution CloudFront E5XC74WR62W9Z"
echo -e "2. Nettoyer les user pools Cognito redondants"
echo -e "3. Vérifier que les assets sont correctement accessibles via CloudFront"
