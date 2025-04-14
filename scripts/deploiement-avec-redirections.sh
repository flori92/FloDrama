#!/bin/bash
# Script pour déployer FloDrama avec redirections pour les assets
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement de FloDrama avec redirections pour les assets ===${NC}"

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

# Étape 1: Supprimer le projet existant
echo -e "${BLUE}Étape 1: Suppression du projet existant...${NC}"
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

# Étape 4: Identifier les fichiers JS et CSS réels
echo -e "${BLUE}Étape 4: Identification des fichiers JS et CSS réels...${NC}"
INDEX_JS=$(find $TEMP_DIR/assets -name "index-*.js" | head -n 1 | xargs basename)
INDEX_CSS=$(find $TEMP_DIR/assets -name "index-*.css" | head -n 1 | xargs basename)
PLAYER_JS=$(find $TEMP_DIR/assets -name "player-*.js" | head -n 1 | xargs basename)
PLAYER_CSS=$(find $TEMP_DIR/assets -name "player-*.css" | head -n 1 | xargs basename)
REACT_VENDOR_JS=$(find $TEMP_DIR/assets -name "react-vendor-*.js" | head -n 1 | xargs basename)
ANIMATION_VENDOR_JS=$(find $TEMP_DIR/assets -name "animation-vendor-*.js" | head -n 1 | xargs basename)

echo -e "${YELLOW}Fichiers identifiés:${NC}"
echo -e "INDEX_JS: $INDEX_JS"
echo -e "INDEX_CSS: $INDEX_CSS"
echo -e "PLAYER_JS: $PLAYER_JS"
echo -e "PLAYER_CSS: $PLAYER_CSS"
echo -e "REACT_VENDOR_JS: $REACT_VENDOR_JS"
echo -e "ANIMATION_VENDOR_JS: $ANIMATION_VENDOR_JS"

# Étape 5: Créer un fichier vercel.json optimisé avec redirections
echo -e "${BLUE}Étape 5: Création de la configuration Vercel optimisée avec redirections...${NC}"
cat > $TEMP_DIR/vercel.json << EOF
{
  "version": 2,
  "public": true,
  "routes": [
    { 
      "src": "/assets/index-DB2rMoq0.js", 
      "dest": "/assets/$INDEX_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/index-FzMy9jnZ.js", 
      "dest": "/assets/$INDEX_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/index-tgB4rCs7.js", 
      "dest": "/assets/$INDEX_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/index.js", 
      "dest": "/assets/$INDEX_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/player-B3y77Ftp.js", 
      "dest": "/assets/$PLAYER_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/player-j_Efw4XN.css", 
      "dest": "/assets/$PLAYER_CSS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/index-XTtdyp1V.css", 
      "dest": "/assets/$INDEX_CSS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/index.css", 
      "dest": "/assets/$INDEX_CSS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/theme.css", 
      "dest": "/assets/$INDEX_CSS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/react-vendor-BLmBcftk.js", 
      "dest": "/assets/$REACT_VENDOR_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    { 
      "src": "/assets/animation-vendor-DtIvvljf.js", 
      "dest": "/assets/$ANIMATION_VENDOR_JS",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
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
    { "src": "/theme.css", "dest": "/assets/$INDEX_CSS" },
    { "src": "/animations.js", "dest": "/assets/$ANIMATION_VENDOR_JS" },
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

# Étape 6: Créer un fichier index.html modifié qui charge directement les bons fichiers
echo -e "${BLUE}Étape 6: Création d'un index.html optimisé...${NC}"
cat > $TEMP_DIR/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Plateforme de Streaming</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/$INDEX_CSS">
  <link rel="stylesheet" href="/assets/$PLAYER_CSS">
  <script>
    // Configuration pour charger les assets localement
    window.FLODRAMA_CONFIG = {
      ASSETS_BASE_URL: '/assets/',
      API_BASE_URL: 'https://api.flodrama.com',
      USE_LOCAL_ASSETS: true
    };
    
    // Fonction pour charger les scripts
    function loadScript(src, async = true, defer = true) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = async;
        script.defer = defer;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // Fonction pour charger les styles
    function loadStylesheet(href) {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    }
    
    // Chargement des scripts principaux
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        // Charger les scripts dans l'ordre
        await loadScript('/assets/$REACT_VENDOR_JS');
        await loadScript('/assets/$ANIMATION_VENDOR_JS');
        await loadScript('/assets/$PLAYER_JS');
        await loadScript('/assets/$INDEX_JS');
        
        console.log('Tous les scripts ont été chargés avec succès');
      } catch (error) {
        console.error('Erreur lors du chargement des scripts:', error);
      }
    });
  </script>
</head>
<body>
  <div id="root">
    <div class="loading-container">
      <div class="loading-logo">
        <img src="/assets/logo-flodrama.svg" alt="FloDrama" width="200" height="200" onerror="this.src='/assets/logo.png'">
      </div>
      <div class="loading-text">Chargement de FloDrama...</div>
    </div>
  </div>
  
  <style>
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .loading-logo {
      margin-bottom: 2rem;
      animation: pulse 1.5s infinite ease-in-out;
    }
    
    .loading-text {
      font-size: 1.5rem;
      letter-spacing: 1px;
    }
    
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.7; }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.7; }
    }
  </style>
</body>
</html>
EOF

# Étape 7: Créer un fichier _redirects pour Vercel
echo -e "${YELLOW}Création du fichier _redirects pour Vercel...${NC}"
cat > $TEMP_DIR/_redirects << EOF
/assets/index-DB2rMoq0.js  /assets/$INDEX_JS  200
/assets/index-FzMy9jnZ.js  /assets/$INDEX_JS  200
/assets/index-tgB4rCs7.js  /assets/$INDEX_JS  200
/assets/index.js  /assets/$INDEX_JS  200
/assets/player-B3y77Ftp.js  /assets/$PLAYER_JS  200
/assets/player-j_Efw4XN.css  /assets/$PLAYER_CSS  200
/assets/index-XTtdyp1V.css  /assets/$INDEX_CSS  200
/assets/index.css  /assets/$INDEX_CSS  200
/assets/theme.css  /assets/$INDEX_CSS  200
/assets/react-vendor-BLmBcftk.js  /assets/$REACT_VENDOR_JS  200
/assets/animation-vendor-DtIvvljf.js  /assets/$ANIMATION_VENDOR_JS  200
/theme.css  /assets/$INDEX_CSS  200
/animations.js  /assets/$ANIMATION_VENDOR_JS  200
/assets/*  /assets/:splat  200
/static/*  /static/:splat  200
/*  /index.html  200
EOF

# Étape 8: Créer un fichier _headers pour Vercel
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

echo -e "${GREEN}=== Déploiement de FloDrama avec redirections terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Veuillez vérifier que tous les assets sont correctement chargés.${NC}"
