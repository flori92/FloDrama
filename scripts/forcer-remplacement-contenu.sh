#!/bin/bash
# Script pour forcer le remplacement du contenu sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Remplacement forcé du contenu sur Vercel ===${NC}"

# Vérifier si le fichier index.html existe
if [ ! -f "index.html" ]; then
    echo -e "${RED}Erreur: Le fichier index.html n'existe pas dans le répertoire courant${NC}"
    exit 1
fi

# Créer un dossier temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Création d'un dossier temporaire pour le déploiement: $TEMP_DIR${NC}"

# Copier les fichiers nécessaires dans le dossier temporaire
cp index.html $TEMP_DIR/
cp -r public $TEMP_DIR/ 2>/dev/null || mkdir -p $TEMP_DIR/public
cp -r static $TEMP_DIR/ 2>/dev/null || mkdir -p $TEMP_DIR/static
cp -r assets $TEMP_DIR/ 2>/dev/null || mkdir -p $TEMP_DIR/assets

# Créer un fichier vercel.json minimal dans le dossier temporaire
cat > $TEMP_DIR/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF

# Ajouter un timestamp pour forcer le déploiement
TIMESTAMP=$(date +%s)
echo "FORCE_UPDATE_$TIMESTAMP" > $TEMP_DIR/.force-update

# Se déplacer dans le dossier temporaire
cd $TEMP_DIR

# Déployer directement depuis le dossier temporaire
echo -e "${YELLOW}Déploiement direct depuis le dossier temporaire...${NC}"
vercel --prod --force

# Retourner au dossier d'origine
cd - > /dev/null

# Nettoyer le dossier temporaire
echo -e "${YELLOW}Nettoyage du dossier temporaire...${NC}"
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Processus de remplacement forcé terminé ===${NC}"
echo -e "${YELLOW}Vérifiez le résultat en visitant: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Note: Il peut y avoir un délai avant que les changements ne soient visibles en raison du CDN de Vercel${NC}"
