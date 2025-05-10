#!/bin/bash

# Script de déploiement pour le Worker Cloudflare FloDrama API
# Ce script nécessite que wrangler soit installé et configuré

echo "Déploiement de la configuration CORS pour le Worker FloDrama API..."

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null
then
    echo "Erreur: wrangler n'est pas installé. Installez-le avec 'npm install -g wrangler'"
    exit 1
fi

# Vérifier si l'utilisateur est connecté à Cloudflare
echo "Vérification de la connexion à Cloudflare..."
wrangler whoami || {
    echo "Erreur: Vous n'êtes pas connecté à Cloudflare. Connectez-vous avec 'wrangler login'"
    exit 1
}

# Créer un répertoire temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo "Création d'un répertoire temporaire: $TEMP_DIR"

# Copier le fichier de configuration CORS
cp cors-config.js $TEMP_DIR/index.js

# Créer un fichier wrangler.toml pour le déploiement
cat > $TEMP_DIR/wrangler.toml << EOL
name = "flodrama-api-worker"
main = "index.js"
compatibility_date = "2023-05-08"

[triggers]
routes = [
    "flodrama-api-worker.florifavi.workers.dev/*"
]
EOL

# Se déplacer dans le répertoire temporaire
cd $TEMP_DIR

# Déployer le Worker
echo "Déploiement du Worker..."
wrangler deploy

# Nettoyage
echo "Nettoyage..."
cd -
rm -rf $TEMP_DIR

echo "Déploiement terminé !"
echo "Vérifiez que le Worker fonctionne correctement en accédant à https://flodrama-api-worker.florifavi.workers.dev"
