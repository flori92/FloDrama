#!/bin/bash
# Script pour déployer FloDrama avec assets locaux
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement de FloDrama avec assets locaux ===${NC}"

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

# Créer un fichier index.html modifié qui utilise des assets locaux
cat > $TEMP_DIR/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Plateforme de Streaming</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/index-XTtdyp1V.css">
  <link rel="stylesheet" href="/assets/player-j_Efw4XN.css">
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
        await loadScript('/assets/react-vendor-BLmBcftk.js');
        await loadScript('/assets/animation-vendor-DtIvvljf.js');
        await loadScript('/assets/player-B3y77Ftp.js');
        await loadScript('/assets/index-CDjFv9qA.js');
        
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
        <img src="/flodrama-logo-animated.svg" alt="FloDrama" width="200" height="200">
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

# Se déplacer dans le dossier temporaire
cd $TEMP_DIR

# Déployer directement depuis le dossier temporaire
echo -e "${YELLOW}Déploiement de FloDrama avec assets locaux...${NC}"
vercel --prod

# Attendre que le déploiement soit terminé
echo -e "${YELLOW}Attente de la fin du déploiement...${NC}"
sleep 10

# Récupérer l'URL du déploiement
DEPLOYMENT_URL=$(vercel ls --prod | head -n 4 | tail -n 1 | awk '{print $2}')
echo -e "${GREEN}URL du déploiement: $DEPLOYMENT_URL${NC}"

# Configurer l'URL principale
if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${YELLOW}Configuration de l'URL principale...${NC}"
    vercel alias set "$DEPLOYMENT_URL" flodrama.vercel.app
else
    echo -e "${RED}Impossible de récupérer l'URL du déploiement${NC}"
    echo -e "${YELLOW}Veuillez configurer manuellement l'alias avec:${NC}"
    echo -e "${GREEN}vercel alias set <URL-DU-DEPLOIEMENT> flodrama.vercel.app${NC}"
fi

# Retourner au dossier d'origine
cd - > /dev/null

# Nettoyer le dossier temporaire
echo -e "${YELLOW}Nettoyage du dossier temporaire...${NC}"
rm -rf $TEMP_DIR

echo -e "${GREEN}=== Déploiement de FloDrama terminé ===${NC}"
echo -e "${YELLOW}Votre application est maintenant disponible à l'adresse: https://flodrama.vercel.app${NC}"
echo -e "${YELLOW}Veuillez vérifier que tous les assets sont correctement chargés.${NC}"
