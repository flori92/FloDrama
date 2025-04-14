#!/bin/bash
# Script pour déployer le contenu authentique de FloDrama sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement du contenu authentique de FloDrama sur Vercel ===${NC}"

# Vérifier si le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier dist n'existe pas dans le répertoire courant${NC}"
    exit 1
fi

# Créer un dossier temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Création d'un dossier temporaire pour le déploiement: $TEMP_DIR${NC}"

# Copier le contenu du dossier dist dans le dossier temporaire
echo -e "${YELLOW}Copie du contenu authentique de FloDrama...${NC}"
cp -r dist/* $TEMP_DIR/

# Créer un fichier vercel.json minimal dans le dossier temporaire
cat > $TEMP_DIR/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "routes": [
    { "src": "/assets/(.*)", "dest": "/assets/\$1" },
    { "src": "/static/(.*)", "dest": "/static/\$1" },
    { "src": "/data/(.*)", "dest": "/data/\$1" },
    { "src": "/fallback/(.*)", "dest": "/fallback/\$1" },
    { "src": "/favicon.ico", "dest": "/favicon.ico" },
    { "src": "/favicon.svg", "dest": "/favicon.svg" },
    { "src": "/logo(.*).png", "dest": "/logo\$1.png" },
    { "src": "/logo(.*).svg", "dest": "/logo\$1.svg" },
    { "src": "/flodrama-logo(.*).svg", "dest": "/flodrama-logo\$1.svg" },
    { "src": "/manifest.json", "dest": "/manifest.json" },
    { "src": "/service-worker.js", "dest": "/service-worker.js" },
    { "src": "/theme.css", "dest": "/theme.css" },
    { "src": "/animations.js", "dest": "/animations.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF

# Se déplacer dans le dossier temporaire
cd $TEMP_DIR

# Déployer directement depuis le dossier temporaire
echo -e "${YELLOW}Déploiement du contenu authentique de FloDrama...${NC}"
TIMESTAMP=$(date +%s)
PROJECT_NAME="flodrama-authentic-$TIMESTAMP"
vercel --name $PROJECT_NAME --prod

# Récupérer l'URL du nouveau déploiement
NEW_URL=$(vercel ls --prod | grep $PROJECT_NAME | awk '{print $2}')

# Configurer l'URL principale
echo -e "${YELLOW}Configuration de l'URL principale...${NC}"
vercel alias set $PROJECT_NAME flodrama.vercel.app

# Retourner au dossier d'origine
cd - > /dev/null

# Nettoyer le dossier temporaire
echo -e "${YELLOW}Nettoyage du dossier temporaire...${NC}"
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Déploiement du contenu authentique de FloDrama terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Veuillez vérifier que le contenu authentique est bien visible.${NC}"
