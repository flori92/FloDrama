#!/bin/bash

# Script pour synchroniser les assets FloDrama avec AWS S3 et invalider le cache CloudFront
# Ce script est un wrapper pour le script Node.js sync-assets.js

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Synchronisation des assets FloDrama avec AWS ===${NC}"
echo -e "${BLUE}Date : $(date)${NC}"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer d'abord.${NC}"
    echo -e "${YELLOW}Installation avec Homebrew : brew install awscli${NC}"
    echo -e "${YELLOW}Puis configurez avec : aws configure${NC}"
    exit 1
fi

# Vérifier si les identifiants AWS sont configurés
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Les identifiants AWS ne sont pas configurés correctement.${NC}"
    echo -e "${YELLOW}Veuillez exécuter : aws configure${NC}"
    exit 1
fi

# Chemin du script Node.js
SCRIPT_DIR="$(dirname "$0")"
SCRIPT_PATH="$SCRIPT_DIR/sync-assets.js"

# Vérifier si le script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}Le script sync-assets.js n'existe pas dans le répertoire des scripts.${NC}"
    exit 1
fi

# Vérifier si package.json existe
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    echo -e "${YELLOW}Le fichier package.json n'existe pas. Création...${NC}"
    cat > "$SCRIPT_DIR/package.json" << EOF
{
  "name": "flodrama-scripts",
  "version": "1.0.0",
  "description": "Scripts utilitaires pour FloDrama",
  "type": "module",
  "scripts": {
    "build-bundle": "node build-bundle.js",
    "sync-assets": "node sync-assets.js",
    "sync-assets-shell": "./sync-assets.sh"
  },
  "author": "FloDrama",
  "private": true
}
EOF
    echo -e "${GREEN}✓ Fichier package.json créé${NC}"
fi

# Options disponibles
echo -e "\n${YELLOW}Options disponibles :${NC}"
echo -e "1. Exécuter en mode simulation (dry run)"
echo -e "2. Exécuter en mode production"
echo -e "3. Générer le bundle.js"
echo -e "4. Quitter"

# Demander à l'utilisateur de choisir une option
read -p "Choisissez une option (1-4) : " option

case $option in
    1)
        echo -e "\n${YELLOW}Exécution en mode simulation...${NC}"
        # Modifier temporairement le script pour activer le mode dry run
        sed -i.bak 's/dryRun: false/dryRun: true/g' "$SCRIPT_PATH"
        cd "$SCRIPT_DIR" && node sync-assets.js
        # Restaurer le script original
        mv "${SCRIPT_PATH}.bak" "$SCRIPT_PATH"
        ;;
    2)
        echo -e "\n${YELLOW}Exécution en mode production...${NC}"
        cd "$SCRIPT_DIR" && node sync-assets.js
        ;;
    3)
        echo -e "\n${YELLOW}Génération du bundle.js...${NC}"
        cd "$SCRIPT_DIR" && node build-bundle.js
        echo -e "\n${GREEN}✓ Vérification du bundle.js généré${NC}"
        if [ -f "$SCRIPT_DIR/../Frontend/dist/bundle.js" ]; then
            echo -e "${GREEN}✓ bundle.js généré avec succès${NC}"
            # Synchroniser avec S3 si l'utilisateur le souhaite
            read -p "Voulez-vous synchroniser le bundle.js avec S3 ? (o/n) : " sync_bundle
            if [[ "$sync_bundle" == "o" || "$sync_bundle" == "O" || "$sync_bundle" == "oui" ]]; then
                aws s3 cp "$SCRIPT_DIR/../Frontend/dist/bundle.js" "s3://flodrama-assets/js/bundle.js" --acl public-read
                echo -e "${GREEN}✓ bundle.js synchronisé avec S3${NC}"
                
                # Invalider le cache CloudFront
                aws cloudfront create-invalidation --distribution-id E275AW2L6UVK2A --paths "/js/bundle.js"
                echo -e "${GREEN}✓ Cache CloudFront invalidé pour bundle.js${NC}"
            fi
        else
            echo -e "${RED}✗ Erreur lors de la génération du bundle.js${NC}"
        fi
        ;;
    4)
        echo -e "\n${YELLOW}Opération annulée.${NC}"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Option invalide.${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}=== Fin de la synchronisation ===${NC}"

# Vérification finale
echo -e "\n${YELLOW}Vérification des assets :${NC}"
echo -e "1. Vérifier l'accès à l'asset logo.svg via CloudFront :"
echo -e "   curl -I https://d11nnqvjfooahr.cloudfront.net/assets/logo.svg"
echo -e "2. Vérifier l'accès à l'asset logo.svg via S3 :"
echo -e "   curl -I https://flodrama-assets.s3.amazonaws.com/assets/logo.svg"
echo -e "3. Vérifier l'accès au fichier status.json :"
echo -e "   curl -I https://d11nnqvjfooahr.cloudfront.net/status.json"

echo -e "\n${GREEN}Pour appliquer les modifications à l'application, accédez à :${NC}"
echo -e "https://flodrama.com"

# Rendre le script exécutable
chmod +x "$0"
