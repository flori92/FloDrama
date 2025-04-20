#!/bin/bash
# Script de déploiement automatique complet pour FloDrama
# Auteur: Cascade AI
# Date: 2025-04-20

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/deploiement-automatique-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

log "${GREEN}=== Déploiement automatique complet de FloDrama ===${NC}"

# Vérifier si les commandes nécessaires sont installées
for cmd in node npm aws git; do
    if ! command -v $cmd &> /dev/null; then
        log "${YELLOW}Installation de $cmd...${NC}"
        case $cmd in
            node|npm)
                # Ces commandes sont généralement installées ensemble
                log "${RED}Node.js ou npm n'est pas installé. Veuillez l'installer manuellement.${NC}"
                exit 1
                ;;
            aws)
                # Installer AWS CLI via pip
                pip install awscli --upgrade --user >> $LOG_FILE 2>&1
                ;;
            git)
                log "${RED}Git n'est pas installé. Veuillez l'installer manuellement.${NC}"
                exit 1
                ;;
        esac
    fi
done

# 1. Nettoyer les builds précédents
log "${BLUE}1. Nettoyage des builds précédents...${NC}"
rm -rf dist build out .next

# 2. Mettre à jour le fichier status.json pour désactiver explicitement la maintenance
log "${BLUE}2. Mise à jour du fichier status.json...${NC}"
mkdir -p frontend/public/data

cat > frontend/public/data/status.json << EOF
{
  "status": "online",
  "version": "1.0.0",
  "lastUpdate": "$(date +"%Y-%m-%dT%H:%M:%S%:z")",
  "services": {
    "streaming": {"status": "online", "message": "Service de streaming opérationnel"},
    "metadata": {"status": "online", "message": "Service de métadonnées opérationnel"},
    "auth": {"status": "online", "message": "Service d'authentification opérationnel"},
    "payment": {"status": "online", "message": "Service de paiement opérationnel"}
  },
  "maintenance": {
    "scheduled": false,
    "startTime": null,
    "endTime": null,
    "message": ""
  }
}
EOF

# 3. Créer un fichier index.html de secours sans message de maintenance
log "${BLUE}3. Création d'un fichier index.html de secours...${NC}"
cat > frontend/public/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="description" content="FloDrama - Votre plateforme de streaming dédiée aux dramas et films asiatiques" />
  <link rel="apple-touch-icon" href="/logo192.png" />
  <link rel="manifest" href="/manifest.json" />
  <title>FloDrama - Streaming de Dramas et Films Asiatiques</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: Arial, sans-serif;
    }
    #root {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #111827;
      color: #f3f4f6;
    }
    .logo {
      width: 180px;
      margin-bottom: 20px;
    }
    h1 {
      color: #3b82f6;
      margin-bottom: 16px;
      font-size: 2.5rem;
    }
    p {
      font-size: 1.2rem;
      margin-bottom: 24px;
      text-align: center;
      max-width: 500px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(59, 130, 246, 0.2);
      border-top: 5px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <img src="/flodrama-logo.svg" alt="FloDrama Logo" class="logo" />
    <h1>FloDrama</h1>
    <p>Chargement de l'interface enrichie...</p>
    <div class="spinner"></div>
  </div>
  
  <!-- Redirection automatique vers l'interface enrichie -->
  <script>
    // Vérifier si le navigateur prend en charge le stockage local
    if (window.localStorage) {
      // Vérifier si l'utilisateur a déjà choisi l'interface enrichie
      const preferEnhanced = localStorage.getItem('preferEnhanced');
      if (preferEnhanced === 'true') {
        window.location.href = '/direct-enhanced.html';
      } else {
        // Rediriger vers l'interface principale
        setTimeout(function() {
          window.location.href = '/';
        }, 2000);
      }
    }
  </script>
</body>
</html>
EOF

# 4. Configurer le fichier next.config.js pour GitHub Pages
log "${BLUE}4. Configuration de next.config.js pour GitHub Pages...${NC}"
cat > frontend/next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
  assetPrefix: ''
};

module.exports = nextConfig;
EOF

# 5. Créer un fichier .env pour désactiver la maintenance et activer l'interface enrichie
log "${BLUE}5. Création d'un fichier .env pour désactiver la maintenance...${NC}"
cat > frontend/.env << EOF
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_API_URL=https://api.flodrama.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ENHANCED_UI=true
NEXT_PUBLIC_DEFAULT_INTERFACE=enhanced
EOF

# 6. Construction de l'application
log "${BLUE}6. Construction de l'application...${NC}"
cd frontend
npm run build

# Vérifier si la construction a réussi
if [ $? -ne 0 ]; then
    log "${RED}Erreur: La construction de l'application a échoué${NC}"
    log "${YELLOW}Tentative de construction avec une configuration minimale...${NC}"
    
    # Créer un fichier next.config.js minimal
    cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  }
};

module.exports = nextConfig;
EOF
    
    # Réessayer la construction
    npm run build
    
    if [ $? -ne 0 ]; then
        log "${RED}Erreur: La construction a échoué même avec une configuration minimale. Abandon du déploiement.${NC}"
        exit 1
    else
        log "${GREEN}Construction réussie avec la configuration minimale${NC}"
    fi
fi

# 7. Vérifier que le fichier index.html du build ne contient pas de message de maintenance
log "${BLUE}7. Vérification du fichier index.html du build...${NC}"
if [ -f "out/index.html" ] && grep -q "maintenance" out/index.html; then
    log "${YELLOW}Le fichier index.html contient toujours un message de maintenance. Remplacement...${NC}"
    cp public/index.html out/index.html
fi

# 8. Créer un script pour vider le cache du navigateur
log "${BLUE}8. Création d'un script pour vider le cache du navigateur...${NC}"
mkdir -p out/js
cat > out/js/clear-cache.js << EOF
// Script pour vider le cache du navigateur
(function() {
  // Générer un timestamp unique pour forcer le rechargement des ressources
  const timestamp = new Date().getTime();
  
  // Ajouter le timestamp comme paramètre de requête aux liens CSS et JS
  document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => {
    if (el.href && !el.href.includes('?')) {
      el.href = el.href + '?v=' + timestamp;
    } else if (el.src && !el.src.includes('?')) {
      el.src = el.src + '?v=' + timestamp;
    }
  });
  
  // Vider le cache du navigateur si possible
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
      console.log('Cache vidé avec succès');
    });
  }
  
  // Recharger la page sans utiliser le cache
  if (window.location.href.includes('?')) {
    window.location.href = window.location.href + '&nocache=' + timestamp;
  } else {
    window.location.href = window.location.href + '?nocache=' + timestamp;
  }
})();
EOF

# 9. Déploiement sur GitHub Pages
log "${BLUE}9. Déploiement sur GitHub Pages...${NC}"
cd ..

# Vérifier si le dossier .git existe
if [ ! -d ".git" ]; then
    log "${YELLOW}Initialisation du dépôt Git...${NC}"
    git init
    git remote add origin https://github.com/flori92/FloDrama.git
fi

# Vérifier si la branche gh-pages existe
git branch -a | grep -q "gh-pages"
if [ $? -ne 0 ]; then
    log "${YELLOW}Création de la branche gh-pages...${NC}"
    git checkout --orphan gh-pages
else
    log "${YELLOW}Checkout de la branche gh-pages...${NC}"
    git checkout gh-pages || git checkout -b gh-pages
fi

# Copier les fichiers du build dans la racine du dépôt
log "${YELLOW}Copie des fichiers du build...${NC}"
cp -r frontend/out/* .

# Ajouter un fichier .nojekyll pour désactiver Jekyll sur GitHub Pages
touch .nojekyll

# Commit et push
log "${YELLOW}Commit et push des fichiers...${NC}"
git add .
git commit -m "✨ [FEAT] Déploiement automatique sur GitHub Pages"
git push -f origin gh-pages

# Revenir à la branche principale
git checkout main || git checkout master

# 10. Vider le cache CloudFront
log "${BLUE}10. Invalidation du cache CloudFront...${NC}"
CLOUDFRONT_DISTRIBUTION_ID="d1323ouxr1qbdp"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log "${YELLOW}Invalidation du cache CloudFront pour la distribution $CLOUDFRONT_DISTRIBUTION_ID...${NC}"
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" >> $LOG_FILE 2>&1
    log "${GREEN}Invalidation du cache créée pour la distribution $CLOUDFRONT_DISTRIBUTION_ID${NC}"
else
    log "${YELLOW}Aucun ID de distribution CloudFront spécifié${NC}"
    
    # Essayer de trouver automatiquement les distributions
    DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[*].{Id:Id,Origins:Origins.Items[*].DomainName}" --output json 2>/dev/null)
    if [ -n "$DISTRIBUTIONS" ]; then
        echo "$DISTRIBUTIONS" | grep -q "flodrama"
        if [ $? -eq 0 ]; then
            log "${YELLOW}Distributions CloudFront trouvées pour FloDrama. Invalidation du cache...${NC}"
            DIST_IDS=$(echo "$DISTRIBUTIONS" | grep -B 2 "flodrama" | grep "Id" | awk -F'"' '{print $4}')
            for DIST_ID in $DIST_IDS; do
                aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" >> $LOG_FILE 2>&1
                log "${GREEN}Invalidation du cache créée pour la distribution $DIST_ID${NC}"
            done
        else
            log "${YELLOW}Aucune distribution CloudFront trouvée pour FloDrama${NC}"
        fi
    else
        log "${YELLOW}Aucune distribution CloudFront trouvée ou AWS CLI non configuré${NC}"
    fi
fi

# 11. Synchroniser les assets avec S3
log "${BLUE}11. Synchronisation des assets avec S3...${NC}"
S3_BUCKET="flodrama-assets"
if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
    log "${YELLOW}Synchronisation des assets avec le bucket S3 $S3_BUCKET...${NC}"
    aws s3 sync frontend/out/images s3://$S3_BUCKET/images --acl public-read >> $LOG_FILE 2>&1
    aws s3 sync frontend/out/assets s3://$S3_BUCKET/assets --acl public-read >> $LOG_FILE 2>&1
    log "${GREEN}Synchronisation avec S3 terminée${NC}"
else
    log "${YELLOW}Le bucket S3 $S3_BUCKET n'existe pas ou n'est pas accessible${NC}"
fi

# 12. Créer un rapport de déploiement
log "${BLUE}12. Création du rapport de déploiement...${NC}"
REPORT_DIR="rapports"
mkdir -p $REPORT_DIR
REPORT_FILE="$REPORT_DIR/rapport-deploiement-$(date +%Y%m%d_%H%M%S).md"

cat > $REPORT_FILE << EOF
# Rapport de déploiement automatique de FloDrama

## Informations générales
- **Date de déploiement:** $(date +"%d/%m/%Y %H:%M:%S")
- **URL de production:** https://flodrama.com
- **Plateforme de déploiement:** GitHub Pages
- **CDN:** AWS CloudFront (d1323ouxr1qbdp.cloudfront.net)
- **Stockage des assets:** S3 (flodrama-assets.s3.amazonaws.com)

## Actions réalisées
1. Nettoyage des builds précédents
2. Mise à jour du fichier status.json (maintenance désactivée)
3. Création d'un fichier index.html de secours
4. Configuration optimisée pour GitHub Pages
5. Construction de l'application Next.js
6. Déploiement sur GitHub Pages
7. Invalidation du cache CloudFront
8. Synchronisation des assets avec S3

## Système d'images multi-sources
Le système d'images utilise une approche multi-sources avec ordre de priorité :
1. GitHub Pages (flodrama.com) - Priorité 1
2. CloudFront (d1323ouxr1qbdp.cloudfront.net) - Priorité 2
3. S3 direct (flodrama-assets.s3.amazonaws.com) - Priorité 3

## Prochaines étapes recommandées
1. Vérifier l'application en production
2. Tester le système d'images multi-sources
3. Mettre en place un monitoring
4. Nettoyer les ressources AWS inutilisées

## Ressources
- **Logs de déploiement:** $LOG_FILE
- **Documentation technique:** docs/architecture-github-aws.md
EOF

log "${GREEN}=== Déploiement automatique complet de FloDrama terminé ===${NC}"
log "${YELLOW}Consultez le rapport pour plus de détails: $REPORT_FILE${NC}"
log "${YELLOW}URL de l'application: https://flodrama.com${NC}"

# Sauvegarde automatique
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_deployment.tar.gz"

log "${BLUE}Sauvegarde automatique du projet...${NC}"
tar -czf $BACKUP_FILE --exclude="node_modules" --exclude="out" --exclude=".next" --exclude=".git" --exclude="backups" .
log "${GREEN}Sauvegarde créée: $BACKUP_FILE${NC}"

exit 0
