#!/bin/bash
# Script pour déployer FloDrama avec tous les assets correctement configurés
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement de FloDrama avec tous les assets ===${NC}"

# Vérifier si le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier dist n'existe pas dans le répertoire courant${NC}"
    exit 1
fi

# Créer un dossier temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Création d'un dossier temporaire pour le déploiement: $TEMP_DIR${NC}"

# Copier le contenu du dossier dist dans le dossier temporaire
echo -e "${YELLOW}Copie du contenu de FloDrama...${NC}"
cp -r dist/* $TEMP_DIR/

# Vérifier si le dossier assets existe
if [ ! -d "$TEMP_DIR/assets" ]; then
    echo -e "${RED}Erreur: Le dossier assets n'existe pas dans le dossier dist${NC}"
    exit 1
fi

# Créer un fichier vercel.json optimisé dans le dossier temporaire
cat > $TEMP_DIR/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "routes": [
    { 
      "src": "/assets/(.*)", 
      "dest": "/assets/\$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/static/(.*)", 
      "dest": "/static/\$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/data/(.*)", 
      "dest": "/data/\$1",
      "headers": {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { "src": "/favicon.ico", "dest": "/favicon.ico" },
    { "src": "/favicon.svg", "dest": "/favicon.svg" },
    { "src": "/logo(.*).png", "dest": "/logo\$1.png" },
    { "src": "/logo(.*).svg", "dest": "/logo\$1.svg" },
    { "src": "/flodrama-logo(.*).svg", "dest": "/flodrama-logo\$1.svg" },
    { "src": "/manifest.json", "dest": "/manifest.json" },
    { "src": "/service-worker.js", "dest": "/service-worker.js" },
    { "src": "/theme.css", "dest": "/theme.css" },
    { "src": "/animations.js", "dest": "/animations.js" },
    { 
      "src": "/(.*)", 
      "dest": "/index.html",
      "headers": {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, HEAD, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control" }
      ]
    }
  ]
}
EOF

# Créer un fichier _headers pour Vercel
cat > $TEMP_DIR/_headers << EOF
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, HEAD, OPTIONS
  Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization, Cache-Control

/assets/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

/static/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
EOF

# Se déplacer dans le dossier temporaire
cd $TEMP_DIR

# Déployer directement depuis le dossier temporaire
echo -e "${YELLOW}Déploiement de FloDrama avec tous les assets...${NC}"
TIMESTAMP=$(date +%s)
PROJECT_NAME="flodrama-complete-$TIMESTAMP"
vercel --name $PROJECT_NAME --prod

# Configurer l'URL principale
echo -e "${YELLOW}Configuration de l'URL principale...${NC}"
sleep 5
vercel alias set $PROJECT_NAME flodrama.vercel.app

# Retourner au dossier d'origine
cd - > /dev/null

# Nettoyer le dossier temporaire
echo -e "${YELLOW}Nettoyage du dossier temporaire...${NC}"
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Déploiement de FloDrama terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Veuillez vérifier que tous les assets sont correctement chargés.${NC}"
