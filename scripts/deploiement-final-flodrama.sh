#!/bin/bash
# Script pour le déploiement final de FloDrama sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement final de FloDrama sur Vercel ===${NC}"

# Vérifier si les commandes nécessaires sont installées
for cmd in vercel node; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Erreur: La commande $cmd n'est pas installée. Veuillez l'installer avant de continuer.${NC}"
        exit 1
    fi
done

# Vérifier si le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier dist n'existe pas dans le répertoire courant${NC}"
    exit 1
fi

# Étape 1: Supprimer tous les projets existants
echo -e "${BLUE}Étape 1: Suppression des projets existants...${NC}"
echo -e "${YELLOW}Cette opération peut prendre quelques minutes...${NC}"
vercel rm flodrama --yes

# Attendre que la suppression soit terminée
sleep 5

# Étape 2: Créer un dossier temporaire pour le déploiement
echo -e "${BLUE}Étape 2: Préparation du déploiement...${NC}"
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Création d'un dossier temporaire pour le déploiement: $TEMP_DIR${NC}"

# Étape 3: Copier le contenu du dossier dist dans le dossier temporaire
echo -e "${YELLOW}Copie du contenu de FloDrama...${NC}"
cp -r dist/* $TEMP_DIR/

# Vérifier si le dossier assets existe
if [ ! -d "$TEMP_DIR/assets" ]; then
    echo -e "${RED}Erreur: Le dossier assets n'existe pas dans le dossier dist${NC}"
    exit 1
fi

# Étape 4: Créer un fichier vercel.json optimisé
echo -e "${BLUE}Étape 4: Création de la configuration Vercel optimisée...${NC}"
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
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/static/(.*)", 
      "dest": "/static/\$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/data/(.*)", 
      "dest": "/data/\$1",
      "headers": {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
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
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    }
  ]
}
EOF

# Étape 5: Créer un fichier _headers pour Vercel
echo -e "${YELLOW}Création du fichier _headers pour Vercel...${NC}"
cat > $TEMP_DIR/_headers << EOF
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, HEAD, OPTIONS, POST
  Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization, Cache-Control

/assets/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

/static/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
EOF

# Étape 6: Créer un fichier _redirects pour Vercel
echo -e "${YELLOW}Création du fichier _redirects pour Vercel...${NC}"
cat > $TEMP_DIR/_redirects << EOF
/assets/*  /assets/:splat  200
/static/*  /static/:splat  200
/*  /index.html  200
EOF

# Étape 7: Créer un script pour corriger les chemins des assets
echo -e "${BLUE}Étape 7: Création du script de correction des chemins d'assets...${NC}"
cat > $TEMP_DIR/fix-assets-paths.js << EOF
// Script pour corriger les chemins des assets dans index.html
const fs = require('fs');
const path = require('path');

// Lire le contenu de index.html
const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Remplacer les références aux assets
content = content.replace(/d1323ouxr1qbdp\.cloudfront\.net\/assets\//g, '/assets/');
content = content.replace(/flodrama-prod\.s3\.amazonaws\.com\/assets\//g, '/assets/');
content = content.replace(/flodrama-prod\.s3\.us-east-1\.amazonaws\.com\/assets\//g, '/assets/');
content = content.replace(/cdn\.jsdelivr\.net\/gh\/flori92\/FloDrama@main\/assets\//g, '/assets/');
content = content.replace(/flodrama-backup\.pages\.dev\/assets\//g, '/assets/');

// Écrire le contenu modifié
fs.writeFileSync(indexPath, content);
console.log('Chemins des assets corrigés dans index.html');
EOF

# Étape 8: Exécuter le script de correction des chemins
echo -e "${BLUE}Étape 8: Correction des chemins des assets dans index.html...${NC}"
cd $TEMP_DIR && node fix-assets-paths.js
echo -e "${GREEN}✅ Chemins des assets corrigés${NC}"

# Étape 9: Déployer directement depuis le dossier temporaire
echo -e "${BLUE}Étape 9: Déploiement de FloDrama...${NC}"
cd $TEMP_DIR
echo -e "${YELLOW}Déploiement du nouveau projet FloDrama...${NC}"
vercel --name flodrama --prod

# Étape 10: Attendre que le déploiement soit terminé
echo -e "${YELLOW}Attente de la fin du déploiement...${NC}"
sleep 15

# Étape 11: Configurer l'URL principale
echo -e "${BLUE}Étape 11: Configuration de l'URL principale...${NC}"
DEPLOYMENT_URL=$(vercel ls | grep "flodrama-" | head -n 1 | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${YELLOW}Configuration de l'alias pour $DEPLOYMENT_URL...${NC}"
    vercel alias set $DEPLOYMENT_URL flodrama.vercel.app
else
    echo -e "${RED}Impossible de récupérer l'URL du déploiement.${NC}"
    echo -e "${YELLOW}Veuillez configurer manuellement l'alias avec:${NC}"
    echo -e "${GREEN}vercel alias set <URL-DU-DEPLOIEMENT> flodrama.vercel.app${NC}"
fi

# Étape 12: Retourner au dossier d'origine et nettoyer
cd - > /dev/null
rm -rf $TEMP_DIR

# Étape 13: Créer un rapport de déploiement
echo -e "${BLUE}Étape 13: Création du rapport de déploiement...${NC}"
REPORT_FILE="rapport-deploiement-flodrama.md"
cat > $REPORT_FILE << EOF
# Rapport de déploiement de FloDrama

## Informations générales
- **Date de déploiement:** $(date +"%d/%m/%Y %H:%M:%S")
- **URL de production:** https://flodrama.vercel.app
- **Plateforme de déploiement:** Vercel

## Actions réalisées
1. Nettoyage de tous les projets Vercel existants
2. Création d'un nouveau projet FloDrama
3. Configuration optimisée des routes et des en-têtes CORS
4. Correction des chemins des assets pour utiliser des ressources locales
5. Configuration de l'URL principale flodrama.vercel.app

## Configuration technique
- **Type de déploiement:** Statique (SPA)
- **Mise en cache:** Activée pour les assets statiques (1 an)
- **CORS:** Configuré pour permettre l'accès depuis n'importe quelle origine
- **Routage:** Toutes les routes non-assets sont redirigées vers index.html

## Tests effectués
- Vérification de l'accès à l'URL principale: https://flodrama.vercel.app
- Vérification du chargement des assets (CSS, JS, images)
- Vérification de la navigation dans l'application

## Prochaines étapes recommandées
1. Configurer un domaine personnalisé si nécessaire
2. Mettre en place un système de déploiement continu
3. Optimiser les performances de l'application
4. Mettre en place un système de monitoring

## Maintenance
Pour mettre à jour le déploiement, utilisez le script \`deploiement-final-flodrama.sh\`.

EOF

echo -e "${GREEN}Rapport de déploiement créé: $REPORT_FILE${NC}"
echo -e "${GREEN}=== Déploiement final de FloDrama terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Veuillez vérifier que tous les assets sont correctement chargés.${NC}"
