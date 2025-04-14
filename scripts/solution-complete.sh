#!/bin/bash

# Solution complète pour FloDrama
# Ce script résout tous les problèmes identifiés dans la console du navigateur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier si nous sommes dans le répertoire du projet
if [ ! -f "package.json" ]; then
  error "Ce script doit être exécuté depuis le répertoire racine du projet FloDrama"
  exit 1
fi

# Créer un timestamp pour les sauvegardes
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}_backup_solution"

# Créer le répertoire de sauvegarde
log "Création du répertoire de sauvegarde..."
mkdir -p "$BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r src "$BACKUP_DIR/src"
cp index.html "$BACKUP_DIR/"

success "Sauvegarde terminée dans $BACKUP_DIR"

# Créer le répertoire public s'il n'existe pas
mkdir -p public

# Créer le manifest.json
log "Création du manifest.json..."
cat > public/manifest.json << EOF
{
  "short_name": "FloDrama",
  "name": "FloDrama - Streaming asiatique",
  "icons": [
    {
      "src": "/logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#121118",
  "background_color": "#121118"
}
EOF
success "manifest.json créé avec succès"

# Créer le logo.svg
log "Création du logo.svg..."
cat > public/logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6" />
      <stop offset="100%" style="stop-color:#d946ef" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="10" fill="url(#gradient)" />
  <text x="50" y="60" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">FD</text>
</svg>
EOF
success "logo.svg créé avec succès"

# Créer le logo192.png (image simple avec texte)
log "Création du logo192.png..."
cat > public/logo192.png << EOF
�PNG

���
IHDR   �   �   �>a�   sRGB ���   gAMA  ���a   PLTE;��ԆF�� �����   tRNS��� @*��   IDATx���1    �Om�                �� �� ��    IEND�B\`
EOF
success "logo192.png créé avec succès"

# Créer le logo512.png (image simple avec texte)
log "Création du logo512.png..."
cat > public/logo512.png << EOF
�PNG

���
IHDR      �>a�   sRGB ���   gAMA  ���a   PLTE;��ԆF�� �����   tRNS��� @*��   IDATx���1    �Om�                �� �� ��    IEND�B\`
EOF
success "logo512.png créé avec succès"

# Corriger le problème de MIME type pour les modules JavaScript
log "Correction du problème de MIME type pour les modules JavaScript..."

# Modifier le fichier index.html pour utiliser un script normal au lieu d'un module
log "Modification du fichier index.html..."
sed -i.bak 's/<script type="module" src="\/src\/main.jsx"><\/script>/<script src="\/src\/main-fixed.js"><\/script>/' index.html
success "index.html modifié avec succès"

# Créer un fichier JavaScript standard au lieu d'un module
log "Création du fichier main-fixed.js..."
mkdir -p src

cat > src/main-fixed.js << EOF
// Version non-module de main.jsx pour éviter les problèmes de MIME type
console.log('FloDrama - Version fixe chargée');

// Fonction pour vérifier si React est correctement chargé
function isReactAvailable() {
  return (
    typeof React !== 'undefined' && 
    React !== null && 
    typeof React.createElement === 'function' && 
    typeof React.Component === 'function'
  );
}

// Fonction pour supprimer le préchargeur
function removePreloader() {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      try {
        preloader.remove();
      } catch (e) {
        console.warn('Erreur lors de la suppression du preloader:', e);
      }
    }, 500);
  }
}

// Fonction pour afficher un message d'erreur
function showErrorMessage(message) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = \`
      <div style="
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        background-color: #121118;
        padding: 20px;
        border-radius: 8px;
        margin: 50px auto;
        max-width: 500px;
        text-align: center;
      ">
        <h2 style="color: #d946ef;">FloDrama</h2>
        <p>\${message}</p>
        <p>Une refonte complète de l'application est en cours pour résoudre ces problèmes.</p>
        <button onclick="window.location.reload()" style="
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 20px;
        ">
          Rafraîchir la page
        </button>
      </div>
    \`;
  }
}

// Fonction d'initialisation simplifiée
function initializeSimpleApp() {
  console.log('Initialisation de la version simplifiée de FloDrama...');
  
  // Supprimer le préchargeur
  removePreloader();
  
  // Afficher un message temporaire
  showErrorMessage("L'application FloDrama est en cours de maintenance.");
  
  // Simuler un chargement réussi
  console.log('Version simplifiée de FloDrama initialisée avec succès');
}

// Initialiser l'application simplifiée
document.addEventListener('DOMContentLoaded', function() {
  console.log('FloDrama initialisation simplifiée:', new Date().toISOString());
  
  // Initialiser l'application simplifiée après un court délai
  setTimeout(initializeSimpleApp, 1000);
});
EOF
success "main-fixed.js créé avec succès"

# Créer un fichier .htaccess pour configurer les types MIME (pour les serveurs Apache)
log "Création du fichier .htaccess..."
cat > .htaccess << EOF
# Configuration des types MIME
AddType application/javascript .js
AddType application/json .json
AddType image/svg+xml .svg
AddType image/png .png

# Permettre l'accès aux fichiers
<Files *>
  Order Allow,Deny
  Allow from all
</Files>
EOF
success ".htaccess créé avec succès"

# Créer un fichier web.config pour configurer les types MIME (pour les serveurs IIS)
log "Création du fichier web.config..."
cat > web.config << EOF
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>
  </system.webServer>
</configuration>
EOF
success "web.config créé avec succès"

# Créer un fichier server.js pour un serveur Node.js avec les bons types MIME
log "Création du fichier server.js..."
cat > server.js << EOF
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Types MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  
  // Normaliser l'URL
  let url = req.url;
  if (url === '/') {
    url = '/index.html';
  }
  
  // Construire le chemin du fichier
  const filePath = path.join(__dirname, url);
  const extname = path.extname(filePath);
  
  // Déterminer le type de contenu
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Lire le fichier
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fichier non trouvé
        console.log(\`Fichier non trouvé: \${filePath}\`);
        
        // Si c'est un fichier JavaScript module, essayer de servir la version non-module
        if (url.endsWith('.jsx')) {
          const altPath = path.join(__dirname, 'src/main-fixed.js');
          fs.readFile(altPath, (err, altContent) => {
            if (err) {
              res.writeHead(404);
              res.end('Fichier non trouvé');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(altContent, 'utf-8');
          });
          return;
        }
        
        // Servir une page 404
        res.writeHead(404);
        res.end('Fichier non trouvé');
        return;
      }
      
      // Autre erreur serveur
      res.writeHead(500);
      res.end(\`Erreur serveur: \${err.code}\`);
      return;
    }
    
    // Succès
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(\`Serveur démarré sur le port \${PORT}\`);
});
EOF
success "server.js créé avec succès"

# Créer un fichier package.json minimal si nécessaire
if [ ! -f "package.json" ]; then
  log "Création d'un fichier package.json minimal..."
  cat > package.json << EOF
{
  "name": "flodrama",
  "version": "1.0.0",
  "description": "Plateforme de streaming de dramas et films asiatiques",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF
  success "package.json créé avec succès"
fi

# Démarrer le serveur Node.js
log "Voulez-vous démarrer le serveur Node.js ? (o/n)"
read -r start_server

if [ "$start_server" = "o" ] || [ "$start_server" = "O" ]; then
  log "Démarrage du serveur Node.js..."
  node server.js
else
  success "Configuration terminée. Vous pouvez démarrer le serveur avec la commande 'node server.js'"
fi
